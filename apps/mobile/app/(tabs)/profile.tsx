import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useAuthStore } from "@/stores/auth.store";

type SettingsItem = {
  icon: string;
  label: string;
  subtitle?: string;
  onPress: () => void;
  danger?: boolean;
};

export default function ProfileScreen() {
  const logout = useAuthStore((s) => s.logout);

  const handleLogout = () => {
    Alert.alert("Sign Out", "Are you sure you want to sign out?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Sign Out",
        style: "destructive",
        onPress: () => {
          logout();
          router.replace("/");
        },
      },
    ]);
  };

  const settingsSections: { title: string; items: SettingsItem[] }[] = [
    {
      title: "General",
      items: [
        {
          icon: "🔔",
          label: "Notifications",
          subtitle: "Push, email, SMS alerts",
          onPress: () => {},
        },
        {
          icon: "🔒",
          label: "Privacy & Security",
          subtitle: "Two-factor auth, data privacy",
          onPress: () => {},
        },
        {
          icon: "🌙",
          label: "Appearance",
          subtitle: "Dark mode, font size",
          onPress: () => {},
        },
      ],
    },
    {
      title: "Support",
      items: [
        {
          icon: "❓",
          label: "Help Center",
          subtitle: "FAQs and support",
          onPress: () => {},
        },
        {
          icon: "ℹ️",
          label: "About CaseConnect",
          subtitle: "Version 1.0.0",
          onPress: () => {},
        },
        {
          icon: "📄",
          label: "Terms & Conditions",
          onPress: () => {},
        },
      ],
    },
    {
      title: "",
      items: [
        {
          icon: "🚪",
          label: "Sign Out",
          onPress: handleLogout,
          danger: true,
        },
      ],
    },
  ];

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View className="bg-primary-600 px-6 pt-6 pb-10 items-center">
          <View className="w-20 h-20 bg-white/20 rounded-full items-center justify-center mb-3">
            <Text className="text-3xl">👨‍⚕️</Text>
          </View>
          <Text className="text-white text-xl font-bold">Dr. Smith</Text>
          <Text className="text-primary-100 text-sm mt-0.5">
            Senior Cardiologist
          </Text>
          <View className="bg-white/20 px-4 py-1.5 rounded-full mt-2">
            <Text className="text-white text-xs font-medium">
              Apollo Hospitals, Delhi
            </Text>
          </View>
        </View>

        {/* Stats Row */}
        <View className="flex-row mx-6 -mt-6 bg-white rounded-2xl p-4 border border-gray-100 shadow-sm">
          <View className="flex-1 items-center">
            <Text className="text-gray-900 text-xl font-bold">1,247</Text>
            <Text className="text-gray-500 text-xs">Total Cases</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-gray-900 text-xl font-bold">8.2</Text>
            <Text className="text-gray-500 text-xs">Years Exp</Text>
          </View>
          <View className="w-px bg-gray-200" />
          <View className="flex-1 items-center">
            <Text className="text-gray-900 text-xl font-bold">4.9</Text>
            <Text className="text-gray-500 text-xs">Rating</Text>
          </View>
        </View>

        {/* Settings */}
        <View className="px-6 mt-6 pb-8">
          {settingsSections.map((section, sIdx) => (
            <View key={sIdx} className="mb-4">
              {section.title ? (
                <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
                  {section.title}
                </Text>
              ) : null}
              <View className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
                {section.items.map((item, iIdx) => (
                  <TouchableOpacity
                    key={iIdx}
                    className={`flex-row items-center px-4 py-3.5 ${
                      iIdx < section.items.length - 1
                        ? "border-b border-gray-50"
                        : ""
                    }`}
                    onPress={item.onPress}
                    activeOpacity={0.6}
                  >
                    <Text className="text-lg mr-3">{item.icon}</Text>
                    <View className="flex-1">
                      <Text
                        className={`text-base font-medium ${
                          item.danger ? "text-red-600" : "text-gray-900"
                        }`}
                      >
                        {item.label}
                      </Text>
                      {item.subtitle ? (
                        <Text className="text-gray-400 text-xs mt-0.5">
                          {item.subtitle}
                        </Text>
                      ) : null}
                    </View>
                    <Text className="text-gray-300 text-lg">›</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          ))}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
