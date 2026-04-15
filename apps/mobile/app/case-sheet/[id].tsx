import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { useLocalSearchParams, router } from "expo-router";

const MOCK_CASE = {
  id: "1",
  patientName: "Rajesh Kumar",
  age: 54,
  gender: "Male",
  department: "Cardiology",
  admissionDate: "2026-04-04",
  status: "active",
  doctor: "Dr. Smith",
  chiefComplaint: "Chest pain radiating to left arm, onset 2 hours ago",
  vitals: {
    bp: "140/90",
    pulse: "88",
    temp: "98.6°F",
    spo2: "96%",
    rr: "18",
  },
  history:
    "Patient has a history of hypertension (10 years), Type 2 DM (5 years). Previous MI in 2023. Currently on Aspirin 75mg, Metoprolol 50mg, Atorvastatin 40mg.",
  examination:
    "Patient is anxious, diaphoretic. Cardiovascular: S1, S2 heard. No murmurs. Chest: bilateral clear. Abdomen: soft, non-tender.",
  investigations: [
    { name: "ECG", status: "Completed", result: "ST elevation in V1-V4" },
    { name: "Troponin I", status: "Pending", result: "Awaiting" },
    { name: "CBC", status: "Completed", result: "Within normal limits" },
    { name: "Echo", status: "Scheduled", result: "-" },
  ],
  plan: "1. Start Heparin drip\n2. Cardiology consultation stat\n3. Serial troponins q6h\n4. Monitor on telemetry\n5. NPO, IV fluids",
};

type InvestigationStatus = "Completed" | "Pending" | "Scheduled";

const INV_STYLES: Record<
  InvestigationStatus,
  { bg: string; text: string }
> = {
  Completed: { bg: "bg-primary-100", text: "text-primary-700" },
  Pending: { bg: "bg-yellow-100", text: "text-yellow-700" },
  Scheduled: { bg: "bg-blue-100", text: "text-blue-700" },
};

export default function CaseDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      showsVerticalScrollIndicator={false}
    >
      {/* Patient Header */}
      <View className="bg-white px-6 py-5 border-b border-gray-100">
        <View className="flex-row items-center justify-between">
          <View>
            <Text className="text-gray-900 text-xl font-bold">
              {MOCK_CASE.patientName}
            </Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              {MOCK_CASE.age}y / {MOCK_CASE.gender} · Case #{id}
            </Text>
          </View>
          <View className="bg-primary-100 px-3 py-1.5 rounded-full">
            <Text className="text-primary-700 text-xs font-semibold capitalize">
              {MOCK_CASE.status}
            </Text>
          </View>
        </View>
        <View className="flex-row mt-3 gap-4">
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs mr-1">🏥</Text>
            <Text className="text-gray-600 text-xs">{MOCK_CASE.department}</Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs mr-1">📅</Text>
            <Text className="text-gray-600 text-xs">
              {MOCK_CASE.admissionDate}
            </Text>
          </View>
          <View className="flex-row items-center">
            <Text className="text-gray-400 text-xs mr-1">👨‍⚕️</Text>
            <Text className="text-gray-600 text-xs">{MOCK_CASE.doctor}</Text>
          </View>
        </View>
      </View>

      <View className="px-6 py-4 gap-4">
        {/* Chief Complaint */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
            Chief Complaint
          </Text>
          <Text className="text-gray-900 text-sm leading-5">
            {MOCK_CASE.chiefComplaint}
          </Text>
        </View>

        {/* Vitals */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
            Vitals
          </Text>
          <View className="flex-row flex-wrap gap-3">
            {Object.entries(MOCK_CASE.vitals).map(([key, val]) => (
              <View key={key} className="bg-gray-50 rounded-xl px-3 py-2 min-w-[72px]">
                <Text className="text-gray-400 text-[10px] uppercase font-medium">
                  {key}
                </Text>
                <Text className="text-gray-900 text-sm font-bold">{val}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* History */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
            History
          </Text>
          <Text className="text-gray-800 text-sm leading-5">
            {MOCK_CASE.history}
          </Text>
        </View>

        {/* Examination */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
            Examination
          </Text>
          <Text className="text-gray-800 text-sm leading-5">
            {MOCK_CASE.examination}
          </Text>
        </View>

        {/* Investigations */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-3">
            Investigations
          </Text>
          <View className="gap-2.5">
            {MOCK_CASE.investigations.map((inv, idx) => {
              const style =
                INV_STYLES[inv.status as InvestigationStatus] ?? INV_STYLES.Pending;
              return (
                <View
                  key={idx}
                  className="flex-row items-center justify-between py-2 border-b border-gray-50 last:border-0"
                >
                  <View className="flex-1">
                    <Text className="text-gray-900 text-sm font-medium">
                      {inv.name}
                    </Text>
                    <Text className="text-gray-500 text-xs mt-0.5">
                      {inv.result}
                    </Text>
                  </View>
                  <View className={`${style.bg} px-2.5 py-1 rounded-full`}>
                    <Text className={`${style.text} text-[10px] font-semibold`}>
                      {inv.status}
                    </Text>
                  </View>
                </View>
              );
            })}
          </View>
        </View>

        {/* Plan */}
        <View className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
          <Text className="text-primary-700 text-xs font-semibold uppercase tracking-wide mb-2">
            Treatment Plan
          </Text>
          <Text className="text-primary-900 text-sm leading-5">
            {MOCK_CASE.plan}
          </Text>
        </View>

        {/* Action Buttons */}
        <View className="flex-row gap-3 mt-2 mb-8">
          <TouchableOpacity
            className="flex-1 bg-primary-600 rounded-xl py-3.5 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-white text-sm font-semibold">
              Update Notes
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            className="flex-1 bg-white border border-gray-200 rounded-xl py-3.5 items-center"
            activeOpacity={0.8}
          >
            <Text className="text-gray-700 text-sm font-semibold">
              Share Case
            </Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
}
