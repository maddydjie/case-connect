import { useState, useRef, useCallback, useEffect } from 'react';

type SpeechLang = 'en-IN' | 'hi-IN';

interface UseSpeechRecognitionOptions {
  lang?: SpeechLang;
  continuous?: boolean;
  interimResults?: boolean;
  onResult?: (transcript: string, isFinal: boolean) => void;
  onError?: (error: string) => void;
}

interface UseSpeechRecognitionReturn {
  isListening: boolean;
  transcript: string;
  interimTranscript: string;
  confidence: number;
  isSupported: boolean;
  start: () => void;
  stop: () => void;
  toggle: () => void;
  reset: () => void;
  setLang: (lang: SpeechLang) => void;
}

const SpeechRecognitionAPI =
  typeof window !== 'undefined'
    ? (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
    : null;

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {},
): UseSpeechRecognitionReturn {
  const {
    lang: initialLang = 'en-IN',
    continuous = true,
    interimResults = true,
    onResult,
    onError,
  } = options;

  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [confidence, setConfidence] = useState(0);
  const [lang, setLangState] = useState<SpeechLang>(initialLang);

  const recognitionRef = useRef<any>(null);
  const isSupported = !!SpeechRecognitionAPI;

  const createRecognition = useCallback(() => {
    if (!SpeechRecognitionAPI) return null;
    const recognition = new SpeechRecognitionAPI();
    recognition.lang = lang;
    recognition.continuous = continuous;
    recognition.interimResults = interimResults;
    recognition.maxAlternatives = 1;
    return recognition;
  }, [lang, continuous, interimResults]);

  const stop = useCallback(() => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
      recognitionRef.current = null;
    }
    setIsListening(false);
    setInterimTranscript('');
  }, []);

  const start = useCallback(() => {
    if (!isSupported) {
      onError?.('Speech recognition is not supported in this browser. Use Chrome or Edge.');
      return;
    }

    stop();

    const recognition = createRecognition();
    if (!recognition) return;

    recognition.onstart = () => setIsListening(true);

    recognition.onresult = (event: any) => {
      let newFinal = '';
      let interim = '';

      for (let i = event.resultIndex; i < event.results.length; i++) {
        const result = event.results[i];
        if (result.isFinal) {
          newFinal += result[0].transcript;
          setConfidence(Math.round(result[0].confidence * 100));
        } else {
          interim += result[0].transcript;
        }
      }

      if (newFinal) {
        setTranscript((prev) => {
          const updated = prev ? `${prev} ${newFinal}` : newFinal;
          onResult?.(updated, true);
          return updated;
        });
      }
      setInterimTranscript(interim);
      if (interim) onResult?.(interim, false);
    };

    recognition.onerror = (event: any) => {
      if (event.error === 'no-speech') return;
      if (event.error === 'aborted') return;
      onError?.(event.error);
      setIsListening(false);
    };

    recognition.onend = () => {
      if (recognitionRef.current === recognition && isListening) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      } else {
        setIsListening(false);
      }
    };

    recognitionRef.current = recognition;
    try {
      recognition.start();
    } catch {
      onError?.('Failed to start speech recognition.');
    }
  }, [isSupported, stop, createRecognition, onResult, onError, isListening]);

  const toggle = useCallback(() => {
    if (isListening) {
      stop();
    } else {
      start();
    }
  }, [isListening, start, stop]);

  const reset = useCallback(() => {
    stop();
    setTranscript('');
    setInterimTranscript('');
    setConfidence(0);
  }, [stop]);

  const setLang = useCallback(
    (newLang: SpeechLang) => {
      setLangState(newLang);
      if (isListening) {
        stop();
        setTimeout(() => start(), 100);
      }
    },
    [isListening, stop, start],
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.stop();
        recognitionRef.current = null;
      }
    };
  }, []);

  return {
    isListening,
    transcript,
    interimTranscript,
    confidence,
    isSupported,
    start,
    stop,
    toggle,
    reset,
    setLang,
  };
}
