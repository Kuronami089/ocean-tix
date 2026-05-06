"use client";

import React, { useState, useEffect, useMemo, Dispatch, SetStateAction } from "react";
import { X, Search, Filter, Star, MapPin, ChevronRight, User, Clock, Bell } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { DUMMY_THEATERS, CITIES } from "@/lib/data";
import { getNext30Days } from "@/lib/utils";
import { SeatSelection, PaymentFlow } from "@/components/BookingSystem";
import { useRealtimeSeats } from "@/hooks/useRealtimeSeats";






interface MovieJadwalTabProps {
  user?: any;
  openAuthModal?: () => void;
  movie?: any;
  onBack: () => void;
  initialBookingData?: {
    time: string;
    theaterId: number;
    seatCount: number;
  } | null;
  onPaymentComplete?: () => void;
}

const MovieJadwalTab: React.FC<MovieJadwalTabProps> = ({ user, openAuthModal, movie, onBack, initialBookingData, onPaymentComplete }) => {
  const [searchCinema, setSearchCinema] = useState("");
  const [showFilter, setShowFilter] = useState(false);
  const [sortType, setSortType] = useState("terdekat");
  const [filterType, setFilterType] = useState("all");
  const [formatType, setFormatType] = useState("2D");
  const [selectedDate, setSelectedDate] = useState(0);
  const { selectedCity } = useLocation();
  const [showLoginWarning, setShowLoginWarning] = useState(false);
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<{ time: string; theater: any } | null>(
    initialBookingData ? { 
      time: initialBookingData.time, 
      theater: DUMMY_THEATERS.find(t => t.id === initialBookingData.theaterId) 
    } : null
  );
  const [seatCount, setSeatCount] = useState(initialBookingData?.seatCount || 1);
  const [showSeatMap, setShowSeatMap] = useState(!!initialBookingData);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showSeatWarning, setShowSeatWarning] = useState(false);
  
  // Checkout States
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [saveCard, setSaveCard] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'qris_scan' | 'success'>('idle');


  useEffect(() => {
    if (initialBookingData) {
      setSelectedSeatInfo({
        time: initialBookingData.time,
        theater: DUMMY_THEATERS.find(t => t.id === initialBookingData.theaterId)
      });
      setSeatCount(initialBookingData.seatCount);
      setShowSeatMap(true);
    }
  }, [initialBookingData]);

  const days = useMemo(() => getNext30Days(), []);

  const dummyStudio = useMemo(() => {
    if (!selectedSeatInfo) return "Studio 1";
    const studioNum = Math.floor(Math.random() * 5) + 1;
    return `Studio ${studioNum}`;
  }, [selectedSeatInfo?.theater?.name]);

  // Real-time seats from Supabase
  const { occupiedSeats } = useRealtimeSeats(
    movie?.id ?? "",
    selectedSeatInfo?.theater?.name ?? "",
    days[selectedDate]?.fullDate ?? "",
    selectedSeatInfo?.time ?? ""
  );


  const filteredTheaters = useMemo(() => {
    let result = DUMMY_THEATERS.filter(
      (t) =>
        t.city === selectedCity && // Filter by shared selectedCity
        t.name.toLowerCase().includes(searchCinema.toLowerCase()) &&
        (filterType === "all" || t.type === filterType),
    );
    if (sortType === "az") result.sort((a, b) => a.name.localeCompare(b.name));
    if (sortType === "za") result.sort((a, b) => b.name.localeCompare(a.name));
    if (sortType === "termurah")
      result.sort(
        (a, b) =>
          (formatType === "2D" ? a.price2D : a.price3D) -
          (formatType === "2D" ? b.price2D : b.price3D),
      );
    if (sortType === "terdekat") result.sort((a, b) => a.distance - b.distance);
    return result;
  }, [searchCinema, sortType, filterType, formatType, selectedCity]);

  return (
    <>
      <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
        {/* PICKER TANGGAL */}
      <div className="flex gap-3 overflow-x-auto pb-4 no-scrollbar">
        {days.map((day, i) => (
          <button
            key={i}
            onClick={() => setSelectedDate(i)}
            className={`flex-none min-w-[75px] md:min-w-[85px] py-3 px-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-1 ${selectedDate === i ? "bg-[#1e293b] border-[#1e293b]" : "bg-transparent border-white/10 hover:bg-white/5"}`}
          >
            <p className={`text-sm md:text-base font-bold ${selectedDate === i ? "text-white" : "text-slate-300"}`}>
              {day.dateNum} {day.month}
            </p>
            <p className={`text-[9px] md:text-[10px] font-semibold uppercase ${selectedDate === i ? "text-slate-300" : "text-slate-500"}`}>
              {day.dayName}
            </p>
          </button>
        ))}
      </div>

      {/* SEARCH & FILTER */}
      <div className="flex items-center gap-3 pb-4 border-b border-white/10">
        <div className="relative flex-1">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Cari bioskop..."
            className="w-full bg-transparent border border-white/20 py-3 pl-10 pr-4 rounded-full text-sm outline-none focus:border-cyan-500/50 text-white placeholder-slate-500 transition-all"
            value={searchCinema}
            onChange={(e) => setSearchCinema(e.target.value)}
          />
        </div>
        <button
          onClick={() => setShowFilter(!showFilter)}
          className={`flex-none flex items-center gap-2 px-5 py-3 rounded-full border transition-all text-sm font-semibold ${showFilter ? "bg-white/10 border-white/20 text-white" : "bg-transparent border-white/20 text-slate-300 hover:bg-white/5"}`}
        >
          <Filter className="w-4 h-4" /> Filter
        </button>
      </div>

      {showFilter && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-5 bg-white/5 border border-white/10 rounded-2xl mb-4">
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">
              Urutkan
            </label>
            <select
              value={sortType}
              onChange={(e) => setSortType(e.target.value)}
              className="w-full bg-[#000814] border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="terdekat">Terdekat</option>
              <option value="termurah">Termurah</option>
              <option value="az">A - Z</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">
              Brand
            </label>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full bg-[#000814] border border-white/10 p-3 rounded-xl text-xs outline-none focus:border-cyan-500/50 transition-colors"
            >
              <option value="all">Semua</option>
              <option value="XXI">XXI</option>
              <option value="CGV">CGV</option>
            </select>
          </div>
          <div>
            <label className="text-[9px] font-black text-slate-500 uppercase block mb-2">
              Format
            </label>
            <div className="flex bg-[#000814] p-1 rounded-xl border border-white/10">
              {["2D", "3D"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFormatType(f)}
                  className={`flex-1 py-2 rounded-lg text-[10px] font-black transition-all ${formatType === f ? "bg-[#1e293b] text-white" : "text-slate-500 hover:text-slate-300"}`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* LIST BIOSKOP */}
      <div className="space-y-4 pt-2">
        {filteredTheaters.map((theater) => (
          <div
            key={theater.id}
            className="bg-transparent border-b border-white/10 pb-6 mb-2"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <Star className="w-5 h-5 text-slate-400 fill-slate-400" />
                <h4 className="text-base md:text-lg font-bold text-white uppercase tracking-tight">
                  {theater.name}
                </h4>
              </div>
              <div className="px-2 py-0.5 border border-white/20 rounded text-[10px] font-bold text-slate-300 uppercase">
                {theater.type}
              </div>
            </div>
            
            <div className="flex justify-between items-center mb-4">
              <p className="text-sm font-bold text-slate-400 uppercase">
                {formatType}
              </p>
              <p className="text-sm font-medium text-slate-300">
                Rp{(formatType === "2D" ? theater.price2D : theater.price3D).toLocaleString("id-ID")}
              </p>
            </div>

            <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3">
              {["12:00", "12:40", "14:05", "14:45", "16:50", "18:20", "18:55", "20:30", "21:00", "23:59"].map(
                (time, idx) => {
                  const now = new Date();
                  const currentHour = now.getHours();
                  const currentMinute = now.getMinutes();
                  const [hourStr, minStr] = time.split(":");
                  const hour = parseInt(hourStr, 10);
                  const minute = parseInt(minStr, 10);

                  let isPast = false;
                  // Disable past times if the selected date is today (index 0)
                  if (selectedDate === 0) {
                    if (hour < currentHour || (hour === currentHour && minute < currentMinute)) {
                      isPast = true;
                    }
                  }
                  
                  return (
                    <button
                      key={idx}
                      disabled={isPast}
                      onClick={() => {
                        if (!user) {
                          setShowLoginWarning(true);
                        } else {
                          setSelectedSeatInfo({ time, theater });
                          setSeatCount(1);
                        }
                      }}
                      className={`py-2 px-4 rounded-lg text-sm font-semibold transition-all ${isPast ? "bg-white/5 text-slate-600 border border-transparent cursor-not-allowed opacity-50" : selectedSeatInfo?.time === time && selectedSeatInfo?.theater.id === theater.id ? "bg-cyan-600 text-white border-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.4)] scale-105" : "bg-white/10 border border-transparent text-white hover:border-white/50 hover:bg-transparent"}`}
                    >
                      {time}
                    </button>
                  );
                },
              )}
            </div>
          </div>
        ))}
      </div>
      </div>

      {/* LOGIN WARNING MODAL */}
      {showLoginWarning && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowLoginWarning(false)} />
          <div className="relative w-full max-w-sm bg-[#1e293b] rounded-3xl border border-white/10 p-6 shadow-2xl animate-in zoom-in-95">
            <div className="text-center mb-6">
              <div className="w-16 h-16 bg-cyan-500/20 text-cyan-400 rounded-full flex items-center justify-center mx-auto mb-4 border border-cyan-500/50">
                <User className="w-8 h-8" />
              </div>
              <h3 className="text-xl font-black italic uppercase tracking-tighter text-white mb-2">Yuk, Login Dulu!</h3>
              <p className="text-sm text-slate-400">Untuk memesan tiket dan memilih kursi, kamu harus login ya.</p>
            </div>
            <div className="flex flex-col gap-3">
              <button 
                onClick={() => {
                  setShowLoginWarning(false);
                  if (openAuthModal) openAuthModal();
                }}
                className="w-full py-3 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl font-black text-[10px] uppercase tracking-widest transition-all"
              >
                Login Sekarang
              </button>
              <button 
                onClick={() => setShowLoginWarning(false)}
                className="w-full py-3 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl font-black text-[10px] uppercase tracking-widest transition-all border border-white/10"
              >
                Nanti Saja
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SEAT SELECTION MODAL */}
      {selectedSeatInfo && !showSeatMap && !showCheckout && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setSelectedSeatInfo(null)} />
          <div className="relative w-full max-w-sm bg-[#e5e7eb] rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 text-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold">How many seats needed?</h3>
              <button onClick={() => setSelectedSeatInfo(null)} className="text-slate-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-[10px] font-black italic shadow-sm">
                {selectedSeatInfo.theater.type}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-slate-900 tracking-tighter mb-0.5">{movie?.title || "Movie Title"}</h4>
                <p className="text-[11px] font-semibold text-slate-500">
                  {days[selectedDate].dayName}, {days[selectedDate].dateNum} {days[selectedDate].month} {new Date().getFullYear()}
                </p>
              </div>
            </div>

            <ul className="text-[10px] text-amber-600 font-medium list-disc pl-4 space-y-1 mb-6">
              <li>Tiket yang udah dibeli gak bisa di-refund atau ditukar</li>
              <li>Kamu wajib membeli tiket untuk anak berumur 2 tahun dan lebih.</li>
            </ul>

            <div className="flex items-center justify-between mb-8 p-3 bg-slate-200/50 rounded-2xl border border-slate-300">
              <span className="text-sm font-bold text-slate-900 ml-2">{selectedSeatInfo.time}</span>
              <span className="text-sm font-bold text-cyan-700 mr-2">Rp {((formatType === "2D" ? selectedSeatInfo.theater.price2D : selectedSeatInfo.theater.price3D) * seatCount).toLocaleString("id-ID")}</span>
            </div>

            <div className="flex items-center justify-center gap-6 mb-8">
              <button 
                onClick={() => setSeatCount(Math.max(1, seatCount - 1))}
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-white transition-colors bg-slate-100 shadow-sm"
              >
                -
              </button>
              <span className="text-2xl font-black text-slate-900 w-8 text-center">{seatCount}</span>
              <button 
                onClick={() => setSeatCount(Math.min(10, seatCount + 1))}
                className="w-10 h-10 rounded-full border border-slate-300 flex items-center justify-center text-slate-600 hover:bg-white transition-colors bg-slate-100 shadow-sm"
              >
                +
              </button>
            </div>

            <button 
              onClick={() => {
                setShowSeatMap(true);
                setSelectedSeats([]);
              }}
              className="w-full py-4 bg-[#0f172a] hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
            >
              Continue
            </button>
          </div>
        </div>
      )}

      {showSeatMap && selectedSeatInfo && (
        <SeatSelection
          movie={movie}
          selectedSeatInfo={selectedSeatInfo}
          seatCount={seatCount}
          selectedSeats={selectedSeats}
          setSelectedSeats={setSelectedSeats}
          formatType={formatType}
          selectedDate={selectedDate}
          days={days}
          dummyStudio={dummyStudio}
          dummyOccupiedSeats={occupiedSeats}
          onClose={() => setShowSeatMap(false)}
          onContinue={() => {
            setTimeLeft(600); // reset timer
            setShowCheckout(true);
            setShowSeatMap(false);
          }}
          showSeatWarning={showSeatWarning}
          setShowSeatWarning={setShowSeatWarning}
        />
      )}

      {selectedSeatInfo && (showCheckout || paymentStatus !== 'idle') && (
        <PaymentFlow
          movie={movie}
          selectedSeatInfo={selectedSeatInfo}
          selectedSeats={selectedSeats}
          seatCount={seatCount}
          formatType={formatType}
          selectedDate={selectedDate}
          days={days}
          dummyStudio={dummyStudio}
          onClose={() => {
            setShowCheckout(false);
            setShowSeatMap(true);
          }}
          onComplete={() => {
            if (onPaymentComplete) {
              onPaymentComplete();
            } else {
              setShowCheckout(false);
              setPaymentStatus('idle');
              setSelectedSeatInfo(null);
              setSelectedSeats([]);
            }
          }}
          showCheckout={showCheckout}
          setShowCheckout={setShowCheckout}
          paymentStatus={paymentStatus}
          setPaymentStatus={setPaymentStatus}
          paymentMethod={paymentMethod}
          setPaymentMethod={setPaymentMethod}
          timeLeft={timeLeft}
          setTimeLeft={setTimeLeft}
          saveCard={saveCard}
          setSaveCard={setSaveCard}
        />
      )}

      {/* GLOBAL CSS HACK TO HIDE BOTTOM NAV WHEN MODALS ARE OPEN */}
      {(showSeatMap || showCheckout || paymentStatus !== 'idle') && (
        <style>{`
          nav.fixed.bottom-4 {
            opacity: 0 !important;
            pointer-events: none !important;
            transition: opacity 0.2s ease-in-out;
          }
        `}</style>
      )}

    </>
  );
};

