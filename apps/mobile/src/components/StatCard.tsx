import { View, Text } from "react-native";

type StatCardProps = {
  icon: string;
  label: string;
  value: string;
  trend?: string;
  trendUp?: boolean;
};

export function StatCard({ icon, label, value, trend, trendUp }: StatCardProps) {
  return (
    <View className="flex-1 bg-white/15 rounded-2xl p-3">
      <Text className="text-lg mb-1">{icon}</Text>
      <Text className="text-white text-xl font-bold">{value}</Text>
      <Text className="text-primary-100 text-[10px] font-medium mt-0.5">
        {label}
      </Text>
      {trend ? (
        <Text
          className={`text-[10px] mt-1 font-medium ${
            trendUp ? "text-primary-200" : "text-yellow-300"
          }`}
        >
          {trendUp ? "↑" : "⚠"} {trend}
        </Text>
      ) : null}
    </View>
  );
}
