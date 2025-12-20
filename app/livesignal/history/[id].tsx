import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { File, Paths } from 'expo-file-system';
import { useLocalSearchParams, useRouter } from "expo-router";
import { useEffect, useState } from "react";
import {
  Alert,
  ScrollView,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Sample = { t: number; v: number };
type Marker = { t: number; label: string };
type SessionMeta = {
  id: string; //unique ID generated from date.now()
  title: string; // name set by user
  timestamp: string;
  duration: string;
  samplesCount: number;
  avg?: number; //optional
  peak?: number;
  notes?: string;
};

const SESSIONS_KEY = "sessions"; // async key where app stores array of all session object

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string}>();
  const router = useRouter();

  const [meta, setMeta] = useState<SessionMeta | null>(null);
  const [samples, setSamples] = useState<Sample[]>([]);
  const [markers, setMarkers] = useState<Marker[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    (async () => {
      try {
        // load metadata list, then pick the one with this id
        const raw = await AsyncStorage.getItem(SESSIONS_KEY);
        const all: SessionMeta[] = raw ? JSON.parse(raw) : [];
        const m = all.find((s) => s.id === id) || null;
        setMeta(m);

        // load samples + markers
        const sRaw = await AsyncStorage.getItem(`samples:${id}`);
        const mRaw = await AsyncStorage.getItem(`markers:${id}`);
        setSamples(sRaw ? JSON.parse(sRaw) : []);
        setMarkers(mRaw ? JSON.parse(mRaw) : []);
      } catch (e) {
        console.log("Error loading session detail", e);
        Alert.alert("Error", "Unable to load this session.");
      } finally {
        setLoading(false);
      }
    })();
  }, [id]);

  const onRenameTitle = () => {
  if (!meta) return;

  // iOS-only Alert.prompt, fine for now
  Alert.prompt(
    "Rename session",
    "Enter a new title.",
    async (text) => {
      const newTitle = text?.trim();
      if (!newTitle) return;

      try {
        const raw = await AsyncStorage.getItem(SESSIONS_KEY);
        const all: SessionMeta[] = raw ? JSON.parse(raw) : [];
        const updated = all.map((s) =>
          s.id === meta.id ? { ...s, title: newTitle } : s
        );
        await AsyncStorage.setItem(SESSIONS_KEY, JSON.stringify(updated));
        setMeta((prev) => (prev ? { ...prev, title: newTitle } : prev));
      } catch (e) {
        console.log("rename error", e);
        Alert.alert("Error", "Unable to rename this session.");
      }
    },
    "plain-text",
    meta.title
  );
};



  const onExportCsv = async () => {
    if (!meta) return;
    try {
      // basic CSV: metadata, samples, markers
      let csv = "";

      csv += "Session ID," + meta.id + "\n";
      csv += "Title," + (meta.title ?? "") + "\n";
      csv += "Timestamp," + meta.timestamp + "\n";
      csv += "Duration," + meta.duration + "\n";
      csv += "Mean (mV)," + (meta.avg ?? "") + "\n";
      csv += "Peak (mV)," + (meta.peak ?? "") + "\n\n";

      csv += "Samples\n";
      csv += "t_ms,value_mV\n";

      for (const s of samples) {
        csv += `${s.t},${s.v}\n`;
      }

      csv += "\nMarkers\n";
      csv += "t_ms,label\n";
      for (const m of markers) {
        csv += `${m.t},${m.label}\n`;
      }

      // creating temporary file in cache
      const file = new File(Paths.cache,`session-${meta.id}.csv`);
      // file.create(); // create file
      file.write(csv); // write CSV text

      //console.log("CSV saved: ", file.uri)
      console.log("Content preview: ", file.textSync());

      await Share.share({
        url: file.uri, // the file:// URI we just wrote
        title: "Export session CSV",
        message: `CSV export for session "${meta.title ?? meta.id}"`,
    });

    } catch (e) {
      console.log("export error", e);
      Alert.alert("Export failed", "Unable to export this session.");
    }
  };

  const onDelete = async () => {
    if (!id) return;
    Alert.alert(
      "Delete session?",
      "This will permanently remove the session and its data.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const raw = await AsyncStorage.getItem(SESSIONS_KEY);
              const all: SessionMeta[] = raw ? JSON.parse(raw) : [];
              const remaining = all.filter((s) => s.id !== id);
              await AsyncStorage.setItem(
                SESSIONS_KEY,
                JSON.stringify(remaining)
              );
              await AsyncStorage.removeItem(`samples:${id}`);
              await AsyncStorage.removeItem(`markers:${id}`);
              router.back();
            } catch (e) {
              console.log("delete error", e);
              Alert.alert("Error", "Unable to delete this session.");
            }
          },
        },
      ]
    );
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <Text>Loading session…</Text>
      </View>
    );
  }

  if (!meta) {
    return (
      <View style={styles.center}>
        <Text>Session not found.</Text>
      </View>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#f8faf9" }}>
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f8faf9" }}
      contentContainerStyle={{ padding: 16, paddingBottom: 32, gap: 12 }}
    >
      {/* top bar */}
      <View style={styles.topBar}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={22} color="#1f462a" />
          <Text style={styles.backText}>History</Text>
        </TouchableOpacity>
      </View>

      {/* summary card */}
      <View style={styles.card}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center"}}>
          <Text style={styles.title}>{meta.title}</Text>
          <TouchableOpacity onPress={onRenameTitle}>
            <Ionicons name="pencil" size={18} color="#1f462a" />
          </TouchableOpacity>
        </View>
        <Text style={styles.timestamp}>{meta.timestamp}</Text>

        <View style={styles.row}>
          <Text style={styles.meta}>
            Duration: <Text style={styles.metaStrong}>{meta.duration}</Text>
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.meta}>
            Mean:{" "}
            <Text style={styles.metaStrong}>
              {meta.avg != null ? `${meta.avg} mV` : "—"}
            </Text>
          </Text>
          <Text style={styles.dot}>•</Text>
          <Text style={styles.meta}>
            Peak:{" "}
            <Text style={styles.metaStrong}>
              {meta.peak != null ? `${meta.peak} mV` : "—"}
            </Text>
          </Text>
        </View>

        <View style={styles.row}>
          <Text style={styles.meta}>
            Samples:{" "}
            <Text style={styles.metaStrong}>
              {meta.samplesCount ?? samples.length}
            </Text>
          </Text>
        </View>
      </View>

      {/* simple chart placeholder */}
      <View style={styles.chart}>
        <Text style={styles.chartLabel}>
          {/* you can replace this with real SVG chart later */}
          {samples.length
            ? "Preview of voltage over time (graph placeholder)"
            : "No samples to display."}
        </Text>
      </View>

      {/* markers summary (optional) */}
      {!!markers.length && (
        <View style={styles.card}>
          <Text style={styles.sectionTitle}>Markers</Text>
          {markers.map((m) => (
            <Text key={m.t} style={styles.markerLine}>
              • {m.label} at {m.t}
            </Text>
          ))}
        </View>
      )}

      {/* actions */}
      <View style={styles.actionsRow}>
        <TouchableOpacity
          style={[styles.btn, styles.primaryBtn]}
          onPress={onExportCsv}
        >
          <Ionicons name="download-outline" size={18} color="white" />
          <Text style={styles.btnText}>Export as CSV</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.btn, styles.deleteBtn]}
          onPress={onDelete}
        >
          <Ionicons name="trash-outline" size={18} color="white" />
          <Text style={styles.btnText}>Delete</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: "#f8faf9",
    alignItems: "center",
    justifyContent: "center",
  },
  topBar: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 4,
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
  card: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  title: { fontSize: 18, fontWeight: "700", color: "#1f462a" },
  timestamp: { marginTop: 4, color: "#6b7280" },
  row: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    marginTop: 6,
    flexWrap: "wrap",
  },
  meta: { color: "#6b7280" },
  metaStrong: { fontWeight: "700", color: "#1f2937" },
  dot: { color: "#b9c9c0" },

  chart: {
    backgroundColor: "white",
    borderRadius: 16,
    padding: 16,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  chartLabel: { color: "#6b7280", textAlign: "center" },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f462a",
    marginBottom: 6,
  },
  markerLine: { color: "#374151", marginTop: 2 },

  actionsRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 4,
  },
  btn: {
    flex: 1,
    flexDirection: "row",
    gap: 8,
    justifyContent: "center",
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 12,
  },
  primaryBtn: { backgroundColor: "#2f6f3e" },
  deleteBtn: { backgroundColor: "#dc2626" },
  btnText: { color: "white", fontWeight: "700" },
});
