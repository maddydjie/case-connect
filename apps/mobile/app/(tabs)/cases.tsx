import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { router } from "expo-router";
import { CaseCard } from "@/components/CaseCard";

const DEPARTMENTS = [
  "All",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "General",
];

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
  {
    id: "4",
    patientName: "Sunita Devi",
    department: "Pediatrics",
    date: "2026-04-03",
    status: "active" as const,
    summary: "Fever evaluation, blood work ordered",
  },
  {
    id: "5",
    patientName: "Mohammed Ali",
    department: "Cardiology",
    date: "2026-04-02",
    status: "discharged" as const,
    summary: "Stent placement follow-up, stable",
  },
  {
    id: "6",
    patientName: "Lakshmi Rao",
    department: "Oncology",
    date: "2026-04-02",
    status: "active" as const,
    summary: "Chemotherapy cycle 3, monitoring",
  },
];

export default function CasesScreen() {
  const [search, setSearch] = useState("");
  const [selectedDept, setSelectedDept] = useState("All");

  const filtered = MOCK_CASES.filter((c) => {
    const matchSearch =
      c.patientName.toLowerCase().includes(search.toLowerCase()) ||
      c.summary.toLowerCase().includes(search.toLowerCase());
    const matchDept =
      selectedDept === "All" || c.department === selectedDept;
    return matchSearch && matchDept;
  });

  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      {/* Header */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-gray-900 text-2xl font-bold mb-4">Cases</Text>

        {/* Search */}
        <View className="bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-4">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-base text-gray-900"
            placeholder="Search patients, cases..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        {/* Department Filter */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3 -mx-1"
        >
          {DEPARTMENTS.map((dept) => (
            <TouchableOpacity
              key={dept}
              className={`px-4 py-2 rounded-full mr-2 ${
                selectedDept === dept
                  ? "bg-primary-600"
                  : "bg-gray-100"
              }`}
              onPress={() => setSelectedDept(dept)}
            >
              <Text
                className={`text-sm font-medium ${
                  selectedDept === dept ? "text-white" : "text-gray-600"
                }`}
              >
                {dept}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Cases List */}
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="gap-3 pb-24">
          {filtered.map((c) => (
            <CaseCard
              key={c.id}
              {...c}
              onPress={() => router.push(`/case-sheet/${c.id}`)}
            />
          ))}
          {filtered.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-4xl mb-2">📭</Text>
              <Text className="text-gray-500 text-base">No cases found</Text>
            </View>
          )}
        </View>
      </ScrollView>

      {/* FAB - New Case */}
      <TouchableOpacity
        className="absolute bottom-24 right-6 w-14 h-14 bg-primary-600 rounded-full items-center justify-center shadow-lg"
        style={{
          elevation: 8,
          shadowColor: "#16a34a",
          shadowOffset: { width: 0, height: 4 },
          shadowOpacity: 0.3,
          shadowRadius: 8,
        }}
        onPress={() => router.push("/case-sheet/new")}
        activeOpacity={0.8}
      >
        <Text className="text-white text-2xl font-light">+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}
