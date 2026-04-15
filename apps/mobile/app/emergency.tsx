import { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Alert,
  Vibration,
} from "react-native";

export default function EmergencyScreen() {
  const [started, setStarted] = useState(false);
  const [seconds, setSeconds] = useState(0);
  const [airway, setAirway] = useState("");
  const [breathing, setBreathing] = useState("");
  const [circulation, setCirculation] = useState("");
  const [notes, setNotes] = useState("");
  const [gcs, setGcs] = useState({ eye: 0, verbal: 0, motor: 0 });
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (started) {
      timerRef.current = setInterval(() => {
        setSeconds((s) => s + 1);
      }, 1000);
    }
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [started]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const handleStart = () => {
    Vibration.vibrate(200);
    setStarted(true);
  };

  const handleSubmit = () => {
    Alert.alert(
      "Emergency Documented",
      `Duration: ${formatTime(seconds)}\nGCS: ${gcs.eye + gcs.verbal + gcs.motor}/15`,
      [{ text: "OK" }]
    );
  };

  if (!started) {
    return (
      <View className="flex-1 bg-gray-900 items-center justify-center px-6">
        <View className="items-center">
          <Text className="text-6xl mb-6">🚨</Text>
          <Text className="text-white text-2xl font-bold text-center mb-2">
            Emergency Documentation
          </Text>
          <Text className="text-gray-400 text-sm text-center mb-12">
            Timer begins when you start. Document ABC assessment in real-time.
          </Text>

          <TouchableOpacity
            className="w-44 h-44 bg-red-600 rounded-full items-center justify-center"
            style={{
              elevation: 12,
              shadowColor: "#dc2626",
              shadowOffset: { width: 0, height: 8 },
              shadowOpacity: 0.5,
              shadowRadius: 16,
            }}
            onPress={handleStart}
            activeOpacity={0.7}
          >
            <Text className="text-white text-2xl font-bold">START</Text>
          </TouchableOpacity>

          <Text className="text-gray-500 text-xs mt-8 text-center">
            Tap to begin emergency documentation
          </Text>
        </View>
      </View>
    );
  }

  return (
    <ScrollView
      className="flex-1 bg-gray-50"
      contentContainerStyle={{ paddingBottom: 40 }}
      keyboardShouldPersistTaps="handled"
    >
      {/* Timer Banner */}
      <View className="bg-red-600 px-6 py-4 flex-row items-center justify-between">
        <View className="flex-row items-center">
          <View className="w-3 h-3 bg-white rounded-full mr-3 animate-pulse" />
          <Text className="text-white text-sm font-medium">EMERGENCY ACTIVE</Text>
        </View>
        <Text className="text-white text-2xl font-bold font-mono">
          {formatTime(seconds)}
        </Text>
      </View>

      <View className="px-6 pt-4 gap-4">
        {/* Airway */}
        <View className="bg-white rounded-2xl p-4 border-l-4 border-red-500">
          <Text className="text-red-600 text-sm font-bold uppercase mb-2">
            A - Airway
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
            placeholder="Airway assessment (patent, obstructed, intubated...)"
            placeholderTextColor="#9ca3af"
            value={airway}
            onChangeText={setAirway}
            multiline
          />
        </View>

        {/* Breathing */}
        <View className="bg-white rounded-2xl p-4 border-l-4 border-orange-500">
          <Text className="text-orange-600 text-sm font-bold uppercase mb-2">
            B - Breathing
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
            placeholder="Breathing assessment (rate, effort, sounds...)"
            placeholderTextColor="#9ca3af"
            value={breathing}
            onChangeText={setBreathing}
            multiline
          />
        </View>

        {/* Circulation */}
        <View className="bg-white rounded-2xl p-4 border-l-4 border-yellow-500">
          <Text className="text-yellow-700 text-sm font-bold uppercase mb-2">
            C - Circulation
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
            placeholder="Circulation assessment (pulse, BP, cap refill...)"
            placeholderTextColor="#9ca3af"
            value={circulation}
            onChangeText={setCirculation}
            multiline
          />
        </View>

        {/* GCS */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-900 text-sm font-bold uppercase mb-3">
            Glasgow Coma Scale
          </Text>
          <View className="flex-row gap-3">
            <View className="flex-1 items-center">
              <Text className="text-gray-500 text-xs mb-2">Eye (1-4)</Text>
              <View className="flex-row gap-1">
                {[1, 2, 3, 4].map((n) => (
                  <TouchableOpacity
                    key={n}
                    className={`w-9 h-9 rounded-lg items-center justify-center ${
                      gcs.eye === n ? "bg-primary-600" : "bg-gray-100"
                    }`}
                    onPress={() => setGcs({ ...gcs, eye: n })}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        gcs.eye === n ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-gray-500 text-xs mb-2">Verbal (1-5)</Text>
              <View className="flex-row gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <TouchableOpacity
                    key={n}
                    className={`w-8 h-9 rounded-lg items-center justify-center ${
                      gcs.verbal === n ? "bg-primary-600" : "bg-gray-100"
                    }`}
                    onPress={() => setGcs({ ...gcs, verbal: n })}
                  >
                    <Text
                      className={`text-sm font-bold ${
                        gcs.verbal === n ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            <View className="flex-1 items-center">
              <Text className="text-gray-500 text-xs mb-2">Motor (1-6)</Text>
              <View className="flex-row gap-1 flex-wrap justify-center">
                {[1, 2, 3, 4, 5, 6].map((n) => (
                  <TouchableOpacity
                    key={n}
                    className={`w-7 h-8 rounded-md items-center justify-center ${
                      gcs.motor === n ? "bg-primary-600" : "bg-gray-100"
                    }`}
                    onPress={() => setGcs({ ...gcs, motor: n })}
                  >
                    <Text
                      className={`text-xs font-bold ${
                        gcs.motor === n ? "text-white" : "text-gray-600"
                      }`}
                    >
                      {n}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>
          <Text className="text-center text-gray-600 text-lg font-bold mt-3">
            GCS: {gcs.eye + gcs.verbal + gcs.motor}/15
          </Text>
        </View>

        {/* Additional Notes */}
        <View className="bg-white rounded-2xl p-4 border border-gray-100">
          <Text className="text-gray-500 text-xs font-semibold uppercase tracking-wide mb-2">
            Additional Notes
          </Text>
          <TextInput
            className="bg-gray-50 border border-gray-200 rounded-xl px-4 py-3 text-gray-900 text-sm"
            placeholder="Interventions, medications, observations..."
            placeholderTextColor="#9ca3af"
            value={notes}
            onChangeText={setNotes}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
            style={{ minHeight: 100 }}
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          className="bg-red-600 rounded-xl py-4 items-center"
          onPress={handleSubmit}
          activeOpacity={0.8}
        >
          <Text className="text-white text-base font-semibold">
            Complete Emergency Documentation
          </Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
