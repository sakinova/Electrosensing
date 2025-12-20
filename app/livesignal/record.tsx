import { AuthContext } from "@/contexte/authContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import React, { useContext, useEffect, useMemo, useState } from "react";
import {
  Alert,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import Svg, { Path, Rect, Text as SvgText } from "react-native-svg";

type Sample = { t: number; v: number };
type Marker = { t: number; label: string };
type Session = {
  id: string;
  title: string;
  timestamp: string;
  duration: string;
  samplesCount: number;
  avg?: number;
  peak?: number;
  notes?: string;
};

const { height: SCREEN_H, width: SCREEN_W } = Dimensions.get("window");
const PAGE_PAD = 16;
const SESSIONS_KEY = "sessions";

// graph size (a bit smaller than before so buttons always fit)
const CHART_WIDTH = SCREEN_W - PAGE_PAD * 2;
const CHART_HEIGHT = Math.min(260, SCREEN_H * 0.4);

export default function RecordScreen() {
  const router = useRouter();
  const { device, lastValue, windowData, disconnect } = useContext(AuthContext);

  const [sessionTitle, setSessionTitle] = useState("New Session");
  const [isRec, setIsRec] = useState(false);
  const [startedAt, setStartedAt] = useState<number | null>(null); // epoch ms
  const [elapsedMs, setElapsedMs] = useState(0);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const insets = useSafeAreaInsets();

  // ----- TIMER ----- //
  useEffect(() => {
    if (!isRec || startedAt == null) return;

    const id = setInterval(() => {
      setElapsedMs(Date.now() - startedAt);
    }, 500);

    return () => clearInterval(id);
  }, [isRec, startedAt]);

  const duration = msToHMS(elapsedMs);

  // ----- LIVE WINDOW / GRAPH METRICS  ----- //
  const chartData = useMemo(() => {
    if (!windowData || windowData.length < 2) return null;

    const xs = windowData.map((p) => p.t);
    const ys = windowData.map((p) => p.v);

    const minX = Math.min(...xs);
    const maxX = Math.max(...xs);
    const minYRaw = Math.min(...ys);
    const maxYRaw = Math.max(...ys);

    const spanX = maxX - minX || 1;

     // ---- NEW: enforce a minimum vertical span to "zoom out" ---- //
    const rawSpanY = maxYRaw - minYRaw || 1;
    const MIN_SPAN = 100; // mV – tweak this up/down to taste (50, 100, 200…)
    let spanY = Math.max(rawSpanY, MIN_SPAN);

    // add some padding so trace isn't glued to edges
    const padY = spanY * 0.2;
    spanY = spanY + padY * 2;

    // center this span around the mid value of the signal
    const midY = (minYRaw + maxYRaw) / 2;
    const minY = midY - spanY / 2;
    const maxY = midY + spanY / 2;


    // build SVG path
    let d = "";
    windowData.forEach((p, i) => {
      const x = ((p.t - minX) / spanX) * CHART_WIDTH;
      const y =
        CHART_HEIGHT - ((p.v - minY) / spanY) * CHART_HEIGHT;

      d += (i === 0 ? "M" : " L") + ` ${x} ${y}`;
    });

    return { d, minX, maxX, minY, maxY, spanX, spanY };
  }, [windowData]);

  // samples that occurred after recording started
  const recSamples: Sample[] = useMemo(() => {
    if (!isRec || startedAt == null) return [];
    return windowData.filter((s) => s.t >= startedAt);
  }, [isRec, startedAt, windowData]);

  const onStart = () => {
    if (!device) {
      Alert.alert("Not connected", "Connect your PlantSense device first.");
      return;
    }
    setMarkers([]);
    // anchor to current time base used in windowData (epoch ms)
    const now = Date.now();
    setStartedAt(now);
    setElapsedMs(0);
    setIsRec(true);
  };

  const onStopAndSave = async () => {
    if (!isRec || !startedAt) return;
    setIsRec(false);

    if (recSamples.length === 0) {
      Alert.alert("Nothing to save", "No samples were captured.");
      return;
    }

    // make timestamps relative to first recorded sample
    const baseT = recSamples[0].t;
    const relSamples: Sample[] = recSamples.map((s) => ({
      t: s.t - baseT,
      v: s.v,
    }));

    const relMarkers: Marker[] = markers.map((m) => ({
      t: m.t - startedAt,
      label: m.label,
    }));

    const vs = recSamples.map((s) => s.v);
    const avg = vs.reduce((a, b) => a + b, 0) / vs.length;
    const peak = Math.max(...vs);
    const durMs = Date.now() - startedAt;

    const id = String(Date.now());
    const meta: Session = {
      id,
      title: sessionTitle.trim() || "New Session",
      timestamp: new Date(startedAt).toISOString(),
      duration: msToHMS(durMs),
      samplesCount: vs.length,
      avg: +avg.toFixed(3),
      peak: +peak.toFixed(3),
    };

    const existing: Session[] = JSON.parse(
      (await AsyncStorage.getItem(SESSIONS_KEY)) || "[]"
    );

    await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify([...existing, meta]));
    await AsyncStorage.setItem(`samples:${id}`, JSON.stringify(relSamples));
    await AsyncStorage.setItem(`markers:${id}`, JSON.stringify(relMarkers));

    Alert.alert("Saved", `${vs.length} samples stored to History.`);
    setSessionTitle("New Session");
    setElapsedMs(0);
  };

  const addMarker = (label: string) => {
    if (!isRec) return;
    setMarkers((m) => [...m, { t: Date.now(), label }]);
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8faf9" }}>
      <ScrollView
        contentInsetAdjustmentBehavior="always"
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{
          paddingTop: PAGE_PAD,
          paddingHorizontal: PAGE_PAD,
          paddingBottom: Math.max(PAGE_PAD, insets.bottom + 16),
          gap: 12,
        }}
      >
        {/* Top bar: Back + connection pill */}
        <View style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
            <Ionicons name="chevron-back" size={22} color="#1f462a" />
            <Text style={styles.backText}>Home</Text>
          </TouchableOpacity>

          <View style={styles.connPill}>
            <View
              style={[
                styles.connDot,
                { backgroundColor: device ? "#16a34a" : "#dc2626" },
              ]}
            />
            <Text style={styles.connText}>
              {device ? device.name : "No device"}
            </Text>
            {device && (
              <TouchableOpacity onPress={disconnect} style={styles.connAction}>
                <Text style={styles.connActionText}>Disconnect</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* timer + samples */}
        <View style={styles.timerRow}>
          <Text style={styles.timer}>{duration}</Text>
          <Text style={styles.small}>Samples: {recSamples.length}</Text>
        </View>

        {/* session title input */}
        <View style={styles.titleRow}>
          <Text style={styles.titleLabel}>Session title</Text>
          <TextInput
            style={styles.titleInput}
            placeholder="New Session"
            value={sessionTitle}
            onChangeText={setSessionTitle}
            placeholderTextColor="#9ca3af"
          />
        </View>

        {/* chart */}
        <View style={[styles.chart, { minHeight: CHART_HEIGHT + 40 }]}>
          <Text style={styles.chartLabel}>
            {lastValue != null
              ? `${lastValue.toFixed(3)} mV`
              : "Waiting for data…"}
          </Text>

          {!chartData ? (
            <Text style={{ marginTop: 12, color: "#9ca3af" }}>
              Stimulate it to see changes over time.
            </Text>
          ) : (
            <Svg
              width="100%"
              height={CHART_HEIGHT}
              viewBox={`0 0 ${CHART_WIDTH} ${CHART_HEIGHT}`}
              style={{ marginTop: 8 }}
            >
              {/* background */}
              <Rect
                x={0}
                y={0}
                width={CHART_WIDTH}
                height={CHART_HEIGHT}
                fill="white"
                rx={8}
              />

              {/* horizontal grid + Y labels (dynamic) */}
              {Array.from({ length: 5 }).map((_, i) => {
                const value =
                  chartData.minY +
                  (chartData.spanY * i) / 4; // bottom->top
                const y =
                  CHART_HEIGHT -
                  ((value - chartData.minY) / chartData.spanY) * CHART_HEIGHT;

                return (
                  <React.Fragment key={`y-${i}`}>
                    <Path
                      d={`M 0 ${y} L ${CHART_WIDTH} ${y}`}
                      stroke="#e5e7eb"
                      strokeWidth={1}
                      strokeDasharray="4 4"
                    />
                    <SvgText
                      fill="#6b7280"
                      fontSize={10}
                      x={4}
                      y={y - 2}
                    >
                      {value.toFixed(0)} mV
                    </SvgText>
                  </React.Fragment>
                );
              })}

              {/* vertical grid + X labels in seconds (dynamic) */}
              {Array.from({ length: 5 }).map((_, i) => {
                const t =
                  chartData.minX +
                  (chartData.spanX * i) / 4; // left->right
                const x =
                  ((t - chartData.minX) / chartData.spanX) * CHART_WIDTH;

                return (
                  <Path
                    key={`x-${i}`}
                    d={`M ${x} 0 L ${x} ${CHART_HEIGHT}`}
                    stroke="#f3f4f6"
                    strokeWidth={1}
                  />
                );
              })}

              {/* signal path */}
              <Path
                d={chartData.d}
                stroke="#16a34a"
                strokeWidth={2}
                fill="none"
              />
            </Svg>
          )}
        </View>

        {/* markers */}
        <View style={styles.markerRow}>
          {["Stimulus", "Touch", "Light", "Other"].map((l) => (
            <TouchableOpacity
              key={l}
              style={styles.marker}
              onPress={() => addMarker(l)}
              disabled={!isRec}
            >
              <Text style={styles.markerText}>{l}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* controls */}
        <View style={styles.controlsRow}>
          <TouchableOpacity
            style={[styles.btn, isRec && styles.btnDisabled]}
            onPress={onStart}
            disabled={isRec}
          >
            <Ionicons name="radio-button-on" size={18} color="white" />
            <Text style={styles.btnText}>Start</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.btn, !isRec && styles.btnDisabled]}
            onPress={onStopAndSave}
            disabled={!isRec}
          >
            <Ionicons name="stop" size={18} color="white" />
            <Text style={styles.btnText}>Stop & Save</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

/* helpers */
function msToHMS(ms: number) {
  const s = Math.floor(ms / 1000);
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${r.toString().padStart(2, "0")}`;
}

/* styles (same as yours, with a couple of extras already included) */
const styles = StyleSheet.create({
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  backBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 2,
    paddingVertical: 6,
    paddingRight: 6,
  },
  backText: {
    color: "#1f462a",
    fontWeight: "700",
  },
  connPill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderRadius: 999,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: "#ecf7ef",
  },
  connDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  connText: {
    color: "#1f462a",
    fontWeight: "600",
    maxWidth: 180,
  },
  connAction: {
    marginLeft: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "#e7f3ea",
    borderRadius: 8,
  },
  connActionText: {
    color: "#1f462a",
    fontWeight: "700",
    fontSize: 12,
  },

  timerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-end",
  },
  timer: { fontSize: 32, fontWeight: "800", color: "#1f462a" },
  small: { color: "#6b7280" },

  chart: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 12,
    justifyContent: "center",
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  chartLabel: { color: "#6b7280", textAlign: "center" },

  markerRow: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  marker: {
    backgroundColor: "#e7f3ea",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
  },
  markerText: { color: "#1f462a", fontWeight: "600" },

  controlsRow: { flexDirection: "row", gap: 12, marginTop: 4 },
  btn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: "#2f6f3e",
  },
  btnDisabled: { backgroundColor: "#cbd5e1" },
  btnText: { color: "white", fontWeight: "700" },

  titleRow: {
    marginTop: 8,
    marginBottom: 4,
  },
  titleLabel: {
    fontSize: 12,
    fontWeight: "600",
    color: "#6b7280",
    marginBottom: 4,
  },
  titleInput: {
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#d1d5db",
    paddingHorizontal: 10,
    paddingVertical: 6,
    fontSize: 14,
    color: "#111827",
    backgroundColor: "white",
  },
});
