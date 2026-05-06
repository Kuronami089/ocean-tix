export interface Theater {
  id: number;
  name: string;
  city: string;
  type: string;
  price2D: number;
  price3D: number;
  distance: number;
  hasPremiere?: boolean;
}

export const DUMMY_THEATERS: Theater[] = [
  // TASIKMALAYA
  { id: 1, name: "TASIK XXI", city: "Tasikmalaya", type: "XXI", price2D: 35000, price3D: 50000, distance: 2.5 },
  { id: 2, name: "TRANSMART TASIKMALAYA XXI", city: "Tasikmalaya", type: "XXI", price2D: 40000, price3D: 55000, distance: 4.8 },
  { id: 3, name: "CGV PASAR ASIA", city: "Tasikmalaya", type: "CGV", price2D: 30000, price3D: 45000, distance: 1.2 },
  // BEKASI
  { id: 4, name: "CIPLAZ CIBITUNG XXI", city: "Bekasi", type: "XXI", price2D: 35000, price3D: 50000, distance: 3.5 },
  { id: 5, name: "CIPUTRA CIBUBUR XXI", city: "Bekasi", type: "XXI", price2D: 40000, price3D: 60000, distance: 2.1, hasPremiere: true },
  { id: 6, name: "COURTS KHI XXI", city: "Bekasi", type: "XXI", price2D: 35000, price3D: 50000, distance: 5.2 },
  { id: 7, name: "CGV GRAND METROPOLITAN", city: "Bekasi", type: "CGV", price2D: 40000, price3D: 55000, distance: 1.8 },
  // TANGERANG SELATAN
  { id: 8, name: "BINTARO XCHANGE XXI", city: "Tangerang Selatan", type: "XXI", price2D: 50000, price3D: 75000, distance: 3.1 },
  { id: 9, name: "LOTTE BINTARO CGV", city: "Tangerang Selatan", type: "CGV", price2D: 45000, price3D: 60000, distance: 0.5 },
  { id: 10, name: "ALAM SUTERA XXI", city: "Tangerang Selatan", type: "XXI", price2D: 50000, price3D: 70000, distance: 4.2, hasPremiere: true },
  // JAKARTA
  { id: 11, name: "GRAND INDONESIA XXI", city: "Jakarta", type: "XXI", price2D: 60000, price3D: 80000, distance: 1.5 },
  { id: 12, name: "PLAZA SENAYAN XXI", city: "Jakarta", type: "XXI", price2D: 75000, price3D: 100000, distance: 2.8, hasPremiere: true },
  { id: 13, name: "CGV GRAND INDONESIA", city: "Jakarta", type: "CGV", price2D: 55000, price3D: 75000, distance: 1.6 },
  { id: 14, name: "EPICENTRUM XXI", city: "Jakarta", type: "XXI", price2D: 60000, price3D: 85000, distance: 3.0 },
  // BANDUNG
  { id: 15, name: "PARIS VAN JAVA XXI", city: "Bandung", type: "XXI", price2D: 45000, price3D: 65000, distance: 2.2 },
  { id: 16, name: "FESTIVAL CITYLINK XXI", city: "Bandung", type: "XXI", price2D: 40000, price3D: 55000, distance: 1.8 },
  { id: 17, name: "CGV TRANS STUDIO BANDUNG", city: "Bandung", type: "CGV", price2D: 50000, price3D: 70000, distance: 3.5, hasPremiere: true },
  { id: 18, name: "BIP XXI", city: "Bandung", type: "XXI", price2D: 40000, price3D: 55000, distance: 0.8 },
  // SURABAYA
  { id: 19, name: "GALAXY XXI", city: "Surabaya", type: "XXI", price2D: 45000, price3D: 65000, distance: 3.0 },
  { id: 20, name: "TUNJUNGAN PLAZA XXI", city: "Surabaya", type: "XXI", price2D: 50000, price3D: 70000, distance: 1.5, hasPremiere: true },
  { id: 21, name: "CGV PAKUWON TRADE CENTER", city: "Surabaya", type: "CGV", price2D: 45000, price3D: 60000, distance: 2.8 },
  // YOGYAKARTA
  { id: 22, name: "JOGJA CITY MALL XXI", city: "Yogyakarta", type: "XXI", price2D: 35000, price3D: 50000, distance: 4.5 },
  { id: 23, name: "HARTONO MALL XXI", city: "Yogyakarta", type: "XXI", price2D: 40000, price3D: 55000, distance: 2.1 },
  { id: 24, name: "CGV AMBARUKMO PLAZA", city: "Yogyakarta", type: "CGV", price2D: 40000, price3D: 55000, distance: 3.2 },
  // MEDAN
  { id: 25, name: "SUN PLAZA XXI", city: "Medan", type: "XXI", price2D: 40000, price3D: 55000, distance: 1.5 },
  { id: 26, name: "CGV MALL OLIMPIA PARK", city: "Medan", type: "CGV", price2D: 45000, price3D: 60000, distance: 2.8 },
  // SEMARANG
  { id: 27, name: "PARAGON XXI", city: "Semarang", type: "XXI", price2D: 40000, price3D: 55000, distance: 2.0 },
  { id: 28, name: "CGV JAVA SUPERMALL", city: "Semarang", type: "CGV", price2D: 35000, price3D: 50000, distance: 3.1 },
  // MALANG
  { id: 29, name: "MALANG TOWN SQUARE XXI", city: "Malang", type: "XXI", price2D: 35000, price3D: 50000, distance: 1.8 },
  { id: 30, name: "CGV MALANG CITY POINT", city: "Malang", type: "CGV", price2D: 40000, price3D: 55000, distance: 2.5 },
  // DEPOK
  { id: 31, name: "MARGO CITY XXI", city: "Depok", type: "XXI", price2D: 45000, price3D: 60000, distance: 1.2 },
  { id: 32, name: "CGV CINEMAXX DEPOK", city: "Depok", type: "CGV", price2D: 40000, price3D: 55000, distance: 2.8 },
  // BOGOR
  { id: 33, name: "BOTANI SQUARE XXI", city: "Bogor", type: "XXI", price2D: 40000, price3D: 55000, distance: 1.5 },
  { id: 34, name: "CGV BOGOR TRADE MALL", city: "Bogor", type: "CGV", price2D: 35000, price3D: 50000, distance: 3.0 },
];

