import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabaseAdmin = createClient(
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

function phoneToEmail(normalized: string): string {
  return `${normalized}@oceantix.user`;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, password, otp } = await req.json();
    if (!phone || !password || !otp) return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });

    const normalized = normalizePhone(phone);
    const internalEmail = phoneToEmail(normalized);

    // 🔒 Final check: nomor tidak boleh sudah diklaim
    const { data: claimed } = await supabaseAdmin
      .from("verified_phones")
      .select("user_id")
      .eq("phone", normalized)
      .maybeSingle();

    if (claimed) {
      return NextResponse.json({ error: "Nomor ini sudah terdaftar di akun lain." }, { status: 409 });
    }

    // Cek OTP
    const { data, error: fetchError } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("phone", normalized)
      .single();

    if (fetchError || !data) return NextResponse.json({ error: "OTP tidak ditemukan. Coba kirim ulang." }, { status: 400 });
    if (new Date(data.expires_at) < new Date()) return NextResponse.json({ error: "OTP sudah kadaluarsa. Minta kode baru." }, { status: 400 });
    if (data.otp !== otp.trim()) return NextResponse.json({ error: "Kode OTP salah. Coba lagi." }, { status: 400 });

    // Buat akun
    const { data: authData, error: signUpError } = await supabaseAdmin.auth.admin.createUser({
      email: internalEmail,
      password,
      phone: normalized,
      email_confirm: true,
      user_metadata: { phone: normalized, phone_verified: true },
    });

    if (signUpError) {
      if (signUpError.message?.includes("already")) {
        return NextResponse.json({ error: "Nomor ini sudah terdaftar. Silakan login." }, { status: 409 });
      }
      return NextResponse.json({ error: signUpError.message }, { status: 500 });
    }

    const userId = authData.user?.id;

    // Klaim nomor di verified_phones
    await supabaseAdmin.from("verified_phones").insert({ phone: normalized, user_id: userId });

    // Hapus OTP
    await supabaseAdmin.from("otp_verifications").delete().eq("phone", normalized);

    return NextResponse.json({ success: true, message: "Akun berhasil dibuat!", internalEmail, userId });
  } catch (err) {
    console.error("Verify OTP error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
