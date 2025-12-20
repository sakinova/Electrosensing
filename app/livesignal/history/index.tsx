import AsyncStorage from "@react-native-async-storage/async-storage";
import { useRouter } from "expo-router";
import { useEffect, useState } from "react";
import { FlatList, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";


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

export default function HistoryScreen() {
    const [sessions, setSessions] =
    useState<Session[]>([]);
    const router = useRouter();

    useEffect(() => {
        (async() => {
            const raw = await AsyncStorage.getItem("sessions");
            if (!raw) return;
            const parsed: Session[] = JSON.parse(raw);
            
            // Sort newest -> oldest
            parsed.sort(
                (a, b) =>
                    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
            );
            setSessions(parsed);
        })();
    }, []);

    //console.log("vbvb",sessions.filter(m=> m.id==="1763063928914"))
    //session[0].id => example of accessing the informations 
    return (
        <SafeAreaView style = {{ flex: 1, padding: 16, backgroundColor: "white"}}>
            <Text style = {styles.title}>History</Text>

            <FlatList
                data = {sessions}
                keyExtractor={(s) => s.id}
                ItemSeparatorComponent={() => <View style={{height: 8}} />}
                renderItem={({ item }) => {
                    return <TouchableOpacity
                        style={styles.card}
                        onPress={() => router.push(`/livesignal/history/${item.id}`)}
                    >
                        <Text style={styles.cardTitle}>{item.title}</Text>
                        <Text style={styles.meta}>{new Date(item.timestamp).toLocaleString()}</Text>
                        <Text style={styles.meta}>
                            Duration: {item.duration} • Samples: {item.samplesCount}
                        </Text>
                    </TouchableOpacity>
                }}
            />
        </SafeAreaView>
    );
}

const styles = StyleSheet.create ({
    title: {
        fontSize: 22,
        fontWeight: "700",
        marginBottom: 12,
        color: "#1f462a",
    },
    card: {
        padding: 12,
        borderRadius: 12,
        backgroundColor: "#f8faf9",
    },
    cardTitle: {
        fontSize: 16,
        fontWeight: "700",
        color: "#1f462a",
    },
    meta: {
        fontSize: 12,
        color: "#6b7280",
        marginTop: 2,
    },
});