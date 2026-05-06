"use client";

import React, { useState } from "react";
import { Search, Bell, Ticket as TicketIcon, Clock } from "lucide-react";
import Link from "next/link";
import { useTickets } from "@/context/TicketContext";
import { useLocation } from "@/context/LocationContext";
import { MapPin } from "lucide-react";

export default function TicketsPage() {
  const [activeTab, setActiveTab] = useState<"aktif" | "transaksi">("aktif");
  const { tickets } = useTickets();
  const { selectedCity, setSelectedCity } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);

  const getRelativeDateLabel = (timestamp: number | undefined, originalDate: string) => {
    if (!timestamp) return originalDate;
    const tDate = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    
    let dayName = new Intl.DateTimeFormat("id-ID", { weekday: "short" }).format(tDate).toUpperCase();
    if (tDate.toDateString() === today.toDateString()) {
      dayName = "HARI INI";
    } else if (tDate.toDateString() === yesterday.toDateString()) {
      dayName = "KEMARIN";
    }

    const dateNum = tDate.getDate();
    const monthName = new Intl.DateTimeFormat("id-ID", { month: "short" }).format(tDate).toUpperCase();
    const year = tDate.getFullYear();

    return `${dayName}, ${dateNum} ${monthName} ${year}`;
  };

  const now = Date.now();
  const ONE_DAY_MS = 24 * 60 * 60 * 1000;
  const activeTickets = tickets.filter((t) => t.timestamp ? (t.timestamp + ONE_DAY_MS) > now : t.status === "active");
  const pastTickets = tickets.filter((t) => t.timestamp ? (t.timestamp + ONE_DAY_MS) <= now : t.status === "past");

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans pb-24">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center p-4 md:p-5 md:px-10 sticky top-0 bg-[#000814]/90 backdrop-blur-md z-[100] border-b border-white/5 h-[70px] md:h-[90px] gap-4">
        <div className="flex items-center gap-4 md:gap-8 flex-shrink-0">
          <Link href="/">
            <h1 className="text-xl md:text-2xl font-black italic tracking-tight uppercase cursor-pointer">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
                OCEAN{"\u00A0"}
              </span>
              <span className="text-white">TIX</span>
            </h1>
          </Link>
          <div
            onClick={() => setShowLocationModal(true)}
            className="group flex items-center gap-2 bg-slate-800/50 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-all"
          >
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-300 truncate max-w-[80px] md:max-w-none">
              {selectedCity}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 md:gap-8 text-[9px] md:text-[11px] font-bold uppercase tracking-widest flex-shrink-0">
          <span className="text-slate-400 hover:text-white cursor-pointer transition-colors">
            Promo
          </span>
          <Link
            href="/notifications"
            className="relative p-2 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            {/* Dot Notifikasi Merah */}
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#000814]"></span>
          </Link>
        </div>
      </nav>

      {/* TABS */}
      <div className="flex border-b border-white/10">
        <button
          onClick={() => setActiveTab("aktif")}
          className={`flex-1 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === "aktif" ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
            }`}
        >
          Tiket Aktif
          {activeTab === "aktif" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400" />
          )}
        </button>
        <button
          onClick={() => setActiveTab("transaksi")}
          className={`flex-1 py-4 text-xs md:text-sm font-black uppercase tracking-widest transition-all relative ${activeTab === "transaksi" ? "text-cyan-400" : "text-slate-500 hover:text-slate-300"
            }`}
        >
          Daftar Transaksi
          {activeTab === "transaksi" && (
            <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-400" />
          )}
        </button>
      </div>

      <main className="px-6 py-6 max-w-4xl mx-auto">
        {/* SUB TABS (Pills) */}
        <div className="flex gap-3 mb-8">
          <button className="px-5 py-2 rounded-xl text-xs font-bold border border-cyan-500 text-cyan-400 bg-cyan-500/10">
            Film
          </button>
        </div>

        {/* CONTENT */}
        {activeTab === "aktif" ? (
          activeTickets.length > 0 ? (
            <div className="space-y-4">
              {activeTickets.map((ticket) => (
                <div key={ticket.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="bg-white/5 border border-white/10 rounded-3xl p-5 flex gap-4 items-start hover:border-cyan-500/50 transition-all group"
                  >
                    {/* Poster */}
                    <div className="w-20 md:w-24 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10">
                      <img
                        src={`https://image.tmdb.org/t/p/w200${ticket.movie.poster_path}`}
                        alt={ticket.movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                      <div>
                        <h4 className="text-sm md:text-base font-black text-white uppercase tracking-tight truncate mb-1 group-hover:text-cyan-400 transition-colors">
                          {ticket.movie.title}
                        </h4>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest truncate mb-2 flex items-center gap-1">
                          <span className="w-3 h-3 inline-block bg-slate-400 rounded-full" style={{ maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z\'%3E%3C/path%3E%3Ccircle cx=\'12\' cy=\'10\' r=\'3\'%3E%3C/circle%3E%3C/svg%3E")', maskSize: 'cover', maskRepeat: 'no-repeat', maskPosition: 'center', backgroundColor: 'currentColor' }}></span>
                          {ticket.theater.name}
                        </p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                          <TicketIcon className="w-3 h-3" />
                          Tiket ({ticket.seatCount})
                        </p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500">
                          {getRelativeDateLabel(ticket.timestamp, ticket.date)}, {ticket.time}
                        </p>
                      </div>
                      <div className="flex justify-end mt-2">
                        <span className="text-cyan-400 font-black text-xs md:text-sm">Aktif</span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
              <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                <TicketIcon className="w-16 h-16 text-slate-600" />
              </div>
              <h3 className="text-xl font-black text-white mb-2">Nonton Film Yuk!</h3>
              <p className="text-sm text-slate-400 mb-8 max-w-[250px]">
                Dapatkan tiket nonton seru di bioskop favoritmu.
              </p>
              <Link
                href="/cinemas"
                className="bg-[#1e293b] hover:bg-black border border-white/10 px-10 py-3.5 rounded-full text-sm font-black text-white uppercase tracking-widest transition-all shadow-lg"
              >
                Lihat Film
              </Link>
            </div>
          )
        ) : (
          <div className="space-y-6">
            {pastTickets.length > 0 ? (
              pastTickets.map((ticket) => (
                <div key={ticket.id} className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                  <Link
                    href={`/tickets/${ticket.id}`}
                    className="bg-white/5 border border-white/10 rounded-3xl p-5 flex gap-4 items-start hover:border-cyan-500/50 transition-all group"
                  >
                    {/* Poster */}
                    <div className="w-20 md:w-24 aspect-[2/3] rounded-xl overflow-hidden flex-shrink-0 bg-slate-800 border border-white/10">
                      <img
                        src={`https://image.tmdb.org/t/p/w200${ticket.movie.poster_path}`}
                        alt={ticket.movie.title}
                        className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                      />
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full py-1">
                      <div>
                        <h4 className="text-sm md:text-base font-black text-white uppercase tracking-tight truncate mb-1 group-hover:text-cyan-400 transition-colors">
                          {ticket.movie.title}
                        </h4>
                        <p className="text-[10px] md:text-xs font-bold text-slate-400 uppercase tracking-widest truncate mb-2 flex items-center gap-1">
                          <span className="w-3 h-3 inline-block bg-slate-400 rounded-full" style={{ maskImage: 'url("data:image/svg+xml,%3Csvg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'none\' stroke=\'currentColor\' stroke-width=\'2\' stroke-linecap=\'round\' stroke-linejoin=\'round\'%3E%3Cpath d=\'M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z\'%3E%3C/path%3E%3Ccircle cx=\'12\' cy=\'10\' r=\'3\'%3E%3C/circle%3E%3C/svg%3E")', maskSize: 'cover', maskRepeat: 'no-repeat', maskPosition: 'center', backgroundColor: 'currentColor' }}></span>
                          {ticket.theater.name}
                        </p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500 mb-1 flex items-center gap-1">
                          <TicketIcon className="w-3 h-3" />
                          Tiket ({ticket.seatCount})
                        </p>
                        <p className="text-[10px] md:text-xs font-medium text-slate-500">
                          {getRelativeDateLabel(ticket.timestamp, ticket.date)}, {ticket.time}
                        </p>
                      </div>
                      <div className="flex justify-end mt-2">
                        <span className="text-slate-500 font-black text-xs md:text-sm flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          Sudah Ditonton
                        </span>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in-95 duration-500">
                <div className="w-32 h-32 bg-white/5 rounded-full flex items-center justify-center mb-6 border border-white/10">
                  <Clock className="w-16 h-16 text-slate-600" />
                </div>
                <h3 className="text-xl font-black text-white mb-2">Belum Ada Riwayat</h3>
                <p className="text-sm text-slate-400 mb-8 max-w-[250px]">
                  Tiket yang sudah kamu tonton akan muncul di sini.
                </p>
                <Link
                  href="/"
                  className="bg-[#1e293b] hover:bg-black border border-white/10 px-10 py-3.5 rounded-full text-sm font-black text-white uppercase tracking-widest transition-all shadow-lg"
                >
                  Cari Film
                </Link>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
