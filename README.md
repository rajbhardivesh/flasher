# RDH Robotics Firmware Flasher

A modern, browser-based firmware flashing tool for **ESP32** and **ESP8266** devices,
built with **React**, **TypeScript**, **Material UI**, and
[**esptool-js**](https://github.com/espressif/esptool-js). Everything runs locally
in the browser via the **Web Serial API** — there is no backend and no firmware is
ever uploaded to a server.

## Features

- Connect to ESP32 / ESP8266 boards over USB-serial directly from the browser
- One-click flashing of the official **RF-Hunter** firmware
- Upload (or drag & drop) a custom `.bin` file for any compatible device
- Live, dark-themed flashing console with auto-scroll and a clear button
- Real-time chip detection, flash progress %, flash speed, and status
- Light and dark mode, fully responsive Material UI design
- Ready to deploy as a static site on GitHub Pages

## Requirements

- **Node.js 18+** and npm
- A Chromium-based browser (Chrome, Edge, Opera, Brave, etc.) — the Web Serial API
  is not supported in Firefox or Safari
- A secure context (HTTPS or `localhost`) — required by the Web Serial API

## Getting Started

```bash
# Install dependencies
npm install

# Run the development server
npm run dev

# Build for production
npm run build

# Preview the production build locally
npm run preview
```

The dev server runs on `http://localhost:5173`, which satisfies the Web Serial
API's secure-context requirement.

## Project Structure

```
rdh-firmware-flasher/
├── .github/
│   └── workflows/
│       └── deploy.yml          # GitHub Pages deployment workflow
├── public/
│   └── favicon.svg
├── src/
│   ├── components/
│   │   ├── DeviceSelectionCard.tsx   # RF-Hunter / Custom firmware selector + drag&drop
│   │   ├── FlasherControls.tsx       # Connect / Flash / Disconnect buttons + baud rate
│   │   ├── Header.tsx                # App bar with title + theme toggle
│   │   ├── StatusPanel.tsx           # Chip type, progress, speed, status
│   │   └── TerminalPanel.tsx         # Dark themed live log console
│   ├── hooks/
│   │   └── useFirmwareFlasher.ts     # esptool-js integration (connect/flash/disconnect)
│   ├── theme/
│   │   └── theme.ts                  # MUI light/dark theme definitions
│   ├── types/
│   │   └── serial.d.ts               # Web Serial API TypeScript declarations
│   ├── utils/
│   │   └── binary.ts                 # Binary string / formatting helpers
│   ├── App.tsx                       # Main application layout & state
│   ├── main.tsx                      # React entry point
│   └── vite-env.d.ts
├── index.html
├── package.json
├── tsconfig.json
├── tsconfig.app.json
├── tsconfig.node.json
└── vite.config.ts
```

## Deploying to GitHub Pages

This project builds with a relative base path (`base: "./"`), so the production
build works correctly when served from
`https://<your-username>.github.io/<repo-name>/`.

### Option 1: GitHub Actions (recommended)

1. Push this repository to GitHub.
2. In your repository settings, go to **Settings → Pages** and set
   **Source** to **GitHub Actions**.
3. The included workflow at `.github/workflows/deploy.yml` will automatically
   build and deploy the app on every push to `main`.

### Option 2: `gh-pages` package

```bash
npm run deploy
```

This builds the project and pushes the `dist/` folder to the `gh-pages` branch
using the `gh-pages` package (already included as a dev dependency). Make sure
your repository's Pages source is set to the `gh-pages` branch.

## Usage

1. **Select a device profile**
   - **RF-Hunter** — automatically uses the official firmware release from
     `https://github.com/rdhrobotics/RF-Hunter/releases/download/FirmwareV1.0/RF-Hunter-firmware.bin`
   - **Custom Firmware** — upload or drag & drop your own `.bin` file
2. Click **Connect Device** and select your board's serial port in the browser
   prompt. Hold the **BOOT/FLASH** button on your board if it does not enter the
   bootloader automatically.
3. Click **Flash Firmware** to begin flashing. Progress, speed, and chip
   information will update live, and detailed logs appear in the console panel.
4. Click **Disconnect** when finished.

## Notes on RF-Hunter Firmware Download

The RF-Hunter firmware is fetched directly from the GitHub Releases URL at flash
time. If your network blocks GitHub or the request fails for any reason (e.g.
CORS or connectivity issues), download the `.bin` file manually and use the
**Custom Firmware** option instead.

## License

This project is provided as-is for use with RDH Robotics hardware.
