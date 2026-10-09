<div align="center">
  <img src="https://tuquet.com/icons/lunar.svg" width="76" height="76" alt="Lunar Logo" />
  <h1>@tuquet/lunar</h1>
  <p><strong>Astronomical Vietnamese Lunar-Solar Calendar Converter &amp; Recurrence Engine</strong></p>

  <p>
    <a href="https://www.npmjs.com/package/@tuquet/lunar"><img src="https://img.shields.io/npm/v/@tuquet/lunar.svg" alt="npm version" /></a>
    <img src="https://img.shields.io/badge/Dependencies-Zero-brightgreen.svg" alt="Zero Dependencies" />
    <img src="https://img.shields.io/badge/Module-Dual%20ESM%2FCJS-blue.svg" alt="ESM/CJS" />
    <a href="LICENSE"><img src="https://img.shields.io/badge/License-MIT-blue.svg" alt="License" /></a>
  </p>
</div>

---

> Astronomical Vietnamese Lunar-Solar calendar converter, recurrence engine, and Can Chi calculator.

## 🌟 Features

- 🌓 **Astronomical Accuracy**: Implements Dr. Ho Ngoc Duc's algorithm (based on Jean Meeus' _Astronomical Algorithms_) adapted for UTC+7 (Hanoi/Ho Chi Minh City).
- 🔄 **Bidirectional Conversion**: Seamlessly convert Solar ➔ Lunar and Lunar ➔ Solar dates (including leap month support).
- 🗓️ **Recurrence & Event Discovery**: Find next upcoming lunar dates for Memorial events (Gio), Full Moon (Ram - 15th), and New Moon (Mung 1).
- 🐅 **Can Chi & 24 Solar Terms**: Calculates Can Chi for Year (with Vietnamese Zodiac Animal), Month, Day, and Hour, plus 24 Solar Terms (Tiet Khi).
- 🪶 **Zero Dependencies & Dual ESM/CJS**: Lightweight, runs anywhere (Node.js, Browser, Edge, Cloudflare Workers).

---

## 📦 Installation

```bash
# Using pnpm
pnpm add @tuquet/lunar

# Using npm
npm install @tuquet/lunar

# Using yarn
yarn add @tuquet/lunar
```

---

## 🚀 Usage

### 1. Convert Solar to Lunar Date

```typescript
import { solarToLunar } from '@tuquet/lunar';

// Convert 2024-02-10 (Lunar New Year)
const lunar = solarToLunar({ day: 10, month: 2, year: 2024 });
console.log(lunar);
// { day: 1, month: 1, year: 2024, isLeap: false }
```

### 2. Convert Lunar back to Solar Date

```typescript
import { lunarToSolar } from '@tuquet/lunar';

// What solar date corresponds to 01/01/2025 Lunar?
const solar = lunarToSolar({ day: 1, month: 1, year: 2025 });
console.log(solar);
// { day: 29, month: 1, year: 2025 }
```

### 3. Find Next Upcoming Lunar Events (Memorials, Full Moon, New Moon)

```typescript
import { getNextAnnualLunarDate, getNextFullMoon, getNextNewMoon } from '@tuquet/lunar';

// Find next Memorial event (15th of 8th lunar month)
const nextMemorial = getNextAnnualLunarDate(15, 8);
console.log(
  `Next memorial date: ${nextMemorial.solar.day}/${nextMemorial.solar.month}/${nextMemorial.solar.year} (${nextMemorial.daysUntil} days remaining)`
);

// Find next Full Moon (15th lunar day)
const nextFullMoon = getNextFullMoon();
console.log(
  `Next Full Moon date: ${nextFullMoon.solar.day}/${nextFullMoon.solar.month}/${nextFullMoon.solar.year}`
);
```

### 4. Can Chi & Zodiac Animal

```typescript
import { getCanChiYear, getCanChiDay, getFullLunarDate } from '@tuquet/lunar';

const year = getCanChiYear(2024);
console.log(year.full); // "Giap Thin"
console.log(year.animal); // "Dragon"

const fullInfo = getFullLunarDate(new Date());
console.log(
  `Today: ${fullInfo.canChiDay.full}, month ${fullInfo.canChiMonth.full}, year ${fullInfo.canChiYear.full} (${fullInfo.solarTerm})`
);
```

---

## 🌐 Ecosystem

Part of the **Automation & Agent Ecosystem**:

- [Automa](https://github.com/tuquet/automa) — Native Chrome/Edge Desktop UI Automation Browser.
- [Runner](https://github.com/tuquet/runner) — High-Performance Distributed Process Supervision Engine in Rust.
- [Browser](https://github.com/tuquet/browser) — High-Performance Headless Web Scraping & Stealth Automation Core.
- [Cloud](https://github.com/tuquet/cloud) — Enterprise Orchestration & Real-time Task Control Plane.
- [CLI](https://github.com/tuquet/cli) — Developer Ergonomic CLI & Unified Command Center.
- [Lib](https://github.com/tuquet/lib) — Monorepo for Shared Enterprise UI & Utilities (`vue-ui`, `vue-table`, `md-export`, `extension-runner`, `lunar`).
- [Scoop Bucket](https://github.com/tuquet/scoop-bucket) — Official Windows Scoop Distribution Channel.

---

## 📄 License

Distributed under the [MIT License](LICENSE).

---

<div align="center">
  <samp>
    <a href="https://tuquet.com">Portfolio</a> •
    <a href="https://tuquet.com/cv">CV &amp; Resume</a> •
    <a href="https://specter.specter.tuquet.com/automa/">Automa Studio</a> •
    <a href="https://storybook.tuquet.com/">Component Lab</a> •
    <a href="https://github.com/tuquet/scoop-bucket">Scoop Bucket</a>
  </samp>
</div>
