"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { ArrowLeft, Tag, Copy, Check, X, ChevronLeft, ChevronRight } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

const PROMOS = [
  {
    id: "p1",
    code: "WEEKEND50",
    title: "Weekend Blast",
    subtitle: "50% OFF Semua Tiket CGV",
    discount: "50%",
    validUntil: "31 Mei 2026",
    minPurchase: "Rp30.000",
    desc: "Nikmati diskon 50% untuk semua tiket CGV setiap Sabtu & Minggu. Hemat lebih, nonton lebih banyak film favoritmu bersama orang tersayang.",
    gradient: "from-cyan-600 via-blue-700 to-indigo-800",
    accent: "#06b6d4",
    terms: ["Berlaku Sabtu–Minggu saja", "Maks. diskon Rp25.000", "1x per akun per minggu", "Tidak berlaku untuk Premiere"],
    img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80",
  },
  {
    id: "p2",
    code: "FLASH10K",
    title: "Flash Sale QRIS",
    subtitle: "Cashback Rp10.000",
    discount: "Rp10K",
    validUntil: "15 Mei 2026",
    minPurchase: "Rp25.000",
    desc: "Bayar pakai QRIS dan dapatkan cashback Rp10.000 untuk setiap pembelian tiket. Kuota terbatas hanya 500 pengguna pertama setiap harinya!",
    gradient: "from-amber-500 via-orange-600 to-red-700",
    accent: "#f59e0b",
    terms: ["Berlaku metode QRIS saja", "Cashback dikreditkan 1x24 jam", "Kuota 500 pengguna/hari", "Berlaku semua hari"],
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80",
  },
  {
    id: "p3",
    code: "OCEANTIX30",
    title: "Special OceanTix",
    subtitle: "30% OFF Sepanjang Mei",
    discount: "30%",
    validUntil: "31 Mei 2026",
    minPurchase: "Rp35.000",
    desc: "Rayakan ulang tahun OceanTix! Dapatkan diskon 30% untuk semua tiket di seluruh bioskop XXI & CGV sepanjang bulan Mei 2026.",
    gradient: "from-teal-500 via-cyan-600 to-blue-700",
    accent: "#14b8a6",
    terms: ["Berlaku 1–31 Mei 2026", "Maks. diskon Rp30.000", "Berlaku 2x per akun", "Termasuk format 3D"],
    img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&q=80",
  },
  {
    id: "p4",
    code: "MEMBER20",
    title: "Member Exclusive",
    subtitle: "20% OFF Tiket Pertama",
    discount: "20%",
    validUntil: "31 Mei 2026",
    minPurchase: "Rp20.000",
    desc: "Khusus member terdaftar OceanTix, hemat 20% untuk pembelian tiket pertama kamu setiap bulannya. Daftar sekarang dan mulai hemat!",
    gradient: "from-purple-600 via-violet-700 to-pink-700",
    accent: "#a855f7",
    terms: ["Hanya akun terverifikasi", "1x per akun per bulan", "Berlaku semua bioskop", "Tidak bisa digabung promo lain"],
    img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80",
  },
];

