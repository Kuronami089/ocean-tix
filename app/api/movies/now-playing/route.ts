import { NextResponse } from "next/server";

export async function GET() {
  const API_KEY = "1a82e830e599746ce2f5636d396471ab";

  // Tambahkan region=ID agar film yang sedang tayang di bioskop Indonesia muncul
  // Kita hapus language=en-US agar judul asli Indonesia tidak berubah jadi Inggris
  const TMDB_URL = `https://api.themoviedb.org/3/movie/now_playing?api_key=${API_KEY}&region=ID&page=1`;

  try {
    const response = await fetch(TMDB_URL);
    const data = await response.json();

    // Opsional: Urutkan berdasarkan popularitas agar yang paling baru di depan
    if (data.results) {
      data.results.sort((a: any, b: any) => b.popularity - a.popularity);
    }

    return NextResponse.json(data);
  } catch (error) {
    return NextResponse.json({ results: [] }, { status: 500 });
  }
}
