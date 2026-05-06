"use client";

import React, { useState, useEffect } from "react";
import { useRouter, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import MovieDetailPage from "@/app/MovieDetail";
import Link from "next/link";

export default function FilmDetailPage() {
  const router = useRouter();
  const params = useParams();
  const movieId = params?.id as string;

  const [movie, setMovie] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [trailerId, setTrailerId] = useState<string | null>(null);

  // Auth
  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => subscription.unsubscribe();
  }, []);

  // Fetch movie details
  useEffect(() => {
    if (!movieId) return;
    const fetchMovie = async () => {
      try {
        setLoading(true);
        const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
        const res = await fetch(
          `https://api.themoviedb.org/3/movie/${movieId}?api_key=${apiKey}&append_to_response=release_dates,credits,videos`
        );
        const data = await res.json();

        const certification =
          data.release_dates?.results?.find(
            (r: any) => r.iso_3166_1 === "ID"
          )?.release_dates?.[0]?.certification ||
          data.release_dates?.results?.find(
            (r: any) => r.iso_3166_1 === "US"
          )?.release_dates?.[0]?.certification ||
          "13+";

        const trailerKey = data.videos?.results?.find(
          (v: any) => v.type === "Trailer" && v.site === "YouTube"
        )?.key;

        setMovie({
          ...data,
          trailerKey,
          genres: data.genres?.map((g: any) => g.name).join(" / "),
          age_rating: certification,
          director: data.credits?.crew?.find((p: any) => p.job === "Director")?.name,
          writer: data.credits?.crew?.find(
            (p: any) => p.job === "Writer" || p.job === "Screenplay"
          )?.name,
          producer: data.credits?.crew?.find((p: any) => p.job === "Producer")?.name,
          studio: data.production_companies?.[0]?.name,
          cast: data.credits?.cast?.slice(0, 8).map((a: any) => a.name).join(", "),
        });
      } catch (err) {
        console.error("Failed to fetch movie:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchMovie();
  }, [movieId]);

  const handlePlayTrailer = async (id: number) => {
    try {
      const apiKey = process.env.NEXT_PUBLIC_TMDB_API_KEY;
      const res = await fetch(
        `https://api.themoviedb.org/3/movie/${id}?api_key=${apiKey}&append_to_response=videos,credits`
      );
      const data = await res.json();
      const trailer = data.videos?.results?.find(
        (v: any) => v.type === "Trailer" && v.site === "YouTube"
      );
      if (trailer) setTrailerId(trailer.key);
    } catch (err) {
      console.error("Failed to fetch trailer:", err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#000814] flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="w-10 h-10 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin" />
          <p className="text-slate-400 text-sm font-bold uppercase tracking-widest">
            Memuat film...
          </p>
        </div>
      </div>
    );
  }

  if (!movie) {
    return (
      <div className="min-h-screen bg-[#000814] flex flex-col items-center justify-center gap-4 text-white">
        <p className="text-slate-400 font-bold uppercase tracking-widest">Film tidak ditemukan.</p>
        <Link
          href="/film"
          className="px-6 py-3 bg-cyan-600 hover:bg-cyan-500 rounded-full text-sm font-black uppercase tracking-widest transition-all"
        >
          Kembali ke Film
        </Link>
      </div>
    );
  }

  return (
    <>
      <MovieDetailPage
        movie={movie}
        onBack={() => router.push("/film")}
        handlePlayTrailer={handlePlayTrailer}
        user={user}
        openAuthModal={() => setShowAuthModal(true)}
        extraBreadcrumbs={[{ label: "Film", href: "/film" }]}
        onPaymentComplete={() => router.push("/")}
      />

      {/* Floating trailer modal (from handlePlayTrailer on home page) */}
      {trailerId && (
        <div className="fixed inset-0 z-[1001] flex items-center justify-center bg-black/95 backdrop-blur-2xl p-4 md:p-20">
          <button
            onClick={() => setTrailerId(null)}
            className="absolute top-6 right-6 md:top-10 md:right-10 text-white hover:text-cyan-400 transition-colors z-[1002]"
          >
            <svg className="w-10 h-10" fill="none" stroke="currentColor" strokeWidth={3} viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="w-full max-w-6xl aspect-video rounded-[2rem] overflow-hidden shadow-[0_0_100px_rgba(6,182,212,0.3)] border border-white/10">
            <iframe
              className="w-full h-full"
              src={`https://www.youtube.com/embed/${trailerId}?autoplay=1&rel=0`}
              allow="autoplay; encrypted-media"
              allowFullScreen
            />
          </div>
        </div>
      )}
    </>
  );
}