function PromoContent() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selected, setSelected] = useState<typeof PROMOS[0] | null>(null);
  const [copied, setCopied] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const searchParams = useSearchParams();

  // Auto-open promo from URL param (?id=p1)
  useEffect(() => {
    const id = searchParams.get("id");
    if (id) {
      const promo = PROMOS.find((p) => p.id === id);
      if (promo) setSelected(promo);
    }
  }, [searchParams]);

  // Auto-scroll
  useEffect(() => {
    if (isPaused || selected) return;
    const interval = setInterval(() => {
      if (scrollRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = scrollRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          scrollRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          scrollRef.current.scrollBy({ left: scrollRef.current.clientWidth * 0.85, behavior: "smooth" });
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused, selected]);

  const scroll = (dir: "left" | "right") => {
    if (!scrollRef.current) return;
    scrollRef.current.scrollBy({
      left: dir === "left" ? -scrollRef.current.clientWidth * 0.85 : scrollRef.current.clientWidth * 0.85,
      behavior: "smooth",
    });
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans pb-28">
      {/* DETAIL MODAL */}
      {selected && (
        <div className="fixed inset-0 z-[300] flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-md bg-[#0d1b2a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="relative h-44 overflow-hidden">
              <img src={selected.img} alt={selected.title} className="w-full h-full object-cover" />
              <div className={`absolute inset-0 bg-gradient-to-t ${selected.gradient} opacity-70`} />
              <div className="absolute inset-0 p-5 flex flex-col justify-end">
                <p className="text-[10px] font-black text-white/70 uppercase tracking-widest mb-0.5">{selected.subtitle}</p>
                <h3 className="text-2xl font-black text-white uppercase italic tracking-tighter">{selected.title}</h3>
                <span className="text-4xl font-black text-white/90 absolute top-4 right-5">{selected.discount}</span>
              </div>
              <button onClick={() => setSelected(null)} className="absolute top-4 left-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center">
                <X className="w-4 h-4 text-white" />
              </button>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-slate-300 leading-relaxed">{selected.desc}</p>
              <div className="flex gap-4 text-[10px] text-slate-500 font-bold uppercase tracking-wider">
                <span>Min. {selected.minPurchase}</span><span>·</span>
                <span>Berlaku s/d {selected.validUntil}</span>
              </div>
              <div className="flex gap-2">
                <div className="flex-1 bg-white/5 border border-dashed border-white/20 rounded-xl px-4 py-3 flex items-center">
                  <span className="font-black tracking-widest text-sm" style={{ color: selected.accent }}>{selected.code}</span>
                </div>
                <button onClick={() => copyCode(selected.code)}
                  className={`px-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-1.5 ${copied ? "bg-green-600 text-white" : "bg-cyan-600 hover:bg-cyan-500 text-white"}`}>
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                  {copied ? "Disalin!" : "Salin"}
                </button>
              </div>
              <div className="bg-white/[0.03] border border-white/5 rounded-xl p-4">
                <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3">Syarat & Ketentuan</p>
                <ul className="space-y-2">
                  {selected.terms.map((t, i) => (
                    <li key={i} className="flex items-start gap-2 text-xs text-slate-400">
                      <span className="mt-0.5 flex-none" style={{ color: selected.accent }}>•</span>{t}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* HEADER */}
      <header className="sticky top-0 bg-[#000814]/90 backdrop-blur-md z-50 px-4 py-4 flex items-center justify-between border-b border-white/5 h-[70px]">
        <Link href="/" className="p-2 hover:bg-white/10 rounded-full transition-all">
          <ArrowLeft className="w-6 h-6 text-white" />
        </Link>
        <div className="flex items-center gap-2">
          <Tag className="w-5 h-5 text-cyan-400" />
          <h1 className="text-sm font-black uppercase tracking-widest">Promo</h1>
        </div>
        <div className="w-10" />
      </header>

      <main className="pt-6 pb-10">
        <div className="px-6 md:px-10 mb-6">
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mb-1">Eksklusif</p>
          <h2 className="text-2xl md:text-3xl font-black uppercase italic tracking-tighter">Promo Pilihan</h2>
        </div>

        <div className="relative group/banner px-6 md:px-10"
          onMouseEnter={() => setIsPaused(true)}
          onMouseLeave={() => setIsPaused(false)}>
          <button onClick={() => scroll("left")}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/60 hover:bg-cyan-600 rounded-full border border-white/10 hidden md:flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-all">
            <ChevronLeft className="w-5 h-5 text-white" />
          </button>
          <button onClick={() => scroll("right")}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 bg-black/60 hover:bg-cyan-600 rounded-full border border-white/10 hidden md:flex items-center justify-center opacity-0 group-hover/banner:opacity-100 transition-all">
            <ChevronRight className="w-5 h-5 text-white" />
          </button>

          <div ref={scrollRef} className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
            {PROMOS.map((promo) => (
              <div key={promo.id} onClick={() => setSelected(promo)}
                className="flex-none w-[85%] md:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-3rem)/3)] aspect-[16/9] rounded-2xl md:rounded-[2rem] relative overflow-hidden border border-white/5 cursor-pointer snap-center shadow-2xl group hover:scale-[1.02] transition-transform duration-300">
                <img src={promo.img} alt={promo.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                <div className={`absolute inset-0 bg-gradient-to-br ${promo.gradient} opacity-75`} />
                <div className="absolute inset-0 p-5 md:p-6 flex flex-col justify-between">
                  <div className="flex justify-between items-start">
                    <span className="text-[9px] md:text-[10px] font-black text-white/70 uppercase tracking-widest bg-black/30 px-2 py-1 rounded-full">{promo.subtitle}</span>
                    <span className="text-3xl md:text-4xl font-black text-white/90">{promo.discount}</span>
                  </div>
                  <div>
                    <h3 className="text-xl md:text-2xl font-black text-white uppercase italic tracking-tighter leading-tight mb-1">{promo.title}</h3>
                    <div className="flex items-center justify-between">
                      <p className="text-[10px] md:text-xs text-white/60 font-bold uppercase tracking-wider">s/d {promo.validUntil}</p>
                      <span className="text-[9px] md:text-[10px] bg-white/20 backdrop-blur-sm border border-white/20 text-white font-black px-2.5 py-1 rounded-full uppercase tracking-wider">Lihat Detail →</span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <p className="text-center text-[10px] text-slate-600 mt-8 uppercase tracking-widest font-bold">
          Ketuk banner untuk melihat detail & kode promo
        </p>
      </main>

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function PromoPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000814]" />}>
      <PromoContent />
    </Suspense>
  );
}
