import Link from "next/link";

export default function Footer() {
  return (
    <footer className="relative z-10 bg-[#000814] border-t border-white/5 text-white font-sans mb-20 md:mb-0">
      <div className="max-w-7xl mx-auto px-6 md:px-10 py-10 md:py-14">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-10">
          {/* Brand */}
          <div className="col-span-2 md:col-span-1">
            <h2 className="text-xl font-black italic tracking-tight uppercase mb-3">
              <span className="bg-gradient-to-r from-cyan-400 via-blue-500 to-cyan-600 bg-clip-text text-transparent">OCEAN </span>
              <span className="text-white">TIX</span>
            </h2>
            <p className="text-xs text-slate-400 leading-relaxed mb-4 max-w-[200px]">
              Platform tiket bioskop online terbaik dengan pengalaman nonton yang tak terlupakan.
            </p>
          </div>

          {/* Jelajahi */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Jelajahi</p>
            <ul className="space-y-2.5">
              {[
                { label: "Film", href: "/film" },
                { label: "Bioskop", href: "/cinemas" },
                { label: "Promo", href: "/promo" },
                { label: "Tiket Saya", href: "/tickets" },
              ].map(({ label, href }) => (
                <li key={href}>
                  <Link href={href} className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Bantuan */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Bantuan</p>
            <ul className="space-y-2.5">
              {[
                { label: "Kebijakan Privasi", href: "/profile?modal=policy" },
                { label: "FAQ", href: "/profile?modal=help" },
                { label: "Notifikasi", href: "/notifications" },
                { label: "Profil", href: "/profile" },
              ].map(({ label, href }) => (
                <li key={label}>
                  <Link href={href} className="text-xs text-slate-400 hover:text-cyan-400 transition-colors font-medium">
                    {label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Kontak */}
          <div>
            <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-4">Kontak</p>
            <ul className="space-y-2.5 text-xs text-slate-400">
              <li>+62 856-9353-1306</li>
              <li>Open All The Times! (24/7)</li>
            </ul>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/5 pt-6 flex flex-col md:flex-row items-center justify-between gap-3">
          <p className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">
            © 2026 OceanTix. All rights reserved.
          </p>
          <div className="flex items-center gap-4">
            <span className="text-[10px] text-slate-600 font-bold uppercase tracking-widest">v2.0.0</span>
            <span className="text-[10px] text-slate-600">Made with 🌊</span>
          </div>
        </div>
      </div>
    </footer>
  );
}
