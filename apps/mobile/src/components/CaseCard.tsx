import { View, Text, TouchableOpacity } from "react-native";

type CaseCardProps = {
  id: string;
  patientName: string;
  department: string;
  date: string;
  status: "active" | "pending" | "discharged";
  summary?: string;
  onPress?: () => void;
};

const STATUS_STYLES: Record<
  CaseCardProps["status"],
  { bg: string; text: string; label: string }
> = {
  active: { bg: "bg-primary-100", text: "text-primary-700", label: "Active" },
  pending: { bg: "bg-yellow-100", text: "text-yellow-700", label: "Pending" },
  discharged: { bg: "bg-gray-100", text: "text-gray-600", label: "Discharged" },
};

const DEPT_COLORS: Record<string, { bg: string; text: string }> = {
  Cardiology: { bg: "bg-red-100", text: "text-red-700" },
  Neurology: { bg: "bg-purple-100", text: "text-purple-700" },
  Orthopedics: { bg: "bg-blue-100", text: "text-blue-700" },
  Pediatrics: { bg: "bg-pink-100", text: "text-pink-700" },
  Oncology: { bg: "bg-orange-100", text: "text-orange-700" },
  General: { bg: "bg-gray-100", text: "text-gray-700" },
};

export function CaseCard({
  patientName,
  department,
  date,
  status,
  summary,
  onPress,
}: CaseCardProps) {
  const statusStyle = STATUS_STYLES[status];
  const deptStyle = DEPT_COLORS[department] ?? {
    bg: "bg-gray-100",
    text: "text-gray-700",
  };

  return (
    <TouchableOpacity
      className="bg-white rounded-2xl p-4 border border-gray-100"
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View className="flex-row items-start justify-between">
        <View className="flex-1 mr-3">
          <Text className="text-gray-900 text-base font-semibold">
            {patientName}
          </Text>
          {summary ? (
            <Text
              className="text-gray-500 text-sm mt-1 leading-4"
              numberOfLines={2}
            >
              {summary}
            </Text>
          ) : null}
        </View>
        <View className={`${statusStyle.bg} px-2.5 py-1 rounded-full`}>
          <Text className={`${statusStyle.text} text-[10px] font-semibold`}>
            {statusStyle.label}
          </Text>
        </View>
      </View>

      <View className="flex-row items-center mt-3 gap-3">
        <View className={`${deptStyle.bg} px-2.5 py-1 rounded-full`}>
          <Text className={`${deptStyle.text} text-[10px] font-semibold`}>
            {department}
          </Text>
        </View>
        <Text className="text-gray-400 text-xs">{date}</Text>
      </View>
    </TouchableOpacity>
  );
}
