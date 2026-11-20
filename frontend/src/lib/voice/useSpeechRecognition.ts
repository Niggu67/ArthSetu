"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeechRecognitionHook {
  isListening: boolean;
  isSupported: boolean;
  error: string | null;
  startListening: (langCode: string, currentText?: string) => void;
  stopListening: () => void;
  resetError: () => void;
}

interface UseSpeechRecognitionOptions {
  onTranscriptChange?: (text: string) => void;
}

export function useSpeechRecognition(
  options: UseSpeechRecognitionOptions = {}
): SpeechRecognitionHook {
  const [isListening, setIsListening] = useState(false);
  const [isSupported, setIsSupported] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const recognitionRef = useRef<any>(null);
  const finalTranscriptRef = useRef<string>("");
  const baseTextRef = useRef<string>("");
  const optionsRef = useRef(options);

  useEffect(() => {
    optionsRef.current = options;
  }, [options]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;
      setIsSupported(!!SpeechRecognition);
    }
  }, []);

  const getLanguageTag = (lang: string): string => {
    switch (lang.toLowerCase()) {
      case "mr":
        return "mr-IN";
      case "hi":
        return "hi-IN";
      case "en":
      default:
        return "en-IN";
    }
  };

  const stopListening = useCallback(() => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch {
        // Recognition may have already stopped
      }
    }
    setIsListening(false);
  }, []);

  const startListening = useCallback(
    (langCode: string, currentText: string = "") => {
      setError(null);

      if (typeof window === "undefined") return;

      const SpeechRecognition =
        (window as any).SpeechRecognition ||
        (window as any).webkitSpeechRecognition;

      if (!SpeechRecognition) {
        setError(
          "Voice input is not supported in this browser. Please use a Chromium-based browser like Chrome or Edge."
        );
        return;
      }

      // Stop any existing instance
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }

      // Initialize base text and final transcript buffer
      baseTextRef.current = currentText.trim();
      finalTranscriptRef.current = "";

      try {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = getLanguageTag(langCode);

        recognition.onstart = () => {
          setIsListening(true);
        };

        recognition.onresult = (event: any) => {
          let currentInterim = "";
          let accumulatedFinal = "";

          for (let i = 0; i < event.results.length; i++) {
            const result = event.results[i];
            const text = result[0]?.transcript || "";
            if (result.isFinal) {
              accumulatedFinal += text + " ";
            } else {
              currentInterim += text;
            }
          }

          finalTranscriptRef.current = accumulatedFinal;

          // Combine with initial text without duplicates
          const base = baseTextRef.current ? `${baseTextRef.current} ` : "";
          const combined = (base + accumulatedFinal + currentInterim).trim();

          if (optionsRef.current.onTranscriptChange) {
            optionsRef.current.onTranscriptChange(combined);
          }
        };

        recognition.onerror = (event: any) => {
          if (event.error === "no-speech") {
            // Silence is normal; ignore or keep listening
            return;
          }
          if (event.error === "not-allowed" || event.error === "service-not-allowed") {
            setError(
              "Microphone permission was denied. Please allow microphone access in your browser settings to speak."
            );
          } else if (event.error === "network") {
            setError("Voice service network issue. Please check your connection.");
          } else {
            setError(`Speech recognition notice: ${event.error || "unavailable"}.`);
          }
          setIsListening(false);
        };

        recognition.onend = () => {
          setIsListening(false);
        };

        recognitionRef.current = recognition;
        recognition.start();
      } catch (err: any) {
        setError("Unable to start voice recording: " + (err.message || "Unknown error"));
        setIsListening(false);
      }
    },
    []
  );

  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        try {
          recognitionRef.current.abort();
        } catch {
          // ignore
        }
      }
    };
  }, []);

  return {
    isListening,
    isSupported,
    error,
    startListening,
    stopListening,
    resetError: () => setError(null),
  };
}
