"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Bell, Check, Ticket, Tag, AlertCircle, Info, X } from "lucide-react";

interface Notification {
  id: string;
  type: "ticket" | "promo" | "info" | "warning";
  title: string;
  message: string;
  time: string;
  isRead: boolean;
}

const DUMMY_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    type: "ticket",
    title: "Tiket Berhasil Dipesan!",
    message: "Pemesanan tiket kamu untuk Deadpool & Wolverine di TASIK XXI telah berhasil. Tunjukkan QR code saat masuk studio. Pastikan kamu hadir 15 menit sebelum film dimulai. Tiket tidak dapat di-refund atau ditukar setelah pembelian.",
    time: "2 menit lalu",
    isRead: false,
  },
  {
    id: "n2",
    type: "promo",
    title: "Promo Weekend 50% OFF!",
    message: "Nikmati diskon 50% untuk semua tiket CGV setiap Sabtu-Minggu. Berlaku hingga akhir bulan. Gunakan kode promo WEEKEND50 saat checkout. Promo hanya berlaku untuk pembelian via aplikasi OceanTix dan tidak dapat digabungkan dengan promo lainnya. Syarat & ketentuan berlaku.",
    time: "1 jam lalu",
    isRead: false,
  },
  {
    id: "n3",
    type: "info",
    title: "Film Baru Minggu Ini",
    message: "Alien: Romulus dan Alien: Resurrection kini tayang di bioskop terdekat. Pesan sekarang sebelum kehabisan! Alien: Romulus hadir dalam format 2D dan 3D di bioskop pilihan. Rating: 17+. Durasi: 119 menit. Genre: Horror, Sci-Fi.",
    time: "3 jam lalu",
    isRead: true,
  },
  {
    id: "n4",
    type: "promo",
    title: "Flash Sale QRIS",
    message: "Bayar pakai QRIS dan dapatkan cashback Rp10.000 untuk setiap pembelian tiket. Kuota terbatas hanya 500 pengguna pertama setiap harinya. Cashback akan dikreditkan ke dompet OceanTix dalam 1x24 jam setelah transaksi berhasil.",
    time: "1 hari lalu",
    isRead: true,
  },
  {
    id: "n5",
    type: "warning",
    title: "Pengingat: Film Mau Mulai!",
    message: "Film Garfield kamu akan dimulai dalam 1 jam di Bintaro Xchange XXI. Jangan sampai terlambat! Studio 3, kursi B7 & B8. Pintu studio ditutup 5 menit setelah film dimulai. Silakan tunjukkan tiket digital atau QR code ke petugas.",
    time: "2 hari lalu",
    isRead: true,
  },
  {
    id: "n6",
    type: "ticket",
    title: "Tiket Kedaluwarsa",
    message: "Tiket Avengers: Endgame kamu sudah tidak aktif karena melewati tanggal tayang. Lihat riwayat transaksi untuk detail pembelian. Jika ada pertanyaan mengenai refund, silakan hubungi customer service OceanTix melalui menu Bantuan di halaman Profil.",
    time: "5 hari lalu",
    isRead: true,
  },
];

const typeConfig = {
  ticket: {
    icon: Ticket,
    color: "text-cyan-400",
    bg: "bg-cyan-900/30",
    border: "border-cyan-500/30",
    badge: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
    label: "Tiket",
  },
  promo: {
    icon: Tag,
    color: "text-amber-400",
    bg: "bg-amber-900/30",
    border: "border-amber-500/30",
    badge: "bg-amber-500/20 text-amber-400 border-amber-500/30",
    label: "Promo",
  },
  info: {
    icon: Info,
    color: "text-blue-400",
    bg: "bg-blue-900/30",
    border: "border-blue-500/30",
    badge: "bg-blue-500/20 text-blue-400 border-blue-500/30",
    label: "Info",
  },
  warning: {
    icon: AlertCircle,
    color: "text-orange-400",
    bg: "bg-orange-900/30",
    border: "border-orange-500/30",
    badge: "bg-orange-500/20 text-orange-400 border-orange-500/30",
    label: "Peringatan",
  },
};

