"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface LocationContextType {
  selectedCity: string;
  setSelectedCity: (city: string) => void;
}

const LocationContext = createContext<LocationContextType | undefined>(undefined);

export function LocationProvider({ children }: { children: React.ReactNode }) {
  const [selectedCity, setSelectedCity] = useState("Bekasi"); // Default to Bekasi as per user request

  // Optional: Load from localStorage
  useEffect(() => {
    const savedCity = localStorage.getItem("selectedCity");
    if (savedCity) {
      setSelectedCity(savedCity);
    }
  }, []);

  const handleSetCity = (city: string) => {
    setSelectedCity(city);
    localStorage.setItem("selectedCity", city);
  };

  return (
    <LocationContext.Provider value={{ selectedCity, setSelectedCity: handleSetCity }}>
      {children}
    </LocationContext.Provider>
  );
}

export function useLocation() {
  const context = useContext(LocationContext);
  if (context === undefined) {
    throw new Error("useLocation must be used within a LocationProvider");
  }
  return context;
}
