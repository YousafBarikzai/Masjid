import { Component, type ReactNode } from "react";
import { ScrollView, Text, StyleSheet, Pressable } from "react-native";

/* Last line of defence at the app root. Without this, a render-time crash on
   a release build leaves the user staring at a frozen splash or a blank
   screen with no clue why. With it, they see a calm branded screen with the
   actual error message — which is also exactly what we need them to
   screenshot when reporting a problem. */

type Props = { children: ReactNode };
type State = { error: Error | null };

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  render() {
    if (!this.state.error) return this.props.children;
    return (
      <ScrollView style={s.root} contentContainerStyle={s.body}>
        <Text style={s.mark}>KMA</Text>
        <Text style={s.title}>Something went wrong</Text>
        <Text style={s.hint}>
          The app hit an unexpected error while starting. Please screenshot this page and send it to the mosque team —
          the message below tells us exactly what to fix.
        </Text>
        <Text style={s.err}>
          {this.state.error.message || String(this.state.error)}
        </Text>
        <Pressable style={s.btn} onPress={() => this.setState({ error: null })}>
          <Text style={s.btnText}>Try again</Text>
        </Pressable>
      </ScrollView>
    );
  }
}

const s = StyleSheet.create({
  root: { flex: 1, backgroundColor: "#081f15" },
  body: { flexGrow: 1, justifyContent: "center", padding: 28, gap: 14 },
  mark: { color: "#c9a227", fontSize: 22, fontWeight: "800", letterSpacing: 6 },
  title: { color: "#f4efe2", fontSize: 24, fontWeight: "800" },
  hint: { color: "rgba(244,239,226,0.7)", fontSize: 14, lineHeight: 21 },
  err: {
    color: "#e8d59a",
    fontSize: 13,
    lineHeight: 19,
    fontFamily: "monospace",
    backgroundColor: "rgba(0,0,0,0.35)",
    borderRadius: 10,
    padding: 14,
  },
  btn: {
    alignSelf: "flex-start",
    backgroundColor: "#c9a227",
    borderRadius: 999,
    paddingVertical: 10,
    paddingHorizontal: 22,
    marginTop: 6,
  },
  btnText: { color: "#081f15", fontSize: 15, fontWeight: "800" },
});
