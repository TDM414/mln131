import Link from 'next/link';
import { NETIZEN_AVATARS } from '../data/memeAvatars';
import {
  Tv,
  Smartphone,
  Trophy,
  Zap,
  ArrowRight,
  Flame,
  Users,
  Sparkles,
} from 'lucide-react';

export default function Home() {
  const avatars = NETIZEN_AVATARS;

  return (
    <main className="min-h-screen bg-[#0B0F19] text-white flex flex-col items-center justify-between p-6 max-w-6xl mx-auto select-none font-sans">
      {/* 1. HERO TITLE */}
      <div className="text-center pt-8 pb-4">
        <div className="inline-flex items-center gap-2 bg-cyber-yellow border-3 border-black px-4 py-1.5 rounded-full text-xs font-black text-black tracking-widest uppercase mb-4 shadow-[3px_3px_0px_#000] animate-pulse">
          ⚡ MÔN HỌC MLN131 • CHỦ ĐỀ DÂN CHỦ XHCN & TRUYỀN THÔNG SỐ ⚡
        </div>
        <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-white mb-2">
          NETIZEN <span className="text-cyber-yellow underline decoration-black">PARTY</span>
        </h1>
        <p className="text-xl sm:text-2xl font-black text-cyber-cyan tracking-wide uppercase">
          ĐẠI HỘI DÂN MẠNG (MLN131 EDITION)
        </p>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl mx-auto mt-2 leading-relaxed">
          Nền tảng Game Show tương tác thời gian thực cho lớp học (Host máy chiếu + 40-50 mobile client).
          Giải đấu 4 vòng dồn dập, âm thanh bựa, văn phong Gen Z châm biếm thông minh!
        </p>
      </div>

      {/* 2. CHOOSE ROLE (HOST vs PLAYER) */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-3xl my-4">
        {/* Host Screen Card */}
        <Link
          href="/host"
          className="group relative bg-cyber-card border-4 border-black hover:border-cyber-yellow rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[8px_8px_0px_#000] hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-cyber-yellow border-3 border-black flex items-center justify-center text-black mb-4 shadow-[3px_3px_0px_#000] group-hover:scale-110 transition">
              <Tv className="w-7 h-7" />
            </div>
            <div className="text-[11px] font-black uppercase text-cyber-yellow tracking-wider mb-1">
              DÀNH CHO GIẢNG VIÊN / BAN TỔ CHỨC
            </div>
            <h2 className="text-2xl font-black text-white group-hover:text-cyber-yellow transition">
              MÀN HÌNH MÁY CHIẾU (HOST)
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Mở trên Laptop kết nối máy chiếu phòng học (16:9). Điều khiển giải đấu 4 vòng, tạo mã QR, phát nhạc nền 128 BPM và chạy luồng Danmaku trực tiếp.
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-black text-cyber-yellow">
            <span>Mở Đấu Trường Máy Chiếu</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
          </div>
        </Link>

        {/* Mobile Player Card */}
        <Link
          href="/play?room=MLN131"
          className="group relative bg-cyber-card border-4 border-black hover:border-cyber-cyan rounded-3xl p-7 flex flex-col justify-between transition-all duration-300 hover:shadow-[8px_8px_0px_#000] hover:-translate-y-1 cursor-pointer"
        >
          <div>
            <div className="w-14 h-14 rounded-2xl bg-cyber-cyan border-3 border-black flex items-center justify-center text-black mb-4 shadow-[3px_3px_0px_#000] group-hover:scale-110 transition">
              <Smartphone className="w-7 h-7" />
            </div>
            <div className="text-[11px] font-black uppercase text-cyber-cyan tracking-wider mb-1">
              DÀNH CHO 40-50 SINH VIÊN
            </div>
            <h2 className="text-2xl font-black text-white group-hover:text-cyber-cyan transition">
              ĐIỆN THOẠI CHIẾN SĨ (PLAY)
            </h2>
            <p className="text-xs text-slate-400 mt-2 leading-relaxed">
              Giao diện tối ưu 1 ngón tay chạm (100dvh). Chọn 1 trong 10 Persona Netizen, nhập câu cà khịa, phản xạ mini-game 5s, và tung thẻ bài cướp điểm!
            </p>
          </div>

          <div className="mt-6 flex items-center gap-2 text-sm font-black text-cyber-cyan">
            <span>Vào Đại Hội (PIN: MLN131)</span>
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1.5 transition" />
          </div>
        </Link>
      </div>

      {/* 3. SHOWCASE 10 NETIZEN PERSONA AVATARS */}
      <div className="w-full max-w-4xl bg-cyber-card border-4 border-black rounded-3xl p-5 my-3 shadow-[6px_6px_0px_#000]">
        <div className="flex items-center justify-between mb-3 px-2">
          <span className="text-xs font-black text-cyber-yellow uppercase tracking-widest flex items-center gap-1.5">
            <Sparkles className="w-4 h-4 fill-cyber-yellow" /> 10 PERSONA DÂN MẠNG ĐỘC QUYỀN
          </span>
          <span className="text-[11px] text-slate-400 font-bold">100% Vector SVG không phụ thuộc mạng</span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5">
          {avatars.map((av) => {
            const AvatarSvg = av.SvgComponent;
            return (
              <div
                key={av.id}
                className="bg-slate-900 border-2 border-black rounded-2xl p-2.5 flex flex-col items-center text-center shadow-[2px_2px_0px_#000] hover:scale-105 transition"
              >
                <div className="w-12 h-12 rounded-xl bg-black flex items-center justify-center mb-1.5 overflow-hidden">
                  <AvatarSvg size={44} />
                </div>
                <div className="text-[11px] font-black text-white leading-tight truncate w-full">
                  {av.name}
                </div>
                <div className="text-[9px] text-cyber-yellow font-bold truncate w-full mt-0.5">
                  {av.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* 4. FOOTER */}
      <footer className="text-center text-xs text-slate-500 py-3">
        Đồ án Game Show môn Chủ nghĩa Xã hội Khoa học & Truyền thông số • Sẵn sàng 1-click deploy lên Vercel
      </footer>
    </main>
  );
}
