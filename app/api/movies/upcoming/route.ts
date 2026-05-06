import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = "1a82e830e599746ce2f5636d396471ab";
  // Pake endpoint 'upcoming' dan region 'ID' biar relevan sama jadwal rilis di Indonesia
  const TMDB_URL = `https://api.themoviedb.org/3/movie/upcoming?api_key=${API_KEY}&region=ID`;

  try {
    const response = await fetch(TMDB_URL);
    const data = await response.json();
    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}