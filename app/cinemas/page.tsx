"use client";

import React, { useState, useMemo } from "react";
import { Search, MapPin, ChevronRight, Bell } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { DUMMY_THEATERS, CITIES } from "@/lib/data";
import Link from "next/link";

export default function CinemasPage() {
  const { selectedCity, setSelectedCity } = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [citySearch, setCitySearch] = useState("");

  const filteredTheaters = useMemo(() => {
    return DUMMY_THEATERS.filter(
      (t) =>
        t.city === selectedCity &&
        t.name.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }, [selectedCity, searchTerm]);

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans">
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
          <Link
            href="/promo"
            className="text-slate-400 hover:text-white cursor-pointer transition-colors"
          >
            Promo
          </Link>
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

      <main className="max-w-4xl mx-auto px-6 py-10">
        {/* BREADCRUMBS */}
        <nav className="flex gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-200">Bioskop</span>
        </nav>

        {/* TITLE */}
        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-10 leading-tight">
          Bioskop
        </h2>

        {/* SEARCH BAR */}
        <div className="relative mb-12">
          <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
          <input
            type="text"
            placeholder={`Cari bioskop di ${selectedCity.toUpperCase()}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white/5 border border-white/10 text-white py-5 pl-16 pr-8 rounded-full text-sm md:text-base outline-none focus:border-cyan-500/50 transition-all backdrop-blur-md"
          />
        </div>

        {/* CINEMA LIST */}
        <div className="space-y-4">
          {filteredTheaters.length > 0 ? (
            filteredTheaters.map((theater) => (
              <Link
                key={theater.id}
                href={`/cinemas/${theater.id}`}
                className="group relative bg-white/5 border border-white/10 hover:border-cyan-500/30 p-6 md:p-8 rounded-[2rem] transition-all duration-300 flex items-center justify-between overflow-hidden block"
              >
                {/* Background glow on hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/0 to-cyan-500/0 group-hover:via-cyan-500/5 transition-all duration-500"></div>
                
                <div className="relative z-10 flex flex-col gap-4">
                  <h3 className="text-lg md:text-xl font-black uppercase tracking-tight text-white group-hover:text-cyan-400 transition-colors">
                    {theater.name}
                  </h3>
                  
                  <div className="flex gap-3 items-center">
                    {/* Brand Tag */}
                    <div className="px-3 py-1 bg-white/10 border border-white/20 rounded-md">
                      <span className="text-[10px] md:text-[11px] font-black italic tracking-tighter text-slate-300">
                        {theater.type === "XXI" ? "Cinema XXI" : "CGV Cinemas"}
                      </span>
                    </div>
                    
                    {/* Premiere Tag if applicable */}
                    {theater.hasPremiere && (
                      <div className="px-3 py-1 bg-amber-900/20 border border-amber-500/30 rounded-md">
                        <span className="text-[10px] md:text-[11px] font-black italic tracking-tighter text-amber-500">
                          the Premiere
                        </span>
                      </div>
                    )}
                  </div>
                </div>

                <div className="relative z-10 flex items-center justify-center w-10 h-10 rounded-full bg-white/5 border border-white/10 group-hover:bg-cyan-500 group-hover:border-cyan-400 transition-all duration-300">
                  <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-white" />
                </div>
              </Link>
            ))
          ) : (
            <div className="text-center py-20 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
              <p className="text-slate-500 font-bold uppercase tracking-widest">
                Tidak ada bioskop ditemukan di {selectedCity}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* LOCATION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-[#000814] border border-white/10 w-full max-w-md rounded-[2.5rem] p-8 shadow-2xl max-h-[80vh] flex flex-col">
            <h3 className="text-xl font-black uppercase italic tracking-tighter mb-4">Pilih Lokasi</h3>
            <div className="relative mb-4">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari kota..."
                value={citySearch}
                onChange={(e) => setCitySearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white py-3 pl-10 pr-4 rounded-xl text-sm outline-none focus:border-cyan-500/50 transition-all"
              />
            </div>
            <div className="flex-1 overflow-y-auto grid grid-cols-1 gap-2 pr-1">
              {CITIES.filter(c => c.toLowerCase().includes(citySearch.toLowerCase())).map((city) => (
                <button
                  key={city}
                  onClick={() => {
                    setSelectedCity(city);
                    setShowLocationModal(false);
                    setCitySearch("");
                  }}
                  className={`w-full py-3.5 rounded-2xl font-bold transition-all border text-left px-4 ${
                    selectedCity === city
                      ? 'bg-cyan-600 border-cyan-400 text-white'
                      : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
            <button
              onClick={() => { setShowLocationModal(false); setCitySearch(""); }}
              className="w-full mt-6 py-4 text-slate-500 font-bold uppercase tracking-widest text-xs hover:text-white transition-colors"
            >
              Tutup
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
