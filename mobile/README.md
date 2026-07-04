# Kingston Mosque — Mobile App (iOS + Android)

A native Expo / React Native app driven entirely by the website CMS. It reads
the same `/app-api/snapshot` feed the website, PWA and mosque display screens
use, so prayer times, news, events, media links and contact details stay in
sync automatically — and the mosque can push announcements straight to phones.

One codebase builds **both** the iOS and Android apps.

## What's in the app

| Tab | What it shows |
|---|---|
| **Home** | Greeting + Hijri date, live next-jamāʿah countdown ring, today's times, Friday Jumuʿah strip, quick actions, upcoming events, latest news |
| **Prayers** | Today's begins + iqāmah table, the **full monthly timetable** (cached offline), month switcher, Share month, **Download PDF** |
| **News** | Announcement banner + latest articles (open in-app) |
| **Media** | YouTube + khutbahs/lectures/podcasts — managed in the CMS |
| **More** | **Notification topic toggles**, digital tasbīḥ counter, donate, services & education, contact (call / email / directions), share the app |

Everything content-driven comes from the CMS. Staff manage the app from
**Admin → Site Settings → Mobile app** (welcome line, quick actions, media
links, timetable PDF link) — changes reach phones within a minute, with no
app-store release.

## Push notifications

- The app registers an Expo push token (with the user's chosen topics:
  news / events / prayer reminders) at `/app-api/register-device`.
- Publishing an announcement or sending a Broadcast in the admin notifies
  every registered device.
- Push needs a **physical device** (not a simulator) and a real build (not
  Expo Go) for production tokens. iOS also needs an APNs key — Codemagic's
  App Store Connect integration handles the certificate side.

## Run it locally

```bash
cd mobile
npm install
npx expo start        # press a for Android emulator, or scan the QR in Expo Go
```

The API base defaults to the deployed site. Override per build with
`EXPO_PUBLIC_API_BASE` or `expo.extra.apiBase` in `app.json`.

## Build in the cloud with Codemagic (no Mac needed)

The repo root contains `codemagic.yaml` with three workflows:

| Workflow | Output | Credentials needed |
|---|---|---|
| `android-preview` | Installable debug `.apk` | **None** — run this first |
| `android-release` | Signed `.aab` for Google Play | An upload keystore |
| `ios-release` | Signed `.ipa`, auto-submitted to TestFlight | App Store Connect API key |

### One-time setup

1. **Sign up** at [codemagic.io](https://codemagic.io) (free tier: 500 macOS
   build minutes/month) and add this GitHub repository as an application —
   choose **"Other" → codemagic.yaml**. It picks up the workflows automatically.
2. **Test on Android now:** run `android-preview`. No signing, no accounts —
   download the APK artifact and install it on any Android phone.
3. **iOS (requires the $99/yr Apple Developer account):**
   - In App Store Connect → Users & Access → Integrations, create an **API key**
     (App Manager role) and note the Issuer ID / Key ID / .p8 file.
   - In Codemagic: Teams → Integrations → **App Store Connect** → add it with
     the name **`kma-appstore`** (the name referenced in `codemagic.yaml`).
   - Create the app record in App Store Connect with bundle ID
     `org.kingstonmosque.app`.
   - Run `ios-release` — Codemagic creates the signing certificate + profile
     itself, builds the .ipa on its Macs, and submits it to **TestFlight**.
   - For push: in Apple Developer → Keys, create an **APNs key** and upload it
     to your Expo account (`npx eas credentials`) or configure FCM/APNs in your
     push provider of choice.
4. **Android release:** generate an upload keystore once:
   ```bash
   keytool -genkey -v -keystore kma.keystore -alias kma -keyalg RSA -keysize 2048 -validity 10000
   ```
   Upload it in Codemagic under Teams → Code signing identities → Android with
   the reference name **`kma_keystore`**, then run `android-release` and upload
   the `.aab` to Google Play Console ($25 one-time).

## Design system

The app uses the same identity as the website and mosque screens: deep
emerald surfaces, warm gold accents, cream type (`src/theme.ts`). Shared UI
primitives live in `src/ui.tsx` (aurora headers, glass cards, gold buttons,
haptic feedback throughout).

## Regenerate icons / splash

```bash
node mobile/scripts/generate-assets.mjs   # run from the repo root (uses sharp)
```
