# ⛽ Global Petrol Prices — Impact of 2026 US-Iran War

[![Kaggle Dataset](https://img.shields.io/badge/Kaggle-Dataset-blue?logo=kaggle)](https://www.kaggle.com/datasets/khurramshahzad/global-petrol-prices-us-iran-war-2026)
[![License: CC BY-SA 4.0](https://img.shields.io/badge/License-CC%20BY--SA%204.0-orange)](https://creativecommons.org/licenses/by-sa/4.0/)
[![Python 3.10+](https://img.shields.io/badge/Python-3.10%2B-green?logo=python)](https://python.org)
[![Last Updated](https://img.shields.io/badge/Updated-9%20March%202026-brightgreen)]()

---

## 📋 Overview

This dataset provides a **comprehensive analysis** of the impact of the **2026 US-Iran military conflict** on global petroleum prices. Following US-Israeli strikes on Iran (28 Feb 2026) and Iran's subsequent closure of the **Strait of Hormuz** — which handles ~20% of the world's oil supply — crude oil prices surged from ~$70 to over **$104/barrel** (Brent), triggering fuel price increases across the globe.

> ⚠️ **Context**: The conflict disrupted ~15 million barrels/day of oil shipments, causing the largest supply shock since the 1973 oil embargo.

### 🔥 Key Findings

| Metric | Value |
|---|---|
| 🛢️ Brent Crude (9 Mar 2026) | **$104.25/barrel** (+51.5% in 1 month) |
| 🛢️ WTI Crude (9 Mar 2026) | **$102.88/barrel** (+60.9% in 1 month) |
| 📈 Highest Price Increase | **Pakistan +20.66%** (PKR 266→321/L) |
| ⚡ Oil Supply Disrupted | **~20%** of global supply |
| 🌍 Countries Tracked | **14** (price comparison) + **17** (impact assessment) |
| ⏱️ Conflict Events | **20** key events (Dec 2025 – Mar 2026) |

---

## 📂 Files

| File | Description | Rows × Cols |
|---|---|---|
| `petrol_prices_comparison.csv` | 14 countries' retail petrol prices — before war vs 7 Mar 2026 | 14 × 14 |
| `crude_oil_daily.csv` | Daily Brent & WTI crude oil prices (Feb–Mar 2026) | ~16 × 7 |
| `war_timeline.csv` | Key events of the US-Iran conflict | 20 × 5 |
| `country_impact.csv` | Country-level economic impact assessment | 17 × 10 |
| `pros_cons_analysis.csv` | Pros & cons of rising petrol prices | 16 × 7 |
| `petrol_prices_eda.ipynb` | 📓 Rich EDA notebook (Kaggle-ready) | — |
| `dataset-metadata.json` | Kaggle metadata | — |
| `PP.py` | Generation script for all datasets + notebook | — |

---

## 🏗️ Key Columns

### ⛽ petrol_prices_comparison.csv

| Column | Type | Description |
|---|---|---|
| `Country` | str | Country name |
| `ISO` | str | ISO 3-letter code (PAK, IND, USA…) |
| `Region` | str | South Asia / Middle East / Europe / North America |
| `Before_War_Price` | float | Retail price before conflict (local currency/L) |
| `Mar7_Price` | float | Retail price on 7 March 2026 (local currency/L) |
| `Pct_Increase` | float | Percentage price increase |
| `Before_War_USD` / `Mar7_USD` | float | Price in USD per liter |
| `Oil_Import_Dep` | str | Oil import dependency: High / Medium / Low |

### 🛢️ crude_oil_daily.csv

| Column | Type | Description |
|---|---|---|
| `Date` | date | Trading day |
| `Brent_USD` | float | Brent crude price (USD/barrel) |
| `WTI_USD` | float | WTI crude price (USD/barrel) |
| `Phase` | str | Pre-Conflict / Active Conflict |
| `Strait_Hormuz` | str | Open / Closed/Restricted |

---

## ⏱️ US-Iran War — Key Timeline

| Date | Event | Category |
|---|---|---|
| 🏛️ Dec 2025 | Widespread protests erupt across Iran | Political |
| 🕊️ Feb 2026 | Geneva nuclear talks begin (mediated by Oman) | Diplomatic |
| ⚔️ 28 Feb 2026 | US-Israeli military strikes on Iran commence | Military |
| 💥 1 Mar 2026 | Iran closes Strait of Hormuz (~20% of world oil) | Military/Energy |
| ⚡ 4 Mar 2026 | Qatar halts gas production after drone strikes | Energy |
| 💰 7 Mar 2026 | Pakistan petrol jumps 20.66% — largest single hike | Economic |
| 🛢️ 9 Mar 2026 | Brent hits $104.25/barrel — highest since 2022 | Economic |

---

## ✅❌ Pros & Cons Summary

### ❌ Cons
- 📈 **Inflation surge** — Every 10% oil rise → 0.4% inflation + 0.15% GDP reduction
- 💸 **Consumer hardship** — Low-income households disproportionately affected
- 🏦 **Balance of payments crisis** — Oil-importing developing nations face FX drain
- ⚠️ **Stagflation risk** — Weak growth + high inflation threatening global recession
- 📉 **Stock market crashes** — Japan -5%, South Korea -6%, global markets down

### ✅ Pros
- 🌱 **Green transition accelerated** — Renewables, EVs become more attractive
- 💰 **Oil exporter windfall** — Saudi, UAE, USA see revenue increase
- 🚗 **Reduced consumption** — Shift to public transport & fuel-efficient vehicles
- 🔄 **Energy diversification** — Crisis pushes developing nations toward renewables

---

## 🚀 Quick Start

### Option 1 — Kaggle Notebook (Recommended)
```python
import pandas as pd
prices = pd.read_csv("/kaggle/input/global-petrol-prices-us-iran-war-2026/petrol_prices_comparison.csv")
prices.head()
```

### Option 2 — Local Setup
```bash
cd Petrol_Prices
python -m venv .kag_go
.kag_go\Scripts\activate        # Windows
pip install pandas numpy matplotlib seaborn plotly nbformat
python PP.py                     # Generates all CSVs + notebook
jupyter notebook petrol_prices_eda.ipynb
```

---

## 🔗 Data Sources & Citations

| # | Source | URL |
|---|---|---|
| 1 | 📰 Al Jazeera | [aljazeera.com](https://www.aljazeera.com) |
| 2 | 📰 The Guardian | [theguardian.com](https://www.theguardian.com) |
| 3 | 📊 TradingEconomics | [tradingeconomics.com](https://tradingeconomics.com) |
| 4 | 📊 GlobalPetrolPrices | [globalpetrolprices.com](https://www.globalpetrolprices.com) |
| 5 | 🏦 IMF | [imf.org](https://www.imf.org) |
| 6 | 📖 Wikipedia | [en.wikipedia.org](https://en.wikipedia.org/wiki/2026_Iran%E2%80%93United_States_war) |
| 7 | 💰 Goldman Sachs | [goldmansachs.com](https://www.goldmansachs.com) |
| 8 | 🏛️ Chatham House | [chathamhouse.org](https://www.chathamhouse.org) |
| 9 | 📚 Brookings Institution | [brookings.edu](https://www.brookings.edu) |
| 10 | 🌱 ESMAP / World Bank | [esmap.org](https://www.esmap.org) |

---

## ⚖️ License

This dataset is released under **[CC BY-SA 4.0](https://creativecommons.org/licenses/by-sa/4.0/)**. You are free to share and adapt with appropriate credit.

---

## 📌 Tags

`petrol-prices` · `crude-oil` · `brent` · `WTI` · `US-Iran-war` · `Strait-of-Hormuz` · `energy-crisis` · `oil-supply` · `inflation` · `geopolitics` · `Pakistan` · `Middle-East` · `economic-impact` · `pros-cons` · `EDA` · `data-visualization`

---

<p align="center">
  <b>Made with ❤️ for Energy Data Research</b><br>
  If you find this dataset useful, please <b>⬆️ Upvote</b> it on Kaggle!
</p>
