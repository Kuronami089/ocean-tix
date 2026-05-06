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
    const { phone } = await req.json();
    if (!phone) return NextResponse.json({ error: "Nomor wajib diisi." }, { status: 400 });

    const normalized = normalizePhone(phone);

    // Check verified_phones to find user_id
    const { data: vp } = await supabaseAdmin
      .from("verified_phones")
      .select("user_id")
      .eq("phone", normalized)
      .maybeSingle();

    if (vp?.user_id) {
      // Get the user's actual email
      const { data: userData, error } = await supabaseAdmin.auth.admin.getUserById(vp.user_id);
      if (!error && userData?.user?.email) {
        return NextResponse.json({ email: userData.user.email });
      }
    }

    // Fallback: phone-registered user (email = 628xxx@oceantix.user)
    return NextResponse.json({ email: `${normalized}@oceantix.user` });
  } catch (err) {
    console.error("get-email-by-phone error:", err);
    return NextResponse.json({ error: "Terjadi kesalahan server." }, { status: 500 });
  }
}
