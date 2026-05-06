"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { supabase } from "@/lib/supabase";

/**
 * useRealtimeSeats
 *
 * Fetches all occupied seats for a specific show from Supabase and subscribes
 * to live INSERT events so the seat map updates the moment another user books.
 *
 * Strategy:
 * - Initial fetch on mount
 * - Supabase Realtime subscription (no server-side filter — filter client-side
 *   because Supabase realtime column filters can be unreliable without special config)
 * - Polling every 5s as a fallback in case the WS drops
 */
export function useRealtimeSeats(
  movieId: string | number,
  theaterName: string,
  showDate: string,
  showTime: string
) {
  const [occupiedSeats, setOccupiedSeats] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const isReady =
    !!movieId && !!theaterName && !!showDate && !!showTime;

  // Convert movieId to string consistently
  const movieIdStr = String(movieId);

  // ── Core fetch function ──────────────────────────────────────────────────
  const fetchSeats = useCallback(async () => {
    if (!isReady) return;

    const { data, error } = await supabase
      .from("bookings")
      .select("seats")
      .eq("movie_id", movieIdStr)
      .eq("theater_name", theaterName)
      .eq("show_date", showDate)
      .eq("show_time", showTime);

    if (error) {
      console.warn("[useRealtimeSeats] fetch error:", error.message);
      return;
    }

    if (data) {
      const all: string[] = data.flatMap((b: { seats: string[] }) => b.seats);
      setOccupiedSeats(all);
    }
  }, [isReady, movieIdStr, theaterName, showDate, showTime]);

  // ── Initial fetch + polling + realtime ──────────────────────────────────
  useEffect(() => {
    if (!isReady) return;

    // 1. First fetch immediately
    setLoading(true);
    fetchSeats().finally(() => setLoading(false));

    // 2. Poll every 5 seconds as a guaranteed fallback
    pollRef.current = setInterval(fetchSeats, 5000);

    // 3. Realtime subscription — listen to ALL inserts on bookings table,
    //    then filter client-side (avoids Supabase realtime filter config issues)
    const channelName = `seats_${movieIdStr}_${theaterName}_${showDate}_${showTime}`
      .replace(/[^a-zA-Z0-9_]/g, "_")
      .slice(0, 100);

    const channel = supabase
      .channel(channelName)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "bookings",
        },
        (payload: any) => {
          const row = payload.new as {
            movie_id: string;
            theater_name: string;
            show_date: string;
            show_time: string;
            seats: string[];
          };

          // Client-side filter — only add seats for THIS exact show
          if (
            row.movie_id === movieIdStr &&
            row.theater_name === theaterName &&
            row.show_date === showDate &&
            row.show_time === showTime
          ) {
            setOccupiedSeats((prev) => {
              const newSeats = row.seats.filter((s) => !prev.includes(s));
              return newSeats.length > 0 ? [...prev, ...newSeats] : prev;
            });
          }
        }
      )
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          console.log("[useRealtimeSeats] subscribed:", channelName);
        }
        if (status === "CHANNEL_ERROR") {
          console.warn("[useRealtimeSeats] channel error, polling will cover");
        }
      });

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
      supabase.removeChannel(channel);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [movieIdStr, theaterName, showDate, showTime]);

  return { occupiedSeats, loading };
}
