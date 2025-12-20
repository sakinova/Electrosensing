import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import { useEffect, useRef } from "react";
import { Animated, StyleSheet, Text, View } from "react-native";

export default function SplashScreen() {
    const fadeAnim = useRef(new Animated.Value(0)).current;
    const scaleAnim = useRef(new Animated.Value(0.5)).current;
    const router = useRouter();
    useEffect(() => {
        Animated.parallel([
            Animated.timing(fadeAnim, {
                toValue: 1,
                duration: 1000,
                useNativeDriver: true
            }),
            Animated.spring(scaleAnim, {
                toValue: 1,
                tension: 10,
                friction: 2,
                useNativeDriver: true, // to run on native thread
            }),
        ]).start();
        
        const timer = setTimeout(() => { // after 2 secs go to auth page to sign in
            router.replace("/auth");
        }, 2000)
        return () => clearTimeout(timer);
        
    }, []);

    return (
        <View style={styles.container}>
            <Animated.View style={[styles.iconContainer,
                {
                    opacity: fadeAnim,
                    transform: [{scale: scaleAnim}]
                }
            ]}>
                <Ionicons name='leaf' size={100} color = 'white'/>
                <Text style={styles.appName}>Electrosensing</Text>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#4CAF50',
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        alignItems: 'center',
    },
    appName: {
        color: 'white',
        fontSize: 32,
        fontWeight: 'bold',
        marginTop: 20,
        letterSpacing: 1,
    },
});
