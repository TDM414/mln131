# Dispatch Log

## 2026-10-19T11:40:23Z
Sender: d7067d44-8697-49c8-a932-46226a1b983c
Priority: MESSAGE_PRIORITY_HIGH

Content:
You are the Project Orchestrator for the project "NETIZEN PARTY: ĐẠI HỘI DÂN MẠNG (MLN131 Edition)".

Your working directory:
C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\.agents\teamwork\orchestrator_1

Project root directory:
C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131

Original Request file:
C:\Users\duyma\.gemini\antigravity\scratch\democracy-raid-mln131\ORIGINAL_REQUEST.md

Please read ORIGINAL_REQUEST.md thoroughly. Execute the project according to all requirements:
1. Game Show 4-round tournament & free-play structure (R1).
2. Visual identity & Gen Z party tone (R2).
3. Sound system with arcade & meme SFX (R3).
4. Architecture & Vercel / Local LAN compatibility with Next.js & Dev Bot Simulator (R4).
5. Strictly adhere to the Asset & Visual Pipeline priority:
   - Priority 1: Download from web (Lucide, OpenGameArt, Freesound, Flaticon open assets, Google Fonts).
   - Priority 2: Gen AI if no matching context memes.
   - Priority 3: Code (Canvas 2D, SVG, Tailwind animations).
   - Priority 4: Report if blocked.

Maintain your progress.md and BRIEFING.md in your working directory. Regularly update progress.md so progress can be monitored. When complete, provide your handoff report and notify the sentinel.

## 2026-10-19T13:19:41Z
Sender: d7067d44-8697-49c8-a932-46226a1b983c
Priority: MESSAGE_PRIORITY_HIGH

Content:
### URGENT DIRECTIVE FROM USER / PARENT AGENT
A new architectural requirement has been submitted by the user and appended to `ORIGINAL_REQUEST.md`:

**User Directive**:
"không phải là chung 1 lần chơi mà mỗi cái là một mode game ấy host chọn để bắt đầu game ấy"

**Architectural Requirements**:
1. **Independent Modes (Non-Linear)**: Do NOT force a single linear 4-round tournament sequence. Structure the entire platform as a **Party Game Hub** with 4 completely standalone Game Modes (analogous to Jackbox Party Pack / Mario Party):
   - **Mode 1**: "Đại Hội Cà Khịa & Check VAR" (Jackbox Quiplash)
   - **Mode 2**: "Chiến Binh 5 Giây Dị Hợm" (WarioWare)
   - **Mode 3**: "Vạch Mặt Seeder & Check VAR" (Social Deduction)
   - **Mode 4**: "Đấu Trường Chơi Xấu Cướp Điểm" (Sabotage Trivia)
2. **Host Hub Selection**: The Host in the main lobby (`HostLobby`) can click and launch any mode directly for the entire room.
3. **Return to Hub Flow**: When a mode finishes, display podium/celebration, accompanied by an explicit **"Quay Về Sảnh Chính (Return to Hub)"** button for the Host to return everyone to the hub to choose another mode.
4. **Persistent Player Connection**: Mobile clients on phones MUST maintain persistent session/WebSocket/polling connection across mode switches (no QR re-scanning, no PIN re-entry). The mobile client UI must automatically adapt and switch screens dynamically based on the mode activated by the Host.
5. **Project Alignment**: Immediately incorporate this directive into `PROJECT.md`, align your state models (`GameShowState`, `GameMode`), and instruct your subagents/workers accordingly.
