import "../global.css";
import { useEffect } from "react";
import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { GestureHandlerRootView } from "react-native-gesture-handler";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5,
      retry: 2,
    },
  },
});

export default function RootLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <QueryClientProvider client={queryClient}>
          <StatusBar style="light" />
          <Stack
            screenOptions={{
              headerShown: false,
              contentStyle: { backgroundColor: "#ffffff" },
              animation: "slide_from_right",
            }}
          >
            <Stack.Screen name="index" />
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="case-sheet/new"
              options={{
                headerShown: true,
                title: "New Case Sheet",
                headerStyle: { backgroundColor: "#16a34a" },
                headerTintColor: "#fff",
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="case-sheet/[id]"
              options={{
                headerShown: true,
                title: "Case Details",
                headerStyle: { backgroundColor: "#16a34a" },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="emergency"
              options={{
                headerShown: true,
                title: "Emergency",
                headerStyle: { backgroundColor: "#dc2626" },
                headerTintColor: "#fff",
                presentation: "modal",
              }}
            />
            <Stack.Screen
              name="health-vault"
              options={{
                headerShown: true,
                title: "Health Vault",
                headerStyle: { backgroundColor: "#16a34a" },
                headerTintColor: "#fff",
              }}
            />
            <Stack.Screen
              name="triage"
              options={{
                headerShown: true,
                title: "Triage Assessment",
                headerStyle: { backgroundColor: "#16a34a" },
                headerTintColor: "#fff",
                presentation: "modal",
              }}
            />
          </Stack>
        </QueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
