# 📖 YOUR DAY IS DYING (YDID) — Complete User Guide & Manual

> **Personal Time-Monitoring Instrument**  
> *"Time won't wait. Make the passage of time physically real."*

---

## 📑 Table of Contents

1. [Introduction & Interface Overview](#1-introduction--interface-overview)
2. [Setting Timers & Schedules](#2-setting-timers--schedules)
   - [2.1 Configuring Day Boundaries (Daily Countdown Timer)](#21-configuring-day-boundaries-daily-countdown-timer)
   - [2.2 Starting a Deep Work Focus Timer](#22-starting-a-deep-work-focus-timer)
   - [2.3 Setting Interruption & Reminder Frequency](#23-setting-interruption--reminder-frequency)
   - [2.4 Setting the Idle Inactivity Threshold](#24-setting-the-idle-inactivity-threshold)
3. [Customizing Activity Categorization Rules](#3-customizing-activity-categorization-rules)
   - [3.1 How Activity Classification Works](#31-how-activity-classification-works)
   - [3.2 Adding Desktop Application Rules](#32-adding-desktop-application-rules)
   - [3.3 Adding Website Domain Rules](#33-adding-website-domain-rules)
   - [3.4 Modifying and Removing Rules](#34-modifying-and-removing-rules)
4. [Customizing Financial & Opportunity Cost Settings](#4-customizing-financial--opportunity-cost-settings)
5. [Procedural Sound Engine Configuration](#5-procedural-sound-engine-configuration)
6. [Windows Desktop & Floating HUD Settings](#6-windows-desktop--floating-hud-settings)
   - [6.1 Start with Windows (Automatic Startup)](#61-start-with-windows-automatic-startup)
   - [6.2 Using the Independent Floating Desktop HUD](#62-using-the-independent-floating-desktop-hud)
   - [6.3 Windows System Tray Controls & Application Lifecycle](#63-windows-system-tray-controls--application-lifecycle)
7. [Privacy, Data Export & Database Management](#7-privacy-data-export--database-management)
8. [Quick Reference & Troubleshooting](#8-quick-reference--troubleshooting)

---

## 1. Introduction & Interface Overview

**YOUR DAY IS DYING (YDID)** operates as a dedicated two-window desktop instrument:

```text
┌────────────────────────────────────────────────────────┐
│  MAIN COMMAND DASHBOARD                                │
│  - Full countdown hero, health bar & live process      │
│  - 4-category metrics grid (Productive, Distraction,…) │
│  - Time Debt & Opportunity Cost ledger                 │
│  - Interactive 24-hour timeline ribbon                 │
│  - 7-day rolling report & biggest sinks                │
└────────────────────────────────────────────────────────┘
                           ▲
                           │ Shared Local SQLite Core (127.0.0.1:41832)
                           ▼
┌──────────────────────────────────────┐
│  INDEPENDENT FLOATING HUD WIDGET     │
│  - Always-on-top desktop overlay     │
│  - Draggable anywhere over any app   │
│  - Stays alive when dashboard closes │
│  - Pill mode & quick focus launcher  │
└──────────────────────────────────────┘
```

### The Control Bar (Header)
Located at the top of the Main Dashboard:
- **`TRACKING ACTIVE / PAUSED`**: Live background tracking status badge.
- **`[ PAUSE / RESUME ]`**: Immediately halt or restart the 1-second background tracking loop.
- **`[ FOCUS ]`**: Launches the dedicated deep focus countdown modal.
- **`[ INTERRUPT ]`**: Tests the context-aware periodic notification engine.
- **`[ REPORT ]`**: Opens the honest End-of-Day summary.
- **`[ HUD WIDGET ]`**: Toggles visibility of the independent floating native desktop HUD.
- **`⚙ (Gear Icon)`**: Opens the full Control Panel & Configuration modal.

---

## 2. Setting Timers & Schedules

### 2.1 Configuring Day Boundaries (Daily Countdown Timer)

The central physical countdown instrument and health bar are **not** tied to arbitrary 24-hour clocks. They are calibrated precisely to your working/waking hours.

```text
[ 06:00 AM ] ────────────────────── [ NOW ] ────────────────────── [ 12:00 AM ]
  Day Start                              Remaining Time              Day End
```

#### How to customize your day boundaries:
1. Open the Main Dashboard.
2. Click the **⚙ Settings** button in the top-right header.
3. Select the **`GENERAL`** tab.
4. Locate the **Day Boundaries** section:
   - **`Day Starts At`**: Enter or pick your wake-up/work start time (e.g., `06:00`, `08:30`, or `10:00`).
   - **`Day Ends At`**: Enter or pick your target end-of-day/sleep time (e.g., `00:00`, `23:00`, or `02:00` for night owls).
5. Click **`SAVE CHANGES`**.

#### Escalating Severity Stages:
As your day ticks down, the status banner automatically escalates based on elapsed percentage:

| Elapsed % | Severity Level | Visual Cue | Status Message |
|:---:|:---:|:---:|:---|
| **0% – 24%** | Normal | Emerald `#10b981` | *"THE DAY HAS STARTED."* |
| **25% – 49%** | Normal | Emerald `#10b981` | *"THE DAY IS SLIPPING AWAY."* |
| **50% – 69%** | Half-Day | Amber `#f59e0b` | *"HALF YOUR DAY IS GONE."* |
| **70% – 84%** | Dying | Amber `#f59e0b` | *"YOUR DAY IS DYING."* |
| **85% – 94%** | Critical | Red `#ef4444` (pulsing) | *"YOU DON'T HAVE MUCH LEFT."* |
| **95% – 99%** | Critical | Red `#ef4444` (pulsing) | *"THIS IS ALMOST OVER."* |
| **100%** | Dead | Dark Crimson | *"TODAY IS DEAD."* |

---

### 2.2 Starting a Deep Work Focus Timer

Focus Mode runs an uninterrupted countdown session designed to shield you from distraction and repay accumulated **Time Debt**.

#### How to start a focus session:
1. Click the **`FOCUS`** button in the Header, on the HUD widget, or inside the **Time Debt Panel**.
2. Select your target duration preset:
   - **15 Minutes**: Quick burst execution
   - **25 Minutes**: Standard Pomodoro-length sprint *(Default)*
   - **45 Minutes**: Extended deep work block
   - **60 Minutes**: Monastic execution session
3. Enter an optional **Session Objective** (e.g. *"Finish Rust backend tests"*).
4. Click **`BEGIN FOCUS SESSION`**.

#### During the session:
- The dial shows remaining minutes and seconds in real-time.
- **Distraction Warning Shield**: If you switch to an application or browser tab tagged as `distraction` (e.g. YouTube, Twitter, Reddit), the modal cavity flashes red and plays a sharp distraction hit warning.
- **Time Debt Repayment**: When the timer finishes, your entire focus duration is automatically deducted from your accumulated **Time Debt**, restoring your balance.

---

### 2.3 Setting Interruption & Reminder Frequency

YDID periodically interrupts you with a short sound and a contextual drawer that summarizes how you spent the last time block (e.g., *"30 MINUTES GONE. YouTube took 27 of them."*).

#### How to adjust interruption intervals:
1. Open **⚙ Settings** → **`NOTIFICATIONS`** tab.
2. Under **Interruption Frequency**, choose your interval:
   - **`15m`**: Aggressive accountability for high-distraction periods.
   - **`30m`**: Balanced cadence *(Recommended Default)*.
   - **`45m`**: Medium deep work rhythm.
   - **`60m`**: Minimal interruption schedule.
3. Click **`SAVE CHANGES`**.

---

### 2.4 Setting the Idle Inactivity Threshold

YDID distinguishes between active computer usage and when you step away from your desk (for meals, phone calls, or breaks).

#### How to set the idle threshold:
1. Open **⚙ Settings** → **`GENERAL`** tab.
2. Locate the **Idle Inactivity Threshold** slider.
3. Drag the slider to your desired cutoff:
   - **`1 minute`**: Strict idle detection (stops tracking immediately upon leaving).
   - **`5 minutes`**: Standard desktop default *(Recommended)*.
   - **`15 minutes`**: For users who do extensive reading without typing/mousing.
4. Click **`SAVE CHANGES`**.

> **Note**: Idle time is tracked separately under the grey `IDLE` bucket and never counts toward your productive work or distraction metrics.

---

## 3. Customizing Activity Categorization Rules

### 3.1 How Activity Classification Works

Every second, YDID's native Win32 tracker checks the currently focused window:
- If it is a desktop app (e.g., `code.exe`, `slack.exe`, `steam.exe`), it matches against your **App Rules**.
- If it is a web browser (Chrome, Edge, Brave) and the YDID Chrome Extension is connected, it matches the active tab's domain (e.g., `github.com`, `youtube.com`) against your **Domain Rules**.

Activities are assigned to one of four categories:
1. **Productive (Emerald)**: Coding, documentation, CAD, terminal, email, writing.
2. **Neutral (Blue)**: Communication, utility apps, music playback (e.g. Spotify, Slack).
3. **Distraction (Red)**: Social media, video entertainment, gaming, forums.
4. **Idle (Grey)**: Away from keyboard/mouse past your idle threshold.

---

### 3.2 Adding Desktop Application Rules

1. Open **⚙ Settings** → **`RULES`** tab.
2. Under **Add Custom Pattern Rule**:
   - Set **Type** to **`Application (.exe)`**.
   - In **Pattern**, type the executable name (case-insensitive, e.g. `blender.exe`, `figma.exe`, `discord.exe`).
   - In **Category**, select **`Productive`**, **`Neutral`**, or **`Distraction`**.
3. Click **`ADD RULE`**.

---

### 3.3 Adding Website Domain Rules

1. Open **⚙ Settings** → **`RULES`** tab.
2. Under **Add Custom Pattern Rule**:
   - Set **Type** to **`Website Domain`**.
   - In **Pattern**, type the root domain (e.g. `stackoverflow.com`, `twitch.tv`, `news.ycombinator.com`).
   - In **Category**, choose the desired classification.
3. Click **`ADD RULE`**.

---

### 3.4 Modifying and Removing Rules

- The active rules list displays all configured patterns with their match type and colored category badge.
- To delete a rule, click the red **Trash icon (<kbd>🗑</kbd>)** on that rule's row.
- Changes take effect immediately on the next 1-second tracker tick.

---

## 4. Customizing Financial & Opportunity Cost Settings

The **Opportunity Cost Panel** translates your wasted distraction minutes into direct economic potential lost:

$$\text{Opportunity Cost} = \left(\frac{\text{Distraction Seconds}}{3600}\right) \times \text{Hourly Rate}$$

#### How to configure your valuation:
1. Open **⚙ Settings** → **`GENERAL`** tab.
2. Under **Opportunity Cost Calculation**:
   - **`Hourly Valuation`**: Enter your target or actual hourly earning rate (e.g. `300`, `75`, `50`).
   - **`Currency Symbol`**: Enter your local currency symbol (e.g. `₹`, `$`, `€`, `£`, `¥`).
3. Click **`SAVE CHANGES`**.

The Opportunity Cost card on the dashboard will immediately recalculate today's financial loss.

---

## 5. Procedural Sound Engine Configuration

YDID features a **zero-asset procedural audio engine** running on the Web Audio API. It synthesizes analog sine waves and resonant bandpass noise in real time without loading external sound files.

#### How to configure audio preferences:
1. Open **⚙ Settings** → **`NOTIFICATIONS`** tab.
2. **Master Mute Toggle**:
   - Click the green audio button in the top-right of the card to quickly mute/unmute all sounds.
3. **Volume Level**:
   - Adjust the **Master Output Volume** slider between `0%` and `100%`.
4. **Sound Synthesis Profiles**:
   Select your preferred sound character:
   - **`Cinematic`**: Heavy 28Hz sub-bass sweeps and warm resonant acoustic chords.
   - **`Mechanical`**: Physical mechanical escapement ticks and high-frequency escapement snaps.
   - **`Minimal`**: Subtle, ultra-soft sine wave beeps with zero distraction.
5. Click **`SAVE CHANGES`**.

---

## 6. Windows Desktop & Floating HUD Settings

### 6.1 Start with Windows (Automatic Startup)

Ensure YDID is always monitoring from the moment your computer boots up without requiring manual launching:

1. Open **⚙ Settings** → **`DESKTOP`** tab.
2. Toggle the **`Start with Windows`** checkbox to **ON**.
3. YDID automatically writes an entry to your Windows Registry:
   ```text
   HKEY_CURRENT_USER\Software\Microsoft\Windows\CurrentVersion\Run
   "YOUR DAY IS DYING" = "C:\Path\To\YourDayIsDying.exe"
   ```
4. To disable automatic startup, simply uncheck this setting anytime.

---

### 6.2 Using the Independent Floating Desktop HUD

The HUD is a **true native desktop window**, not a browser overlay. You can drag it outside the application and float it over full-screen browser tabs, IDEs, spreadsheets, or games.

```text
┌──────────────────────────────────────────────┐
│  YDID HUD                 18:19   [↺] [📌] [▼] [⛶] [✕] │
├──────────────────────────────────────────────┤
│               REMAINING TODAY                │
│                 04:56:12                     │
│  [████████████████████████░░░░░░░░]          │
│  72.6% GONE       YOUR DAY IS DYING          │
├──────────────────────────────────────────────┤
│  ● code.exe [PROD]          [FOCUS] [▶/⏸]    │
└──────────────────────────────────────────────┘
```

#### Key HUD Controls:
- **Move Anywhere**: Click and hold the header grip handle (<kbd>:::</kbd>) or chassis to drag the HUD anywhere across single or multiple monitors.
- **Pill Dial Mode (<kbd>▼</kbd>)**: Minimizes the HUD into a compact floating dial (`4h 56m | 72%`). Click (<kbd>▲</kbd>) to expand back to the full instrument.
- **Always on Top (<kbd>📌</kbd>)**: Toggles whether the HUD stays floating above all active full-screen windows.
- **Reset Position (<kbd>↺</kbd>)**: Instantly centers the HUD at the bottom-right corner of your primary display.
- **Open Dashboard (<kbd>⛶</kbd>)**: Restores and focuses the full Command Dashboard.
- **Close HUD (<kbd>✕</kbd>)**: Hides the HUD (can be reopened from the System Tray or Header).

---

### 6.3 Windows System Tray Controls & Application Lifecycle

YDID lives continuously in your Windows notification area (System Tray near the clock):

- **Left-Click Tray Icon**: Instantly toggles visibility of the main Command Dashboard.
- **Closing the Dashboard (`✕`)**: Minimizes the window into the tray while the HUD and background tracker continue running.
- **Right-Click Tray Menu**:
  - **`Open Dashboard`**: Restores and brings the main window into focus.
  - **`Show / Hide HUD Widget`**: Toggles the native floating HUD independently.
  - **`Pause / Resume Tracking`**: Freezes or unfreezes background time monitoring.
  - **`Quit YDID`**: Completely terminates the entire application, background tracking loops, and HUD window (`app.exit(0)`).

---

## 7. Privacy, Data Export & Database Management

YDID is engineered with a strict **Local-First, Zero-Telemetry** architecture:
- All logs, hourly intervals, rules, and settings are stored locally in:
  `%APPDATA%\com.ydid.app\ydid_data.sqlite` (or the application folder).
- No telemetry, no remote analytics, no third-party cloud connections.

#### Exporting Tracked Activity as JSON:
1. Open **⚙ Settings** → **`PRIVACY`** tab.
2. Click **`EXPORT DATA (JSON)`**.
3. A JSON backup containing your timeline segments and duration logs will download automatically to your machine.

#### Wiping All Local Records:
1. Open **⚙ Settings** → **`PRIVACY`** tab.
2. Click **`DELETE ALL DATA`**.
3. Confirm the security prompt. All recorded timeline history and accumulated time debt will be reset to zero immediately.

---

## 8. Quick Reference & Troubleshooting

### Frequently Asked Questions

#### Q: How do I track browser tabs in Chrome / Edge / Brave?
1. Open your browser and go to `chrome://extensions/`.
2. Enable **Developer mode** in the top-right corner.
3. Click **Load unpacked** and select the `extension/` folder in the YDID directory.
4. Pin the YDID extension icon. When active, it displays: `BRIDGE CONNECTED (127.0.0.1:41832)`.

#### Q: My HUD disappeared or is off-screen after unplugging an external monitor.
Open the Main Dashboard → **⚙ Settings** → **`DESKTOP`** tab → click **`RESET HUD POSITION`** (or press the reset icon on the HUD if partially visible). YDID automatically clamps the window back to your primary display's bottom-right corner.

#### Q: How do I completely quit YDID?
Right-click the YDID icon in your **Windows System Tray** and select **`Quit YDID`**, or open **⚙ Settings** → **`DESKTOP`** and click **`QUIT YDID COMPLETELY`**.

---

<div align="center">

**YOUR DAY IS DYING**  
*Time won't wait. Use what you have left.*

</div>
