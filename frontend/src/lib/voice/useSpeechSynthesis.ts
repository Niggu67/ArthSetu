"use client";

import { useState, useEffect, useRef, useCallback } from "react";

export interface SpeechSynthesisHook {
  isSpeaking: boolean;
  speakingIndex: number | null;
  isSupported: boolean;
  speak: (text: string, langCode: string, messageIndex: number) => void;
  stop: () => void;
}

function cleanMarkdownForSpeech(text: string): string {
  if (!text) return "";
  return text
    // Remove markdown headers and bold/italic markers
    .replace(/#{1,6}\s+/g, "")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/\*(.*?)\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .replace(/_(.*?)_/g, "$1")
    // Remove scheme citation tags
    .replace(/\[SCHEME_ID:\s*\d+\]/gi, "")
    // Remove markdown links [Label](URL) -> Label
    .replace(/\[(.*?)\]\(.*?\)/g, "$1")
    // Remove bullets and numbered lists
    .replace(/^\s*[-*•]\s+/gm, "")
    .replace(/^\s*\d+\.\s+/gm, "")
    // Clean excessive line breaks and spaces
    .replace(/\n+/g, " ")
    .replace(/\s{2,}/g, " ")
    .trim();
}

export function useSpeechSynthesis(): SpeechSynthesisHook {
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speakingIndex, setSpeakingIndex] = useState<number | null>(null);
  const [isSupported, setIsSupported] = useState(false);
  const [availableVoices, setAvailableVoices] = useState<SpeechSynthesisVoice[]>([]);

  const utteranceRef = useRef<SpeechSynthesisUtterance | null>(null);

  useEffect(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      setIsSupported(true);

      const updateVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        if (voices.length > 0) {
          setAvailableVoices(voices);
        }
      };

      updateVoices();

      // Voices may load asynchronously in Chrome/Edge
      if (window.speechSynthesis.onvoiceschanged !== undefined) {
        window.speechSynthesis.onvoiceschanged = updateVoices;
      }
    }
  }, []);

  const stop = useCallback(() => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      try {
        window.speechSynthesis.cancel();
      } catch {
        // ignore
      }
    }
    setIsSpeaking(false);
    setSpeakingIndex(null);
  }, []);

  const selectBestVoice = useCallback(
    (langCode: string, voices: SpeechSynthesisVoice[]): { voice: SpeechSynthesisVoice | null; langTag: string } => {
      const code = langCode.toLowerCase();
      let targetTag = "en-IN";

      if (code === "mr") targetTag = "mr-IN";
      else if (code === "hi") targetTag = "hi-IN";

      if (voices.length === 0) {
        return { voice: null, langTag: targetTag };
      }

      // 1. Exact match (e.g. mr-IN, hi-IN, en-IN)
      const exactMatch = voices.find(
        (v) => v.lang.replace(/_/g, "-").toLowerCase() === targetTag.toLowerCase()
      );
      if (exactMatch) return { voice: exactMatch, langTag: targetTag };

      // 2. Language prefix match (e.g. any 'mr' or 'hi' or 'en')
      const prefix = code === "mr" ? "mr" : code === "hi" ? "hi" : "en";
      const prefixMatch = voices.find((v) =>
        v.lang.toLowerCase().startsWith(prefix)
      );
      if (prefixMatch) return { voice: prefixMatch, langTag: targetTag };

      // 3. Fallback for Indian context: Indian English voice
      const indianEnglish = voices.find(
        (v) => v.lang.replace(/_/g, "-").toLowerCase() === "en-in"
      );
      if (indianEnglish) return { voice: indianEnglish, langTag: targetTag };

      // 4. Fallback to default voice or first available voice
      const defaultVoice = voices.find((v) => v.default) || voices[0] || null;
      return { voice: defaultVoice, langTag: targetTag };
    },
    []
  );

  const speak = useCallback(
    (text: string, langCode: string, messageIndex: number) => {
      if (typeof window === "undefined" || !("speechSynthesis" in window)) {
        return;
      }

      // If already speaking this message, toggle stop
      if (isSpeaking && speakingIndex === messageIndex) {
        stop();
        return;
      }

      // Cancel any ongoing speech
      stop();

      const cleanedText = cleanMarkdownForSpeech(text);
      if (!cleanedText) return;

      try {
        const utterance = new SpeechSynthesisUtterance(cleanedText);
        const { voice, langTag } = selectBestVoice(langCode, availableVoices);

        utterance.lang = langTag;
        if (voice) {
          utterance.voice = voice;
        }

        // Natural, accessible rate for clarity
        utterance.rate = 0.95;
        utterance.pitch = 1.0;

        utterance.onstart = () => {
          setIsSpeaking(true);
          setSpeakingIndex(messageIndex);
        };

        utterance.onend = () => {
          setIsSpeaking(false);
          setSpeakingIndex(null);
        };

        utterance.onerror = () => {
          setIsSpeaking(false);
          setSpeakingIndex(null);
        };

        utteranceRef.current = utterance;
        window.speechSynthesis.speak(utterance);
      } catch (err) {
        console.error("Speech synthesis failed:", err);
        setIsSpeaking(false);
        setSpeakingIndex(null);
      }
    },
    [availableVoices, isSpeaking, speakingIndex, selectBestVoice, stop]
  );

  // Stop speech when component unmounts
  useEffect(() => {
    return () => {
      stop();
    };
  }, [stop]);

  return {
    isSpeaking,
    speakingIndex,
    isSupported,
    speak,
    stop,
  };
}
