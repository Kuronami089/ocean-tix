"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";
import {
  ArrowLeft, User, Mail, LogOut, Ticket, Bell, ChevronRight,
  MapPin, Shield, Edit3, Camera, Lock, FileText, HelpCircle,
  Phone, Calendar, X, Check, Eye, EyeOff
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useTickets } from "@/context/TicketContext";
import { useLocation } from "@/context/LocationContext";

function ProfilePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { tickets } = useTickets();
  const { selectedCity } = useLocation();

  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<"edit" | "password" | "policy" | "help" | "logout" | "phone-verify" | null>(null);

  // Auto-open modal from URL param (?modal=help or ?modal=policy)
  useEffect(() => {
    const m = searchParams.get("modal");
    if (m === "help" || m === "policy") setModal(m);
  }, [searchParams]);

  // Edit profile state
  const [profileForm, setProfileForm] = useState({ name: "", phone: "", birthdate: "", gender: "" });
  const [profileSaved, setProfileSaved] = useState(false);

  // Password state
  const [pwStep, setPwStep] = useState<1 | 2 | 3>(1); // 1=send OTP, 2=verify OTP, 3=new password
  const [pwOtp, setPwOtp] = useState("");
  const [pwForm, setPwForm] = useState({ next: "", confirm: "" });
  const [showPw, setShowPw] = useState({ next: false, confirm: false });
  const [pwError, setPwError] = useState("");
  const [pwSuccess, setPwSuccess] = useState("");
  const [pwLoading, setPwLoading] = useState(false);
  const [pwSaved, setPwSaved] = useState(false);

  // Phone verification state (for email/Google users adding a phone)
  const [pendingPhone, setPendingPhone] = useState("");
  const [phoneOtp, setPhoneOtp] = useState("");
  const [phoneOtpStep, setPhoneOtpStep] = useState<1 | 2>(1);
  const [phoneVerifyLoading, setPhoneVerifyLoading] = useState(false);
  const [phoneVerifyError, setPhoneVerifyError] = useState("");
  const [phoneVerifySuccess, setPhoneVerifySuccess] = useState("");

  // Notification toggles


  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) setProfileForm({
        name: u.user_metadata?.full_name || u.email?.split("@")[0] || "",
        phone: u.user_metadata?.phone || "",
        birthdate: u.user_metadata?.birthdate || "",
        gender: u.user_metadata?.gender || "",
      });
      setLoading(false);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  const handleLogout = async () => { await supabase.auth.signOut(); router.push("/"); };

  // Lock phone if: registered via phone OR already verified a phone number
  const isPhoneLocked = user?.email?.endsWith("@oceantix.user") || user?.user_metadata?.phone_verified === true;

  const saveProfile = async () => {
    // Never let phone-users change their phone (it's their login identifier)
    const dataToSave = isPhoneLocked
      ? { full_name: profileForm.name, birthdate: profileForm.birthdate, gender: profileForm.gender }
      : { full_name: profileForm.name, birthdate: profileForm.birthdate, gender: profileForm.gender };
    await supabase.auth.updateUser({ data: dataToSave });
    setProfileSaved(true);
    setTimeout(() => { setProfileSaved(false); setModal(null); }, 1200);
  };

  // Helper: get user's phone for OTP (from metadata or internal email)
  const getUserPhone = () => {
    const meta = user?.user_metadata?.phone;
    if (meta) return meta;
    if (user?.email?.endsWith("@oceantix.user")) return user.email.replace("@oceantix.user", "");
    return "";
  };

  const sendPwOtp = async () => {
    const phone = getUserPhone();
    if (!phone) { setPwError("Akun kamu tidak memiliki nomor HP terdaftar."); return; }
    setPwLoading(true); setPwError("");
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, purpose: "change-password" }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) { setPwError(data.error || "Gagal kirim OTP."); return; }
    setPwSuccess("OTP terkirim ke WhatsApp kamu!"); setPwStep(2);
  };

  const savePassword = async () => {
    setPwError("");
    if (pwForm.next !== pwForm.confirm) { setPwError("Password baru tidak cocok."); return; }
    if (pwForm.next.length < 6) { setPwError("Password minimal 6 karakter."); return; }
    setPwLoading(true);
    const phone = getUserPhone();
    const res = await fetch("/api/reset-password", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone, otp: pwOtp, newPassword: pwForm.next, userId: user?.id }),
    });
    const data = await res.json();
    setPwLoading(false);
    if (!res.ok) { setPwError(data.error || "Gagal mengubah password."); return; }
    setPwSaved(true);
    setTimeout(() => {
      setPwSaved(false); setModal(null);
      setPwStep(1); setPwOtp(""); setPwForm({ next: "", confirm: "" }); setPwError(""); setPwSuccess("");
    }, 1200);
  };

  const sendPhoneOtp = async () => {
    if (!pendingPhone) { setPhoneVerifyError("Masukkan nomor HP."); return; }
    setPhoneVerifyLoading(true); setPhoneVerifyError("");
    const res = await fetch("/api/send-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: pendingPhone }),
    });
    const data = await res.json();
    setPhoneVerifyLoading(false);
    if (!res.ok) { setPhoneVerifyError(data.error || "Gagal kirim OTP."); return; }
    setPhoneVerifySuccess("OTP terkirim ke WhatsApp!");
    setPhoneOtpStep(2);
  };


  const verifyPhoneOtp = async () => {
    setPhoneVerifyLoading(true); setPhoneVerifyError(""); setPhoneVerifySuccess("");
    const res = await fetch("/api/verify-phone-otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: pendingPhone, otp: phoneOtp, userId: user?.id }),
    });
    const data = await res.json();
    setPhoneVerifyLoading(false);
    if (!res.ok) { setPhoneVerifyError(data.error || "Kode salah."); return; }
    // Save phone + mark as permanently verified in metadata
    await supabase.auth.updateUser({ data: { phone: pendingPhone, phone_verified: true } });
    setProfileForm(f => ({ ...f, phone: pendingPhone }));
    setPhoneVerifySuccess("Nomor HP berhasil ditambahkan!");
    setTimeout(() => { setModal(null); setPhoneOtpStep(1); setPendingPhone(""); setPhoneOtp(""); setPhoneVerifySuccess(""); }, 1500);
  };




  const now = Date.now();
  const ONE_DAY = 24 * 60 * 60 * 1000;
  const activeTickets = tickets.filter(t => t.timestamp ? t.timestamp + ONE_DAY > now : t.status === "active");
  const pastTickets = tickets.filter(t => t.timestamp ? t.timestamp + ONE_DAY <= now : t.status === "past");
  const displayName = user?.user_metadata?.full_name || profileForm.name || user?.email?.split("@")[0] || "Pengguna";
  const avatarInitial = displayName.charAt(0).toUpperCase();

  if (loading) return <div className="min-h-screen bg-[#000814] flex items-center justify-center"><div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" /></div>;


  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans pb-28">

      {/* ── EDIT PROFILE MODAL ── */}
      {modal === "edit" && (
        <ModalWrap onClose={() => setModal(null)}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-black text-base uppercase tracking-tight">Edit Profil</h3>
            <button onClick={() => setModal(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            {/* Nama Lengkap */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nama Lengkap</label>
              <div className="relative">
                <User className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="text" placeholder="Masukkan nama lengkap" value={profileForm.name}
                  onChange={e => setProfileForm(f => ({ ...f, name: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder-slate-600" />
              </div>
            </div>

            {/* Nomor HP — locked once verified */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nomor HP</label>
              {isPhoneLocked ? (
                <div className="relative">
                  <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <input type="tel" value={profileForm.phone} disabled
                    className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-slate-500 cursor-not-allowed" />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-600 font-black uppercase tracking-wider">🔒 Terkunci</span>
                </div>
              ) : (
                <button type="button" onClick={() => { setPendingPhone(profileForm.phone); setPhoneOtpStep(1); setPhoneVerifyError(""); setPhoneVerifySuccess(""); setModal("phone-verify"); }}
                  className="w-full flex items-center gap-3 bg-white/5 border border-white/10 rounded-xl pl-4 pr-4 py-3 text-sm text-left hover:border-cyan-500/50 transition-all">
                  <Phone className="w-4 h-4 text-slate-500 flex-shrink-0" />
                  <span className={profileForm.phone ? "text-white" : "text-slate-600"}>{profileForm.phone || "Tambah nomor HP (verifikasi WA)"}</span>
                  {!profileForm.phone && <span className="ml-auto text-[10px] text-cyan-400 font-black uppercase">Verifikasi</span>}
                </button>
              )}
              <p className="text-[10px] text-slate-600 mt-1 pl-1">
                {isPhoneLocked ? "Nomor sudah terverifikasi dan tidak dapat diubah." : "Setelah diverifikasi, nomor tidak dapat diubah lagi."}
              </p>
            </div>

            {/* Tanggal Lahir */}
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Tanggal Lahir</label>
              <div className="relative">
                <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <input type="date" value={profileForm.birthdate}
                  onChange={e => setProfileForm(f => ({ ...f, birthdate: e.target.value }))}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all" />
              </div>
            </div>
            <div>
              <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Jenis Kelamin</label>
              <div className="flex gap-3">
                {["Pria", "Wanita"].map(g => (
                  <button key={g} onClick={() => setProfileForm(f => ({ ...f, gender: g }))}
                    className={`flex-1 py-3 rounded-xl border text-sm font-bold transition-all ${profileForm.gender === g ? "bg-cyan-600 border-cyan-500 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"}`}>
                    {g}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={saveProfile}
              className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${profileSaved ? "bg-green-600" : "bg-cyan-600 hover:bg-cyan-500"}`}>
              {profileSaved ? <><Check className="w-4 h-4" /> Tersimpan!</> : "Simpan Perubahan"}
            </button>
          </div>
        </ModalWrap>
      )}

      {/* ── CHANGE PASSWORD MODAL ── */}
      {modal === "password" && (
        <ModalWrap onClose={() => { setModal(null); setPwStep(1); setPwOtp(""); setPwForm({ next: "", confirm: "" }); setPwError(""); setPwSuccess(""); }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-black text-base uppercase tracking-tight">Ubah Password</h3>
            <button onClick={() => { setModal(null); setPwStep(1); }} className="p-2 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            {pwError && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold">⚠️ {pwError}</div>}
            {pwSuccess && <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-bold">✅ {pwSuccess}</div>}

            {/* STEP 1: Send OTP */}
            {pwStep === 1 && (
              <>
                <div className="text-center py-2">
                  <div className="w-14 h-14 bg-cyan-900/30 border border-cyan-500/30 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Phone className="w-7 h-7 text-cyan-400" />
                  </div>
                  <p className="text-sm text-slate-300 font-bold">Verifikasi dulu via WhatsApp</p>
                  <p className="text-[11px] text-slate-500 mt-1">OTP akan dikirim ke nomor HP terdaftar</p>
                  {getUserPhone() && <p className="text-cyan-400 font-black text-sm mt-2">{getUserPhone()}</p>}
                </div>
                <button disabled={pwLoading} onClick={sendPwOtp}
                  className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 transition-all">
                  {pwLoading ? "Mengirim..." : "Kirim OTP ke WhatsApp"}
                </button>
              </>
            )}

            {/* STEP 2: Verify OTP */}
            {pwStep === 2 && (
              <>
                <div className="text-center py-1">
                  <p className="text-slate-400 text-xs mb-1">Kode dikirim ke</p>
                  <p className="text-cyan-400 font-black text-sm">{getUserPhone()}</p>
                </div>
                <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={pwOtp}
                  onChange={e => { setPwOtp(e.target.value.replace(/\D/g, "")); setPwError(""); }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white text-center tracking-[0.6em] font-black text-2xl outline-none focus:border-cyan-500/50" />
                <button disabled={pwLoading || pwOtp.length < 6} onClick={() => { setPwError(""); setPwSuccess(""); setPwStep(3); }}
                  className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 transition-all">
                  Lanjut
                </button>
                <button disabled={pwLoading} onClick={() => { setPwStep(1); setPwError(""); setPwSuccess(""); }}
                  className="w-full text-slate-500 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-widest transition-colors py-1">Kirim ulang OTP</button>
              </>
            )}

            {/* STEP 3: New password */}
            {pwStep === 3 && (
              <>
                {[{ label: "Password Baru", key: "next" }, { label: "Konfirmasi Password", key: "confirm" }].map(({ label, key }) => (
                  <div key={key}>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">{label}</label>
                    <div className="relative">
                      <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                      <input type={(showPw as any)[key] ? "text" : "password"} placeholder="••••••••"
                        value={(pwForm as any)[key]}
                        onChange={e => { setPwForm(f => ({ ...f, [key]: e.target.value })); setPwError(""); }}
                        className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-12 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all" />
                      <button onClick={() => setShowPw(s => ({ ...s, [key]: !(s as any)[key] }))}
                        className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-white">
                        {(showPw as any)[key] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                ))}
                <button disabled={pwLoading} onClick={savePassword}
                  className={`w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${pwSaved ? "bg-green-600" : "bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60"}`}>
                  {pwSaved ? <><Check className="w-4 h-4" /> Berhasil!</> : pwLoading ? "Menyimpan..." : "Ubah Password"}
                </button>
              </>
            )}
          </div>
        </ModalWrap>
      )}

      {/* ── PHONE VERIFY MODAL (email/Google users adding phone) ── */}
      {modal === "phone-verify" && (
        <ModalWrap onClose={() => { setModal(null); setPhoneOtpStep(1); setPhoneVerifyError(""); setPhoneVerifySuccess(""); }}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-black text-base uppercase tracking-tight">Verifikasi Nomor HP</h3>
            <button onClick={() => { setModal(null); setPhoneOtpStep(1); }} className="p-2 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4">
            {phoneVerifyError && <div className="px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold">⚠️ {phoneVerifyError}</div>}
            {phoneVerifySuccess && <div className="px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-bold">✅ {phoneVerifySuccess}</div>}
            {phoneOtpStep === 1 ? (
              <>
                <div>
                  <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1.5 block">Nomor WhatsApp</label>
                  <div className="relative">
                    <Phone className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input type="tel" placeholder="08xx / 628xx" value={pendingPhone}
                      onChange={e => { setPendingPhone(e.target.value); setPhoneVerifyError(""); }}
                      className="w-full bg-white/5 border border-white/10 rounded-xl pl-11 pr-4 py-3 text-sm text-white outline-none focus:border-cyan-500/50 transition-all placeholder-slate-600" />
                  </div>
                  <p className="text-[10px] text-slate-500 mt-1 pl-1">Kode OTP akan dikirim ke WhatsApp kamu</p>
                </div>
                <button disabled={phoneVerifyLoading} onClick={sendPhoneOtp}
                  className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 transition-all">
                  {phoneVerifyLoading ? "Mengirim..." : "Kirim OTP ke WhatsApp"}
                </button>
              </>
            ) : (
              <>
                <div className="text-center py-1">
                  <p className="text-slate-400 text-xs mb-1">Kode dikirim ke</p>
                  <p className="text-cyan-400 font-black text-sm">{pendingPhone}</p>
                </div>
                <input type="text" inputMode="numeric" maxLength={6} placeholder="000000" value={phoneOtp}
                  onChange={e => { setPhoneOtp(e.target.value.replace(/\D/g, "")); setPhoneVerifyError(""); }}
                  className="w-full bg-white/5 border border-white/10 rounded-xl py-4 px-4 text-white text-center tracking-[0.6em] font-black text-2xl outline-none focus:border-cyan-500/50" />
                <button disabled={phoneVerifyLoading || phoneOtp.length < 6} onClick={verifyPhoneOtp}
                  className="w-full py-3.5 rounded-xl font-black text-sm uppercase tracking-widest bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 transition-all">
                  {phoneVerifyLoading ? "Memverifikasi..." : "Verifikasi & Simpan"}
                </button>
                <button disabled={phoneVerifyLoading} onClick={() => { setPhoneOtpStep(1); setPhoneVerifyError(""); setPhoneVerifySuccess(""); }}
                  className="w-full text-slate-500 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-widest transition-colors py-1">
                  Ganti nomor / Kirim ulang
                </button>
              </>
            )}
          </div>
        </ModalWrap>
      )}

      {/* ── PRIVACY POLICY MODAL ── */}
      {modal === "policy" && (
        <ModalWrap onClose={() => setModal(null)}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-black text-base uppercase tracking-tight">Kebijakan Privasi</h3>
            <button onClick={() => setModal(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-4 max-h-[60vh] overflow-y-auto">
            {[
              { title: "1. Data yang Kami Kumpulkan", body: "OceanTix mengumpulkan informasi yang kamu berikan saat mendaftar, termasuk nama, alamat email, nomor telepon, dan informasi pembayaran. Kami juga mengumpulkan data penggunaan aplikasi untuk meningkatkan layanan kami." },
              { title: "2. Penggunaan Data", body: "Data kamu digunakan untuk memproses pemesanan tiket, mengirimkan notifikasi, dan mempersonalisasi pengalaman kamu. Kami tidak menjual data pribadi kamu kepada pihak ketiga tanpa persetujuan." },
              { title: "3. Keamanan Data", body: "Kami menggunakan enkripsi SSL/TLS untuk melindungi data yang ditransmisikan. Data disimpan di server yang aman dengan akses terbatas dan dipantau secara berkala." },
              { title: "4. Hak Pengguna", body: "Kamu berhak mengakses, memperbarui, atau menghapus data pribadi kamu kapan saja melalui pengaturan profil atau dengan menghubungi tim dukungan kami." },
              { title: "5. Cookie", body: "OceanTix menggunakan cookie untuk meningkatkan pengalaman pengguna dan menganalisis penggunaan aplikasi. Kamu dapat menonaktifkan cookie melalui pengaturan browser." },
              { title: "6. Perubahan Kebijakan", body: "Kebijakan privasi ini dapat berubah sewaktu-waktu. Perubahan signifikan akan diberitahukan melalui email atau notifikasi dalam aplikasi." },
            ].map(({ title, body }) => (
              <div key={title}>
                <p className="text-xs font-black text-cyan-400 mb-1.5">{title}</p>
                <p className="text-xs text-slate-400 leading-relaxed">{body}</p>
              </div>
            ))}
            <p className="text-[10px] text-slate-600 pt-2 border-t border-white/5">Terakhir diperbarui: 1 Mei 2026</p>
          </div>
        </ModalWrap>
      )}

      {/* ── HELP MODAL ── */}
      {modal === "help" && (
        <ModalWrap onClose={() => setModal(null)}>
          <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
            <h3 className="font-black text-base uppercase tracking-tight">Bantuan</h3>
            <button onClick={() => setModal(null)} className="p-2 hover:bg-white/10 rounded-full"><X className="w-4 h-4" /></button>
          </div>
          <div className="p-5 space-y-3 max-h-[60vh] overflow-y-auto">
            {[
              { q: "Bagaimana cara memesan tiket?", a: "Pilih film di beranda, lalu pilih jadwal, kursi, dan lanjutkan ke pembayaran. Tiket akan muncul di menu Tiket Saya." },
              { q: "Bisakah tiket di-refund?", a: "Tiket yang sudah dibeli tidak dapat di-refund. Pastikan kamu memeriksa jadwal sebelum melakukan pembelian." },
              { q: "Kode promo tidak berfungsi?", a: "Pastikan kode masih berlaku, memenuhi minimal pembelian, dan belum melampaui batas penggunaan per akun." },
              { q: "Bagaimana mengubah kota?", a: "Klik ikon kota di navbar atas, lalu pilih kota yang diinginkan. Bioskop akan otomatis menyesuaikan." },
              { q: "Hubungi kami", a: "Email: support@oceantix.id\nWA: +62 812-0000-0000\nJam operasional: 08.00–22.00 WIB" },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white/5 border border-white/10 rounded-xl p-4">
                <p className="text-xs font-black text-white mb-1.5">{q}</p>
                <p className="text-xs text-slate-400 leading-relaxed whitespace-pre-line">{a}</p>
              </div>
            ))}
          </div>
        </ModalWrap>
      )}

      {/* ── LOGOUT MODAL ── */}
      {modal === "logout" && (
        <ModalWrap onClose={() => setModal(null)}>
          <div className="p-8 text-center">
            <div className="w-16 h-16 bg-red-900/30 border border-red-500/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <LogOut className="w-8 h-8 text-red-400" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Yakin mau keluar?</h3>
            <p className="text-sm text-slate-400 mb-8">Kamu akan keluar dari akun OceanTix kamu.</p>
            <div className="flex gap-3">
              <button onClick={() => setModal(null)} className="flex-1 py-3 bg-white/5 border border-white/10 rounded-xl text-slate-300 font-bold text-sm hover:bg-white/10 transition-all">Batal</button>
              <button onClick={handleLogout} className="flex-1 py-3 bg-red-600 hover:bg-red-500 rounded-xl text-white font-bold text-sm transition-all">Keluar</button>
            </div>
          </div>
        </ModalWrap>
      )}

      {/* HEADER */}
      <header className="sticky top-0 bg-[#000814]/90 backdrop-blur-md z-50 px-4 py-4 flex items-center justify-between border-b border-white/5 h-[70px]">
        <button onClick={() => router.back()} className="p-2 hover:bg-white/10 rounded-full transition-all">
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-sm font-black uppercase tracking-widest">Profil</h1>
        <div className="w-10" />
      </header>

      <main className="max-w-md mx-auto px-4 mt-6 space-y-5">
        {/* AVATAR CARD */}
        <div className="bg-gradient-to-br from-cyan-900/30 via-blue-900/20 to-transparent border border-cyan-500/20 rounded-3xl p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 to-blue-600/5 pointer-events-none" />
          {user ? (
            <>
              <div className="relative inline-block mb-4">
                <div className="w-24 h-24 rounded-full bg-gradient-to-br from-cyan-400 to-blue-600 flex items-center justify-center text-3xl font-black text-white shadow-2xl border-4 border-[#000814]">
                  {avatarInitial}
                </div>
                <button onClick={() => setModal("edit")} className="absolute bottom-0 right-0 w-8 h-8 bg-cyan-600 rounded-full flex items-center justify-center border-2 border-[#000814] hover:bg-cyan-500 transition-all">
                  <Camera className="w-4 h-4 text-white" />
                </button>
              </div>
              <h2 className="text-xl font-black text-white mb-1">{displayName}</h2>
              <p className="text-sm text-slate-400 flex items-center justify-center gap-2 mb-3">
                <Mail className="w-4 h-4" /> {user.email}
              </p>
              {profileForm.phone && <p className="text-xs text-slate-500"><Phone className="w-3 h-3 inline mr-1" />{profileForm.phone}</p>}
              <div className="flex items-center justify-center gap-2 mt-2">
                <MapPin className="w-3 h-3 text-cyan-400" />
                <span className="text-xs text-cyan-400 font-bold uppercase tracking-widest">{selectedCity}</span>
              </div>
            </>
          ) : (
            <>
              <div className="w-24 h-24 rounded-full bg-slate-800 flex items-center justify-center mx-auto mb-4 border-4 border-[#000814]">
                <User className="w-12 h-12 text-slate-500" />
              </div>
              <h2 className="text-xl font-black text-white mb-2">Belum Login</h2>
              <p className="text-sm text-slate-400 mb-4">Login untuk melihat profil dan riwayat tiket kamu.</p>
              <Link href="/" className="inline-block px-8 py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-xs font-black uppercase tracking-widest transition-all">
                Login Sekarang
              </Link>
            </>
          )}
        </div>

        {/* STATS */}
        {user && (
          <div className="grid grid-cols-3 gap-3">
            {[
              { value: activeTickets.length, label: "Tiket Aktif", color: "text-cyan-400" },
              { value: pastTickets.length, label: "Riwayat", color: "text-amber-400" },
              { value: tickets.length, label: "Total Nonton", color: "text-purple-400" },
            ].map(s => (
              <div key={s.label} className="bg-white/5 border border-white/10 rounded-2xl p-4 text-center">
                <p className={`text-2xl font-black mb-1 ${s.color}`}>{s.value}</p>
                <p className="text-[9px] text-slate-400 uppercase font-bold tracking-widest">{s.label}</p>
              </div>
            ))}
          </div>
        )}

        {/* MENU SECTIONS */}
        {user && (
          <>
            {/* Akun */}
            <MenuSection title="Akun">
              <MenuItem icon={Edit3} iconBg="bg-cyan-900/30" iconBorder="border-cyan-500/30" iconColor="text-cyan-400" label="Edit Profil" sub="Ubah nama, nomor HP, tanggal lahir" onClick={() => setModal("edit")} />
              <MenuItem icon={Lock} iconBg="bg-blue-900/30" iconBorder="border-blue-500/30" iconColor="text-blue-400" label="Ubah Password" sub="Ganti password akun kamu" onClick={() => setModal("password")} />
              <MenuItem icon={Ticket} iconBg="bg-amber-900/30" iconBorder="border-amber-500/30" iconColor="text-amber-400" label="Tiket Saya" sub="Lihat tiket aktif & riwayat" href="/tickets" last />
            </MenuSection>


            {/* Umum */}
            <MenuSection title="Umum">
              <MenuItem icon={Bell} iconBg="bg-blue-900/30" iconBorder="border-blue-500/30" iconColor="text-blue-400" label="Notifikasi" sub="Pusat notifikasi OceanTix" href="/notifications" />
              <MenuItem icon={HelpCircle} iconBg="bg-green-900/30" iconBorder="border-green-500/30" iconColor="text-green-400" label="Bantuan & FAQ" sub="Pertanyaan umum & kontak" onClick={() => setModal("help")} />
              <MenuItem icon={FileText} iconBg="bg-slate-700/50" iconBorder="border-slate-600/30" iconColor="text-slate-400" label="Kebijakan Privasi" sub="Cara kami mengelola data kamu" onClick={() => setModal("policy")} last />
            </MenuSection>

            {/* Logout */}
            <button onClick={() => setModal("logout")} className="w-full flex items-center justify-center gap-3 p-4 bg-red-900/20 border border-red-500/30 rounded-2xl text-red-400 hover:bg-red-900/30 hover:border-red-500/50 transition-all font-bold text-sm uppercase tracking-widest">
              <LogOut className="w-5 h-5" /> Keluar
            </button>
          </>
        )}

        <p className="text-center text-[10px] text-slate-600 pb-4">OceanTix v2.0.0 — Made with 🌊</p>
      </main>
    </div>
  );
}

export default function ProfilePage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000814]" />}>
      <ProfilePageContent />
    </Suspense>
  );
}

// ─── MODAL OVERLAY ───
// NOTE: Must be defined outside ProfilePage to prevent focus loss on re-render
function ModalWrap({ children, onClose }: { children: React.ReactNode; onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-[200] flex items-end sm:items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md bg-[#0d1b2a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden animate-in slide-in-from-bottom-4 duration-200">
        {children}
      </div>
    </div>
  );
}

function MenuSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
      <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest px-4 pt-4 pb-2">{title}</p>
      {children}
    </div>
  );
}

function MenuItem({ icon: Icon, iconBg, iconBorder, iconColor, label, sub, onClick, href, last }: any) {
  const inner = (
    <div className={`flex items-center justify-between p-4 hover:bg-white/5 transition-all group ${!last ? "border-b border-white/5" : ""}`}>
      <div className="flex items-center gap-3">
        <div className={`w-9 h-9 ${iconBg} border ${iconBorder} rounded-xl flex items-center justify-center`}>
          <Icon className={`w-5 h-5 ${iconColor}`} />
        </div>
        <div>
          <p className="text-sm font-bold text-white">{label}</p>
          {sub && <p className="text-[10px] text-slate-500">{sub}</p>}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-slate-500 group-hover:text-white transition-colors" />
    </div>
  );
  if (href) return <Link href={href}>{inner}</Link>;
  return <button className="w-full text-left" onClick={onClick}>{inner}</button>;
}
