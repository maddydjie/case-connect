import { useState } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";
import { router } from "expo-router";
import { VoiceRecorder } from "@/components/VoiceRecorder";

const DEPARTMENTS = [
  "General Medicine",
  "Cardiology",
  "Neurology",
  "Orthopedics",
  "Pediatrics",
  "Oncology",
  "Pulmonology",
  "Gastroenterology",
];

export default function NewCaseSheetScreen() {
  const [patientName, setPatientName] = useState("");
  const [age, setAge] = useState("");
  const [gender, setGender] = useState<"M" | "F" | "O" | "">("");
  const [department, setDepartment] = useState("");
  const [showDeptPicker, setShowDeptPicker] = useState(false);
  const [chiefComplaint, setChiefComplaint] = useState("");
  const [transcription, setTranscription] = useState("");
  const [isRecording, setIsRecording] = useState(false);

  const handleTranscription = (text: string) => {
    setTranscription((prev) => (prev ? prev + " " + text : text));
  };

  const handleSubmit = () => {
    if (!patientName.trim()) {
      Alert.alert("Required", "Please enter the patient name.");
      return;
    }
    Alert.alert("Success", "Case sheet created successfully!", [
      { text: "OK", onPress: () => router.back() },
    ]);
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Voice Recording Section */}
      <View className="bg-primary-50 px-6 py-6 border-b border-primary-100">
        <Text className="text-primary-800 text-lg font-bold text-center mb-1">
          Voice Documentation
        </Text>
        <Text className="text-primary-600 text-sm text-center mb-4">
          Tap to start recording your clinical notes
        </Text>

        <VoiceRecorder
          onTranscription={handleTranscription}
          onRecordingStateChange={setIsRecording}
        />

        {/* Live Transcription Area */}
        {transcription ? (
          <View className="mt-4 bg-white rounded-2xl p-4 border border-primary-200">
            <View className="flex-row items-center mb-2">
              <View className="w-2 h-2 bg-primary-500 rounded-full mr-2" />
              <Text className="text-primary-700 text-xs font-semibold uppercase">
                Transcription
              </Text>
            </View>
            <Text className="text-gray-800 text-sm leading-5">
              {transcription}
            </Text>
          </View>
        ) : null}
      </View>

      {/* Manual Form */}
      <View className="px-6 pt-6">
        <Text className="text-gray-900 text-lg font-bold mb-4">
          Patient Details
        </Text>

        {/* Patient Name */}
        <Text className="text-gray-700 text-sm font-medium mb-1.5">
          Patient Name *
        </Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base mb-4"
          placeholder="Full name"
          placeholderTextColor="#9ca3af"
          value={patientName}
          onChangeText={setPatientName}
        />

        {/* Age & Gender Row */}
        <View className="flex-row gap-3 mb-4">
          <View className="flex-1">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Age
            </Text>
            <TextInput
              className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base"
              placeholder="Years"
              placeholderTextColor="#9ca3af"
              value={age}
              onChangeText={setAge}
              keyboardType="numeric"
            />
          </View>
          <View className="flex-1">
            <Text className="text-gray-700 text-sm font-medium mb-1.5">
              Gender
            </Text>
            <View className="flex-row gap-2">
              {(["M", "F", "O"] as const).map((g) => (
                <TouchableOpacity
                  key={g}
                  className={`flex-1 py-3 rounded-xl items-center border ${
                    gender === g
                      ? "bg-primary-600 border-primary-600"
                      : "bg-white border-gray-200"
                  }`}
                  onPress={() => setGender(g)}
                >
                  <Text
                    className={`text-sm font-medium ${
                      gender === g ? "text-white" : "text-gray-600"
                    }`}
                  >
                    {g === "M" ? "Male" : g === "F" ? "Female" : "Other"}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </View>

        {/* Department Selector */}
        <Text className="text-gray-700 text-sm font-medium mb-1.5">
          Department
        </Text>
        <TouchableOpacity
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 mb-2"
          onPress={() => setShowDeptPicker(!showDeptPicker)}
        >
          <Text
            className={department ? "text-gray-900 text-base" : "text-gray-400 text-base"}
          >
            {department || "Select department"}
          </Text>
        </TouchableOpacity>

        {showDeptPicker && (
          <View className="bg-white border border-gray-200 rounded-xl mb-4 overflow-hidden">
            {DEPARTMENTS.map((dept) => (
              <TouchableOpacity
                key={dept}
                className={`px-4 py-3 border-b border-gray-50 ${
                  department === dept ? "bg-primary-50" : ""
                }`}
                onPress={() => {
                  setDepartment(dept);
                  setShowDeptPicker(false);
                }}
              >
                <Text
                  className={`text-sm ${
                    department === dept
                      ? "text-primary-700 font-semibold"
                      : "text-gray-700"
                  }`}
                >
                  {dept}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Chief Complaint */}
        <Text className="text-gray-700 text-sm font-medium mb-1.5 mt-2">
          Chief Complaint
        </Text>
        <TextInput
          className="bg-white border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-base mb-6"
          placeholder="Primary reason for visit"
          placeholderTextColor="#9ca3af"
          value={chiefComplaint}
          onChangeText={setChiefComplaint}
          multiline
          numberOfLines={3}
          textAlignVertical="top"
          style={{ minHeight: 80 }}
        />

        {/* Submit */}
        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center mb-4"
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold">
            Create Case Sheet
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
