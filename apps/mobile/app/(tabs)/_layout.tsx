import { Tabs } from "expo-router";
import { Text, View } from "react-native";

type TabIconProps = {
  icon: string;
  label: string;
  focused: boolean;
};

function TabIcon({ icon, label, focused }: TabIconProps) {
  return (
    <View className="items-center justify-center pt-2">
      <Text className={`text-xl ${focused ? "" : "opacity-50"}`}>{icon}</Text>
      <Text
        className={`text-[10px] mt-0.5 ${
          focused ? "text-primary-600 font-semibold" : "text-gray-400"
        }`}
      >
        {label}
      </Text>
    </View>
  );
}

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          backgroundColor: "#ffffff",
          borderTopColor: "#e5e7eb",
          borderTopWidth: 1,
          height: 80,
          paddingBottom: 20,
          paddingTop: 4,
          elevation: 8,
          shadowColor: "#000",
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.05,
          shadowRadius: 8,
        },
        tabBarActiveTintColor: "#16a34a",
        tabBarInactiveTintColor: "#9ca3af",
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="🏠" label="Home" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="cases"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📋" label="Cases" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="appointments"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="📅" label="Appts" focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          tabBarIcon: ({ focused }) => (
            <TabIcon icon="👤" label="Profile" focused={focused} />
          ),
        }}
      />
    </Tabs>
  );
}
