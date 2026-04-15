import { useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
} from "react-native";

const SYMPTOMS = [
  { id: "chest-pain", label: "Chest Pain", icon: "💔" },
  { id: "shortness-breath", label: "Shortness of Breath", icon: "😮‍💨" },
  { id: "fever", label: "Fever", icon: "🤒" },
  { id: "headache", label: "Headache", icon: "🤕" },
  { id: "abdominal-pain", label: "Abdominal Pain", icon: "🤢" },
  { id: "dizziness", label: "Dizziness", icon: "😵‍💫" },
  { id: "bleeding", label: "Bleeding", icon: "🩸" },
  { id: "fracture", label: "Suspected Fracture", icon: "🦴" },
  { id: "allergic", label: "Allergic Reaction", icon: "🤧" },
  { id: "seizure", label: "Seizure", icon: "⚡" },
  { id: "burns", label: "Burns", icon: "🔥" },
  { id: "unconscious", label: "Loss of Consciousness", icon: "😶" },
];

const SEVERITY_LEVELS = [
  { value: 1, label: "Minor", color: "bg-green-500", desc: "Non-urgent, can wait" },
  { value: 2, label: "Low", color: "bg-lime-500", desc: "Less urgent" },
  { value: 3, label: "Moderate", color: "bg-yellow-500", desc: "Semi-urgent" },
  { value: 4, label: "High", color: "bg-orange-500", desc: "Urgent, needs prompt care" },
  { value: 5, label: "Critical", color: "bg-red-600", desc: "Immediate, life-threatening" },
];

export default function TriageScreen() {
  const [selectedSymptoms, setSelectedSymptoms] = useState<string[]>([]);
  const [severity, setSeverity] = useState(3);

  const toggleSymptom = (id: string) => {
    setSelectedSymptoms((prev) =>
      prev.includes(id) ? prev.filter((s) => s !== id) : [...prev, id]
    );
  };

  const currentSeverity = SEVERITY_LEVELS[severity - 1];

  const handleSubmit = () => {
    if (selectedSymptoms.length === 0) {
      Alert.alert("Required", "Please select at least one symptom.");
      return;
    }
    Alert.alert(
      "Triage Assessment Submitted",
      `Symptoms: ${selectedSymptoms.length}\nSeverity: ${currentSeverity.label}\n\nAI assessment will be generated.`,
      [{ text: "OK" }]
    );
  };

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
    >
      {/* Symptom Selection */}
      <View className="px-6 pt-6">
        <Text className="text-gray-900 text-lg font-bold mb-1">
          Select Symptoms
        </Text>
        <Text className="text-gray-500 text-sm mb-4">
          Tap all that apply to this patient
        </Text>

        <View className="flex-row flex-wrap gap-2">
          {SYMPTOMS.map((symptom) => {
            const selected = selectedSymptoms.includes(symptom.id);
            return (
              <TouchableOpacity
                key={symptom.id}
                className={`flex-row items-center px-3.5 py-2.5 rounded-xl border ${
                  selected
                    ? "bg-primary-50 border-primary-300"
                    : "bg-white border-gray-200"
                }`}
                onPress={() => toggleSymptom(symptom.id)}
                activeOpacity={0.7}
              >
                <Text className="text-base mr-1.5">{symptom.icon}</Text>
                <Text
                  className={`text-sm font-medium ${
                    selected ? "text-primary-700" : "text-gray-700"
                  }`}
                >
                  {symptom.label}
                </Text>
                {selected && (
                  <Text className="text-primary-600 text-sm ml-1.5">✓</Text>
                )}
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Severity Slider */}
      <View className="px-6 mt-8">
        <Text className="text-gray-900 text-lg font-bold mb-1">
          Severity Level
        </Text>
        <Text className="text-gray-500 text-sm mb-4">
          Rate the urgency of the condition
        </Text>

        {/* Custom Severity Selector */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <View className="flex-row gap-2 mb-4">
            {SEVERITY_LEVELS.map((level) => (
              <TouchableOpacity
                key={level.value}
                className={`flex-1 py-3 rounded-xl items-center ${
                  severity === level.value ? level.color : "bg-gray-100"
                }`}
                onPress={() => setSeverity(level.value)}
              >
                <Text
                  className={`text-lg font-bold ${
                    severity === level.value ? "text-white" : "text-gray-400"
                  }`}
                >
                  {level.value}
                </Text>
              </TouchableOpacity>
            ))}
          </View>

          <View className="items-center">
            <Text className="text-gray-900 text-lg font-bold">
              {currentSeverity.label}
            </Text>
            <Text className="text-gray-500 text-sm mt-0.5">
              {currentSeverity.desc}
            </Text>
          </View>
        </View>
      </View>

      {/* Summary */}
      {selectedSymptoms.length > 0 && (
        <View className="px-6 mt-6">
          <View className="bg-primary-50 rounded-2xl p-4 border border-primary-100">
            <Text className="text-primary-700 text-xs font-semibold uppercase tracking-wide mb-2">
              Assessment Summary
            </Text>
            <Text className="text-primary-900 text-sm">
              {selectedSymptoms.length} symptom(s) selected · Severity:{" "}
              {currentSeverity.label}
            </Text>
            <Text className="text-primary-600 text-xs mt-2">
              AI will analyze symptoms and suggest triage category, recommended
              department, and priority level.
            </Text>
          </View>
        </View>
      )}

      {/* Submit */}
      <View className="px-6 mt-6">
        <TouchableOpacity
          className="bg-primary-600 rounded-xl py-4 items-center"
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold">
            Submit for AI Assessment
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
