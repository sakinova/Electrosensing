import { AuthContext } from "@/contexte/authContext";
import { Ionicons } from "@expo/vector-icons";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { LinearGradient } from "expo-linear-gradient";
import { Link, useRouter } from "expo-router";
import { useContext, useEffect, useState } from "react";
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";

const { width } = Dimensions.get("window");

const QUICK_ACTIONS = [
  {
    icon: "add-circle-outline" as const,
    label: "New\nSession",
    route: "/livesignal/record" as const, // going to create this screen
    color: "#2E7D32",
    gradient: ["#4CAF50", "#2E7D32"] as [string, string],
  },
  {
    icon: "time-outline" as const,
    label: "History\nLog",
    route: "/livesignal/history" as const,
    color: "#C2185B",
    gradient: ["#E91E63", "#C2185B"] as [string, string],
  },
  /*
  {
    icon: "save-outline" as const,
    label: "Save\nReading",
    route: "/save" as const,
    color: "#E64A19",
    gradient: ["#FF5722", "#E64A19"] as [string, string],
  },
  {
    icon: "download-outline" as const,
    label: "Export\nData",
    route: "/export" as const,
    color: "#1976D2",
    gradient: ["#2196F3", "#1976D2"] as [string, string],
  },
  */
];

type Session = {
  id: string;
  title: string;
  timestamp: string;
  duration: string;
  avgSignal?: number;
  peakSignal?: number;
  samplesCount: number;
  notes?: string;
};

const SESSIONS_KEY = "sessions";

