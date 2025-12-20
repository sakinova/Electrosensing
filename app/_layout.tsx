import { AuthProvider } from "@/contexte/authContext";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";

export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="light" />
      <Stack 
        screenOptions={{
          headerShown: false,
          contentStyle: {backgroundColor: "white"},
          animation: "slide_from_right",
          header: () => null,
          navigationBarHidden: true,
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
      </Stack>
    </AuthProvider>
  );
}