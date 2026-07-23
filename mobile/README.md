# SentinelAI — Mobile (Capacitor)

Native iOS/Android shell around the existing React web client (`../client`).
There is **no duplicated app code**: `cap sync` bundles the client's production
build into the native projects. The backend is the deployed API:

```
https://project-cybernautes-production.up.railway.app
```

That URL is injected into the web build at build time via `VITE_API_BASE_URL`
(see the `build:web` script), so no secrets are stored in this folder.

## Prerequisites

- Node.js 18+
- **Android:** Android Studio + JDK 17
- **iOS:** macOS + Xcode + CocoaPods

## One-time setup

```bash
cd mobile
npm install

# Build the web client (points it at the Railway backend) and add platforms:
npm run build:web
npm run add:android      # creates mobile/android
npm run add:ios          # macOS only, creates mobile/ios
```

## Everyday workflow

```bash
# Rebuild the web client and copy it into the native projects:
npm run sync

# Open the native IDE to run on a device/emulator:
npm run open:android
npm run open:ios

# Or build + sync + launch in one step:
npm run run:android
npm run run:ios
```

## How it fits together

- `capacitor.config.ts` — app id/name and `webDir: ../client/dist`.
- `build:web` — runs the client's `vite build` with `VITE_API_BASE_URL` set to
  the Railway API, producing `../client/dist`.
- `cap sync` — copies that `dist` into `android/` and `ios/`.

Because the app talks to the deployed backend over HTTPS, the FastAPI CORS
policy (`allow_origins=["*"]`) already permits the Capacitor webview origin.

## Notes

- The web client uses `BrowserRouter`; Capacitor serves it from a local origin
  so client-side routing works after the initial load.
- Firebase Auth config is fetched from the backend at
  `GET /api/auth/config`, using the same `VITE_API_BASE_URL`.
- `android/` and `ios/` are git-ignored here; regenerate them with the
  `add:*` scripts. Remove them from `.gitignore` if you prefer to commit the
  native projects.
