"use client";

import React, { useState, useEffect, useMemo, Suspense } from "react";
import Link from "next/link";
import { Search, MapPin, Bell, LayoutGrid, List, ChevronDown, X } from "lucide-react";
import { useLocation } from "@/context/LocationContext";
import { CITIES } from "@/lib/data";
import { useRouter, useSearchParams } from "next/navigation";

type TabType = "now" | "upcoming";
type ViewType = "grid" | "list";
type SortType = "terbaru" | "terlama" | "rating" | "az";

function FilmContent() {
  const { selectedCity, setSelectedCity } = useLocation();
  const [showLocationModal, setShowLocationModal] = useState(false);
  const [locationSearch, setLocationSearch] = useState("");
  const router = useRouter();
  const searchParams = useSearchParams();

  // Read initial tab from URL ?tab=upcoming
  const initialTab = (searchParams.get("tab") as TabType) || "now";

  const [activeTab, setActiveTab] = useState<TabType>(initialTab);
  const [viewType, setViewType] = useState<ViewType>("grid");
  const [searchQuery, setSearchQuery] = useState("");
  const [sortType, setSortType] = useState<SortType>("terbaru");
  const [showSortDropdown, setShowSortDropdown] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const sortLabels: Record<SortType, string> = {
    terbaru: "Tanggal tayang: terbaru",
    terlama: "Tanggal tayang: terlama",
    rating: "Rating tertinggi",
    az: "A - Z",
  };

  useEffect(() => {
    const fetchMovies = async () => {
      try {
        setLoading(true);
        const [resNow, resUp] = await Promise.all([
          fetch("/api/movies/now-playing"),
          fetch("/api/movies/upcoming"),
        ]);
        const dataNow = await resNow.json();
        const dataUp = await resUp.json();
        const today = new Date().toISOString().split("T")[0];

        if (dataNow?.results) {
          const current = dataNow.results.filter((m: any) => m.release_date <= today);
          const detailed = await Promise.all(
            current.map(async (movie: any) => {
              try {
                const res = await fetch(
                  `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=release_dates`
                );
                const d = await res.json();
                const cert =
                  d.release_dates?.results?.find(
                    (r: any) => r.iso_3166_1 === "ID" || r.iso_3166_1 === "US"
                  )?.release_dates[0]?.certification || "SU";
                return {
                  ...movie,
                  runtime: d.runtime,
                  genres: d.genres?.map((g: any) => g.name).join(" / "),
                  age_rating: cert,
                };
              } catch {
                return movie;
              }
            })
          );
          setMovies(detailed);
        }

        if (dataUp?.results) {
          const upcoming = dataUp.results.filter((m: any) => m.release_date > today);
          const detailed = await Promise.all(
            upcoming.map(async (movie: any) => {
              try {
                const res = await fetch(
                  `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=release_dates`
                );
                const d = await res.json();
                const cert =
                  d.release_dates?.results?.find(
                    (r: any) => r.iso_3166_1 === "ID" || r.iso_3166_1 === "US"
                  )?.release_dates[0]?.certification || "SU";
                return {
                  ...movie,
                  runtime: d.runtime,
                  genres: d.genres?.map((g: any) => g.name).join(" / "),
                  age_rating: cert,
                };
              } catch {
                return movie;
              }
            })
          );
          setUpcomingMovies(detailed);
        }
      } catch (err) {
        console.error("FilmPage fetch error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovies();
  }, []);

  const sourceMovies = useMemo(() => {
    if (activeTab === "upcoming") return upcomingMovies;
    return movies;
  }, [activeTab, movies, upcomingMovies]);

  const displayedMovies = useMemo(() => {
    let filtered = sourceMovies.filter((m) =>
      m.title.toLowerCase().includes(searchQuery.toLowerCase())
    );
    if (sortType === "terbaru")
      filtered = [...filtered].sort(
        (a, b) => new Date(b.release_date).getTime() - new Date(a.release_date).getTime()
      );
    if (sortType === "terlama")
      filtered = [...filtered].sort(
        (a, b) => new Date(a.release_date).getTime() - new Date(b.release_date).getTime()
      );
    if (sortType === "rating")
      filtered = [...filtered].sort((a, b) => b.vote_average - a.vote_average);
    if (sortType === "az")
      filtered = [...filtered].sort((a, b) => a.title.localeCompare(b.title));
    return filtered;
  }, [sourceMovies, searchQuery, sortType]);

  const ageColor = (rating: string) => {
    if (!rating) return "border-green-500 text-green-400";
    if (rating === "R" || rating.includes("17") || rating.includes("21"))
      return "border-red-500 text-red-400";
    if (rating.includes("13")) return "border-yellow-500 text-yellow-400";
    return "border-green-500 text-green-400";
  };

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans">
      {/* NAVBAR */}
      <nav className="flex justify-between items-center px-4 py-3 md:px-10 md:py-4 sticky top-0 bg-[#000814]/90 backdrop-blur-md z-[100] border-b border-white/5">
        <div className="flex items-center gap-3 md:gap-6">
          <Link href="/">
            <h1 className="text-lg md:text-2xl font-black italic tracking-tight uppercase cursor-pointer">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
                OCEAN&nbsp;
              </span>
              <span className="text-white">TIX</span>
            </h1>
          </Link>
          <div
            onClick={() => setShowLocationModal(true)}
            className="flex items-center gap-1.5 bg-slate-800/50 px-3 py-1.5 rounded-full border border-slate-700/50 cursor-pointer hover:border-cyan-500/50 transition-all"
          >
            <MapPin className="w-3 h-3 text-cyan-400" />
            <span className="text-[9px] md:text-[11px] font-black uppercase tracking-widest text-slate-300 truncate max-w-[70px] md:max-w-none">
              {selectedCity}
            </span>
          </div>
        </div>

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

      <main className="max-w-7xl mx-auto px-4 md:px-8 py-6 md:py-10">
        {/* BREADCRUMBS */}
        <nav className="flex gap-2 text-[10px] md:text-xs font-bold uppercase tracking-widest text-slate-400 mb-5">
          <Link href="/" className="hover:text-cyan-400 transition-colors">
            Beranda
          </Link>
          <span>/</span>
          <span className="text-slate-200">Film</span>
        </nav>

        {/* PAGE TITLE */}
        <h2 className="text-3xl md:text-5xl font-black uppercase italic tracking-tighter text-white mb-8 leading-tight">
          Film
        </h2>

        {/* TABS + CONTROLS */}
        <div className="flex flex-col gap-4 mb-6">
          {/* TABS ROW */}
          <div className="flex items-center gap-1.5 md:gap-2 overflow-x-auto no-scrollbar">
            {[
              { key: "now" as TabType, label: "Lagi tayang" },
              { key: "upcoming" as TabType, label: "Akan tayang" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex-none px-4 md:px-6 py-2 md:py-2.5 rounded-full text-[11px] md:text-xs font-black uppercase tracking-wide whitespace-nowrap transition-all border ${
                  activeTab === tab.key
                    ? "bg-[#1e293b] border-[#1e293b] text-white shadow-lg"
                    : "bg-transparent border-white/10 text-slate-400 hover:text-white hover:border-white/20"
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* SEARCH + SORT + VIEW */}
          <div className="flex items-center gap-2 md:gap-3 flex-wrap">
            {/* Search */}
            <div className="relative flex-1 min-w-[140px]">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
              <input
                type="text"
                placeholder="Cari film"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white py-2.5 pl-10 pr-8 rounded-full text-xs md:text-sm outline-none focus:border-cyan-500/50 transition-all placeholder-slate-500"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-white transition-colors"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Sort Dropdown */}
            <div className="relative flex-none">
              <button
                onClick={() => setShowSortDropdown(!showSortDropdown)}
                className="flex items-center gap-1.5 md:gap-2 bg-white/5 border border-white/10 px-3 md:px-4 py-2.5 rounded-full text-[11px] md:text-xs font-bold text-slate-300 hover:border-white/20 hover:text-white transition-all whitespace-nowrap"
              >
                <span className="hidden sm:inline">{sortLabels[sortType]}</span>
                <span className="sm:hidden">Urutan</span>
                <ChevronDown
                  className={`w-3.5 h-3.5 flex-none transition-transform ${showSortDropdown ? "rotate-180" : ""}`}
                />
              </button>
              {showSortDropdown && (
                <>
                  <div
                    className="fixed inset-0 z-30"
                    onClick={() => setShowSortDropdown(false)}
                  />
                  <div className="absolute right-0 top-full mt-2 z-40 bg-[#1e293b] border border-white/10 rounded-2xl shadow-2xl overflow-hidden min-w-[210px]">
                    {(Object.keys(sortLabels) as SortType[]).map((key) => (
                      <button
                        key={key}
                        onClick={() => {
                          setSortType(key);
                          setShowSortDropdown(false);
                        }}
                        className={`w-full text-left px-5 py-3 text-xs font-bold transition-all hover:bg-white/10 ${
                          sortType === key
                            ? "text-cyan-400 bg-cyan-500/10"
                            : "text-slate-300"
                        }`}
                      >
                        {sortLabels[key]}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Grid/List Toggle */}
            <div className="flex items-center bg-white/5 border border-white/10 rounded-xl p-1 flex-none">
              <button
                onClick={() => setViewType("grid")}
                aria-label="Grid view"
                className={`p-2 rounded-lg transition-all ${
                  viewType === "grid"
                    ? "bg-[#1e293b] text-white shadow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
              <button
                onClick={() => setViewType("list")}
                aria-label="List view"
                className={`p-2 rounded-lg transition-all ${
                  viewType === "list"
                    ? "bg-[#1e293b] text-white shadow"
                    : "text-slate-500 hover:text-slate-300"
                }`}
              >
                <List className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* RESULTS COUNT */}
        {!loading && (
          <p className="text-slate-500 text-[10px] md:text-xs font-bold uppercase tracking-widest mb-5">
            {displayedMovies.length} film ditemukan
          </p>
        )}

        {/* LOADING SKELETON */}
        {loading ? (
          <div
            className={
              viewType === "grid"
                ? "grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5"
                : "flex flex-col gap-3"
            }
          >
            {[...Array(8)].map((_, i) =>
              viewType === "grid" ? (
                <div
                  key={i}
                  className="aspect-[2/3] bg-slate-800/50 rounded-2xl animate-pulse"
                />
              ) : (
                <div
                  key={i}
                  className="h-24 bg-slate-800/50 rounded-2xl animate-pulse"
                />
              )
            )}
          </div>
        ) : displayedMovies.length === 0 ? (
          /* EMPTY STATE */
          <div className="text-center py-24 bg-white/5 rounded-[2rem] border border-dashed border-white/10">
            <p className="text-slate-500 font-bold uppercase tracking-widest text-sm">
              Tidak ada film ditemukan
            </p>
          </div>
        ) : viewType === "grid" ? (
          /* ── GRID VIEW ── */
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4 md:gap-5">
            {displayedMovies.map((movie, index) => (
              <div
                key={movie.id}
                onClick={() => router.push(`/film/${movie.id}`)}
                className="group cursor-pointer"
              >
                {/* Poster */}
                <div className="relative aspect-[2/3] rounded-[1.2rem] md:rounded-[1.5rem] overflow-hidden mb-2 md:mb-3 border border-white/5 shadow-xl bg-[#001d3d] group-hover:border-cyan-500/40 group-hover:-translate-y-1 transition-all duration-400">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center bg-slate-800 text-slate-600 text-[10px] font-bold uppercase p-4 text-center">
                      {movie.title}
                    </div>
                  )}

                  {/* Hover overlay with CTA */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/film/${movie.id}`);
                      }}
                      className="w-full py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all active:scale-95"
                    >
                      Beli Tiket
                    </button>
                  </div>

                  {/* Index badge */}
                  <div className="absolute top-2.5 right-2.5 w-6 h-6 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 group-hover:opacity-0 transition-opacity">
                    <span className="text-cyan-400 text-[9px] font-black italic">{index + 1}</span>
                  </div>

                  {/* Age rating */}
                  {movie.age_rating && (
                    <div
                      className={`absolute top-2.5 left-2.5 px-1.5 py-0.5 border text-[7px] md:text-[8px] font-black rounded uppercase backdrop-blur-sm bg-black/50 ${ageColor(movie.age_rating)}`}
                    >
                      {movie.age_rating}
                    </div>
                  )}

                  {/* Star rating bottom-left on hover */}
                  {movie.vote_average > 0 && (
                    <div className="absolute bottom-10 left-3 opacity-0 group-hover:opacity-100 transition-opacity">
                      <span className="text-[9px] font-black text-cyan-400">
                        ★ {movie.vote_average.toFixed(1)}
                      </span>
                    </div>
                  )}
                </div>

                {/* Release date for upcoming */}
                {activeTab === "upcoming" && movie.release_date && (
                  <p className="text-cyan-400 text-[9px] md:text-[10px] font-bold uppercase tracking-wider mb-0.5">
                    {new Date(movie.release_date).toLocaleDateString("id-ID", {
                      day: "numeric",
                      month: "short",
                    })}
                  </p>
                )}

                {/* Title */}
                <h3 className="text-[11px] md:text-xs font-black uppercase tracking-tight line-clamp-2 leading-tight text-slate-200 group-hover:text-cyan-400 transition-colors">
                  {movie.title}
                </h3>
                {movie.genres && (
                  <p className="text-[9px] md:text-[10px] text-slate-500 font-medium mt-0.5 line-clamp-1">
                    {movie.genres}
                  </p>
                )}
              </div>
            ))}
          </div>
        ) : (
          /* ── LIST VIEW ── */
          <div className="flex flex-col gap-3">
            {displayedMovies.map((movie) => (
              <div
                key={movie.id}
                onClick={() => router.push(`/film/${movie.id}`)}
                className="group cursor-pointer flex gap-3 md:gap-4 bg-white/5 border border-white/10 hover:border-cyan-500/30 rounded-2xl p-3 md:p-4 transition-all duration-300 hover:bg-white/[0.07]"
              >
                {/* Poster thumbnail */}
                <div className="flex-none w-12 md:w-16 aspect-[2/3] rounded-xl overflow-hidden border border-white/10 bg-slate-800">
                  {movie.poster_path ? (
                    <img
                      src={`https://image.tmdb.org/t/p/w185${movie.poster_path}`}
                      alt={movie.title}
                      loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                    />
                  ) : (
                    <div className="w-full h-full bg-slate-700" />
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0 flex flex-col justify-center gap-1">
                  <h3 className="text-sm md:text-base font-black uppercase tracking-tight line-clamp-2 leading-tight text-white group-hover:text-cyan-400 transition-colors">
                    {movie.title}
                  </h3>
                  {movie.genres && (
                    <p className="text-[10px] md:text-xs text-slate-500 font-medium line-clamp-1">
                      {movie.genres}
                    </p>
                  )}
                  <div className="flex flex-wrap items-center gap-2 mt-1">
                    {movie.age_rating && (
                      <span
                        className={`px-1.5 py-0.5 border text-[7px] md:text-[8px] font-black rounded uppercase ${ageColor(movie.age_rating)}`}
                      >
                        {movie.age_rating}
                      </span>
                    )}
                    {movie.runtime && (
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">
                        {Math.floor(movie.runtime / 60)}j {movie.runtime % 60}m
                      </span>
                    )}
                    {movie.vote_average > 0 && (
                      <span className="flex items-center gap-0.5 text-[9px] md:text-[10px] text-cyan-400 font-black">
                        ★ {movie.vote_average.toFixed(1)}
                      </span>
                    )}
                    {activeTab === "upcoming" && movie.release_date && (
                      <span className="text-[9px] md:text-[10px] text-slate-400 font-bold">
                        {new Date(movie.release_date).toLocaleDateString("id-ID", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    )}
                  </div>
                </div>

                {/* CTA */}
                <div className="flex-none flex items-center">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      router.push(`/film/${movie.id}`);
                    }}
                    className="px-3 md:px-5 py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-[9px] md:text-[10px] font-black uppercase shadow-lg transition-all active:scale-95 whitespace-nowrap"
                  >
                    Beli Tiket
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* LOCATION MODAL */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            onClick={() => { setShowLocationModal(false); setLocationSearch(""); }}
          />
          <div className="relative w-full max-w-sm bg-[#0d1b2a] border border-white/10 rounded-3xl shadow-2xl overflow-hidden">
            <div className="flex items-center justify-between px-5 py-4 border-b border-white/10">
              <h3 className="font-black text-base uppercase tracking-tight text-white">Pilih Kota</h3>
              <button
                onClick={() => { setShowLocationModal(false); setLocationSearch(""); }}
                className="p-2 hover:bg-white/10 rounded-full transition-all"
              >
                <X className="w-4 h-4 text-white" />
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
              {CITIES
                .filter(c => c.toLowerCase().includes(locationSearch.toLowerCase()))
                .map(city => (
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

      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
      `}</style>
    </div>
  );
}

export default function FilmPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#000814] flex items-center justify-center text-white font-black italic uppercase">
          Loading...
        </div>
      }
    >
      <FilmContent />
    </Suspense>
  );
}
