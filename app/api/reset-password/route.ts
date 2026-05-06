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

export async function POST(req: NextRequest) {
  try {
    const { phone, otp, newPassword, userId: providedUserId } = await req.json();
    if (!phone || !otp || !newPassword) {
      return NextResponse.json({ error: "Semua field wajib diisi." }, { status: 400 });
    }
    if (newPassword.length < 6) {
      return NextResponse.json({ error: "Password minimal 6 karakter." }, { status: 400 });
    }

    const normalized = normalizePhone(phone);

    // Verify OTP
    const { data: otpData, error: otpErr } = await supabaseAdmin
      .from("otp_verifications")
      .select("*")
      .eq("phone", normalized)
      .single();

    if (otpErr || !otpData) {
      return NextResponse.json({ error: "OTP tidak ditemukan. Kirim ulang." }, { status: 400 });
    }
    if (new Date(otpData.expires_at) < new Date()) {
      return NextResponse.json({ error: "OTP kadaluarsa. Minta kode baru." }, { status: 400 });
    }
    if (otpData.otp !== otp.trim()) {
      return NextResponse.json({ error: "Kode OTP salah." }, { status: 400 });
    }

    // Determine userId — use provided if available (logged-in user changing password)
    let userId: string | null = providedUserId ?? null;

    if (!userId) {
      // Forgot password: look up by phone
      const { data: vp } = await supabaseAdmin
        .from("verified_phones")
        .select("user_id")
        .eq("phone", normalized)
        .maybeSingle();

      if (vp?.user_id) {
        userId = vp.user_id;
      } else {
        // Phone-registered fallback: find by internal email
        const internalEmail = `${normalized}@oceantix.user`;
        const { data: listData } = await supabaseAdmin.auth.admin.listUsers({ page: 1, perPage: 1000 });
        const found = listData?.users?.find((u) => u.email === internalEmail);
        if (found) userId = found.id;
      }
    }

    if (!userId) {
      return NextResponse.json({ error: "Nomor HP ini belum terdaftar." }, { status: 404 });
    }

    // Reset password via admin
    const { error: updateErr } = await supabaseAdmin.auth.admin.updateUserById(userId, {
      password: newPassword,
    });
    if (updateErr) {
      console.error("updateUserById error:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    // Delete OTP
    await supabaseAdmin.from("otp_verifications").delete().eq("phone", normalized);

    return NextResponse.json({ success: true, message: "Password berhasil diubah!" });
  } catch (err) {
    console.error("reset-password error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
