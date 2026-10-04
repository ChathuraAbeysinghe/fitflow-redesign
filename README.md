# FitFlow

FitFlow is a cross-platform fitness app redesign for the IT3060 HCI project. The current
prototype is an Expo app built with React Native and Expo Router. It can run in a web browser,
on a real Android phone, or in an Android emulator.

## Tech stack

- React Native 0.86
- Expo SDK 57
- Expo Router
- TypeScript
- React Native Web
- AsyncStorage for local data
- Expo Image Picker and Notifications

## Requirements

- Node.js LTS and npm
- Git
- For a real Android phone: Android 6+ with Expo Go installed
- For an Android emulator: Android Studio, Android SDK, and an Android Virtual Device

## Installation

From the project directory:

```powershell
npm install
```

## Running the app

### Web browser

```powershell
npm run web
```

Then open the URL shown by Expo, normally `http://localhost:8081`.

### Android emulator on Windows

1. Install Android Studio and create/start an Android Virtual Device.
2. Start the Expo development server:

   ```powershell
   npm start
   ```

3. Press `a` in the Expo terminal, or run:

   ```powershell
   npm run android
   ```

### Real Android phone

1. Install **Expo Go** from the Google Play Store.
2. Connect the phone and the Windows computer to the same Wi-Fi network.
3. Start Expo in LAN mode:

   ```powershell
   npx expo start --lan
   ```

4. Scan the QR code displayed in the terminal with Expo Go.

If scanning does not work, open Expo Go and choose **Enter URL manually**. Use the
`exp://` URL displayed by Expo, for example:

```text
exp://10.224.222.125:8081
```

The IP address will be different on each network. Do not use `localhost` on the phone;
`localhost` refers to the phone itself, not the Windows computer.

### Tunnel mode

Tunnel mode can be used when the phone and computer cannot share the same network:

```powershell
npx expo start --tunnel
```

Tunnel mode depends on the ngrok service and may fail during an outage or on restricted
networks. LAN mode is preferred when both devices are on the same Wi-Fi network.

## Troubleshooting Android connection

- Confirm that the phone and computer are on the same non-guest Wi-Fi network.
- Temporarily disable mobile data and VPNs on the phone.
- Allow Node.js or Expo through Windows Firewall on private networks.
- Ensure TCP port `8081` is not blocked.
- Restart Expo with `npx expo start --lan` after changing networks.
- If Expo Go reports that it cannot connect, use the manual `exp://` URL shown by Expo.

## Available npm scripts

| Command | Purpose |
| --- | --- |
| `npm start` | Start the Expo development server |
| `npm run web` | Start the app in a web browser |
| `npm run android` | Start Expo and launch the Android target |
| `npm run ios` | Start Expo and launch the iOS target (macOS/Xcode required) |

## Documentation

See [`docs/`](./docs) for the research, design, testing, and architecture documentation from
Lab Sheets 1-5, including the technology comparison tables, weighted decision matrix, and
architecture decision records.
