# YOUR DAY IS DYING (YDID)

> **Time won't wait.**  
> *Watch your day disappear in real time.*

A production-quality desktop productivity and time-awareness instrument built with **Tauri v2**, **Rust**, **React**, **TypeScript**, **SQLite**, **Tailwind CSS**, and **Manifest V3 Chrome Extension**.

---

## 💀 Product Identity & Core Philosophy

**YOUR DAY IS DYING** is not a generic Pomodoro timer or cheerful screen-time tracker. It does not preach, motivate, or gamify your life with streaks and confetti.

Instead, it functions as a **physical time-monitoring instrument**:
```
TIME PASSES → ACTIVITY IS TRACKED → THE DAY SHRINKS → NOTIFICATION INTERRUPTS → USER BECOMES AWARE → USER CHANGES BEHAVIOR
```

The central visual metaphor is a **health bar for today's remaining time**:
```text
YOUR DAY

19:42

████████████████░░░░░░░░
          72%

4h 18m REMAINING
```

---

## ⚡ Tech Stack & Architecture

- **Desktop Framework**: [Tauri v2](https://tauri.app/) (Rust + Webview)
- **Frontend**: React 19 + TypeScript + Vite + Tailwind CSS
- **Styling Architecture**: Hybrid **Neobrutalism** (structure, borders, hard offset shadows, high contrast) × **Neomorphism** (tactile depth, sunken displays, pressed controls)
- **Audio Engine**: Zero-dependency procedural Web Audio API synthesizer for mechanical clock ticks, sub-bass distraction hits, clean focus clicks, warning pulses, and atmospheric end-of-day tones.
- **Local Storage**: Embedded SQLite database (`rusqlite`) in WAL mode.
- **Desktop Window Tracking**: Native Windows Win32 API (`GetForegroundWindow`, `GetWindowTextW`, `QueryFullProcessImageNameW`).
- **Idle Detection**: Native `GetLastInputInfo` hardware tick tracking.
- **Browser Tracking**: Chrome / Chromium Manifest V3 extension communicating directly with the desktop app's local bridge on `http://127.0.0.1:41832`.
- **Zero Cloud / 100% Privacy**: No user accounts, no telemetry, no keystrokes, no screenshots, no passwords. All data remains strictly local on your machine.

---

## 🚀 Getting Started

### Prerequisites
- [Node.js](https://nodejs.org/) (v18+)
- [Rust & Cargo](https://rustup.rs/) (v1.75+)
- Windows 10/11 (or macOS / Linux with stub tracker)

### 1. Install Dependencies
```bash
npm install
```

### 2. Run in Desktop Dev Mode (Tauri)
```bash
npm run tauri dev
```

### 3. Run Web / Frontend Preview
```bash
npm run dev
```
Open `http://localhost:1420/` in your browser. The application includes a high-fidelity simulator that models active sessions and live time status when opened outside the Tauri native container.

### 4. Build Production Desktop Binary
```bash
npm run tauri build
```
The compiled executable will be located in `src-tauri/target/release/YOUR DAY IS DYING.exe`.

---

## 🌐 Chrome / Chromium Extension Setup

The browser extension tracks active tab domains (e.g. `youtube.com`, `github.com`) and reports durations directly to your local desktop app over port `41832`.

1. Open Chrome, Edge, or Brave and navigate to `chrome://extensions/`.
2. Enable **Developer mode** (toggle in top right).
3. Click **Load unpacked**.
4. Select the `extension/` folder in this repository (`d:\Productive_project\extension`).
5. Pin the **YDID** icon in your browser toolbar. Clicking it displays connection status to the desktop app and the current active domain.

---

## 🎛 Key Features

1. **Physical Countdown Instrument**:
   - Massive monospaced countdown `HH:MM:SS REMAINING` with recessed tactile depth.
   - Striped fuel gauge life bar showing percentage of today elapsed.
   - Escalating Day Messages at critical thresholds (`THE DAY HAS STARTED` → `HALF YOUR DAY IS GONE` → `YOUR DAY IS DYING` → `YOU DON'T HAVE MUCH LEFT` → `TODAY IS DEAD`).

2. **Always-On-Top Floating Widget Mode**:
   - One-click transformation (`WIDGET` button in header or system tray).
   - Minimal tactile desktop instrument showing current time, mini health bar, remaining hours, and active window.
   - Expands automatically into a warning banner when a notification triggers.
   - Draggable, resizable, and sits above all applications.

3. **Context-Aware Signature Interruption Engine**:
   - Periodic reminders (15m, 30m, 45m, 60m).
   - Analyzes activity within that specific interval:
     - **Productive Interval**: *"30 MINUTES GONE. You spent them coding. Keep going."*
     - **Distraction Interval**: *"30 MINUTES GONE. YouTube took 27 of them."*
     - **App Switching**: *"WHERE DID YOU GO? 7 apps. 30 minutes."*
     - **Deep Focus**: *"TIME PASSED. 48 minutes of uninterrupted work. Keep going."*
     - **Idle / Away**: *"THE CLOCK DIDN'T STOP. You were away for 30 minutes."*
     - **Mixed Activity**: *"30 MINUTES GONE. 12m coding, 11m YouTube, 7m browsing. Where did it go?"*

4. **Time Debt & Repayment Ledger**:
   - Surrendering time to distractions accumulates debt (`HH:MM:SS`).
   - Repay debt through focused work blocks (`[ FOCUS 25 MIN ]`, `[ FOCUS 50 MIN ]`).

5. **Opportunity Cost Calculation**:
   - Enter your estimated hourly rate (e.g. ₹300/hr or $50/hr).
   - Real-time calculation of estimated economic potential lost to distractions.

6. **Focus Mode Console**:
   - Dedicated countdown timer and session goal monitor.
   - Distraction detector alert: if you switch to YouTube or a distracting app during a focus session, an alert triggers asking: *"YOU LEFT FOCUS. Return?"*

7. **Today's Timeline**:
   - Chronological ribbon of your day with category color bars (Productive, Neutral, Distraction, Idle).
   - Hover inspection displaying exact start/end timestamps, duration, app name, and window title.
   - Filter by category.

8. **Weekly Rolling Analytics**:
   - 7-day Monday through Sunday breakdown.
   - Best Day highlight (e.g. *Tuesday: 6h 42m productive*).
   - Biggest Time Sink callout (e.g. *YouTube: 5h 13m this week*).

9. **Understated End-of-Day Report**:
   - Summarizes active time, productive time, and distractions without cheerleading, confetti, or artificial streaks.
   - Closes with: *"Tomorrow starts fresh. Don't waste it."*

10. **Classification Rules & Overrides**:
    - Manage rules for both `.exe` applications and web domains.
    - Reclassify any domain or software as Productive, Neutral, or Distraction.
