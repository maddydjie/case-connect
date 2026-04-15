import { View, Text, ScrollView, TouchableOpacity } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

type Appointment = {
  id: string;
  patientName: string;
  time: string;
  type: string;
  status: "upcoming" | "in-progress" | "completed" | "cancelled";
};

type DayGroup = {
  date: string;
  label: string;
  appointments: Appointment[];
};

const STATUS_STYLES: Record<
  Appointment["status"],
  { bg: string; text: string; label: string }
> = {
  upcoming: { bg: "bg-blue-100", text: "text-blue-700", label: "Upcoming" },
  "in-progress": {
    bg: "bg-primary-100",
    text: "text-primary-700",
    label: "In Progress",
  },
  completed: { bg: "bg-gray-100", text: "text-gray-600", label: "Completed" },
  cancelled: { bg: "bg-red-100", text: "text-red-700", label: "Cancelled" },
};

const MOCK_GROUPS: DayGroup[] = [
  {
    date: "2026-04-04",
    label: "Today, April 4",
    appointments: [
      {
        id: "1",
        patientName: "Rajesh Kumar",
        time: "09:00 AM",
        type: "Follow-up",
        status: "completed",
      },
      {
        id: "2",
        patientName: "Priya Sharma",
        time: "10:30 AM",
        type: "Consultation",
        status: "in-progress",
      },
      {
        id: "3",
        patientName: "Amit Patel",
        time: "02:00 PM",
        type: "Post-op Review",
        status: "upcoming",
      },
      {
        id: "4",
        patientName: "Sunita Devi",
        time: "03:30 PM",
        type: "Lab Review",
        status: "upcoming",
      },
    ],
  },
  {
    date: "2026-04-05",
    label: "Tomorrow, April 5",
    appointments: [
      {
        id: "5",
        patientName: "Mohammed Ali",
        time: "09:30 AM",
        type: "Cardiology Check",
        status: "upcoming",
      },
      {
        id: "6",
        patientName: "Lakshmi Rao",
        time: "11:00 AM",
        type: "Chemo Cycle 4",
        status: "upcoming",
      },
    ],
  },
  {
    date: "2026-04-07",
    label: "Monday, April 7",
    appointments: [
      {
        id: "7",
        patientName: "Vikram Singh",
        time: "10:00 AM",
        type: "New Consultation",
        status: "upcoming",
      },
    ],
  },
];

export default function AppointmentsScreen() {
  return (
    <SafeAreaView className="flex-1 bg-gray-50">
      <View className="bg-white px-6 pt-4 pb-4 border-b border-gray-100">
        <Text className="text-gray-900 text-2xl font-bold">Appointments</Text>
        <Text className="text-gray-500 text-sm mt-1">
          7 appointments this week
        </Text>
      </View>

      <ScrollView className="flex-1 px-6 pt-4" showsVerticalScrollIndicator={false}>
        {MOCK_GROUPS.map((group) => (
          <View key={group.date} className="mb-6">
            <Text className="text-gray-500 text-sm font-semibold uppercase tracking-wide mb-3">
              {group.label}
            </Text>
            <View className="gap-3">
              {group.appointments.map((appt) => {
                const style = STATUS_STYLES[appt.status];
                return (
                  <TouchableOpacity
                    key={appt.id}
                    className="bg-white rounded-2xl p-4 border border-gray-100"
                    activeOpacity={0.7}
                  >
                    <View className="flex-row items-start justify-between">
                      <View className="flex-1">
                        <Text className="text-gray-900 text-base font-semibold">
                          {appt.patientName}
                        </Text>
                        <Text className="text-gray-500 text-sm mt-0.5">
                          {appt.type}
                        </Text>
                      </View>
                      <View className={`${style.bg} px-3 py-1 rounded-full`}>
                        <Text className={`${style.text} text-xs font-medium`}>
                          {style.label}
                        </Text>
                      </View>
                    </View>
                    <View className="flex-row items-center mt-3">
                      <Text className="text-gray-400 text-sm mr-1">🕐</Text>
                      <Text className="text-gray-600 text-sm font-medium">
                        {appt.time}
                      </Text>
                    </View>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>
        ))}
        <View className="h-24" />
      </ScrollView>
    </SafeAreaView>
  );
}
