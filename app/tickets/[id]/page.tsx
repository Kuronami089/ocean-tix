"use client";

import React, { useMemo, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { ArrowLeft, Copy, Check } from "lucide-react";
import { useTickets } from "@/context/TicketContext";

export default function TicketDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const { tickets } = useTickets();
  const [showQR, setShowQR] = useState(false);
  const [copied, setCopied] = useState(false);

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  };

  const ticket = useMemo(() => {
    return tickets.find((t) => t.id === id);
  }, [id, tickets]);

  if (!ticket) {
    return (
      <div className="min-h-screen bg-[#000814] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-2">Tiket Tidak Ditemukan</h2>
        <p className="text-slate-400 mb-8">Maaf, tiket yang kamu cari tidak ada atau sudah dihapus.</p>
        <button
          onClick={() => router.push("/tickets")}
          className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white font-black text-sm uppercase tracking-widest transition-all"
        >
          Kembali ke Tiket
        </button>
      </div>
    );
  }

  const isCGV = ticket.theater.type === "CGV" || ticket.theater.name.includes("CGV");
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const isTicketActive = ticket.timestamp ? (ticket.timestamp + ONE_DAY_MS) > Date.now() : ticket.status === "active";

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans pb-24 md:pb-10">
      {/* Header */}
      <header className="sticky top-0 bg-[#000814]/90 backdrop-blur-md z-50 px-4 py-4 flex items-center gap-4">
        <button
          onClick={() => router.back()}
          className="p-2 hover:bg-white/10 rounded-full transition-all"
        >
          <ArrowLeft className="w-6 h-6 text-white" />
        </button>
        <h1 className="text-lg md:text-xl font-black text-white">Sudah Tayang</h1>
      </header>

      <main className="max-w-md mx-auto px-4 mt-6">
        <div className="relative w-full shadow-2xl drop-shadow-2xl rounded-2xl overflow-hidden">
          {/* Top Section (Blue) */}
          <div className="bg-[#1e3a5f] p-6 text-white">
            <div className="flex gap-4">
              {/* Poster */}
              <div className="w-24 md:w-28 aspect-[2/3] rounded-lg overflow-hidden flex-shrink-0 shadow-lg border border-white/10">
                <img
                  src={`https://image.tmdb.org/t/p/w200${ticket.movie.poster_path}`}
                  alt={ticket.movie.title}
                  className="w-full h-full object-cover"
                />
              </div>
              
              {/* Info */}
              <div className="flex-1 flex flex-col justify-center">
                {/* Brand Logo (Text placeholder) */}
                <h2 className="text-xl md:text-2xl font-black italic tracking-tighter mb-4 text-white drop-shadow-md">
                  {isCGV ? "CGV*" : "CINEMA XXI"}
                </h2>
                
                <h3 className="text-sm md:text-base font-bold text-amber-500 uppercase tracking-tight mb-2 leading-tight drop-shadow-sm">
                  {ticket.movie.title}
                </h3>
                
                <p className="text-[10px] md:text-xs font-black text-white uppercase tracking-widest leading-relaxed mb-2 opacity-90">
                  {ticket.theater.name}<br />
                  {ticket.format}, {ticket.audi}
                </p>
                
                <p className="text-xs md:text-sm font-bold text-white mt-1">
                  {ticket.date}, {ticket.time}
                </p>
              </div>
            </div>
          </div>

          {/* Middle Section (Yellow) */}
          <div className="bg-[#eab308] p-6 relative">
            {/* Cutout details to simulate ticket edge */}
            <div className="absolute -top-3 left-4 w-6 h-6 bg-[#000814] rounded-full"></div>
            <div className="absolute -top-3 right-4 w-6 h-6 bg-[#000814] rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] border-t-2 border-dashed border-[#1e3a5f]/50"></div>
            
            <div className="grid grid-cols-2 gap-y-4 gap-x-2 relative z-10 text-[#5f4a00]">
              <div className="text-xs font-semibold">Kode Booking</div>
              <div className="text-sm font-black tracking-widest text-[#713f12] bg-[#fef08a] px-2 py-1 rounded w-fit opacity-80 backdrop-blur-sm">
                {ticket.bookingCode}
              </div>
              
              <div className="text-xs font-semibold">Pass Key</div>
              <div className="text-sm font-black tracking-widest text-[#713f12] bg-[#fef08a] px-2 py-1 rounded w-fit opacity-80 backdrop-blur-sm">
                {ticket.passKey}
              </div>
              
              <div className="text-xs font-semibold">{ticket.seatCount} Tiket</div>
              <div className="text-sm font-black text-[#713f12]">
                {ticket.seats.join(", ")}
              </div>
            </div>
            
            {/* Stamp */}
            <div className="absolute right-4 top-1/2 -translate-y-1/2 transform rotate-12 opacity-80 pointer-events-none">
              <div className="border-4 border-[#713f12] rounded-full p-1">
                <div className="border-2 border-[#713f12] rounded-full w-20 h-20 md:w-24 md:h-24 flex items-center justify-center relative">
                  {/* Inner text */}
                  <div className="absolute w-full flex items-center justify-center transform -rotate-12 bg-[#eab308] z-10 px-1">
                    <span className="text-[10px] md:text-xs font-black text-[#713f12] tracking-widest uppercase">
                      {isTicketActive ? "Belum Tayang" : "Sudah Tayang"}
                    </span>
                  </div>
                  {/* Decorative stars/dots around */}
                  <svg viewBox="0 0 100 100" className="w-full h-full text-[#713f12]">
                    <circle cx="50" cy="50" r="45" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="4 4" />
                  </svg>
                </div>
              </div>
            </div>
          </div>

          {/* Bottom Section (White) */}
          <div className="bg-[#f8fafc] text-slate-800 p-6 relative">
            <div className="absolute -top-3 left-4 w-6 h-6 bg-[#000814] rounded-full"></div>
            <div className="absolute -top-3 right-4 w-6 h-6 bg-[#000814] rounded-full"></div>
            <div className="absolute top-0 left-0 w-full h-[1px] border-t-2 border-dashed border-[#eab308]"></div>
            
            <div className="flex items-center justify-between mb-8 pt-2">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Nomor Order</span>
              <div className="flex items-center gap-2">
                <span className="text-sm font-black text-slate-900">{ticket.orderNumber}</span>
                <button
                  onClick={() => handleCopy(ticket.orderNumber)}
                  className="text-amber-600 hover:text-amber-700 transition-colors"
                  title="Salin nomor order"
                >
                  {copied ? <Check className="w-4 h-4 text-green-600" /> : <Copy className="w-4 h-4" />}
                </button>
              </div>
            </div>
            
            <div className="space-y-4 mb-8">
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-widest">Regular Kursi</span>
                <span className="font-bold text-slate-800">Rp{ticket.price.toLocaleString("id-ID")} × {ticket.seatCount}</span>
              </div>
              <div className="flex justify-between items-center text-xs">
                <span className="font-semibold text-slate-500 uppercase tracking-widest">Biaya Layanan*</span>
                <span className="font-bold text-slate-800">Rp{ticket.serviceFee.toLocaleString("id-ID")} × 1</span>
              </div>
              <div className="flex justify-between items-center text-xs pt-2">
                <span className="font-semibold text-slate-500 uppercase tracking-widest">Metode Pembayaran</span>
                <span className="font-black text-slate-900 uppercase">{ticket.paymentMethod}</span>
              </div>
            </div>
            
            <div className="border-t border-slate-200 pt-6 flex justify-between items-center mb-6">
              <span className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Total Pembayaran</span>
              <span className="text-lg font-black text-slate-900">
                Rp{((ticket.price * ticket.seatCount) + ticket.serviceFee).toLocaleString("id-ID")}
              </span>
            </div>
            
            <p className="text-[10px] text-slate-400 mb-8">*Termasuk Pajak</p>
            
            <div className="border-t border-slate-200 pt-6 flex flex-col items-center">
              {!showQR ? (
                <button 
                  onClick={() => setShowQR(true)}
                  className="px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white rounded-full text-xs font-bold uppercase tracking-widest transition-all w-full"
                >
                  Tampilkan QR Tiket
                </button>
              ) : (
                <div className="animate-in fade-in zoom-in-95 duration-300 flex flex-col items-center">
                  <div className="bg-white p-3 rounded-xl shadow-lg border border-slate-200 mb-3">
                    <img src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${ticket.bookingCode}`} alt="Ticket QR" className="w-32 h-32 md:w-40 md:h-40" />
                  </div>
                  <p className="text-[10px] text-slate-500 font-medium text-center max-w-[200px]">
                    Tunjukkan QR code ini kepada petugas saat memasuki studio.
                  </p>
                </div>
              )}
            </div>
          </div>
          
          {/* Bottom scalloped edge simulation */}
          <div className="h-4 w-full flex" style={{
            background: 'radial-gradient(circle at 10px 16px, #000814 10px, #f8fafc 11px) repeat-x',
            backgroundSize: '20px 20px',
            backgroundPosition: '-10px top'
          }}></div>
        </div>
      </main>
    </div>
  );
}