export default function NotificationsPage() {
  const router = useRouter();
  const [notifications, setNotifications] = useState<Notification[]>(DUMMY_NOTIFICATIONS);
  const [activeFilter, setActiveFilter] = useState<"all" | "unread">("all");
  const [selectedNotif, setSelectedNotif] = useState<Notification | null>(null);

  const markAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
  };

  const markRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n))
    );
  };

  const openNotif = (notif: Notification) => {
    markRead(notif.id);
    setSelectedNotif(notif);
  };

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const filtered =
    activeFilter === "unread"
      ? notifications.filter((n) => !n.isRead)
      : notifications;

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans pb-28">

      {/* ── DETAIL MODAL ── */}
      {selectedNotif && (() => {
        const config = typeConfig[selectedNotif.type];
        const IconComponent = config.icon;
        return (
          <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
            {/* Backdrop */}
            <div
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
              onClick={() => setSelectedNotif(null)}
            />
            {/* Sheet */}
            <div className="relative w-full max-w-md bg-[#0d1b2a] border border-white/10 rounded-3xl shadow-2xl animate-in slide-in-from-bottom-4 duration-300 overflow-hidden">
              {/* Top accent bar */}
              <div className={`h-1 w-full ${
                selectedNotif.type === "ticket" ? "bg-cyan-500" :
                selectedNotif.type === "promo" ? "bg-amber-500" :
                selectedNotif.type === "warning" ? "bg-orange-500" : "bg-blue-500"
              }`} />

              <div className="p-6">
                {/* Header row */}
                <div className="flex items-start justify-between gap-3 mb-5">
                  <div className="flex items-center gap-3">
                    <div className={`w-11 h-11 rounded-xl flex items-center justify-center border ${config.bg} ${config.border} flex-none`}>
                      <IconComponent className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div>
                      <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full border ${config.badge}`}>
                        {config.label}
                      </span>
                      <h3 className="text-sm font-black text-white mt-1 leading-tight">
                        {selectedNotif.title}
                      </h3>
                    </div>
                  </div>
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="flex-none p-2 hover:bg-white/10 rounded-full transition-all text-slate-400 hover:text-white"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                {/* Full message */}
                <p className="text-sm text-slate-300 leading-relaxed mb-6">
                  {selectedNotif.message}
                </p>

                {/* Time + close */}
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                    {selectedNotif.time}
                  </span>
                  <button
                    onClick={() => setSelectedNotif(null)}
                    className="px-5 py-2.5 bg-white/10 hover:bg-white/15 border border-white/10 text-slate-300 rounded-full text-[10px] font-black uppercase tracking-widest transition-all"
                  >
                    Tutup
                  </button>
                </div>
              </div>
            </div>
          </div>
        );
      })()}

      {/* HEADER */}
      <header className="sticky top-0 bg-[#000814]/90 backdrop-blur-md z-50 px-4 py-4 flex items-center justify-between border-b border-white/5 h-[70px]">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-full transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <div className="flex items-center gap-2">
          <Bell className="w-5 h-5 text-cyan-400" />
          <h1 className="text-sm font-black uppercase tracking-widest">Notifikasi</h1>
          {unreadCount > 0 && (
            <span className="bg-red-500 text-white text-[10px] font-black px-1.5 py-0.5 rounded-full min-w-[20px] text-center">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 ? (
          <button
            onClick={markAllRead}
            className="text-[10px] text-cyan-400 font-bold uppercase tracking-widest hover:text-cyan-300 transition-colors flex items-center gap-1"
          >
            <Check className="w-3 h-3" />
            Baca Semua
          </button>
        ) : (
          <div className="w-20" />
        )}
      </header>

      <main className="max-w-md mx-auto px-4 mt-4">
        {/* FILTER PILLS */}
        <div className="flex gap-3 mb-6">
          {(["all", "unread"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              className={`px-5 py-2 rounded-xl text-xs font-bold uppercase tracking-widest transition-all border ${
                activeFilter === f
                  ? "bg-cyan-600 border-cyan-500 text-white"
                  : "bg-white/5 border-white/10 text-slate-400 hover:bg-white/10"
              }`}
            >
              {f === "all" ? "Semua" : `Belum Dibaca${unreadCount > 0 ? ` (${unreadCount})` : ""}`}
            </button>
          ))}
        </div>

        {/* NOTIFICATION LIST */}
        {filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-24 text-center">
            <div className="w-24 h-24 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
              <Bell className="w-12 h-12 text-slate-600" />
            </div>
            <h3 className="text-xl font-black text-white mb-2">Tidak ada notifikasi</h3>
            <p className="text-sm text-slate-400">
              {activeFilter === "unread"
                ? "Semua notifikasi sudah kamu baca!"
                : "Kamu belum punya notifikasi."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filtered.map((notif) => {
              const config = typeConfig[notif.type];
              const IconComponent = config.icon;
              // Get the updated read state from notifications array
              const currentNotif = notifications.find(n => n.id === notif.id)!;
              return (
                <button
                  key={notif.id}
                  onClick={() => openNotif(currentNotif)}
                  className={`w-full text-left p-4 rounded-2xl border transition-all relative group ${
                    currentNotif.isRead
                      ? "bg-white/[0.03] border-white/5 hover:border-white/10 hover:bg-white/[0.05]"
                      : "bg-white/[0.07] border-white/[0.15] hover:border-cyan-500/30"
                  }`}
                >
                  {/* Unread dot */}
                  {!currentNotif.isRead && (
                    <span className="absolute top-3.5 right-3.5 w-2.5 h-2.5 bg-cyan-400 rounded-full" />
                  )}

                  <div className="flex gap-3 items-start">
                    <div className={`flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center border ${config.bg} ${config.border}`}>
                      <IconComponent className={`w-5 h-5 ${config.color}`} />
                    </div>
                    <div className="flex-1 min-w-0 pr-4">
                      <h4 className={`text-sm font-black mb-1 ${currentNotif.isRead ? "text-slate-300" : "text-white"}`}>
                        {notif.title}
                      </h4>
                      {/* Preview: 2-line clamp */}
                      <p className="text-xs text-slate-500 leading-relaxed mb-2 line-clamp-2">
                        {notif.message}
                      </p>
                      <div className="flex items-center justify-between">
                        <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
                          {notif.time}
                        </p>
                        <span className="text-[10px] text-cyan-500 font-bold opacity-0 group-hover:opacity-100 transition-opacity">
                          Baca selengkapnya →
                        </span>
                      </div>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
