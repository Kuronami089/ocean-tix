import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

function normalizePhone(raw: string): string {
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (!n.startsWith("62")) n = "62" + n;
  return n;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, userId } = await req.json();
    if (!phone || !otp || !userId) return NextResponse.json({ error: "Data tidak lengkap." }, { status: 400 });

    const normalized = normalizePhone(phone);

    // 🔒 Cek apakah nomor sudah diklaim akun LAIN
    const { data: claimed } = await supabase
      .from("verified_phones")
      .select("user_id")
      .eq("phone", normalized)
      .maybeSingle();

    if (claimed && claimed.user_id !== userId) {
      return NextResponse.json({ error: "Nomor ini sudah digunakan oleh akun lain." }, { status: 409 });
    }
    if (claimed && claimed.user_id === userId) {
      // Already verified by this user — nothing to do
      return NextResponse.json({ success: true, alreadyVerified: true });
    }

    // Cek OTP
    const { data, error } = await supabase
      .from("otp_verifications")
      .select("*")
      .eq("phone", normalized)
      .single();

    if (error || !data) return NextResponse.json({ error: "OTP tidak ditemukan. Kirim ulang." }, { status: 400 });
    if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: "OTP kadaluarsa. Minta kode baru." }, { status: 400 });
    if (data.otp !== otp.trim()) return NextResponse.json({ error: "Kode OTP salah." }, { status: 400 });

    // Klaim nomor
    const { error: claimErr } = await supabase
      .from("verified_phones")
      .insert({ phone: normalized, user_id: userId });

    if (claimErr) {
      // Race condition: someone else claimed it just now
      return NextResponse.json({ error: "Nomor ini sudah digunakan oleh akun lain." }, { status: 409 });
    }

    // Hapus OTP
    await supabase.from("otp_verifications").delete().eq("phone", normalized);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("verify-phone-otp error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
