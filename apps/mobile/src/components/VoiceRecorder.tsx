import { useState, useRef, useEffect } from "react";
import { View, Text, TouchableOpacity, Animated } from "react-native";
import { Audio } from "expo-av";

type VoiceRecorderProps = {
  onTranscription: (text: string) => void;
  onRecordingStateChange?: (isRecording: boolean) => void;
};

export function VoiceRecorder({
  onTranscription,
  onRecordingStateChange,
}: VoiceRecorderProps) {
  const [recording, setRecording] = useState<Audio.Recording | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const [duration, setDuration] = useState(0);
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (isRecording) {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.15,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();

      timerRef.current = setInterval(() => {
        setDuration((d) => d + 1);
      }, 1000);

      return () => {
        pulse.stop();
        if (timerRef.current) clearInterval(timerRef.current);
      };
    } else {
      pulseAnim.setValue(1);
      if (timerRef.current) clearInterval(timerRef.current);
    }
  }, [isRecording]);

  const formatTime = (s: number) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
  };

  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) return;

      await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
      });

      const { recording: newRecording } = await Audio.Recording.createAsync(
        Audio.RecordingOptionsPresets.HIGH_QUALITY
      );
      setRecording(newRecording);
      setIsRecording(true);
      setDuration(0);
      onRecordingStateChange?.(true);
    } catch (err) {
      console.error("Failed to start recording", err);
    }
  };

  const stopRecording = async () => {
    if (!recording) return;

    try {
      setIsRecording(false);
      onRecordingStateChange?.(false);
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      setRecording(null);

      // In production, send the audio URI to a transcription API.
      // For demo, simulate a transcription response.
      if (uri) {
        setTimeout(() => {
          onTranscription(
            "Patient presents with acute onset chest pain, substernal in nature, radiating to the left arm. Duration approximately two hours. Associated with diaphoresis and mild dyspnea."
          );
        }, 1000);
      }
    } catch (err) {
      console.error("Failed to stop recording", err);
    }
  };

  return (
    <View className="items-center">
      {/* Recording Button */}
      <Animated.View style={{ transform: [{ scale: pulseAnim }] }}>
        <TouchableOpacity
          className={`w-24 h-24 rounded-full items-center justify-center ${
            isRecording ? "bg-red-500" : "bg-primary-600"
          }`}
          style={{
            elevation: 8,
            shadowColor: isRecording ? "#ef4444" : "#16a34a",
            shadowOffset: { width: 0, height: 4 },
            shadowOpacity: 0.3,
            shadowRadius: 8,
          }}
          onPress={isRecording ? stopRecording : startRecording}
          activeOpacity={0.8}
        >
          {isRecording ? (
            <View className="w-8 h-8 bg-white rounded-md" />
          ) : (
            <Text className="text-white text-3xl">🎙️</Text>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Timer */}
      {isRecording && (
        <View className="flex-row items-center mt-4">
          <View className="w-2 h-2 bg-red-500 rounded-full mr-2" />
          <Text className="text-red-600 text-lg font-bold font-mono">
            {formatTime(duration)}
          </Text>
        </View>
      )}

      {/* Label */}
      <Text className="text-primary-600 text-xs mt-3 font-medium">
        {isRecording ? "Tap to stop recording" : "Tap to start voice recording"}
      </Text>
    </View>
  );
}
