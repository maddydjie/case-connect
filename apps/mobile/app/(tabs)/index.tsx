import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { StatCard } from "@/components/StatCard";
import { CaseCard } from "@/components/CaseCard";

const MOCK_CASES = [
  {
    id: "1",
    patientName: "Rajesh Kumar",
    department: "Cardiology",
    date: "2026-04-04",
    status: "active" as const,
    summary: "Chest pain evaluation, ECG pending",
  },
  {
    id: "2",
    patientName: "Priya Sharma",
    department: "Neurology",
    date: "2026-04-04",
    status: "pending" as const,
    summary: "Migraine follow-up, MRI review",
  },
  {
    id: "3",
    patientName: "Amit Patel",
    department: "Orthopedics",
    date: "2026-04-03",
    status: "discharged" as const,
    summary: "Post-op knee replacement day 3",
  },
];

export default function DashboardScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View className="bg-primary-600 px-6 pt-4 pb-8 rounded-b-3xl">
          <View className="flex-row items-center justify-between mb-4">
            <View>
              <Text className="text-primary-100 text-sm">Good morning,</Text>
              <Text className="text-white text-xl font-bold">Dr. Smith</Text>
            </View>
            <TouchableOpacity className="w-10 h-10 bg-white/20 rounded-full items-center justify-center">
              <Text className="text-lg">🔔</Text>
            </TouchableOpacity>
          </View>

          {/* Stats Cards */}
          <View className="flex-row gap-3">
            <StatCard
              icon="📊"
              label="Cases Today"
              value="12"
              trend="+3"
              trendUp={true}
            />
            <StatCard
              icon="⏳"
              label="Follow-ups"
              value="5"
              trend="2 urgent"
              trendUp={false}
            />
            <StatCard
              icon="🛏️"
              label="Bed Occ."
              value="78%"
              trend="+5%"
              trendUp={true}
            />
          </View>
        </View>

        {/* Quick Actions */}
        <View className="px-6 mt-6">
          <Text className="text-gray-900 text-lg font-bold mb-3">
            Quick Actions
          </Text>
          <View className="flex-row gap-3">
            <TouchableOpacity
              className="flex-1 bg-primary-50 border border-primary-100 rounded-2xl p-4 items-center"
              onPress={() => router.push("/case-sheet/new")}
            >
              <View className="w-12 h-12 bg-primary-100 rounded-full items-center justify-center mb-2">
                <Text className="text-2xl">📝</Text>
              </View>
              <Text className="text-primary-700 text-xs font-semibold text-center">
                New Case
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-red-50 border border-red-100 rounded-2xl p-4 items-center"
              onPress={() => router.push("/emergency")}
            >
              <View className="w-12 h-12 bg-red-100 rounded-full items-center justify-center mb-2">
                <Text className="text-2xl">🚨</Text>
              </View>
              <Text className="text-red-700 text-xs font-semibold text-center">
                Emergency
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              className="flex-1 bg-blue-50 border border-blue-100 rounded-2xl p-4 items-center"
              onPress={() => router.push("/case-sheet/new")}
            >
              <View className="w-12 h-12 bg-blue-100 rounded-full items-center justify-center mb-2">
                <Text className="text-2xl">🎙️</Text>
              </View>
              <Text className="text-blue-700 text-xs font-semibold text-center">
                Voice Record
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Cases */}
        <View className="px-6 mt-6 mb-6">
          <View className="flex-row items-center justify-between mb-3">
            <Text className="text-gray-900 text-lg font-bold">
              Recent Cases
            </Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/cases")}>
              <Text className="text-primary-600 text-sm font-medium">
                View All
              </Text>
            </TouchableOpacity>
          </View>
          <View className="gap-3">
            {MOCK_CASES.map((c) => (
              <CaseCard
                key={c.id}
                id={c.id}
                patientName={c.patientName}
                department={c.department}
                date={c.date}
                status={c.status}
                summary={c.summary}
                onPress={() => router.push(`/case-sheet/${c.id}`)}
              />
            ))}
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}
