# 📈 Trade Analyzer & Visualizer Extension

![Version](https://img.shields.io/badge/version-1.0-blue.svg)
![Chrome Extension](https://img.shields.io/badge/Chrome-Extension-green.svg)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)

A powerful, custom-built Google Chrome Extension designed to enhance the UI and analytics capabilities of the **Groww** and **Fyers** trading platforms. It seamlessly injects live market data, advanced insights, and visual tools directly into your existing dashboard without breaking the native user experience.

## ✨ Key Features

- **🚀 Live IPO GMP Tracking**: Automatically fetches the latest Grey Market Premium (GMP) and Expected Listing Prices from public sources and seamlessly injects a brand new column directly into the Groww IPO Dashboard (`groww.in/ipo`).
- **📊 Advanced Trade Insights**: Analyzes stock pages and visualizes holdings. Suggests optimal Entry points, Stop Loss (SL), and Target prices based on real-time data.
- **⚡ Native UI Integration**: Built carefully to avoid React hydration errors and flickering. The injected data looks and feels like a native part of the Groww application.
- **🔒 Secure & Local**: Runs entirely on the client-side (in your browser). It does not intercept your private trading data or communicate with unauthorized servers.

## 🛠️ Tech Stack

- **Language**: TypeScript / JavaScript
- **Styling**: Vanilla CSS
- **Framework**: Chrome Extension API (Manifest V3)
- **Data Source**: Fetches real-time GMP data via background service workers.

## 📥 Installation

Since this is a custom developer tool, it is loaded locally as an unpacked extension:

1. **Clone the repository**:
   ```bash
   git clone https://github.com/HikerHarsh/Groww-extention-on-local.git
   ```
2. **Install Dependencies & Build** *(Optional, if you want to modify code)*:
   ```bash
   npm install
   npx tsc
   ```
3. **Load into Chrome**:
   - Open Google Chrome and go to `chrome://extensions/`.
   - Turn on **"Developer mode"** (toggle switch in the top right corner).
   - Click the **"Load unpacked"** button.
   - Select the folder containing this repository (where `manifest.json` is located).

## 🚀 Usage

1. Log into your [Groww](https://groww.in/) account.
2. Navigate to the **IPO Dashboard** (`groww.in/ipo`).
3. You will automatically see a new **"GMP 🤖"** column injected into the table, displaying the real-time Grey Market Premium and expected listing price for upcoming and open IPOs.
4. Navigate to individual stock pages to see the **Trade Insights** widget.

## 🤝 Contributing
Feel free to fork this repository, submit Pull Requests, or open Issues if you have suggestions or want to add support for more brokers!

## ⚠️ Disclaimer
*This extension is an independent tool and is **NOT** affiliated with, endorsed by, or sponsored by Groww or Fyers. GMP data is fetched from third-party public sources and is for informational and educational purposes only. Always do your own research before investing.*
