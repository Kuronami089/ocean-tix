"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import { Ticket } from "@/lib/data";

interface TicketContextType {
  tickets: Ticket[];
  addTicket: (ticket: Ticket) => Promise<void>;
  loading: boolean;
}

const TicketContext = createContext<TicketContextType | undefined>(undefined);

export function TicketProvider({ children }: { children: React.ReactNode }) {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Track auth state
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      setUserId(data.session?.user?.id ?? null);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // Fetch tickets from Supabase when user changes
  const fetchTickets = useCallback(async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("bookings")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (!error && data) {
      const mapped: Ticket[] = data.map((b: any) => ({
        id: b.id,
        status: b.status as "active" | "past",
        movie: {
          title: b.movie_title,
          poster_path: b.movie_poster ?? "",
        },
        theater: {
          id: 0,
          name: b.theater_name,
          city: "",
          type: b.theater_type,
          price2D: b.price_per_seat,
          price3D: b.price_per_seat,
          distance: 0,
        },
        date: b.show_date,
        time: b.show_time,
        seatCount: (b.seats as string[]).length,
        seats: b.seats as string[],
        bookingCode: b.booking_code,
        passKey: b.pass_key,
        orderNumber: b.order_number,
        price: b.price_per_seat,
        serviceFee: b.service_fee,
        paymentMethod: b.payment_method,
        format: b.format_type,
        audi: b.studio,
        timestamp: b.show_timestamp,
      }));
      setTickets(mapped);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) {
      setTickets([]);
      setLoading(false);
      return;
    }
    fetchTickets(userId);
  }, [userId, fetchTickets]);

  const addTicket = async (ticket: Ticket) => {
    if (!userId) return;

    const { data, error } = await supabase
      .from("bookings")
      .insert({
        user_id: userId,
        movie_id: ticket.movieId ?? String(ticket.movie.title),
        movie_title: ticket.movie.title,
        movie_poster: ticket.movie.poster_path,
        theater_name: ticket.theater.name,
        theater_type: ticket.theater.type,
        show_date: (ticket as any).fullDate ?? ticket.date, // ISO date for realtime matching
        show_time: ticket.time,
        seats: ticket.seats,
        format_type: ticket.format,
        studio: ticket.audi,
        order_number: ticket.orderNumber,
        booking_code: ticket.bookingCode,
        pass_key: ticket.passKey,
        price_per_seat: ticket.price,
        service_fee: ticket.serviceFee,
        payment_method: ticket.paymentMethod,
        status: "active",
        show_timestamp: ticket.timestamp ?? Date.now(),
      })
      .select()
      .single();

    if (error) {
      console.error("Failed to save ticket to Supabase:", error);
      return;
    }

    // Map returned row back to Ticket type and prepend
    if (data) {
      const saved: Ticket = {
        ...ticket,
        id: data.id,
      };
      setTickets((prev) => [saved, ...prev]);
    }
  };

  return (
    <TicketContext.Provider value={{ tickets, addTicket, loading }}>
      {children}
    </TicketContext.Provider>
  );
}

export function useTickets() {
  const context = useContext(TicketContext);
  if (context === undefined) {
    throw new Error("useTickets must be used within a TicketProvider");
  }
  return context;
}
