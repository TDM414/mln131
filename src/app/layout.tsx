import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = {
  title: 'Democracy Raid: MLN131 - Đại Chiến Không Gian Số',
  description: 'Game Co-op 50 người săn Boss thời gian thực - Chủ đề Dân chủ Xã hội Chủ nghĩa & Truyền thông số',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="vi">
      <body className="antialiased bg-cyber-dark text-white selection:bg-cyber-red selection:text-white">
        {children}
      </body>
    </html>
  );
}
