"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { Search, X, ChevronDown, Bell } from "lucide-react";
import { getNext30Days } from "@/lib/utils";
import { DUMMY_THEATERS } from "@/lib/data";
import { SeatSelection, PaymentFlow } from "@/components/BookingSystem";
import { useRealtimeSeats } from "@/hooks/useRealtimeSeats";
import { supabase } from "@/lib/supabase";
import Link from "next/link";

const SHOWTIMES = ["12:30", "14:35", "16:40", "18:45", "20:50", "22:55"];

export default function CinemaDetailPage() {
  const { id } = useParams();
  const router = useRouter();
  const theater = useMemo(
    () => DUMMY_THEATERS.find((t) => t.id === Number(id)),
    [id]
  );

  const [selectedDate, setSelectedDate] = useState(1);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedMovieId, setExpandedMovieId] = useState<number | null>(null);
  const [movies, setMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);

  // Booking states
  const [selectedSeatInfo, setSelectedSeatInfo] = useState<{ time: string; theater: any; movie: any } | null>(null);
  const [seatCount, setSeatCount] = useState(1);
  const [showSeatCountModal, setShowSeatCountModal] = useState(false);
  const [showSeatMap, setShowSeatMap] = useState(false);
  const [selectedSeats, setSelectedSeats] = useState<string[]>([]);
  const [showSeatWarning, setShowSeatWarning] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("");
  const [timeLeft, setTimeLeft] = useState(600);
  const [saveCard, setSaveCard] = useState(false);
  const [paymentStatus, setPaymentStatus] = useState<'idle' | 'qris_scan' | 'success'>('idle');

  const days = useMemo(() => getNext30Days(), []);

  const dummyStudio = useMemo(() => {
    if (!selectedSeatInfo) return "Studio 1";
    return `Studio ${Math.floor(Math.random() * 5) + 1}`;
  }, [selectedSeatInfo?.theater?.name]);

  const { occupiedSeats } = useRealtimeSeats(
    selectedSeatInfo?.movie?.id ?? "",
    selectedSeatInfo?.theater?.name ?? "",
    days[selectedDate]?.fullDate ?? "",
    selectedSeatInfo?.time ?? ""
  );

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => setUser(session?.user ?? null));
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => setUser(session?.user ?? null));
    return () => subscription.unsubscribe();
  }, []);

  // Fetch movies
  useEffect(() => {
    const fetch_ = async () => {
      try {
        setLoading(true);
        const res = await fetch("/api/movies/now-playing");
        const data = await res.json();
        if (!data?.results) return;

        const today = new Date().toISOString().split("T")[0];
        const current = data.results.filter((m: any) => m.release_date <= today).slice(0, 12);

        const detailed = await Promise.all(
          current.map(async (movie: any) => {
            try {
              const r = await fetch(
                `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=release_dates`
              );
              const d = await r.json();
              const cert =
                d.release_dates?.results?.find(
                  (r: any) => r.iso_3166_1 === "ID" || r.iso_3166_1 === "US"
                )?.release_dates[0]?.certification || "SU";
              return {
                ...movie,
                runtime: d.runtime,
                genres: d.genres?.map((g: any) => g.name).join(", "),
                age_rating: cert,
              };
            } catch {
              return movie;
            }
          })
        );
        setMovies(detailed);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetch_();
  }, []);

  const filteredMovies = useMemo(
    () => movies.filter((m) => m.title.toLowerCase().includes(searchQuery.toLowerCase())),
    [movies, searchQuery]
  );

  const isTimePast = (time: string) => {
    if (selectedDate !== 1) return false;
    const now = new Date();
    const [h, m] = time.split(":").map(Number);
    return h < now.getHours() || (h === now.getHours() && m < now.getMinutes());
  };

  const ageColor = (rating: string) => {
    if (!rating) return "border-green-500 text-green-400";
    if (rating === "R" || rating.includes("17") || rating.includes("21"))
      return "border-red-500 text-red-400";
    if (rating.includes("13")) return "border-yellow-500 text-yellow-400";
    return "border-green-500 text-green-400";
  };

  const handleSelectTime = (movie: any, time: string) => {
    if (!user) {
      router.push("/"); // redirect to login
      return;
    }
    setSelectedSeatInfo({ time, theater, movie });
    setSeatCount(1);
    setShowSeatCountModal(true);
  };

  if (!theater) {
    return (
      <div className="min-h-screen bg-[#000814] flex flex-col items-center justify-center p-6 text-center">
        <h2 className="text-2xl font-black text-white mb-2">Bioskop Tidak Ditemukan</h2>
        <p className="text-slate-400 mb-8">Bioskop yang kamu cari tidak tersedia.</p>
        <button
          onClick={() => router.push("/cinemas")}
          className="px-8 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full text-white font-black text-sm uppercase tracking-widest transition-all"
        >
          Kembali ke Daftar Bioskop
        </button>
      </div>
    );
  }

  const isCGV = theater.type === "CGV";

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans pb-28">

      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-4 py-3 md:px-10 md:py-4 sticky top-0 bg-[#000814]/90 backdrop-blur-md z-[100] border-b border-white/5">
        <Link href="/">
          <h1 className="text-lg md:text-2xl font-black italic tracking-tight uppercase cursor-pointer">
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
              OCEAN&nbsp;
            </span>
            <span className="text-white">TIX</span>
          </h1>
        </Link>

        <div className="flex items-center gap-3 md:gap-6">
          <Link
            href="/promo"
            className="text-slate-400 hover:text-white cursor-pointer transition-colors text-[9px] md:text-[11px] font-bold uppercase tracking-widest hidden sm:block"
          >
            Promo
          </Link>
          <Link
            href="/notifications"
            className="relative p-2 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
          >
            <Bell className="w-5 h-5 md:w-6 md:h-6" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#000814]" />
          </Link>
        </div>
      </nav>

      <main className="max-w-2xl mx-auto px-4 pt-6">
        {/* Breadcrumb */}
        <nav className="flex flex-wrap gap-1.5 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
          <Link href="/" className="hover:text-cyan-400 transition-colors">Beranda</Link>
          <span>/</span>
          <Link href="/cinemas" className="hover:text-cyan-400 transition-colors">Bioskop</Link>
          <span>/</span>
          <span className="text-slate-200">{theater.name}</span>
        </nav>

        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-8 leading-tight">
          {theater.name}
        </h2>

        {/* DATE PICKER */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar mb-8">
          {days.map((day, i) => (
            <button
              key={i}
              onClick={() => setSelectedDate(i)}
              className={`flex-none min-w-[64px] md:min-w-[72px] py-3 px-2 rounded-xl border transition-all flex flex-col items-center justify-center gap-0.5 ${
                selectedDate === i
                  ? "bg-[#1e293b] border-[#1e293b] text-white shadow-lg"
                  : "bg-transparent border-white/10 text-slate-400 hover:border-white/20 hover:text-white"
              }`}
            >
              <p className={`text-[9px] font-black uppercase tracking-wider ${selectedDate === i ? "text-slate-300" : "text-slate-500"}`}>
                {day.dayName}
              </p>
              <p className="text-xl font-black leading-none">{day.dateNum}</p>
              <p className={`text-[8px] font-bold ${selectedDate === i ? "text-slate-400" : "text-slate-600"}`}>
                {day.month}
              </p>
            </button>
          ))}
        </div>

        {/* BRAND LOGO + SEARCH */}
        <div className="flex items-center justify-between gap-3 mb-6">
          <div className={`inline-flex items-center px-4 py-2 rounded-full shadow-md ${isCGV ? "bg-red-600" : "bg-white"}`}>
            {isCGV ? (
              <span className="text-white font-black text-sm italic tracking-tight">CGV*</span>
            ) : (
              <span className="text-black font-black text-sm tracking-tight">
                <span className="font-light italic text-slate-500 text-xs">Cinema</span> XXI
              </span>
            )}
          </div>

          <div className="relative flex-1 max-w-xs ml-auto">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
            <input
              type="text"
              placeholder={`Cari film di ${theater.name}`}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white/5 border border-white/10 text-white py-2.5 pl-10 pr-8 rounded-full text-xs md:text-sm outline-none focus:border-cyan-500/50 transition-all placeholder-slate-500"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>

        {/* MOVIE LIST */}
        {loading ? (
          <div className="space-y-3">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-28 bg-slate-800/50 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : filteredMovies.length === 0 ? (
          <div className="text-center py-20 bg-white/5 rounded-2xl border border-dashed border-white/10">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              Tidak ada film ditemukan
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredMovies.map((movie) => {
              const isExpanded = expandedMovieId === movie.id;
              return (
                <div
                  key={movie.id}
                  className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden transition-all duration-300 hover:border-white/20"
                >
                  {/* Movie row */}
                  <button
                    onClick={() => setExpandedMovieId(isExpanded ? null : movie.id)}
                    className="w-full flex items-center gap-4 p-4 text-left hover:bg-white/[0.03] transition-colors"
                  >
                    <div className="flex-none w-14 md:w-16 aspect-[2/3] rounded-xl overflow-hidden bg-slate-800 border border-white/10">
                      {movie.poster_path ? (
                        <img
                          src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                          alt={movie.title}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-slate-700" />
                      )}
                    </div>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm md:text-base font-black uppercase tracking-tight text-white line-clamp-2 leading-tight mb-1">
                        {movie.title}
                      </h3>
                      {movie.genres && (
                        <p className="text-[10px] md:text-xs text-slate-400 font-medium mb-2 line-clamp-1">
                          {movie.genres}
                        </p>
                      )}
                      <div className="flex items-center gap-2">
                        {movie.age_rating && (
                          <span className={`px-1.5 py-0.5 border text-[7px] md:text-[8px] font-black rounded uppercase ${ageColor(movie.age_rating)}`}>
                            {movie.age_rating}
                          </span>
                        )}
                        <span className="text-[10px] md:text-xs font-bold text-slate-400 border border-white/20 px-2 py-0.5 rounded">
                          2D
                        </span>
                      </div>
                    </div>

                    <ChevronDown
                      className={`w-5 h-5 text-slate-400 flex-none transition-transform duration-300 ${isExpanded ? "rotate-180 text-cyan-400" : ""}`}
                    />
                  </button>

                  {/* EXPANDED SHOWTIMES */}
                  {isExpanded && (
                    <div className="border-t border-white/10 px-4 py-4 bg-black/20">
                      <div className="flex items-center justify-between mb-3">
                        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                          Reguler 2D
                        </p>
                        <p className="text-xs font-black text-slate-200">
                          Rp{theater.price2D.toLocaleString("id-ID")}
                        </p>
                      </div>

                      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
                        {SHOWTIMES.map((time, idx) => {
                          const past = isTimePast(time);
                          return (
                            <button
                              key={idx}
                              disabled={past}
                              onClick={() => handleSelectTime(movie, time)}
                              className={`py-2.5 rounded-xl text-xs font-bold border transition-all ${
                                past
                                  ? "bg-white/5 border-transparent text-slate-600 cursor-not-allowed opacity-40"
                                  : "bg-white/10 border-white/10 text-white hover:bg-cyan-600 hover:border-cyan-500 active:scale-95"
                              }`}
                            >
                              {time}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* ── SEAT COUNT MODAL ── */}
      {showSeatCountModal && selectedSeatInfo && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={() => setShowSeatCountModal(false)} />
          <div className="relative w-full max-w-sm bg-[#e5e7eb] rounded-[2rem] p-6 shadow-2xl animate-in zoom-in-95 text-slate-800">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-base font-bold">Berapa banyak kursi?</h3>
              <button onClick={() => setShowSeatCountModal(false)} className="text-slate-500 hover:text-black">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex items-start gap-4 mb-4">
              <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center border border-slate-200 text-[10px] font-black italic shadow-sm">
                {selectedSeatInfo.theater.type}
              </div>
              <div>
                <h4 className="text-sm font-black uppercase text-slate-900 tracking-tighter mb-0.5">
                  {selectedSeatInfo.movie?.title}
                </h4>
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
              <span className="text-sm font-bold text-cyan-700 mr-2">
                Rp {(selectedSeatInfo.theater.price2D * seatCount).toLocaleString("id-ID")}
              </span>
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
                setShowSeatCountModal(false);
                setShowSeatMap(true);
                setSelectedSeats([]);
              }}
              className="w-full py-4 bg-[#0f172a] hover:bg-black text-white rounded-2xl font-black text-xs uppercase tracking-widest transition-all shadow-xl"
            >
              Pilih Kursi
            </button>
          </div>
        </div>
      )}

      {/* ── SEAT SELECTION ── */}
      {showSeatMap && selectedSeatInfo && (
        <SeatSelection
          movie={selectedSeatInfo.movie}
          selectedSeatInfo={selectedSeatInfo}
          seatCount={seatCount}
          selectedSeats={selectedSeats}
          setSelectedSeats={setSelectedSeats}
          formatType="2D"
          selectedDate={selectedDate}
          days={days}
          dummyStudio={dummyStudio}
          dummyOccupiedSeats={occupiedSeats}
          onClose={() => setShowSeatMap(false)}
          onContinue={() => {
            setTimeLeft(600);
            setShowCheckout(true);
            setShowSeatMap(false);
          }}
          showSeatWarning={showSeatWarning}
          setShowSeatWarning={setShowSeatWarning}
        />
      )}

      {/* ── PAYMENT FLOW ── */}
      {selectedSeatInfo && (showCheckout || paymentStatus !== 'idle') && (
        <PaymentFlow
          movie={selectedSeatInfo.movie}
          selectedSeatInfo={selectedSeatInfo}
          selectedSeats={selectedSeats}
          seatCount={seatCount}
          formatType="2D"
          selectedDate={selectedDate}
          days={days}
          dummyStudio={dummyStudio}
          onClose={() => {
            setShowCheckout(false);
            setShowSeatMap(true);
          }}
          onComplete={() => router.push("/")}
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}
