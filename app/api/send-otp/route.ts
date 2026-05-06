import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

function normalizePhone(raw: string): string {
  let n = raw.replace(/\D/g, "");
  if (n.startsWith("0")) n = "62" + n.slice(1);
  if (!n.startsWith("62")) n = "62" + n;
  return n;
}

export async function POST(req: NextRequest) {
  try {
    const { phone, purpose } = await req.json();
    if (!phone) return NextResponse.json({ error: "Nomor WhatsApp wajib diisi." }, { status: 400 });

    const normalized = normalizePhone(phone);

    // 🔒 For registration only: block if number already claimed by another account
    // For 'reset' or 'change-password', allow sending to any registered number
    if (!purpose || purpose === "register") {
      const { data: claimed } = await supabase
        .from("verified_phones")
        .select("user_id")
        .eq("phone", normalized)
        .maybeSingle();

      if (claimed) {
        return NextResponse.json(
          { error: "Nomor ini sudah terdaftar di akun lain." },
          { status: 409 }
        );
      }
    }

    // Generate OTP
    const otp = Math.floor(100000 + Math.random() * 900000).toString();
    const expiresAt = new Date(Date.now() + 5 * 60 * 1000).toISOString();

    const { error: dbError } = await supabase
      .from("otp_verifications")
      .upsert(
        { phone: normalized, otp, expires_at: expiresAt, verified: false },
        { onConflict: "phone" }
      );

    if (dbError) {
      console.error("DB error:", dbError);
      return NextResponse.json(
        { error: `Gagal menyimpan OTP: ${dbError.message} (code: ${dbError.code})` },
        { status: 500 }
      );
    }

    const message = `Halo! 👋\n\nKode verifikasi OceanTix kamu adalah:\n\n*${otp}*\n\nKode ini berlaku selama 5 menit. Jangan bagikan ke siapapun! 🔒`;

    const fonnteRes = await fetch("https://api.fonnte.com/send", {
      method: "POST",
      headers: {
        Authorization: process.env.FONNTE_TOKEN!,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ target: normalized, message, countryCode: "62" }),
    });

    const fonnteData = await fonnteRes.json();
    if (!fonnteRes.ok || fonnteData.status === false) {
      return NextResponse.json(
        { error: "Gagal mengirim OTP via WhatsApp. Pastikan nomor WA aktif." },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true, message: "OTP terkirim ke WhatsApp kamu!" });
  } catch (err) {
    console.error("Send OTP error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
