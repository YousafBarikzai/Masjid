# Kingston Mosque — Mobile App (iOS + Android)

An Expo / React Native app that mirrors the website CMS. It reads the same
`/app-api/snapshot` feed the website and display screens use, so prayer times,
news, events, services and contact details all stay in sync automatically, and
the mosque can push announcements to phones.

One codebase builds **both** the iOS and Android apps.

## What's here

- **Home** — today's prayer times, the next jamā‘ah with a live countdown, and
  the active announcement.
- **Prayers** — today's full timetable (begins + jamā‘ah).
- **News** — latest posts (tap to read on the site).
- **More** — contact (tap to call / email / map), services, education, events.
- **Push notifications** — registers an Expo token with the site so published
  announcements alert the app.

## Prerequisites

- Node 20+
- The [Expo](https://expo.dev) tooling (`npx expo` — no global install needed)
- For a real device: the **Expo Go** app, or a dev build
- For TestFlight / App Store: an Apple Developer account + [EAS](https://expo.dev/eas)

## Run it

```bash
cd mobile
npm install
cp .env.example .env        # point EXPO_PUBLIC_API_BASE at your deployed site
npx expo start              # press i for iOS simulator, or scan the QR in Expo Go
```

> Push notifications only work on a physical device (not the simulator) and
> require a dev/standalone build for the production push token.

## Configuration

- **API base URL:** `EXPO_PUBLIC_API_BASE` (`.env`), falling back to
  `expo.extra.apiBase` in `app.json`. Defaults to `https://kingstonmosque.org`.
- **App identity:** name *Kingston Mosque*, bundle id `org.kingstonmosque.app`
  (`app.json`).

## Build & release (EAS)

```bash
npm i -g eas-cli      # or use npx
eas login
eas build:configure
eas build --platform ios --profile production     # archive for TestFlight/App Store
eas submit --platform ios                          # upload to App Store Connect
```

Push setup for standalone iOS builds needs an APNs key from your Apple Developer
account; `eas credentials` walks you through it.

## Regenerate icons / splash

The icon, adaptive icon and splash are generated from the shared mosque emblem:

```bash
node mobile/scripts/generate-assets.mjs   # run from the repo root (uses sharp)
```