export default function HomeScreen() {

  const { device, scanning, scanAndConnect, disconnect, lastValue, windowData } = useContext(AuthContext);
  const router = useRouter();
  //const [lastSession, setLastSession] = useState<Session | null>(null);
  const [recentSessions, setRecentSessions] = useState<Session[]>([]);
  
/*
  useEffect(() => {
    (async () => {
      try {
        const saved = await AsyncStorage.getItem(SESSIONS_KEY);
        if (saved) {
          const sessions: Session[] = JSON.parse(saved);
          if (sessions.length > 0) {
            // sort by timestamp so the most recent appears first
            const sorted = sessions.sort(
              (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setLastSession(sorted[0]);
          }
        }
      } catch (e) {
        console.log("Error loading sessions:", e);
      }
    })();
  }, []);

  */

  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(SESSIONS_KEY);
        if (!raw) {
          setRecentSessions([]);
          return;
        }

        const parsed: Session[] = JSON.parse(raw);

        // sort newest -> oldest
        parsed.sort(
          (a, b) =>
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
        );

        // keep only the 3 most recent
        setRecentSessions(parsed.slice(0, 3));
      } catch (e) {
        console.log("Error loading recent sessions", e);
      }
    })();
  }, []);

  return (
    <ScrollView showsVerticalScrollIndicator={false} style={{ flex: 1 }}>
      {/* Header gradient */}
      <LinearGradient colors={["#1A8E2D", "#146922"]} style={styles.header}>
        <View style={styles.headerRow}>
          <Text style={styles.headerTitle}>Device Status</Text>
        </View>
      </LinearGradient>

      {/* White status card */}
      <View style={styles.card}>
        <View style={styles.row}>
          <Ionicons name="bluetooth" size={22} color="#2f6f3e" />
          <Text style={styles.cardTitle}>
            { device ? `Connected: ${device.name}` : "No device connected"} 
          </Text>
        </View>

        <View style={styles.metaRow}>
          {device ? (
            <>
        </>
          ) : (
            <Text style={styles.meta}>
              Tap "Scan & Connect" to find your PlantSense device
            </Text>
          )}
        </View>

        {!device ? (
        <TouchableOpacity
          style={[styles.primaryBtn, scanning && { opacity: 0.6 }]}
          onPress={scanAndConnect}
          disabled={scanning}
        >
          <Text style={styles.primaryBtnText}>
            {scanning ? "Scanning…" : "Scan & Connect"}
            </Text>
        </TouchableOpacity>
        ) : (
          <TouchableOpacity 
            style={styles.disconnectBtn} 
            onPress={disconnect}
            >
            <Text style={styles.disconnectText}>Disconnect</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.content}>
        <View style={styles.quickActionsContainer}>
          <Text style={styles.actionTitle}> Quick Actions </Text>
          <View style={styles.quickActionsGrid}>
            {QUICK_ACTIONS.map((action)=> (
                <Link href={action.route} key={action.label} asChild>
                  <TouchableOpacity style={styles.actionButton}>
                    <LinearGradient colors={action.gradient} style={styles.actionGradient}>
                      <View style={styles.actionContent}>
                        <View style={styles.actionIcon}>
                          <Ionicons name={action.icon} size={24} color="white" />
                        </View>
                        <Text style={styles.actionLabel}> {action.label} </Text>
                      </View>
                    </LinearGradient>
                  </TouchableOpacity>
                </Link>
            ))}
          </View>
        </View>
      </View>

      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>Last Sessions</Text>
        {recentSessions.length > 0 && (
          <TouchableOpacity onPress={() => router.push("/livesignal/history")}>
            <Text style={styles.seeAll}>See All →</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={[styles.card, { marginTop: 12 }]}>
        {recentSessions.length === 0 ? (
          <View style={styles.emptyCard}>
            <Ionicons
              name="pulse-outline"
              size={48}
              color="#c4c4c4"
              style={{ marginBottom: 12 }}
            />
            <Text style={styles.emptyTitle}>No sessions recorded yet</Text>
            <Text style={styles.emptySubtitle}>
              Start a new session to capture live plant signals.
            </Text>
          </View>
        ) : (
          recentSessions.map((s) => (
            <TouchableOpacity
              key={s.id}
              style={{ marginBottom: 10 }}
              onPress={() => router.push(`/livesignal/history/${s.id}`)}
            >
              <Text style={styles.sessionTitle}>{s.title}</Text>
              <Text style={styles.sessionMeta}>
                {new Date(s.timestamp).toLocaleString()}
              </Text>
              <View style={styles.metaRow}>
                <Text style={styles.meta}>Duration: {s.duration}</Text>
                <Text style={styles.dot}>•</Text>
                <Text style={styles.meta}>
                  Samples: {s.samplesCount ?? "—"}
                </Text>
              </View>
              {s.notes && <Text style={styles.notes}>Notes: {s.notes}</Text>}
            </TouchableOpacity>
          ))
        )}
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  header: {
    height: 180,
    paddingTop: 80,
    paddingHorizontal: 20,
    justifyContent: "space-between",
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    width: "100%",
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "white" },

  card: {
    backgroundColor: "white",
    marginHorizontal: 20,
    marginTop: -40, // overlap gradient
    borderRadius: 16,
    padding: 16,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
  },
  row: { flexDirection: "row", alignItems: "center", gap: 8 },
  cardTitle: { fontSize: 16, fontWeight: "600", color: "#1f462a" },
  metaRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    alignItems: "center",
    gap: 6,
    marginTop: 8,
  },
  meta: { color: "#6a8b78" },
  dot: { color: "#b9c9c0" },
  disconnectBtn: {
    marginTop: 14,
    backgroundColor: "#e7f3ea",
    paddingVertical: 8,
    borderRadius: 10,
    alignItems: "center",
  },
  disconnectText: { color: "#2f6f3e", fontWeight: "700" },
  primaryBtn: {
  marginTop: 14,
  backgroundColor: "#2f6f3e",
  paddingVertical: 10,
  borderRadius: 10,
  alignItems: "center",
},
primaryBtnText: { color: "white", fontWeight: "700" },
content: {
  flex: 1,
  paddingTop: 20,
},
quickActionsContainer: {
  paddingHorizontal: 20,
  marginBottom: 25,
},
quickActionsGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  gap: 12,
  marginTop: 15,
},
actionButton: {
  width: (width - 52) / 2,
  height: 110,
  borderRadius: 16,
  overflow: "hidden",
},
actionGradient: {
  flex: 1,
  padding: 15,
},
actionIcon: {
  width: 40,
  height: 40,
  borderRadius: 12,
  backgroundColor: "rgba(255, 255, 255, 0.2)",
  justifyContent: "center",
  alignItems: "center",
},
actionLabel: {
  fontSize: 14,
  color: "white",
  fontWeight: "600",
  marginTop: 8,
},
actionTitle: {
  fontSize: 20,
  fontWeight: "700",
  color: "#1f462a",
  marginBottom: 5,
},
actionContent: {
  flex: 1,
  justifyContent: "space-between",
},
sectionHeader: {
  flexDirection: "row",
  justifyContent: "space-between",
  alignItems: "center",
  paddingHorizontal: 20,
  marginTop: 8,
  marginBottom: 6,
},
sectionTitle: { fontSize: 20, fontWeight: "700", color: "#1f462a" },
seeAll: { fontSize: 14, color: "#146922", fontWeight: "600" },

sessionTitle: { fontSize: 16, fontWeight: "700", color: "#1f462a", marginBottom: 4 },
sessionMeta: { color: "#6b7280", marginBottom: 6 },
notes: { color: "#374151", marginTop: 8 },

emptyCard: {
  backgroundColor: "white",
  borderRadius: 20,
  marginHorizontal: 0,         // full width across bottom
  marginTop: 12,
  paddingVertical: 40,
  alignItems: "center",
  justifyContent: "center",
},

emptyTitle: {
  fontSize: 16,
  fontWeight: "700",
  color: "#1f2937",
  textAlign: "center",
},

emptySubtitle: {
  marginTop: 6,
  fontSize: 14,
  color: "#6b7280",
  textAlign: "center",
  paddingHorizontal: 20,
},
});