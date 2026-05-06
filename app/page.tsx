"use client";

import { supabase } from "../lib/supabase";
import MovieDetailPage from "./MovieDetail";
import React, { useState, useEffect, useRef } from "react";
import { useLocation } from "@/context/LocationContext";
import { CITIES } from "@/lib/data";
import {
  MapPin,
  Search,
  ChevronLeft,
  ChevronRight,
  X,
  Check,
  Bell,
} from "lucide-react";
import { useSearchParams, useRouter } from "next/navigation";
import { Suspense } from "react";
import Link from "next/link";

const PROMOS = [
  {
    id: "p1", code: "WEEKEND50", title: "Weekend Blast", subtitle: "50% OFF Semua Tiket CGV",
    discount: "50%", validUntil: "31 Mei 2026", minPurchase: "Rp30.000",
    desc: "Nikmati diskon 50% untuk semua tiket CGV setiap Sabtu & Minggu.",
    gradient: "from-cyan-600 via-blue-700 to-indigo-800", accent: "#06b6d4",
    terms: ["Berlaku Sabtu–Minggu saja", "Maks. diskon Rp25.000", "1x per akun per minggu", "Tidak berlaku untuk Premiere"],
    img: "https://images.unsplash.com/photo-1489599849927-2ee91cede3ba?w=900&q=80",
  },
  {
    id: "p2", code: "FLASH10K", title: "Flash Sale QRIS", subtitle: "Cashback Rp10.000",
    discount: "Rp10K", validUntil: "15 Mei 2026", minPurchase: "Rp25.000",
    desc: "Bayar pakai QRIS dan dapatkan cashback Rp10.000 untuk setiap pembelian tiket.",
    gradient: "from-amber-500 via-orange-600 to-red-700", accent: "#f59e0b",
    terms: ["Berlaku metode QRIS saja", "Cashback dikreditkan 1x24 jam", "Kuota 500 pengguna/hari", "Berlaku semua hari"],
    img: "https://images.unsplash.com/photo-1460925895917-afdab827c52f?w=900&q=80",
  },
  {
    id: "p3", code: "OCEANTIX30", title: "Special OceanTix", subtitle: "30% OFF Sepanjang Mei",
    discount: "30%", validUntil: "31 Mei 2026", minPurchase: "Rp35.000",
    desc: "Rayakan ulang tahun OceanTix! Dapatkan diskon 30% untuk semua tiket di seluruh bioskop.",
    gradient: "from-teal-500 via-cyan-600 to-blue-700", accent: "#14b8a6",
    terms: ["Berlaku 1–31 Mei 2026", "Maks. diskon Rp30.000", "Berlaku 2x per akun", "Termasuk format 3D"],
    img: "https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=900&q=80",
  },
  {
    id: "p4", code: "MEMBER20", title: "Member Exclusive", subtitle: "20% OFF Tiket Pertama",
    discount: "20%", validUntil: "31 Mei 2026", minPurchase: "Rp20.000",
    desc: "Khusus member terdaftar OceanTix, hemat 20% untuk pembelian tiket pertama kamu setiap bulannya.",
    gradient: "from-purple-600 via-violet-700 to-pink-700", accent: "#a855f7",
    terms: ["Hanya akun terverifikasi", "1x per akun per bulan", "Berlaku semua bioskop", "Tidak bisa digabung promo lain"],
    img: "https://images.unsplash.com/photo-1536440136628-849c177e76a1?w=900&q=80",
  },
];

