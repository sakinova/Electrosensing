# Electrosensing Mobile App (React Native / Expo)

This repository contains the PlantSense mobile app used to:
- Connect to the PlantSense device over BLE
- View live plant voltage (mV) in real time
- Record sessions and save locally
- Add markers during recordings (Touch/Light/Stimulus/Other)
- View history, rename sessions, export CSV, and delete sessions

## Tech Stack
- React Native + Expo
- expo-router (file-based navigation)
- AsyncStorage (local session storage)
- react-native-svg (live chart rendering)
- BLE handled via AuthContext (see `/contexte/authContext`)

# Quick Start
## 0) Easier to go to the React Native Website and follow the directions there
- https://reactnative.dev/docs/environment-setup
- https://reactnative.dev/docs/set-up-your-environment
  
## 1) Install prerequisites
- Node.js (LTS): https://nodejs.org
- Git: https://git-scm.com
- VS Code: https://code.visualstudio.com

Mac (iOS):
- Xcode (App Store)

## 2) Clone & install
- follow this video for an easier time: https://youtu.be/ssokvToiYU0?si=L9TPkaUwTByr0Dts
  - Check out his page (https://www.youtube.com/@taylor.galbraith), he gives great tutorials that aided greatly in the setup of this app
    
```bash
git clone <REPO_URL>
cd <REPO_FOLDER>
npm install
```
## 3) Run the App
npx expo start

## 4) Running on a Phone
Option A — Expo Go (quick UI testing)

- Install Expo Go on your phone
- Run npx expo start
- Scan the QR code
- BLE will be limited in Expo Go for this BLE library

Option B — Dev Build (RECOMMENDED due to BLE functionality, this is what I use!)

- This is required for reliable BLE testing.
- First time:
  npx expo prebuild

  Build and run (iOS - Mac only): npx expo run:ios
  - iOS note: You will need to open Xcode once and set a Development Team for signing.

  Build and run (Android): npx expo run:android

Project Structure (important folders)

app/ — screens (expo-router)

app/index.tsx — splash screen → redirects to /auth

app/livesignal/record.tsx — live chart + record + save

app/livesignal/history/ — history list and session detail

contexte/authContext.tsx — BLE connect/stream logic + provides:

device, windowData, lastValue, disconnect, etc.

Local Data Storage (AsyncStorage)

Common Commands

- Start dev server: npx expo start
- Clear cache: npx expo start -c

---
## Below is the README portion that comes when you install expo

# Welcome to your Expo app 👋

This is an [Expo](https://expo.dev) project created with [`create-expo-app`](https://www.npmjs.com/package/create-expo-app).

## Get started

1. Install dependencies

   ```bash
   npm install
   ```

2. Start the app

   ```bash
   npx expo start
   ```

In the output, you'll find options to open the app in a

- [development build](https://docs.expo.dev/develop/development-builds/introduction/)
- [Android emulator](https://docs.expo.dev/workflow/android-studio-emulator/)
- [iOS simulator](https://docs.expo.dev/workflow/ios-simulator/)
- [Expo Go](https://expo.dev/go), a limited sandbox for trying out app development with Expo

You can start developing by editing the files inside the **app** directory. This project uses [file-based routing](https://docs.expo.dev/router/introduction).

## Get a fresh project

When you're ready, run:

```bash
npm run reset-project
```

This command will move the starter code to the **app-example** directory and create a blank **app** directory where you can start developing.

## Learn more

To learn more about developing your project with Expo, look at the following resources:

- [Expo documentation](https://docs.expo.dev/): Learn fundamentals, or go into advanced topics with our [guides](https://docs.expo.dev/guides).
- [Learn Expo tutorial](https://docs.expo.dev/tutorial/introduction/): Follow a step-by-step tutorial where you'll create a project that runs on Android, iOS, and the web.

## Join the community

Join our community of developers creating universal apps.

- [Expo on GitHub](https://github.com/expo/expo): View our open source platform and contribute.
- [Discord community](https://chat.expo.dev): Chat with Expo users and ask questions.