export const CITIES = [
  "Tasikmalaya",
  "Bekasi",
  "Tangerang Selatan",
  "Jakarta",
  "Bandung",
  "Surabaya",
  "Yogyakarta",
  "Medan",
  "Semarang",
  "Malang",
  "Depok",
  "Bogor",
];

export const GENRE_MAP: { [key: number]: string } = {
  28: "Action",
  12: "Adventure",
  16: "Animation",
  35: "Comedy",
  80: "Crime",
  99: "Documentary",
  18: "Drama",
  10751: "Family",
  14: "Fantasy",
  36: "History",
  27: "Horror",
  10402: "Music",
  9648: "Mystery",
  10749: "Romance",
  878: "Science Fiction",
  10770: "TV Movie",
  53: "Thriller",
  10752: "War",
  37: "Western",
};

export interface Ticket {
  id: string;
  status: "active" | "past";
  movie: {
    title: string;
    poster_path: string;
  };
  theater: Theater;
  date: string;
  time: string;
  seatCount: number;
  seats: string[];
  bookingCode: string;
  passKey: string;
  orderNumber: string;
  price: number;
  serviceFee: number;
  paymentMethod: string;
  format: string;
  audi: string;
  timestamp?: number;
  movieId?: string; // TMDB numeric ID — for real-time seat filtering
}

export const DUMMY_TICKETS: Ticket[] = [];
