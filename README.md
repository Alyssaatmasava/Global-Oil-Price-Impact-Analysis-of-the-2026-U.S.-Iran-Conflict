# Global Petrol Prices Impact Analysis: 2026 US-Iran Conflict

An interactive data analysis dashboard exploring the economic impacts of the 2026 US-Iran conflict on global oil markets and national economies.

## Dashboard Preview

![Petrol War Analysis Dashboard](assets/dashboard-preview.png)

*Interactive dashboard showing oil price trends, country fuel comparisons, war timeline, and economic impact correlations. [View Live Demo]([https://alyssaatmasava.github.io/petrol_war_analysis/](https://alyssaatmasava.github.io/Global-Oil-Price-Impact-Analysis-of-the-2026-U.S.-Iran-Conflict/))*

## 📊 Overview

This project analyzes how geopolitical conflicts disrupt global energy markets, with a focus on:
- Oil price volatility and supply chain disruptions
- Country-level economic vulnerability based on oil import dependency
- Statistical correlations between energy security and economic resilience
- Policy implications for energy security in an era of geopolitical instability

## 🚀 Features

- **Interactive Dashboard**: Web-based visualization of oil price trends, country impacts, and correlations
- **Statistical Analysis**: Spearman correlations revealing relationships between oil dependency and economic outcomes
- **Data-Driven Insights**: Evidence-based findings on energy security vulnerabilities
- **Comprehensive Dataset**: Multi-source data including Kaggle datasets and custom analysis

## 📁 Project Structure

```
petrol_war_analysis/
├── assets/             # README images and media
├── dashboard/          # Interactive web dashboard
│   ├── petrol-war-dashboard.html
│   ├── script.js
│   └── styles.css
├── data/
│   ├── raw/            # Source datasets
│   └── cleaned/        # Processed data
├── notebooks/          # Jupyter analysis notebooks
├── outputs/            # Generated charts (not tracked)
├── scripts/            # Data download utilities
├── requirements.txt    # Python dependencies
└── README.md
```

## 🛠️ Installation & Setup

### Prerequisites
- Python 3.8+
- Git

### Quick Start

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/petrol-war-analysis.git
   cd petrol-war-analysis
   ```

2. **Create virtual environment:**
   ```bash
   python -m venv .venv
   source .venv/bin/activate  # On Windows: .venv\Scripts\activate
   ```

3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```

4. **Download data (optional):**
   ```bash
   python scripts/download_data.py
   ```

5. **Launch dashboard:**
   ```bash
   cd dashboard
   python -m http.server 8000
   ```
   Open http://localhost:8000/petrol-war-dashboard.html

## 📈 Key Findings

### Oil Import Dependency Correlations
- **GDP Impact**: ρ = -0.554 (p = 0.021) - Higher import dependency correlates with worse GDP performance
- **Stock Market Impact**: ρ = -0.411 (p = 0.101) - Similar trend with stock market declines
- **Petrol Price Increases**: ρ = -0.540 (p = 0.057) - Countries with higher import dependency saw larger fuel price hikes

### Strategic Implications
- Energy independence emerges as critical national security priority
- Developing nations face compounded inflation and currency depreciation crises
- Geographic proximity ≠ economic exposure; oil import dependency determines vulnerability

## 📊 Data Sources

- **Kaggle Dataset**: ["Global Petrol Prices Impact of 2026 US-Iran War" by zkskhurram](https://www.kaggle.com/datasets/zkskhurram/global-petrol-prices-impact-of-2026-us-iran-war/data)
- **Custom Analysis**: Correlation studies and statistical modeling
- **Time Period**: February-March 2026 conflict escalation

## 🧪 Usage

### Running Analysis
```bash
# Execute Jupyter notebooks
jupyter notebook notebooks/oil_crisis_analysis.ipynb
```

### Dashboard Features
- **Crude Oil Trend**: Brent/WTI price evolution with conflict phases
- **Country Fuel Comparison**: Retail price changes across nations
- **War Timeline**: Chronological event mapping with oil impact
- **Economic Impact**: GDP and stock market correlations with oil dependency

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🙏 Acknowledgments

- Data sourced from Kaggle community datasets
- Analysis inspired by real-world energy market dynamics
- Built with Python data science stack (pandas, matplotlib, scipy)

