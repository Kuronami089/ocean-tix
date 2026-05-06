"use client";

import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";

export interface SavedCard {
  id: string;
  card_number_masked: string; // e.g. "**** **** **** 4242"
  valid_thru: string;
  card_type: "visa" | "mastercard";
}

export function useSavedCards() {
  const [cards, setCards] = useState<SavedCard[]>([]);
  const [userId, setUserId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // ── Track auth ──────────────────────────────────────────────────────────
  useEffect(() => {
    // Get current session immediately
    supabase.auth.getSession().then(({ data }) => {
      const uid = data.session?.user?.id ?? null;
      setUserId(uid);
    });

    // Listen for future auth changes (login / logout)
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, session) => {
      setUserId(session?.user?.id ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  // ── Fetch cards whenever userId changes ─────────────────────────────────
  const fetchCards = useCallback(async (uid: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("saved_cards")
      .select("*")
      .eq("user_id", uid)
      .order("created_at", { ascending: false });

    if (error) {
      console.warn("[useSavedCards] fetch error:", error.message);
    }

    if (!error && data) {
      setCards(data as SavedCard[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (!userId) {
      setCards([]);
      setLoading(false);
      return;
    }
    fetchCards(userId);
  }, [userId, fetchCards]);

  // ── Save a card (masked — NEVER store full number) ──────────────────────
  const saveCard = async (rawCardNumber: string, validThru: string) => {
    // Get the latest session directly to avoid stale userId state
    const { data: sessionData } = await supabase.auth.getSession();
    const uid = sessionData.session?.user?.id;

    if (!uid) {
      console.warn("[useSavedCards] saveCard called but no user is logged in");
      return;
    }

    // If already masked (e.g. auto-filled from saved card), don't save again
    const cleaned = rawCardNumber.replace(/[\s*]/g, "");
    if (cleaned.length < 4) {
      console.warn("[useSavedCards] card number too short, skipping save");
      return;
    }

    const masked = `**** **** **** ${cleaned.slice(-4)}`;
    const card_type: "visa" | "mastercard" = cleaned.startsWith("4")
      ? "visa"
      : "mastercard";

    // Avoid duplicate cards with the same last 4 digits + valid_thru
    const isDuplicate = cards.some(
      (c) =>
        c.card_number_masked === masked && c.valid_thru === validThru
    );
    if (isDuplicate) {
      console.log("[useSavedCards] card already saved, skipping");
      return;
    }

    const { data, error } = await supabase
      .from("saved_cards")
      .insert({
        user_id: uid,
        card_number_masked: masked,
        valid_thru: validThru,
        card_type,
      })
      .select()
      .single();

    if (error) {
      console.error("[useSavedCards] insert error:", error.message, error);
      return;
    }

    if (data) {
      setCards((prev) => [data as SavedCard, ...prev]);
      console.log("[useSavedCards] card saved:", masked);
    }
  };

  const deleteCard = async (cardId: string) => {
    const { error } = await supabase
      .from("saved_cards")
      .delete()
      .eq("id", cardId);

    if (!error) {
      setCards((prev) => prev.filter((c) => c.id !== cardId));
    }
  };

  return { cards, saveCard, deleteCard, loading };
}
