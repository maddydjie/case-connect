import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { router } from "expo-router";
import { SafeAreaView } from "react-native-safe-area-context";
import { useAuthStore } from "@/stores/auth.store";

export default function LoginScreen() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const login = useAuthStore((s) => s.login);

  const handleLogin = async () => {
    if (!email.trim() || !password.trim()) {
      setError("Please enter both email and password");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await login(email, password);
      router.replace("/(tabs)");
    } catch (e: any) {
      setError(e?.message || "Login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="flex-1 bg-primary-600">
      <SafeAreaView className="flex-1">
        <KeyboardAvoidingView
          behavior={Platform.OS === "ios" ? "padding" : "height"}
          className="flex-1"
        >
          <ScrollView
            contentContainerStyle={{ flexGrow: 1 }}
            keyboardShouldPersistTaps="handled"
          >
            {/* Header / Branding */}
            <View className="flex-1 items-center justify-center px-6 pt-12 pb-8">
              <View className="w-20 h-20 bg-white/20 rounded-2xl items-center justify-center mb-4">
                <Text className="text-white text-4xl font-bold">C</Text>
              </View>
              <Text className="text-white text-3xl font-bold tracking-tight">
                CaseConnect
              </Text>
              <Text className="text-primary-100 text-base mt-2 text-center">
                AI-Powered Clinical Documentation
              </Text>

              {/* Medical illustration placeholder */}
              <View className="w-48 h-36 bg-white/10 rounded-2xl mt-8 items-center justify-center">
                <Text className="text-white/60 text-5xl">🩺</Text>
                <Text className="text-white/40 text-xs mt-2">
                  Smart Healthcare
                </Text>
              </View>
            </View>

            {/* Login Form */}
            <View className="bg-white rounded-t-3xl px-6 pt-8 pb-10">
              <Text className="text-gray-900 text-2xl font-bold mb-1">
                Welcome back
              </Text>
              <Text className="text-gray-500 text-sm mb-6">
                Sign in to continue
              </Text>

              {error ? (
                <View className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 mb-4">
                  <Text className="text-red-700 text-sm">{error}</Text>
                </View>
              ) : null}

              <Text className="text-gray-700 text-sm font-medium mb-1.5">
                Email
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base mb-4"
                placeholder="doctor@hospital.com"
                placeholderTextColor="#9ca3af"
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
              />

              <Text className="text-gray-700 text-sm font-medium mb-1.5">
                Password
              </Text>
              <TextInput
                className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3.5 text-gray-900 text-base mb-2"
                placeholder="Enter your password"
                placeholderTextColor="#9ca3af"
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                autoComplete="password"
              />

              <TouchableOpacity className="self-end mb-6">
                <Text className="text-primary-600 text-sm font-medium">
                  Forgot password?
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                className={`rounded-xl py-4 items-center ${loading ? "bg-primary-400" : "bg-primary-600"}`}
                onPress={handleLogin}
                disabled={loading}
                activeOpacity={0.8}
              >
                {loading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <Text className="text-white text-base font-semibold">
                    Sign In
                  </Text>
                )}
              </TouchableOpacity>

              <View className="flex-row items-center justify-center mt-6">
                <Text className="text-gray-500 text-sm">
                  New to CaseConnect?{" "}
                </Text>
                <TouchableOpacity>
                  <Text className="text-primary-600 text-sm font-semibold">
                    Request Access
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </View>
  );
}
