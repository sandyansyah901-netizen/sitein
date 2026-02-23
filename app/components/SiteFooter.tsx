export default function SiteFooter() {
  return (
    <footer className="bg-[#f8f8f8] dark:bg-[#0a0a0a] mt-6">
      {/* App download banner */}
      <div className="bg-gradient-to-r from-purple-600 to-indigo-600 dark:from-[#E50914] dark:to-[#8b0000] py-5">
        <div className="max-w-[1200px] mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div>
            <p className="text-white font-bold text-[15px]">Read anytime, anywhere</p>
            <p className="text-white/80 text-[12px] mt-0.5">Download the Sitein app for the best experience</p>
          </div>
          <div className="flex gap-2">
            <button className="bg-black text-white text-[12px] font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors">
              Google Play
            </button>
            <button className="bg-black text-white text-[12px] font-semibold px-4 py-2 rounded-lg hover:bg-gray-900 transition-colors">
              App Store
            </button>
          </div>
        </div>
      </div>

      {/* Links */}
      <div className="max-w-[1200px] mx-auto px-4 py-6">
        <div className="flex flex-wrap gap-x-6 gap-y-2 justify-center mb-4">
          {["About Us", "Terms of Service", "Privacy Policy", "DMCA", "Contact Us"].map((item) => (
            <span
              key={item}
              className="text-[12px] text-gray-500 dark:text-gray-500 hover:text-[#E50914] cursor-pointer transition-colors"
            >
              {item}
            </span>
          ))}
        </div>
        <p className="text-center text-[11px] text-gray-400 dark:text-gray-600">
          © {new Date().getFullYear()} Sitein Entertainment Corp. All rights reserved.
        </p>
      </div>
    </footer>
  );
}