interface BreadcrumbItem {
  label: string;
  href?: string;
  onClick?: () => void;
}

interface MovieDetailProps {
  movie: any;
  onBack: () => void;
  handlePlayTrailer: (id: number) => void;
  user?: any;
  openAuthModal?: () => void;
  initialBookingData?: {
    time: string;
    theaterId: number;
    seatCount: number;
  } | null;
  /** Optional extra breadcrumb items inserted between Beranda and movie title */
  extraBreadcrumbs?: BreadcrumbItem[];
  /** Called after payment success — defaults to resetting booking state */
  onPaymentComplete?: () => void;
}

const MovieDetailPage: React.FC<MovieDetailProps> = ({
  movie,
  onBack,
  handlePlayTrailer,
  user,
  openAuthModal,
  initialBookingData,
  extraBreadcrumbs,
  onPaymentComplete,
}) => {
  const { selectedCity, setSelectedCity } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const [activeTab, setActiveTab] = useState("jadwal");
  const [showTrailer, setShowTrailer] = useState(false);
  const [videoKey, setVideoKey] = useState<string | null>(null);
  const [cast, setCast] = useState<any[]>([]);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const apiKey = "1a82e830e599746ce2f5636d396471ab";
        const response = await fetch(
          `https://api.themoviedb.org/3/movie/${movie.id}/credits?api_key=${apiKey}`,
        );
        const data = await response.json();
        setCast(data.cast || []);
      } catch (error) {
        console.error("Gagal memuat data pemeran:", error);
      }
    };
    if (movie?.id) fetchCredits();
  }, [movie.id]);

  const handleOpenTrailer = async () => {
    try {
      const apiKey = "1a82e830e599746ce2f5636d396471ab";
      const response = await fetch(
        `https://api.themoviedb.org/3/movie/${movie.id}/videos?api_key=${apiKey}`,
      );
      const data = await response.json();
      const allVideos = data.results || [];
      let selectedVideo = allVideos.find(
        (v: any) =>
          v.type === "Trailer" &&
          v.site === "YouTube" &&
          !v.name.toLowerCase().includes("shorts") &&
          !v.name.toLowerCase().includes("teaser"),
      );
      const finalKey =
        selectedVideo?.key ||
        allVideos.find((v: any) => v.type === "Trailer")?.key ||
        movie.video_id;
      if (finalKey) {
        setVideoKey(finalKey);
        setShowTrailer(true);
      } else {
        alert("Trailer tidak tersedia.");
      }
    } catch (error) {
      console.error("Gagal memuat trailer:", error);
    }
  };

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans">
      {/* STICKY TOP NAVBAR — matches main page style */}
      <nav className="flex justify-between items-center p-4 md:p-5 md:px-10 sticky top-0 bg-[#000814]/80 backdrop-blur-md z-50 border-b border-white/5 h-[70px] md:h-[90px] gap-4">
        {/* Left: Back + Logo + Location */}
        <div className="flex items-center gap-3 md:gap-6 flex-shrink-0">
          <button
            onClick={onBack}
            className="p-2 hover:bg-white/10 rounded-full transition-all"
            aria-label="Kembali"
          >
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" strokeWidth={2.5} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <span
            onClick={onBack}
            className="text-xl md:text-2xl font-black italic tracking-tight uppercase cursor-pointer select-none"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
              OCEAN{"\u00A0"}
            </span>
            <span className="text-white">TIX</span>
          </span>
          <div
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-2 bg-slate-800/50 px-3 md:px-5 py-2 md:py-2.5 rounded-full border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-all"
          >
            <MapPin className="w-3 h-3 md:w-4 md:h-4 text-cyan-400" />
            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-300 truncate max-w-[80px] md:max-w-none">
              {selectedCity}
            </span>
          </div>
        </div>

        {/* Right: Promo + Bell */}
        <div className="flex items-center gap-3 md:gap-8 text-[9px] md:text-[11px] font-bold uppercase tracking-widest flex-shrink-0">
          <a
            href="/promo"
            className="text-slate-400 hover:text-white cursor-pointer transition-colors hidden sm:block"
          >
            Promo
          </a>
          <a
            href="/notifications"
            className="relative p-2 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#000814]" />
          </a>
        </div>
      </nav>

      {/* LOCATION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => { setShowLocationModal(false); setLocationSearch(""); }} />
          <div className="relative w-full max-w-sm bg-[#0d1b2a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-black text-base uppercase tracking-tight">Pilih Kota</h3>
              <button onClick={() => { setShowLocationModal(false); setLocationSearch(""); }} className="p-2 hover:bg-white/10 rounded-full">
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="px-4 pt-4 pb-2">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  placeholder="Cari kota..."
                  value={locationSearch}
                  onChange={e => setLocationSearch(e.target.value)}
                  className="w-full bg-white/5 border border-white/10 rounded-xl pl-9 pr-4 py-2.5 text-sm text-white outline-none focus:border-cyan-500/50 placeholder-slate-500"
                />
              </div>
            </div>
            <div className="px-4 pb-4 max-h-64 overflow-y-auto space-y-1">
              {CITIES.filter(c => c.toLowerCase().includes(locationSearch.toLowerCase())).map(city => (
                <button
                  key={city}
                  onClick={() => { setSelectedCity(city); setShowLocationModal(false); setLocationSearch(""); }}
                  className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold transition-all ${
                    city === selectedCity
                      ? "bg-cyan-600 text-white"
                      : "text-slate-300 hover:bg-white/5"
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* MODAL TRAILER (Tetap sama) */}
      {showTrailer && videoKey && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/95 backdrop-blur-xl"
            onClick={() => setShowTrailer(false)}
          />
          <div className="relative w-full max-w-5xl aspect-video bg-black rounded-[2rem] overflow-hidden shadow-[0_0_60px_rgba(6,182,212,0.4)] border border-white/10">
            <button
              onClick={() => setShowTrailer(false)}
              className="absolute top-4 right-4 z-[10000] p-2.5 bg-black/50 hover:bg-white/10 rounded-full transition-all text-white border border-white/10"
            >
              <X size={24} />
            </button>
            <iframe
              src={`https://www.youtube.com/embed/${videoKey}?autoplay=1&rel=0&modestbranding=1`}
              title="Movie Trailer"
              className="absolute inset-0 w-full h-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        </div>
      )}

      {/* HERO SECTION (Tetap sama) */}
      <section className="relative min-h-[60vh] w-full pt-6 pb-12 overflow-hidden">
        <div className="absolute inset-0 z-0">
          <img
            src={`https://image.tmdb.org/t/p/original${movie.backdrop_path}`}
            alt=""
            className="w-full h-full object-cover opacity-20 blur-2xl scale-110"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#000814]/50 via-[#000814] to-[#000814]" />
        </div>
        <div className="relative z-10 max-w-6xl mx-auto px-8">
          <nav className="flex flex-wrap gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-8">
            <span
              onClick={onBack}
              className="hover:text-cyan-400 cursor-pointer transition-colors"
            >
              Beranda
            </span>
            {extraBreadcrumbs?.map((crumb, i) => (
              <React.Fragment key={i}>
                <span>/</span>
                {crumb.href ? (
                  <a href={crumb.href} className="hover:text-cyan-400 transition-colors">{crumb.label}</a>
                ) : (
                  <span
                    onClick={crumb.onClick}
                    className={crumb.onClick ? "hover:text-cyan-400 cursor-pointer transition-colors" : ""}
                  >
                    {crumb.label}
                  </span>
                )}
              </React.Fragment>
            ))}
            <span>/</span>
            <span className="text-slate-200 truncate max-w-[200px] md:max-w-none">{movie.title}</span>
          </nav>
          <div className="flex flex-col md:flex-row gap-8 md:gap-12 items-start">
            <div className="flex-none w-[200px] md:w-[240px] aspect-[2/3] rounded-[2rem] overflow-hidden border border-white/10 shadow-2xl">
              <img
                src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                alt={movie.title}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="flex-1">
              <p className="text-[10px] md:text-xs font-semibold text-cyan-400">
                Tayang :{" "}
                {movie.release_date
                  ? new Intl.DateTimeFormat("id-ID", {
                      day: "numeric",
                      month: "long",
                    }).format(new Date(movie.release_date))
                  : "-"}
              </p>
              <h1 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-2 leading-tight">
                {movie.title}
              </h1>
              <p className="text-slate-400 text-xs md:text-sm font-bold uppercase tracking-widest mb-8">
                {movie.genres || "Movie"}
              </p>
              <div className="flex flex-wrap items-center gap-4 md:gap-6">
                <button
                  onClick={handleOpenTrailer}
                  className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/10 px-6 py-3 rounded-full transition-all"
                >
                  <div className="w-8 h-8 bg-cyan-500 rounded-full flex items-center justify-center text-black">
                    <span className="ml-0.5">▶</span>
                  </div>
                  <span className="text-[10px] md:text-xs font-black uppercase tracking-widest">
                    Lihat Trailer
                  </span>
                </button>
                <div className="flex items-center gap-3">
                  <span className="text-slate-300 text-[7px] md:text-[8px] font-bold uppercase tracking-tighter">
                    {movie?.runtime
                      ? `${Math.floor(Number(movie.runtime) / 60)}h ${Number(movie.runtime) % 60}m`
                      : "TBA"}
                  </span>
                  <div
                    className={`px-2 py-1.5 rounded-md text-[10px] font-black border ${movie.age_rating === "R" || movie.age_rating?.includes("17") ? "bg-red-600/20 border-red-500 text-red-500" : "bg-green-600/20 border-green-500 text-green-500"}`}
                  >
                    {movie.age_rating || "17+"}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* TABS SECTION */}
      <section className="max-w-6xl mx-auto px-8 pb-20">
        <div className="flex gap-8 border-b border-white/5 mb-8">
          {["jadwal", "detail"].map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-4 text-xs font-black uppercase tracking-[0.2em] transition-all relative ${activeTab === tab ? "text-white" : "text-slate-500 hover:text-slate-300"}`}
            >
              {tab}
              {activeTab === tab && (
                <div className="absolute bottom-0 left-0 w-full h-0.5 bg-cyan-500" />
              )}
            </button>
          ))}
        </div>

        {/* --- MODIFIKASI DISINI: Panggil Komponen Jadwal Baru --- */}
        {activeTab === "jadwal" ? (
          <MovieJadwalTab 
            user={user} 
            openAuthModal={openAuthModal} 
            movie={movie} 
            onBack={onBack} 
            initialBookingData={initialBookingData}
            onPaymentComplete={onPaymentComplete}
          />
        ) : (
          <div className="max-w-4xl">
            {/* Bagian Sinopsis & Detail (Tetap sama seperti kodingan asli lo) */}
            <div className="max-w-3xl text-slate-300 leading-relaxed mb-12">
              <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-2">
                Sinopsis
              </p>
              <p className="text-sm md:text-base">
                {movie.overview || movie.synopsis || "Belum ada sinopsis."}
              </p>
            </div>
            <div className="flex flex-col gap-10 border-t border-white/5 pt-8">
              <div className="space-y-6">
                {[
                  { label: "Sutradara", value: movie?.director || "-" },
                  { label: "Penulis", value: movie?.writer || "-" },
                  { label: "Production", value: movie?.studio || "-" },
                ].map((item, i) => (
                  <div key={i}>
                    <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-1">
                      {item.label}
                    </p>
                    <p className="text-sm font-medium text-white">
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
              <div>
                <p className="text-slate-500 text-[10px] uppercase font-bold tracking-widest mb-6">
                  Pemeran
                </p>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 gap-6">
                  {cast.slice(0, 12).map((actor: any) => (
                    <div
                      key={actor.id}
                      className="flex flex-col items-center gap-3"
                    >
                      <div className="w-16 h-16 md:w-20 md:h-20 rounded-full overflow-hidden bg-slate-700 border border-white/10 shadow-lg">
                        {actor.profile_path ? (
                          <img
                            src={`https://image.tmdb.org/t/p/w185${actor.profile_path}`}
                            alt={actor.name}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-xs font-bold text-slate-400 uppercase">
                            {actor.name
                              .split(" ")
                              .map((n: any) => n[0])
                              .join("")
                              .slice(0, 2)}
                          </div>
                        )}
                      </div>
                      <p className="text-[10px] md:text-xs font-medium text-center text-slate-200 line-clamp-2">
                        {actor.name}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </section>
    </div>
  );
};

export default MovieDetailPage;