function HomeContent() {
  // Helper: convert phone → internal Supabase email
  const phoneToEmail = (phone: string) => {
    let n = phone.replace(/\D/g, "");
    if (n.startsWith("0")) n = "62" + n.slice(1);
    if (!n.startsWith("62")) n = "62" + n;
    return `${n}@oceantix.user`;
  };
  const bannerRef = useRef<HTMLDivElement>(null);
  const movieScrollRef = useRef<HTMLDivElement>(null);
  const upcomingScrollRef = useRef<HTMLDivElement>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "register" | "forgot">(
    "login",
  );
  const [user, setUser] = useState<any>(null);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState(""); // Nomor WhatsApp buat OTP
  const [otp, setOtp] = useState(""); // Input kode OTP
  const [step, setStep] = useState(1); // Step 1: Input No, Step 2: Input OTP
  // Register-specific state
  const [registerStep, setRegisterStep] = useState<1 | 2>(1); // 1: form, 2: OTP
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [authSuccess, setAuthSuccess] = useState("");
  // Nickname prompt (shown after phone registration if no name is set)
  const [showNicknameModal, setShowNicknameModal] = useState(false);
  const [nickname, setNickname] = useState("");
  const [nicknameSaving, setNicknameSaving] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);
  const [showLocationModal, setShowLocationModal] = useState(false);
  const { selectedCity, setSelectedCity } = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [isPaused, setIsPaused] = useState(false);
  const [movies, setMovies] = useState<any[]>([]);
  const [upcomingMovies, setUpcomingMovies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedMovie, setSelectedMovie] = useState<any>(null);

  // --- TAMBAHAN STATE UNTUK TRAILER & BACKGROUND ---
  const [trailerId, setTrailerId] = useState<string | null>(null);
  const [currentBgIndex, setCurrentBgIndex] = useState(0);
  const [movieSearch, setMovieSearch] = useState("");

  const searchParams = useSearchParams();
  const router = useRouter();
  const [initialBookingData, setInitialBookingData] = useState<any>(null);

  useEffect(() => {
    const movieId = searchParams.get('movieId');
    const theaterId = searchParams.get('theaterId');
    const time = searchParams.get('time');
    const seats = searchParams.get('seats');

    if (movieId && theaterId && time && seats) {
      const fetchAndOpenMovie = async () => {
        try {
          const res = await fetch(`https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=release_dates,credits`);
          const data = await res.json();
          if (data) {
            const certification = data.release_dates?.results?.find((r: any) => r.iso_3166_1 === "ID")?.release_dates?.[0]?.certification ||
              data.release_dates?.results?.find((r: any) => r.iso_3166_1 === "US")?.release_dates?.[0]?.certification || "13+";

            const movieData = {
              ...data,
              genres: data.genres?.map((g: any) => g.name).join(" / "),
              age_rating: certification,
              director: data.credits?.crew?.find((p: any) => p.job === "Director")?.name,
              writer: data.credits?.crew?.find((p: any) => p.job === "Writer" || p.job === "Screenplay")?.name,
              studio: data.production_companies?.[0]?.name,
            };

            setSelectedMovie(movieData);
            setInitialBookingData({
              time,
              theaterId: Number(theaterId),
              seatCount: Number(seats)
            });
            // Clear params after reading
            router.replace('/', { scroll: false });
          }
        } catch (e) {
          console.error(e);
        }
      };
      fetchAndOpenMovie();
    }
  }, [searchParams, router]);

  useEffect(() => {
    (window as any).supabase = supabase;
    const initAuth = async () => {
      // 1. Cek session normal
      const {
        data: { session },
      } = await supabase.auth.getSession();

      // 2. Kalau session null, tapi ada token di URL, paksa refresh session
      if (!session && window.location.hash.includes("access_token")) {
        const {
          data: { session: refreshedSession },
        } = await supabase.auth.refreshSession();
        if (refreshedSession) {
          setUser(refreshedSession.user);
          return;
        }
      }

      setUser(session?.user ?? null);
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      console.log("Auth Event:", event);
      setUser(session?.user ?? null);

      // Close auth modal on login
      if (session) setShowAuthModal(false);

      // Show nickname prompt if phone-registered user has no name yet
      if (session?.user) {
        const u = session.user;
        const isPhoneUser = u.email?.endsWith("@oceantix.user");
        const hasNoName = !u.user_metadata?.full_name;
        if (isPhoneUser && hasNoName && (event === "SIGNED_IN" || event === "USER_UPDATED")) {
          setShowNicknameModal(true);
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // --- LISTEN TO HOME BUTTON CLICKS ---
  useEffect(() => {
    const handleGoHome = () => {
      setSelectedMovie(null);
      setInitialBookingData(null);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    };
    window.addEventListener('go-home', handleGoHome);
    return () => window.removeEventListener('go-home', handleGoHome);
  }, []);

  // --- LOGIC SCROLL ---
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 120);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // --- TAMBAHAN FUNGSI FETCH TRAILER & DETAIL ---
  const handlePlayTrailer = async (movieId: number) => {
    try {
      // 1. Ambil Detail Film (Dapet durasi, rating, dan credits)
      const detailRes = await fetch(
        `https://api.themoviedb.org/3/movie/${movieId}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=videos,credits`,
      );
      const data = await detailRes.json();

      // 2. Set ID Trailer YouTube
      const trailer = data.videos?.results?.find(
        (v: any) => v.type === "Trailer" && v.site === "YouTube",
      );
      if (trailer) setTrailerId(trailer.key);

      // --- LOGIC TAMBAHAN: Ekstrak Kru & Pemain ---
      const detailedInfo = {
        runtime: data.runtime,
        genres: data.genres?.map((g: any) => g.name).join(" / "), // Ambil genre asli
        director: data.credits?.crew?.find((p: any) => p.job === "Director")?.name,
        cast: data.credits?.cast?.slice(0, 8).map((a: any) => a.name).join(", "),
        writer: data.credits?.crew?.find((p: any) => p.job === "Writer" || p.job === "Screenplay")?.name,
        producer: data.credits?.crew?.find((p: any) => p.job === "Producer")?.name,
        studio: data.production_companies?.[0]?.name,
      };

      // 3. Update state movies biar durasinya muncul secara real-time di UI
      setMovies((prev) =>
        prev.map((m) =>
          m.id === movieId ? { ...m, ...detailedInfo } : m,
        ),
      );

      // Update selectedMovie jika user sedang melihat detailnya
      if (selectedMovie?.id === movieId) {
        setSelectedMovie((prev: any) => ({ ...prev, ...detailedInfo }));
      }
    } catch (err) {
      console.error("Gagal ambil detail film:", err);
    }
  };

  const scrollMovies = (direction: "left" | "right") => {
    if (movieScrollRef.current) {
      const { scrollLeft, clientWidth } = movieScrollRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth;
      movieScrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  const scrollUpcoming = (direction: "left" | "right") => {
    if (upcomingScrollRef.current) {
      const { scrollLeft, clientWidth } = upcomingScrollRef.current;
      const scrollTo =
        direction === "left"
          ? scrollLeft - clientWidth
          : scrollLeft + clientWidth;
      upcomingScrollRef.current.scrollTo({
        left: scrollTo,
        behavior: "smooth",
      });
    }
  };



  const filteredCities = CITIES.filter((city) =>
    city.toLowerCase().includes(searchTerm.toLowerCase()),
  );


  useEffect(() => {
    const fetchAllMovies = async () => {
      try {
        setLoading(true);
        const [resNow, resUp] = await Promise.all([
          fetch("/api/movies/now-playing"),
          fetch("/api/movies/upcoming"),
        ]);
        const dataNow = await resNow.json();
        const dataUp = await resUp.json();

        const today = new Date().toISOString().split("T")[0];

        // --- FETCH DETAIL UNTUK NOW PLAYING ---
        if (dataNow?.results) {
          const currentMovies = dataNow.results.filter(
            (m: any) => m.release_date <= today,
          );

          const detailedMovies = await Promise.all(
            currentMovies.map(async (movie: any) => {
              try {
                const detailRes = await fetch(
                  `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=release_dates,credits,videos`,
                );
                const detailData = await detailRes.json();
                const certification =
                  detailData.release_dates?.results?.find(
                    (r: any) => r.iso_3166_1 === "ID" || r.iso_3166_1 === "US",
                  )?.release_dates[0]?.certification || "SU";

                const trailerKey = detailData.videos?.results?.find(
                  (v: any) => v.type === "Trailer" && v.site === "YouTube",
                )?.key;

                return {
                  ...movie,
                  trailerKey,
                  runtime: detailData.runtime,
                  genres: detailData.genres?.map((g: any) => g.name).join(" / "), // Genre asli dari API
                  age_rating: certification,
                  director: detailData.credits?.crew?.find((p: any) => p.job === "Director")?.name,
                  cast: detailData.credits?.cast?.slice(0, 5).map((a: any) => a.name).join(", "),
                  writer: detailData.credits?.crew?.find((p: any) => p.job === "Writer" || p.job === "Screenplay")?.name,
                  producer: detailData.credits?.crew?.find((p: any) => p.job === "Producer")?.name,
                  studio: detailData.production_companies?.[0]?.name,
                };
              } catch {
                return movie;
              }
            }),
          );
          setMovies(detailedMovies);

          // --- LOGIC TAMBAHAN: SET INITIAL POSITION KE TENGAH ---
          setTimeout(() => {
            if (movieScrollRef.current) {
              const el = movieScrollRef.current;
              const itemWidth = el.scrollWidth / 3;
              el.style.scrollBehavior = "auto";
              el.scrollLeft = itemWidth;
              el.style.scrollBehavior = "smooth";
            }
          }, 100);
        }

        // --- FETCH DETAIL UNTUK UPCOMING ---
        if (dataUp?.results) {
          const upcomingFiltered = dataUp.results.filter(
            (m: any) => m.release_date > today,
          );

          const detailedUpcoming = await Promise.all(
            upcomingFiltered.map(async (movie: any) => {
              try {
                const detailRes = await fetch(
                  `https://api.themoviedb.org/3/movie/${movie.id}?api_key=${process.env.NEXT_PUBLIC_TMDB_API_KEY}&append_to_response=release_dates,credits`,
                );
                const detailData = await detailRes.json();
                const certification =
                  detailData.release_dates?.results?.find(
                    (r: any) => r.iso_3166_1 === "ID" || r.iso_3166_1 === "US",
                  )?.release_dates[0]?.certification || "SU";

                return {
                  ...movie,
                  runtime: detailData.runtime,
                  genres: detailData.genres?.map((g: any) => g.name).join(" / "), // Genre asli dari API
                  age_rating: certification,
                  director: detailData.credits?.crew?.find((p: any) => p.job === "Director")?.name,
                  cast: detailData.credits?.cast?.slice(0, 5).map((a: any) => a.name).join(", "),
                  writer: detailData.credits?.crew?.find((p: any) => p.job === "Writer" || p.job === "Screenplay")?.name,
                  producer: detailData.credits?.crew?.find((p: any) => p.job === "Producer")?.name,
                  studio: detailData.production_companies?.[0]?.name,
                };
              } catch {
                return movie;
              }
            }),
          );
          setUpcomingMovies(detailedUpcoming);
        }
      } catch (err) {
        console.error("Fetch Error:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchAllMovies();
  }, []);


  // Cycle Hero Background
  useEffect(() => {
    if (movies.length === 0) return;
    const interval = setInterval(() => {
      setCurrentBgIndex((prev) => (prev + 1) % Math.min(5, movies.length));
    }, 5000);
    return () => clearInterval(interval);
  }, [movies]);

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      if (bannerRef.current) {
        const { scrollLeft, scrollWidth, clientWidth } = bannerRef.current;
        if (scrollLeft + clientWidth >= scrollWidth - 10) {
          bannerRef.current.scrollTo({ left: 0, behavior: "smooth" });
        } else {
          bannerRef.current.scrollBy({ left: bannerRef.current.clientWidth * 0.85, behavior: "smooth" });
        }
      }
    }, 3500);
    return () => clearInterval(interval);
  }, [isPaused]);

  const scrollByFrame = (direction: "left" | "right") => {
    if (bannerRef.current) {
      const cardWidth = bannerRef.current.clientWidth * 0.85;
      bannerRef.current.scrollBy({
        left: direction === "left" ? -cardWidth : cardWidth,
        behavior: "smooth",
      });
    }
  };

  const topTrailers = movies.slice(0, 5).map(m => m.trailerKey).filter(Boolean);

  const filteredMovies = movies.filter((m) =>
    m.title.toLowerCase().includes(movieSearch.toLowerCase())
  );

  const filteredUpcoming = upcomingMovies.filter((m) =>
    m.title.toLowerCase().includes(movieSearch.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-[#000814] text-white font-sans relative">
      {/* BACKGROUND ANIMATION */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute inset-0 bg-[#000814]"></div>
        <div className="absolute inset-0 animate-ocean-live-waves opacity-30"></div>
        <div className="absolute inset-0 animate-ocean-live-waves-delayed opacity-20"></div>
        <div className="absolute bottom-[-10%] left-1/4 w-[60%] h-[40%] bg-cyan-950/20 blur-[150px] animate-ocean-live-pulse rounded-full"></div>
      </div>

      {/* MOVIE SLIDESHOW HERO BACKGROUND */}
      {!selectedMovie && topTrailers.length > 0 && (
        <div className="absolute inset-x-0 top-0 h-[120vh] overflow-hidden pointer-events-none z-0">
          <div className="absolute top-1/2 left-1/2 w-[100vw] h-[56.25vw] min-h-[120vh] min-w-[213.33vh] -translate-x-1/2 -translate-y-1/2 opacity-30">
            <iframe
              className="w-full h-full pointer-events-none"
              src={`https://www.youtube.com/embed/${topTrailers[0]}?autoplay=1&mute=1&controls=0&showinfo=0&rel=0&loop=1&playlist=${topTrailers.join(',')}&playsinline=1&modestbranding=1&iv_load_policy=3&disablekb=1`}
              allow="autoplay; encrypted-media"
              title="Background Trailer"
            ></iframe>
          </div>
          <div className="absolute inset-0 bg-gradient-to-b from-[#000814]/30 via-[#000814]/80 to-[#000814]"></div>
        </div>
      )}

      {/* NAVBAR */}
      <nav className="flex justify-between items-center p-4 md:p-5 md:px-10 sticky top-0 bg-[#000814]/50 backdrop-blur-md z-[100] border-b border-white/5 h-[70px] md:h-[90px] gap-4">
        <div className="flex items-center gap-4 md:gap-8 flex-shrink-0">
          <h1
            onClick={() => {
              setSelectedMovie(null);
              setInitialBookingData(null);
            }}
            className="text-xl md:text-2xl font-black italic tracking-tight uppercase cursor-pointer"
          >
            <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">
              OCEAN{"\u00A0"}
            </span>
            <span className="text-white">TIX</span>
          </h1>
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

        {/* BAGIAN YANG DIUBAH: Ditambah hidden agar tidak muncul di HP saat scroll */}
        {!selectedMovie && (
          <div
            className={`hidden md:block flex-grow max-w-lg transition-all duration-500 ease-in-out ${isScrolled ? "opacity-100 translate-y-0 scale-100" : "opacity-0 -translate-y-5 scale-90 pointer-events-none"}`}
          >
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="text"
                placeholder="Cari film atau bioskop"
                value={movieSearch}
                onChange={(e) => setMovieSearch(e.target.value)}
                className="w-full bg-white/5 border border-white/10 text-white py-2.5 pl-12 pr-4 rounded-full text-xs md:text-sm outline-none focus:ring-1 focus:ring-cyan-500/50 backdrop-blur-md"
              />
            </div>
          </div>
        )}
        <div className="flex items-center gap-3 md:gap-8 text-[9px] md:text-[11px] font-bold uppercase tracking-widest flex-shrink-0">
          {/* TOMBOL PROMO SEKARANG DI LUAR (MUNCUL TERUS) */}
          <Link
            href="/promo"
            className={`text-slate-400 hover:text-white cursor-pointer transition-colors ${isScrolled ? "hidden lg:block" : ""}`}
          >
            Promo
          </Link>

          {user ? (
            /* TAMPILAN SETELAH LOGIN: CUMA LONCENG */
            <Link
              href="/notifications"
              className="relative p-2 text-slate-400 hover:text-cyan-400 transition-all active:scale-95"
            >
              <Bell className="w-5 h-5 md:w-6 md:h-6" />
              {/* Dot Notifikasi Merah */}
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-[#000814]"></span>
            </Link>
          ) : (
            /* TAMPILAN SEBELUM LOGIN (TANPA PROMO LAGI DI SINI) */
            <>
              <span
                onClick={() => {
                  setAuthMode("login");
                  setShowAuthModal(true);
                }}
                className={`text-slate-400 hover:text-white cursor-pointer transition-colors ${isScrolled ? "hidden lg:block" : ""}`}
              >
                Login
              </span>
              <button
                onClick={() => {
                  setAuthMode("register");
                  setShowAuthModal(true);
                }}
                className="bg-cyan-600 hover:bg-cyan-500 px-3 md:px-6 py-1.5 md:py-2.5 rounded-full font-black text-[8px] md:text-[11px] transition-all"
              >
                {isScrolled ? "GET STARTED" : "Buat Akun"}
              </button>
            </>
          )}
        </div>
      </nav>

      <main className="overflow-x-hidden relative z-10">
        {/* --- LOGIC KONDISIONAL: JIKA FILM DIPILIH --- */}
        {selectedMovie ? (
          <MovieDetailPage
            movie={selectedMovie}
            onBack={() => {
              setSelectedMovie(null);
              setInitialBookingData(null);
            }}
            handlePlayTrailer={handlePlayTrailer}
            user={user}
            openAuthModal={() => {
              setAuthMode("login");
              setShowAuthModal(true);
            }}
            initialBookingData={initialBookingData}
            extraBreadcrumbs={[{ label: "Film", href: "/film" }]}
          />
        ) : (
          /* --- JIKA TIDAK ADA FILM DIPILIH, TAMPILKAN SEMUA ISI BERANDA --- */
          <>
            <section className="py-12 md:py-20 flex flex-col items-center px-6 text-center">
              <h2 className="text-3xl md:text-6xl font-black mb-8 md:mb-12 tracking-tighter italic uppercase leading-none">
                Feel the memory <br className="md:hidden" /> Beyonds
              </h2>

              {/* BAGIAN SEARCH BAR UTAMA */}
              <div
                className={`w-full max-w-3xl transition-all duration-500 z-40 relative mt-8 md:sticky md:top-24 ${isScrolled
                    ? "opacity-100 md:scale-90 md:opacity-90"
                    : "opacity-100 scale-100"
                  }`}
              >
                <div className="absolute -inset-1 bg-gradient-to-r from-cyan-500/20 to-blue-600/20 rounded-full blur-xl opacity-50"></div>
                <div className="relative">
                  <Search className="absolute left-6 md:left-8 top-1/2 -translate-y-1/2 w-5 h-5 md:w-6 md:h-6 text-cyan-400/70" />
                  <input
                    type="text"
                    placeholder="Cari film atau bioskop"
                    value={movieSearch}
                    onChange={(e) => setMovieSearch(e.target.value)}
                    className="w-full bg-[#00122a]/80 border-t border-white/20 border-l border-white/10 text-white py-5 md:py-7 pl-14 md:pl-20 pr-8 rounded-full text-xs md:text-sm outline-none shadow-2xl backdrop-blur-xl"
                  />
                </div>
              </div>
            </section>

            {/* --- BANNER PROMO --- */}
            <section
              className="relative px-8 md:px-20 mb-20 group/banner"
              onMouseEnter={() => setIsPaused(true)}
              onMouseLeave={() => setIsPaused(false)}
            >

              <div className="relative max-w-6xl mx-auto">
                <button
                  onClick={() => scrollByFrame("left")}
                  className="absolute -left-12 md:-left-16 top-1/2 -translate-y-1/2 z-40 bg-black/60 hover:bg-cyan-600 w-10 h-10 rounded-full border border-white/10 opacity-0 group-hover/banner:opacity-100 transition-all hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => scrollByFrame("right")}
                  className="absolute -right-12 md:-right-16 top-1/2 -translate-y-1/2 z-40 bg-black/60 hover:bg-cyan-600 w-10 h-10 rounded-full border border-white/10 opacity-0 group-hover/banner:opacity-100 transition-all hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>
                <div ref={bannerRef} className="flex gap-4 overflow-x-auto no-scrollbar snap-x snap-mandatory">
                  {PROMOS.map((promo) => (
                    <div
                      key={promo.id}
                      onClick={() => router.push(`/promo?id=${promo.id}`)}
                      className="flex-none w-[85%] md:w-[calc((100%-2rem)/2)] lg:w-[calc((100%-3rem)/3)] aspect-[16/9] rounded-[1.5rem] md:rounded-[2rem] relative overflow-hidden border border-white/5 cursor-pointer snap-center shadow-2xl group hover:scale-[1.02] transition-transform duration-300"
                    >
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
            </section>

            {/* --- NOW PLAYING (FIT 4 POSTERS, WIDE ARROWS, FULL INFO) --- */}
            <section className="px-8 md:px-20 pb-20 relative group/np">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-slate-200">
                    Now Playing
                  </h3>
                  <span className="bg-cyan-500/20 text-cyan-400 text-[8px] md:text-[9px] font-black px-2 py-1 rounded-full uppercase border border-cyan-500/20">
                    Live Now
                  </span>
                </div>
                <Link
                  href="/film"
                  className="text-cyan-400 bg-cyan-400/10 px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400/20 transition-all border border-cyan-400/20 active:scale-95"
                >
                  Lihat semua
                </Link>
              </div>

              <div className="relative max-w-6xl mx-auto">
                <button
                  onClick={() => scrollMovies("left")}
                  className="absolute -left-12 md:-left-16 top-[42%] -translate-y-1/2 z-30 bg-black/60 hover:bg-cyan-600 w-10 h-10 rounded-full border border-white/10 opacity-0 group-hover/np:opacity-100 transition-all hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>

                <button
                  onClick={() => scrollMovies("right")}
                  className="absolute -right-12 md:-right-16 top-[42%] -translate-y-1/2 z-30 bg-black/60 hover:bg-cyan-600 w-10 h-10 rounded-full border border-white/10 opacity-0 group-hover/np:opacity-100 transition-all hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                <div
                  ref={movieScrollRef}
                  className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-10"
                >
                  {loading
                    ? [...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-none w-[160px] md:w-[calc((100%-3rem)/4)] aspect-[2/3] bg-slate-800/50 rounded-[1.8rem] animate-pulse"
                      />
                    ))
                    : filteredMovies.map((movie, index) => (
                      <div
                        key={movie.id}
                        className="flex-none w-[160px] md:w-[calc((100%-3rem)/4)] snap-start group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-4 border border-white/5 shadow-2xl bg-[#001d3d] group-hover:border-cyan-500/50 transition-all duration-500 group-hover:-translate-y-2">
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-105 transition-all duration-700"
                          />

                          {/* Overlay Hover */}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/40 to-transparent opacity-0 group-hover:opacity-100 transition-all duration-300 flex flex-col justify-end p-4 text-center">
                            <h4 className="text-white text-[10px] md:text-xs font-black uppercase tracking-tight leading-tight mb-3 line-clamp-2">
                              {movie.title}
                            </h4>

                            <div className="flex flex-col gap-1.5 mb-4">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handlePlayTrailer(movie.id);
                                }}
                                className="w-full py-1.5 bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 rounded-full text-[8px] md:text-[9px] font-black uppercase flex items-center justify-center gap-1 transition-all"
                              >
                                <span>▶</span> Trailer
                              </button>

                              {/* TRIGGER DETAIL PAGE */}
                              <button
                                onClick={() => {
                                  setSelectedMovie(movie);
                                  setInitialBookingData(null);
                                  window.scrollTo(0, 0);
                                }}
                                className="w-full py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-[8px] md:text-[9px] font-black uppercase shadow-lg shadow-cyan-900/20 transition-all"
                              >
                                Beli Tiket
                              </button>
                            </div>

                            <div className="flex items-center justify-center gap-2 border-t border-white/10 pt-3">
                              <span
                                className={`px-1.5 py-0.5 border text-[7px] md:text-[8px] font-black rounded uppercase ${movie.age_rating?.includes("17") ||
                                    movie.age_rating === "R"
                                    ? "border-red-500 text-red-500"
                                    : movie.age_rating?.includes("13")
                                      ? "border-yellow-500 text-yellow-500"
                                      : "border-green-500 text-green-500"
                                  }`}
                              >
                                {movie.age_rating ? movie.age_rating : "TBA"}
                              </span>
                              <span className="text-slate-300 text-[7px] md:text-[8px] font-bold uppercase tracking-widest">
                                {movie.runtime
                                  ? `${Math.floor(movie.runtime / 60)}h ${movie.runtime % 60}m`
                                  : "2h 05m"}
                              </span>
                              <div className="flex items-center gap-0.5">
                                <span className="text-cyan-400 text-[8px] md:text-[9px]">
                                  ★
                                </span>
                                <span className="text-white text-[8px] md:text-[9px] font-black">
                                  {movie.vote_average?.toFixed(1) || "0.0"}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="absolute top-3 right-3 w-7 h-7 bg-black/60 backdrop-blur-xl rounded-full flex items-center justify-center border border-white/10 group-hover:opacity-0 transition-opacity">
                            <span className="text-cyan-400 text-[10px] font-black italic">
                              {index + 1}
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>

            {/* --- COMING SOON --- */}
            <section className="px-8 md:px-20 pb-20 md:pb-32 relative group/cs">
              <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-4 max-w-6xl mx-auto">
                <div className="flex items-center gap-3">
                  <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter text-slate-200">
                    Coming Soon
                  </h3>
                  <span className="bg-cyan-500/20 text-cyan-400 text-[8px] md:text-[9px] font-black px-2 py-1 rounded-full uppercase border border-cyan-500/20">
                    Stay Tuned
                  </span>
                </div>
                <Link
                  href="/film?tab=upcoming"
                  className="text-cyan-400 bg-cyan-400/10 px-5 py-2.5 rounded-full text-[10px] md:text-[11px] font-black uppercase tracking-widest hover:bg-cyan-400/20 transition-all border border-cyan-400/20 active:scale-95"
                >
                  Lihat semua
                </Link>
              </div>

              <div className="relative max-w-6xl mx-auto">
                <button
                  onClick={() => scrollUpcoming("left")}
                  className="absolute -left-12 md:-left-16 top-[42%] -translate-y-1/2 z-30 bg-black/60 hover:bg-cyan-600 w-10 h-10 rounded-full border border-white/10 opacity-0 group-hover/cs:opacity-100 transition-all hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm"
                >
                  <ChevronLeft className="w-5 h-5 text-white" />
                </button>
                <button
                  onClick={() => scrollUpcoming("right")}
                  className="absolute -right-12 md:-right-16 top-[42%] -translate-y-1/2 z-30 bg-black/60 hover:bg-cyan-600 w-10 h-10 rounded-full border border-white/10 opacity-0 group-hover/cs:opacity-100 transition-all hover:scale-110 hidden md:flex items-center justify-center backdrop-blur-sm"
                >
                  <ChevronRight className="w-5 h-5 text-white" />
                </button>

                <div
                  ref={upcomingScrollRef}
                  className="flex gap-4 overflow-x-auto no-scrollbar snap-x scroll-smooth pb-10"
                >
                  {loading
                    ? [...Array(4)].map((_, i) => (
                      <div
                        key={i}
                        className="flex-none w-[160px] md:w-[calc((100%-3rem)/4)] aspect-[2/3] bg-slate-800/50 rounded-[1.8rem] animate-pulse"
                      />
                    ))
                    : filteredUpcoming.map((movie) => (
                      <div
                        key={movie.id}
                        className="flex-none w-[160px] md:w-[calc((100%-3rem)/4)] snap-start group cursor-pointer"
                      >
                        <div className="relative aspect-[2/3] rounded-[1.5rem] md:rounded-[2rem] overflow-hidden mb-4 border border-white/5 shadow-2xl bg-[#001d3d] group-hover:border-cyan-500/50 transition-all duration-500 group-hover:-translate-y-2">
                          <img
                            src={`https://image.tmdb.org/t/p/w500${movie.poster_path}`}
                            alt={movie.title}
                            className="w-full h-full object-cover group-hover:scale-110 group-hover:blur-[2px] transition-all duration-700"
                          />
                          <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center p-4">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePlayTrailer(movie.id);
                              }}
                              className="w-[85%] py-2 bg-cyan-600 hover:bg-cyan-500 text-white rounded-full text-[9px] font-black uppercase flex items-center justify-center gap-1.5 transition-all shadow-lg shadow-cyan-900/40"
                            >
                              <span>▶</span> Trailer
                            </button>
                          </div>
                        </div>
                        <p className="text-cyan-400 text-[8px] md:text-[10px] font-bold mb-1 uppercase tracking-wider">
                          Tayang:{" "}
                          {movie.release_date
                            ? new Date(movie.release_date).toLocaleDateString(
                              "id-ID",
                              { day: "numeric", month: "short" },
                            )
                            : "TBA"}
                        </p>
                        <h4 className="text-xs md:text-sm font-black uppercase tracking-tighter line-clamp-1 mb-1.5 group-hover:text-cyan-400 transition-colors">
                          {movie.title}
                        </h4>
                        <div className="flex items-center gap-2">
                          <span className="text-[9px] md:text-[10px] font-bold text-slate-500">
                            2D
                          </span>
                          <span
                            className={`px-1.5 py-0.5 text-white text-[7px] md:text-[8px] font-black rounded-sm uppercase ${movie.age_rating === "SU" ? "bg-green-600" : movie.age_rating?.includes("13") ? "bg-yellow-600" : "bg-red-700"}`}
                          >
                            {movie.age_rating || "SU"}
                          </span>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </section>
          </>
        )}

        {/* ── NICKNAME PROMPT MODAL (phone-registered users without a name) ── */}
        {showNicknameModal && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4">
            <div className="absolute inset-0 bg-black/90 backdrop-blur-md" />
            <div className="relative w-full max-w-sm bg-gradient-to-br from-[#0d1b2a] to-[#000814] border border-cyan-500/20 rounded-3xl shadow-2xl overflow-hidden">
              {/* Glow top */}
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-48 h-1 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-full" />
              <div className="p-8 text-center">
                {/* Icon */}
                <div className="w-20 h-20 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-6 shadow-xl shadow-cyan-900/40 text-4xl">
                  👋
                </div>
                <h2 className="text-2xl font-black text-white mb-2 tracking-tight">
                  Halo, Pengguna Baru!
                </h2>
                <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                  Gimana kita harus manggil kamu?<br />
                  <span className="text-slate-500 text-xs">Nama ini akan muncul di profil kamu</span>
                </p>
                <input
                  id="nickname-input"
                  type="text"
                  placeholder="Nama panggilan kamu..."
                  value={nickname}
                  maxLength={30}
                  onChange={(e) => setNickname(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && nickname.trim() && (async () => {
                    setNicknameSaving(true);
                    await supabase.auth.updateUser({ data: { full_name: nickname.trim() } });
                    setNicknameSaving(false);
                    setShowNicknameModal(false);
                  })()}
                  className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 px-5 text-white text-center text-lg font-bold outline-none focus:border-cyan-500/60 transition-all placeholder-slate-600 mb-4"
                  autoFocus
                />
                <button
                  disabled={nicknameSaving || !nickname.trim()}
                  onClick={async () => {
                    setNicknameSaving(true);
                    await supabase.auth.updateUser({ data: { full_name: nickname.trim() } });
                    setNicknameSaving(false);
                    setShowNicknameModal(false);
                  }}
                  className="w-full py-4 bg-gradient-to-r from-cyan-600 to-blue-600 hover:from-cyan-500 hover:to-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white rounded-2xl font-black text-sm uppercase tracking-widest transition-all shadow-lg shadow-cyan-900/30 mb-3"
                >
                  {nicknameSaving ? "Menyimpan..." : "Simpan Nama"}
                </button>
                <button
                  onClick={() => setShowNicknameModal(false)}
                  className="w-full text-slate-600 hover:text-slate-400 text-xs font-bold uppercase tracking-widest transition-colors py-1"
                >
                  Lewati untuk sekarang
                </button>
              </div>
            </div>
          </div>
        )}

        {/* MODAL AUTH TETAP DI LUAR CONDITION AGAR BISA MUNCUL KAPANPUN */}
        {showAuthModal && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
            <div className="bg-[#000814] border border-white/10 p-8 rounded-[2.5rem] w-full max-w-md relative shadow-2xl">
              <button
                onClick={() => {
                  setShowAuthModal(false);
                  setStep(1);
                  setRegisterStep(1);
                  setAuthError("");
                  setAuthSuccess("");
                }}
                className="absolute top-6 right-6 text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>

              {/* HEADER */}
              <h3 className="text-2xl font-black italic uppercase mb-1 tracking-tighter">
                Ocean<span className="text-cyan-400">Tix</span>{" "}
                {authMode === "forgot" ? "Reset" : authMode === "register" ? "Daftar" : "Login"}
              </h3>
              {authMode === "register" && (
                <p className="text-[10px] text-slate-500 font-bold uppercase tracking-widest mb-1">
                  {registerStep === 1 ? "Isi data diri kamu" : "Cek WhatsApp kamu 📱"}
                </p>
              )}

              {/* ERROR / SUCCESS MESSAGES */}
              {authError && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/30 text-red-400 text-[11px] font-bold">
                  ⚠️ {authError}
                </div>
              )}
              {authSuccess && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-green-500/10 border border-green-500/30 text-green-400 text-[11px] font-bold">
                  ✅ {authSuccess}
                </div>
              )}

              <div className="space-y-4 mt-6">

                {/* ===== LOGIN MODE ===== */}
                {authMode === "login" && (
                  <>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📱</span>
                      <input
                        id="auth-phone"
                        type="tel"
                        placeholder="Nomor WhatsApp (08xx / 628xx)"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setAuthError(""); }}
                        className="w-full bg-white/5 border border-white/10 py-4 pl-14 pr-6 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm"
                      />
                    </div>
                    <input
                      id="auth-password"
                      type="password"
                      placeholder="Password"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                      onKeyDown={(e) => e.key === "Enter" && (async () => {
                        if (!phone || !password) return;
                        setAuthLoading(true); setAuthError("");
                        let loginEmail = phoneToEmail(phone);
                        try {
                          const r = await fetch("/api/get-email-by-phone", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone }),
                          });
                          const d = await r.json();
                          if (d.email) loginEmail = d.email;
                        } catch (_) {}
                        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
                        setAuthLoading(false);
                        if (error) setAuthError("Nomor atau password salah.");
                      })()}
                      className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm"
                    />
                    <button
                      id="auth-login-btn"
                      disabled={authLoading}
                      onClick={async () => {
                        if (!phone || !password) { setAuthError("Nomor WA dan password wajib diisi."); return; }
                        setAuthLoading(true); setAuthError("");
                        // Resolve real email by phone (handles Google users who added phone)
                        let loginEmail = phoneToEmail(phone);
                        try {
                          const r = await fetch("/api/get-email-by-phone", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({ phone }),
                          });
                          const d = await r.json();
                          if (d.email) loginEmail = d.email;
                        } catch (_) {}
                        const { error } = await supabase.auth.signInWithPassword({ email: loginEmail, password });
                        setAuthLoading(false);
                        if (error) setAuthError("Nomor atau password salah.");
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg"
                    >
                      {authLoading ? "Memproses..." : "Masuk"}
                    </button>
                  </>
                )}

                {/* ===== REGISTER MODE — STEP 1: FORM ===== */}
                {authMode === "register" && registerStep === 1 && (
                  <>
                    <div className="relative">
                      <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📱</span>
                      <input
                        id="reg-phone"
                        type="tel"
                        placeholder="Nomor WhatsApp (08xx / 628xx)"
                        value={phone}
                        onChange={(e) => { setPhone(e.target.value); setAuthError(""); }}
                        className="w-full bg-white/5 border border-white/10 py-4 pl-14 pr-6 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm"
                      />
                    </div>
                    <input
                      id="reg-password"
                      type="password"
                      placeholder="Buat Password (min. 6 karakter)"
                      value={password}
                      onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                      className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm"
                    />
                    <p className="text-[10px] text-slate-500 pl-1">Kode OTP akan dikirim ke WhatsApp kamu</p>
                    <button
                      id="reg-send-otp-btn"
                      disabled={authLoading}
                      onClick={async () => {
                        if (!phone || !password) { setAuthError("Nomor WA dan password wajib diisi."); return; }
                        if (password.length < 6) { setAuthError("Password minimal 6 karakter."); return; }
                        setAuthLoading(true); setAuthError("");
                        const res = await fetch("/api/send-otp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phone }),
                        });
                        const data = await res.json();
                        setAuthLoading(false);
                        if (!res.ok) { setAuthError(data.error || "Gagal mengirim OTP."); return; }
                        setAuthSuccess("OTP terkirim! Cek WhatsApp kamu.");
                        setOtp("");
                        setRegisterStep(2);
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg"
                    >
                      {authLoading ? "Mengirim OTP..." : "Daftar & Kirim OTP"}
                    </button>
                  </>
                )}

                {/* ===== REGISTER MODE — STEP 2: OTP ===== */}
                {authMode === "register" && registerStep === 2 && (
                  <>
                    <div className="text-center py-2">
                      <p className="text-slate-400 text-xs mb-1">Kode dikirim ke WhatsApp</p>
                      <p className="text-cyan-400 font-black text-sm tracking-wider">{phone}</p>
                    </div>
                    <input
                      id="reg-otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setAuthError(""); }}
                      className="w-full bg-white/5 border border-white/10 py-5 px-6 rounded-2xl text-white text-center tracking-[0.6em] font-black outline-none focus:border-cyan-500/50 text-2xl"
                    />
                    <button
                      id="reg-verify-btn"
                      disabled={authLoading || otp.length < 6}
                      onClick={async () => {
                        setAuthLoading(true); setAuthError(""); setAuthSuccess("");
                        const res = await fetch("/api/verify-otp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phone, password, otp }),
                        });
                        const data = await res.json();
                        setAuthLoading(false);
                        if (!res.ok) { setAuthError(data.error || "Verifikasi gagal."); return; }
                        // Auto-login pakai internalEmail yang dikembalikan server
                        const loginEmail = data.internalEmail || phoneToEmail(phone);
                        const { error: loginErr } = await supabase.auth.signInWithPassword({
                          email: loginEmail,
                          password,
                        });
                        if (loginErr) {
                          setAuthSuccess("Akun dibuat! Silakan login.");
                          setAuthMode("login");
                          setRegisterStep(1);
                        }
                        // onAuthStateChange will close modal automatically
                      }}
                      className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 disabled:cursor-not-allowed text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-lg"
                    >
                      {authLoading ? "Memverifikasi..." : "Verifikasi & Buat Akun"}
                    </button>
                    <button
                      disabled={authLoading}
                      onClick={async () => {
                        setAuthError(""); setAuthSuccess(""); setAuthLoading(true);
                        const res = await fetch("/api/send-otp", {
                          method: "POST",
                          headers: { "Content-Type": "application/json" },
                          body: JSON.stringify({ phone }),
                        });
                        const data = await res.json();
                        setAuthLoading(false);
                        if (!res.ok) setAuthError(data.error || "Gagal mengirim ulang OTP.");
                        else setAuthSuccess("OTP baru terkirim!");
                      }}
                      className="w-full text-slate-500 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-widest transition-colors py-1"
                    >
                      Kirim ulang OTP
                    </button>
                  </>
                )}

                {/* ===== FORGOT MODE: 3-step phone OTP reset ===== */}
                {authMode === "forgot" && (
                  <>
                    {/* Step 1: Enter phone */}
                    {step === 1 && (
                      <>
                        <div className="relative">
                          <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 text-sm">📱</span>
                          <input
                            type="tel"
                            placeholder="Nomor WhatsApp (08xx / 628xx)"
                            value={phone}
                            onChange={(e) => { setPhone(e.target.value); setAuthError(""); }}
                            className="w-full bg-white/5 border border-white/10 py-4 pl-14 pr-6 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm"
                          />
                        </div>
                        <button
                          disabled={authLoading}
                          onClick={async () => {
                            if (!phone) { setAuthError("Nomor WA wajib diisi."); return; }
                            setAuthLoading(true); setAuthError("");
                            const res = await fetch("/api/send-otp", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ phone, purpose: "reset" }),
                            });
                            const data = await res.json();
                            setAuthLoading(false);
                            if (!res.ok) {
                              setAuthError(data.error || "Gagal kirim OTP."); return;
                            }
                            setAuthSuccess("OTP terkirim ke WhatsApp!"); setStep(2);
                          }}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                        >
                          {authLoading ? "Mengirim..." : "Kirim OTP ke WhatsApp"}
                        </button>
                      </>
                    )}

                    {/* Step 2: Verify OTP */}
                    {step === 2 && (
                      <>
                        <div className="text-center py-1">
                          <p className="text-slate-400 text-xs mb-1">Kode dikirim ke</p>
                          <p className="text-cyan-400 font-black text-sm">{phone}</p>
                        </div>
                        <input
                          type="text"
                          inputMode="numeric"
                          maxLength={6}
                          placeholder="000000"
                          value={otp}
                          onChange={(e) => { setOtp(e.target.value.replace(/\D/g, "")); setAuthError(""); }}
                          className="w-full bg-white/5 border border-white/10 py-5 px-6 rounded-2xl text-white text-center tracking-[0.6em] font-black outline-none focus:border-cyan-500/50 text-2xl"
                        />
                        <button
                          disabled={authLoading || otp.length < 6}
                          onClick={() => { setAuthError(""); setAuthSuccess(""); setStep(3); }}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                        >
                          Lanjut
                        </button>
                        <button
                          onClick={() => { setStep(1); setOtp(""); setAuthError(""); setAuthSuccess(""); }}
                          className="w-full text-slate-500 hover:text-cyan-400 text-[10px] font-bold uppercase tracking-widest transition-colors py-1"
                        >
                          Ganti nomor / Kirim ulang
                        </button>
                      </>
                    )}

                    {/* Step 3: New password */}
                    {step === 3 && (
                      <>
                        <input
                          type="password"
                          placeholder="Password baru (min. 6 karakter)"
                          value={password}
                          onChange={(e) => { setPassword(e.target.value); setAuthError(""); }}
                          className="w-full bg-white/5 border border-white/10 py-4 px-6 rounded-2xl text-white outline-none focus:border-cyan-500/50 text-sm"
                        />
                        <button
                          disabled={authLoading}
                          onClick={async () => {
                            if (!password || password.length < 6) { setAuthError("Password minimal 6 karakter."); return; }
                            setAuthLoading(true); setAuthError("");
                            const res = await fetch("/api/reset-password", {
                              method: "POST",
                              headers: { "Content-Type": "application/json" },
                              body: JSON.stringify({ phone, otp, newPassword: password }),
                            });
                            const data = await res.json();
                            setAuthLoading(false);
                            if (!res.ok) { setAuthError(data.error || "Gagal reset password."); return; }
                            setAuthSuccess("Password berhasil diubah! Silakan login.");
                            setTimeout(() => {
                              setAuthMode("login"); setStep(1); setOtp(""); setPassword(""); setAuthSuccess("");
                            }, 1500);
                          }}
                          className="w-full bg-cyan-600 hover:bg-cyan-500 disabled:opacity-60 text-white py-4 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all"
                        >
                          {authLoading ? "Menyimpan..." : "Simpan Password Baru"}
                        </button>
                      </>
                    )}
                  </>
                )}

                {/* GOOGLE BUTTON — only for login & register step 1 */}
                {(authMode === "login" || (authMode === "register" && registerStep === 1)) && (
                  <>
                    <div className="relative my-4 text-center">
                      <div className="absolute inset-0 flex items-center">
                        <div className="w-full border-t border-white/10"></div>
                      </div>
                      <span className="relative bg-[#000814] px-4 text-[9px] text-slate-500 font-bold uppercase tracking-[0.3em]">
                        Atau
                      </span>
                    </div>
                    <button
                      id="auth-google-btn"
                      type="button"
                      onClick={async () => {
                        const { error } = await supabase.auth.signInWithOAuth({
                          provider: "google",
                          options: { redirectTo: window.location.href },
                        });
                        if (error) console.error("Error Google login:", error);
                      }}
                      className="w-full flex items-center justify-center gap-3 bg-white text-black py-3.5 rounded-full font-black text-[10px] uppercase tracking-widest hover:bg-slate-200 transition-all shadow-xl active:scale-95"
                    >
                      <img
                        src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg"
                        className="w-4 h-4"
                        alt="google"
                      />
                      Lanjut Google
                    </button>
                  </>
                )}
              </div>

              {/* FOOTER LINKS */}
              <div className="mt-6 text-center space-y-3 pt-5 border-t border-white/5">
                {authMode === "login" && (
                  <p
                    onClick={() => { setAuthMode("forgot"); setStep(1); setAuthError(""); setAuthSuccess(""); }}
                    className="text-[9px] text-cyan-400 cursor-pointer hover:underline uppercase font-bold tracking-[0.2em]"
                  >
                    Lupa Password?
                  </p>
                )}
                {authMode !== "forgot" && (
                  <p
                    onClick={() => {
                      setAuthMode(authMode === "register" ? "login" : "register");
                      setRegisterStep(1); setStep(1); setAuthError(""); setAuthSuccess(""); setOtp("");
                    }}
                    className="text-[9px] text-slate-500 cursor-pointer hover:text-white uppercase font-bold tracking-[0.2em]"
                  >
                    {authMode === "register"
                      ? "Udah punya akun? Login"
                      : "Belum punya akun? Daftar"}
                  </p>
                )}
                {authMode === "forgot" && (
                  <p
                    onClick={() => { setAuthMode("login"); setStep(1); setAuthError(""); setAuthSuccess(""); }}
                    className="text-[9px] text-slate-500 cursor-pointer hover:text-white uppercase font-bold tracking-[0.2em]"
                  >
                    Kembali ke Login
                  </p>
                )}
              </div>
            </div>
          </div>
        )}
      </main>

      {/* MODAL LOKASI */}
      {showLocationModal && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center p-4 md:p-6">
          <div
            className="absolute inset-0 bg-black/80 backdrop-blur-md animate-in fade-in duration-300"
            onClick={() => setShowLocationModal(false)}
          ></div>
          <div className="relative w-full max-w-lg bg-[#1e293b] rounded-[2.5rem] border border-white/10 shadow-[0_0_50px_rgba(0,0,0,0.5)] overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-8">
              <div className="flex justify-between items-center mb-8">
                <h3 className="text-xl md:text-2xl font-black italic uppercase tracking-tighter">
                  Pick A Location
                </h3>
                <button
                  onClick={() => setShowLocationModal(false)}
                  className="p-3 hover:bg-white/10 rounded-full transition-colors"
                >
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              <div className="relative mb-8">
                <Search className="absolute left-6 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-500" />
                <input
                  type="text"
                  placeholder="Cari kota..."
                  className="w-full bg-slate-900/50 border border-white/10 py-4 pl-16 pr-6 rounded-2xl text-sm outline-none focus:ring-2 focus:ring-cyan-500/50 transition-all"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="max-h-[50vh] overflow-y-auto custom-scrollbar flex flex-col gap-1 pr-2">
                {filteredCities.map((city) => (
                  <div
                    key={city}
                    onClick={() => {
                      setSelectedCity(city);
                      setShowLocationModal(false);
                    }}
                    className={`flex items-center justify-between p-4 rounded-xl cursor-pointer transition-all ${selectedCity === city ? "bg-cyan-500/20 text-cyan-400" : "hover:bg-white/5 text-slate-400"}`}
                  >
                    <span className="text-xs font-black uppercase tracking-widest">
                      {city}
                    </span>
                    {selectedCity === city && <Check className="w-5 h-5" />}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* --- TAMBAHAN MODAL TRAILER (DI LUAR MAIN) --- */}
      {trailerId && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-20">
          <button
            onClick={() => setTrailerId(null)}
            className="absolute top-6 right-6 md:top-10 md:right-10 text-white hover:text-cyan-400 transition-colors z-[1002]"
          >
            <X size={48} strokeWidth={3} />
          </button>
          <div className="w-full max-w-6xl aspect-video rounded-[2rem] md:rounded-[3rem] overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.3)] border border-white/10 relative">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            ></iframe>
          </div>
        </div>
      )}



      <style>{`
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .custom-scrollbar::-webkit-scrollbar { width: 5px; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(6, 182, 212, 0.3); border-radius: 10px; }
        @keyframes ocean-live-waves {
          0% { mask-position: 0 0; -webkit-mask-position: 0 0; }
          100% { mask-position: -200% 0; -webkit-mask-position: -200% 0; }
        }
        .animate-ocean-live-waves {
          background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.2) 20%, rgba(30, 58, 138, 0.3) 50%, transparent 90%);
          mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBDMjAwIDIwIDQwMCAwIDYwMCAxMEM4MDAgMjAgMTAwMCAwIDEwMDAgMTBWMTAwSDBWMTB6IiBmaWxsPSJibGFjayIvPjwvc3ZnPg==');
          -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTBDMjAwIDIwIDQwMCAwIDYwMCAxMEM4MDAgMjAgMTAwMCAwIDEwMDAgMTBWMTAwSDBWMTB6IiBmaWxsPSJibGFjayIvPjwvc3ZnPg==');
          mask-size: 200% 100%; -webkit-mask-size: 200% 100%;
          animation: ocean-live-waves 25s linear infinite;
        }
        .animate-ocean-live-waves-delayed {
          background: linear-gradient(to bottom, transparent, rgba(6, 182, 212, 0.15) 30%, rgba(30, 58, 138, 0.2) 60%, transparent 95%);
          mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTVDMjAwIDI1IDQwMCA1IDYwMCAxNUM4MDAgMjUgMTAwMCA1IDEwMDAgMTVWMTAwSDBWMTV6IiBmaWxsPSJibGFjayIvPjwvc3ZnPg==');
          -webkit-mask-image: url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAwIDEwMCIgcHJlc2VydmVBc3BlY3RSYXRpbz0ibm9uZSI+PHBhdGggZD0iTTAgMTVDMjAwIDI1IDQwMCA1IDYwMCAxNUM4MDAgMjUgMTAwMCA1IDEwMDAgMTVWMTAwSDBWMTV6IiBmaWxsPSJibGFjayIvPjwvc3ZnPg==');
          mask-size: 200% 100%; -webkit-mask-size: 200% 100%;
          animation: ocean-live-waves 35s linear infinite -10s;
        }
        @keyframes ocean-live-pulse {
          0%, 100% { opacity: 0.2; transform: scale(1); }
          50% { opacity: 0.4; transform: scale(1.1); }
        }
        .animate-ocean-live-pulse { animation: ocean-live-pulse 18s ease-in-out infinite; }
      `}</style>
    </div>
  );
}

export default function Home() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-[#000814] flex items-center justify-center text-white font-black italic uppercase">Loading OceanTix...</div>}>
      <HomeContent />
    </Suspense>
  );
}
