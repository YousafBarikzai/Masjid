import { useMemo, useState } from "react";
import { View, Text, StyleSheet, Pressable, ActivityIndicator } from "react-native";
import { WebView } from "react-native-webview";
import { Ionicons } from "@expo/vector-icons";
import { openInApp } from "./actions";
import { colors, radius, type as t } from "./theme";

/* Reliable in-app YouTube player.

   Two things make bare `<WebView source={{uri: ".../embed/ID"}}>` fail with
   "Video unavailable" on real devices:
     1. no page origin — YouTube's iframe rejects being framed with no referer;
     2. some uploaders disable embedding outright.

   So we (1) load the iframe inside our own HTML document served with a real
   https://www.youtube.com base URL — giving it a valid origin — and (2) listen
   to the IFrame API's onError and fall back to a "Watch on YouTube" button,
   which opens the video in the in-app browser (works even when embedding is
   off). Videos that CAN embed play inline; the rest are still one tap away. */

/** Pull the 11-char video id from an embed/watch URL (empty for channel-live). */
function idFrom(url: string): string {
  const m = url.match(/\/embed\/([\w-]{6,})/) || url.match(/[?&]v=([\w-]{6,})/) || url.match(/youtu\.be\/([\w-]{6,})/);
  return m ? m[1] : "";
}

/** Append query params to a URL without clobbering the ones already there. */
function withParams(url: string, params: Record<string, string>): string {
  const has = url.includes("?");
  const extra = Object.entries(params)
    .filter(([k]) => !new RegExp(`[?&]${k}=`).test(url))
    .map(([k, v]) => `${k}=${v}`)
    .join("&");
  if (!extra) return url;
  return `${url}${has ? "&" : "?"}${extra}`;
}

export function YouTubePlayer({
  embedUrl,
  watchUrl,
  style,
}: {
  embedUrl: string;
  watchUrl?: string;
  style?: object;
}) {
  const [failed, setFailed] = useState(false);

  const videoId = idFrom(embedUrl);
  // Where "Watch on YouTube" goes: an explicit watch URL, else the video's
  // watch page, else the channel-live page for the 24/7 channel embeds.
  const fallbackUrl = useMemo(() => {
    if (watchUrl) return watchUrl;
    if (videoId) return `https://www.youtube.com/watch?v=${videoId}`;
    const ch = embedUrl.match(/channel=([\w-]+)/);
    return ch ? `https://www.youtube.com/channel/${ch[1]}/live` : embedUrl;
  }, [embedUrl, watchUrl, videoId]);

  const html = useMemo(() => {
    const src = withParams(embedUrl, {
      playsinline: "1",
      rel: "0",
      modestbranding: "1",
      enablejsapi: "1",
      origin: "https://www.youtube.com",
    });
    return `<!DOCTYPE html><html><head>
<meta name="viewport" content="width=device-width, initial-scale=1, maximum-scale=1, user-scalable=no">
<style>html,body{margin:0;padding:0;height:100%;background:#000;overflow:hidden}
.wrap{position:absolute;top:0;left:0;right:0;bottom:0}iframe{border:0;width:100%;height:100%}</style>
</head><body><div class="wrap">
<iframe id="ytp" src="${src}" allow="accelerometer; autoplay; encrypted-media; gyroscope; picture-in-picture" allowfullscreen></iframe>
</div><script>
var t=document.createElement('script');t.src='https://www.youtube.com/iframe_api';document.body.appendChild(t);
function tell(m){window.ReactNativeWebView&&window.ReactNativeWebView.postMessage(m);}
window.onYouTubeIframeAPIReady=function(){try{new YT.Player('ytp',{events:{onError:function(){tell('error');}}});}catch(e){}};
</script></body></html>`;
  }, [embedUrl]);

  const open = () => openInApp(fallbackUrl);

  if (failed || !embedUrl) {
    return (
      <Pressable style={[s.frame, s.fallback, style]} onPress={open}>
        <Ionicons name="logo-youtube" size={38} color="#ff4d4d" />
        <Text style={s.fallbackTitle}>Watch on YouTube</Text>
        <Text style={s.fallbackSub}>Opens inside the app</Text>
      </Pressable>
    );
  }

  return (
    <View style={[s.frame, style]}>
      <WebView
        source={{ html, baseUrl: "https://www.youtube.com" }}
        style={s.web}
        originWhitelist={["*"]}
        allowsFullscreenVideo
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction
        domStorageEnabled
        javaScriptEnabled
        startInLoadingState
        onMessage={(e) => {
          if (e.nativeEvent.data === "error") setFailed(true);
        }}
        renderLoading={() => (
          <View style={s.loading}>
            <ActivityIndicator color={colors.gold} />
          </View>
        )}
      />
      {/* Always-available escape hatch to the full video */}
      <Pressable style={s.badge} onPress={open} hitSlop={8} accessibilityLabel="Watch on YouTube">
        <Ionicons name="open-outline" size={12} color="#fff" />
        <Text style={s.badgeText}>YouTube</Text>
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  frame: {
    aspectRatio: 16 / 9,
    borderRadius: radius.md,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.glassBorder,
    backgroundColor: "#000",
  },
  web: { flex: 1, backgroundColor: "#000" },
  loading: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#000",
  },
  fallback: { alignItems: "center", justifyContent: "center", gap: 6, backgroundColor: colors.surface },
  fallbackTitle: { color: colors.text, fontSize: t.body, fontWeight: "800" },
  fallbackSub: { color: colors.textFaint, fontSize: t.tiny },
  badge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    backgroundColor: "rgba(0,0,0,0.55)",
    borderRadius: radius.pill,
    paddingHorizontal: 9,
    paddingVertical: 4,
  },
  badgeText: { color: "#fff", fontSize: t.tiny, fontWeight: "700" },
});
