/* Dynamic Expo config — merges over app.json.
 *
 * Android's map view (react-native-maps) uses Google Maps, which needs an API
 * key baked into the manifest at build time. The key comes from the
 * GOOGLE_MAPS_API_KEY environment variable (set it in Codemagic once the
 * Google Cloud key exists — "Maps SDK for Android", restricted to the app's
 * package name org.kingstonmosque.app). Without it the Android build still
 * succeeds; the map screen just shows blank tiles until the key is added.
 * iOS is unaffected — it uses Apple Maps, which needs no key. */
module.exports = ({ config }) => ({
  ...config,
  android: {
    ...config.android,
    config: {
      ...(config.android?.config ?? {}),
      googleMaps: { apiKey: process.env.GOOGLE_MAPS_API_KEY || "" },
    },
  },
});
