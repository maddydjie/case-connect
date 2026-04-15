import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
} from "react-native";

type RecordType = "All" | "Lab" | "Imaging" | "Prescription" | "Discharge";

type HealthRecord = {
  id: string;
  title: string;
  type: RecordType;
  date: string;
  doctor: string;
  hospital: string;
  summary: string;
};

const RECORD_STYLES: Record<string, { bg: string; text: string; icon: string }> = {
  Lab: { bg: "bg-blue-100", text: "text-blue-700", icon: "🧪" },
  Imaging: { bg: "bg-purple-100", text: "text-purple-700", icon: "📷" },
  Prescription: { bg: "bg-green-100", text: "text-green-700", icon: "💊" },
  Discharge: { bg: "bg-orange-100", text: "text-orange-700", icon: "📋" },
};

const MOCK_RECORDS: HealthRecord[] = [
  {
    id: "1",
    title: "Complete Blood Count",
    type: "Lab",
    date: "2026-04-03",
    doctor: "Dr. Smith",
    hospital: "Apollo Hospitals",
    summary: "Hemoglobin 13.5, WBC 7800, Platelets 250000",
  },
  {
    id: "2",
    title: "Chest X-Ray PA View",
    type: "Imaging",
    date: "2026-04-02",
    doctor: "Dr. Gupta",
    hospital: "Apollo Hospitals",
    summary: "No active lung pathology. Cardiomegaly noted.",
  },
  {
    id: "3",
    title: "Cardiac Medications",
    type: "Prescription",
    date: "2026-04-01",
    doctor: "Dr. Smith",
    hospital: "Apollo Hospitals",
    summary: "Aspirin 75mg OD, Metoprolol 50mg BD, Atorvastatin 40mg HS",
  },
  {
    id: "4",
    title: "ECG Report",
    type: "Lab",
    date: "2026-03-28",
    doctor: "Dr. Smith",
    hospital: "Apollo Hospitals",
    summary: "Normal sinus rhythm, HR 78bpm, no ST changes",
  },
  {
    id: "5",
    title: "Discharge Summary - March",
    type: "Discharge",
    date: "2026-03-25",
    doctor: "Dr. Patel",
    hospital: "Max Hospital",
    summary: "Post cardiac catheterization, stable, follow-up in 2 weeks",
  },
];

const FILTERS: RecordType[] = ["All", "Lab", "Imaging", "Prescription", "Discharge"];

export default function HealthVaultScreen() {
  const [search, setSearch] = useState("");
  const [activeFilter, setActiveFilter] = useState<RecordType>("All");

  const filtered = MOCK_RECORDS.filter((r) => {
    const matchSearch =
      r.title.toLowerCase().includes(search.toLowerCase()) ||
      r.summary.toLowerCase().includes(search.toLowerCase());
    const matchFilter = activeFilter === "All" || r.type === activeFilter;
    return matchSearch && matchFilter;
  });

  return (
    <View className="flex-1 bg-gray-50">
      {/* Search & Filters */}
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <View className="bg-gray-50 border border-gray-200 rounded-xl flex-row items-center px-4">
          <Text className="text-gray-400 mr-2">🔍</Text>
          <TextInput
            className="flex-1 py-3 text-base text-gray-900"
            placeholder="Search records..."
            placeholderTextColor="#9ca3af"
            value={search}
            onChangeText={setSearch}
          />
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          className="mt-3"
        >
          {FILTERS.map((filter) => (
            <TouchableOpacity
              key={filter}
              className={`px-4 py-2 rounded-full mr-2 ${
                activeFilter === filter ? "bg-primary-600" : "bg-gray-100"
              }`}
              onPress={() => setActiveFilter(filter)}
            >
              <Text
                className={`text-sm font-medium ${
                  activeFilter === filter ? "text-white" : "text-gray-600"
                }`}
              >
                {filter}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Records List */}
      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        <View className="gap-3 pb-8">
          {filtered.map((record) => {
            const style = RECORD_STYLES[record.type] ?? RECORD_STYLES.Lab;
            return (
              <TouchableOpacity
                key={record.id}
                className="bg-white rounded-2xl p-4 border border-gray-100"
                activeOpacity={0.7}
              >
                <View className="flex-row items-start">
                  <View className={`w-10 h-10 ${style.bg} rounded-xl items-center justify-center mr-3`}>
                    <Text className="text-lg">{style.icon}</Text>
                  </View>
                  <View className="flex-1">
                    <View className="flex-row items-center justify-between">
                      <Text className="text-gray-900 text-base font-semibold flex-1 mr-2">
                        {record.title}
                      </Text>
                      <View className={`${style.bg} px-2 py-0.5 rounded-full`}>
                        <Text className={`${style.text} text-[10px] font-semibold`}>
                          {record.type}
                        </Text>
                      </View>
                    </View>
                    <Text className="text-gray-500 text-xs mt-1">
                      {record.doctor} · {record.hospital}
                    </Text>
                    <Text className="text-gray-600 text-sm mt-2 leading-4">
                      {record.summary}
                    </Text>
                    <Text className="text-gray-400 text-xs mt-2">
                      {record.date}
                    </Text>
                  </View>
                </View>
              </TouchableOpacity>
            );
          })}
          {filtered.length === 0 && (
            <View className="items-center py-12">
              <Text className="text-4xl mb-2">📂</Text>
              <Text className="text-gray-500 text-base">No records found</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
