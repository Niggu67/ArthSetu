"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import {
  Sparkles,
  Send,
  ArrowRight,
  FileText,
  CheckCircle2,
  BookOpen,
  AlertCircle,
  RotateCcw,
  User as UserIcon,
  Mic,
  Square,
  Volume2,
  VolumeX,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { motion, AnimatePresence } from "framer-motion";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatString } from "@/i18n";
import { aiApi } from "@/lib/api";
import { AIChatMessage, AISuggestedAction } from "@/types";
import { useSpeechRecognition } from "@/lib/voice/useSpeechRecognition";
import { useSpeechSynthesis } from "@/lib/voice/useSpeechSynthesis";
import { MarkdownContent } from "@/components/ui/MarkdownContent";
import { cn, stripMarkdown } from "@/lib/utils";

const STARTER_PROMPTS = [
  {
    title: "Government Schemes",
    prompt: "Which government schemes may help my business?",
    category: "schemes",
  },
  {
    title: "Business Loans",
    prompt: "Explain business loans in simple language",
    category: "credit",
  },
  {
    title: "Credit Profile",
    prompt: "How can I improve my credit score?",
    category: "credit",
  },
  {
    title: "Business Insurance",
    prompt: "What insurance should a small business understand?",
    category: "insurance",
  },
  {
    title: "Digital Payments",
    prompt: "Help me understand digital banking",
    category: "banking",
  },
];

export default function AiPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <AiChatContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function AiChatContent() {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [messages, setMessages] = useState<AIChatMessage[]>([]);
  const [inputMessage, setInputMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  const starterPrompts = Object.entries(t.ai.starters).map(([key, item]) => ({
    title: item.title,
    prompt: item.prompt,
    category: key,
  }));

  // Client-side voice interaction hooks (independently supported)
  const speechRecognition = useSpeechRecognition({
    onTranscriptChange: (text) => {
      setInputMessage(text);
    },
  });

  const speechSynthesis = useSpeechSynthesis();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isLoading]);

  const handleSendMessage = async (textToSend?: string) => {
    // If currently listening, stop voice input
    if (speechRecognition.isListening) {
      speechRecognition.stopListening();
    }

    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    setError(null);
    setInputMessage("");

    // Add user message to state
    const userMsg: AIChatMessage = {
      role: "user",
      content: text,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setIsLoading(true);

    try {
      // Build request payload matching AIChatRequest
      const response = await aiApi.chat({
        message: text,
        history: updatedHistory.slice(-6).map((m) => ({
          role: m.role,
          content: m.content,
        })),
        language: language,
      });

      const assistantMsg: AIChatMessage = {
        role: "assistant",
        content: response.assistant_message,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        suggested_actions: response.suggested_actions,
      };

      setMessages((prev) => [...prev, assistantMsg]);
    } catch (err: any) {
      setError(err.message || t.ai.networkError || "Failed to reach ArthSetu AI. Please try again.");
    } finally {
      setIsLoading(false);
      // Auto-refocus input
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleToggleVoiceInput = () => {
    if (speechRecognition.isListening) {
      speechRecognition.stopListening();
    } else {
      speechRecognition.startListening(language, inputMessage);
    }
  };

  const handleClearConversation = () => {
    speechSynthesis.stop();
    speechRecognition.stopListening();
    setMessages([]);
    setError(null);
    setInputMessage("");
  };

  const getLanguageLabel = (code: string) => {
    switch (code) {
      case "mr":
        return "Marathi (मराठी)";
      case "hi":
        return "Hindi (हिंदी)";
      case "en":
      default:
        return "English";
    }
  };

  const fallbackUser = language === "mr" ? "उद्योजक" : language === "hi" ? "उद्यमी" : "Entrepreneur";

  return (
    <div className="max-w-4xl mx-auto flex flex-col h-[calc(100dvh-190px)] md:h-[calc(100vh-135px)] min-h-[460px] md:min-h-[580px] pb-1 md:pb-2">
      {/* Header Banner */}
      <div className="flex items-center justify-between pb-3 border-b border-white/[0.08] shrink-0">
        <div>
          <div className="flex items-center gap-2.5">
            <div className="w-8.5 h-8.5 rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 text-canvas flex items-center justify-center font-black text-base shadow-glow-sm">
              अ
            </div>
            <div>
              <h1 className="text-lg sm:text-xl font-black text-white tracking-tight flex items-center gap-2">
                <span>{t.ai.assistantTitle}</span>
                <Badge variant="brand" withDot className="text-[10px] hidden sm:inline-flex py-0.5">
                  {t.ai.verifiedGuideBadge}
                </Badge>
                {speechRecognition.isSupported && (
                  <Badge variant="neutral" className="text-[10px] hidden md:inline-flex gap-1 items-center py-0.5 border-white/10 text-brand-300">
                    <Mic className="w-3 h-3 text-brand-400" />
                    <span>{t.ai.voiceReadyBadge}</span>
                  </Badge>
                )}
              </h1>
              <p className="text-xs text-gray-400">
                {formatString(t.ai.headerSubtitle, { language: getLanguageLabel(language) })}
              </p>
            </div>
          </div>
        </div>

        {messages.length > 0 && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleClearConversation}
            className="text-xs gap-1 border-white/20 text-gray-300 hover:text-white font-semibold"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{t.ai.newChatButton}</span>
          </Button>
        )}
      </div>

      {/* Main Conversation Stream */}
      <div className="flex-1 overflow-y-auto py-4 space-y-4 pr-1">
        {/* Welcome Empty State */}
        {messages.length === 0 && (
          <div className="py-6 space-y-6 max-w-2xl mx-auto text-center">
            <div className="w-14 h-14 rounded-2xl bg-brand-500/10 text-brand-400 flex items-center justify-center mx-auto border border-brand-400/20 shadow-glow-sm">
              <Sparkles className="w-7 h-7" />
            </div>

            <div className="space-y-1.5">
              <h2 className="text-lg sm:text-xl font-black text-white tracking-tight">
                {formatString(t.ai.welcomeHeading, { name: user?.name || fallbackUser })}
              </h2>
              <p className="text-xs sm:text-sm text-gray-400 max-w-md mx-auto leading-relaxed">
                {formatString(t.ai.welcomeSubtitle, { language: getLanguageLabel(language) })}
              </p>
            </div>

            {/* Starter Prompt Cards */}
            <div className="text-left space-y-2 pt-2">
              <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block px-1">
                {t.ai.starterPromptsTitle}:
              </span>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {starterPrompts.map((item, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => handleSendMessage(item.prompt)}
                    className="p-3.5 rounded-xl border border-white/[0.08] bg-surface hover:border-brand-400/40 hover:bg-brand-500/5 text-left transition-all group shadow-elevation-1 focus:outline-none focus:ring-2 focus:ring-brand-400 cursor-pointer"
                  >
                    <p className="text-xs font-bold text-white group-hover:text-brand-300 flex items-center justify-between">
                      <span>{item.title}</span>
                      <ArrowRight className="w-3.5 h-3.5 text-gray-500 group-hover:text-brand-400 group-hover:translate-x-0.5 transition-transform" />
                    </p>
                    <p className="text-[11px] text-gray-400 mt-1 line-clamp-1">
                      &ldquo;{item.prompt}&rdquo;
                    </p>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Message Stream */}
        {messages.map((msg, index) => {
          const isUser = msg.role === "user";
          const isThisSpeaking = speechSynthesis.isSpeaking && speechSynthesis.speakingIndex === index;

          return (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
              className={`flex gap-3 ${isUser ? "justify-end" : "justify-start"}`}
            >
              {!isUser && (
                <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 text-canvas flex items-center justify-center shrink-0 mt-0.5 text-sm font-black shadow-glow-sm">
                  अ
                </div>
              )}

              <div
                className={`max-w-[85%] sm:max-w-[75%] rounded-2xl p-4.5 space-y-3 ${
                  isUser
                    ? "bg-[#143527] border border-brand-400/20 text-white shadow-elevation-1 rounded-tr-xs"
                    : "bg-[#0C231A] border border-white/[0.08] shadow-elevation-2 text-gray-200 rounded-tl-xs backdrop-blur-xs"
                }`}
              >
                {/* Header row for speech bubble */}
                <div className="flex items-center justify-between gap-3 text-[11px] opacity-85">
                  <div className="flex items-center gap-1.5">
                    <span className={`font-bold ${isUser ? "text-brand-200" : "text-brand-300"}`}>
                      {isUser ? user?.name || (language === "mr" ? "तुम्ही" : language === "hi" ? "आप" : "You") : t.ai.assistantTitle}
                    </span>
                    {isThisSpeaking && (
                      <span className="text-[10px] font-bold text-brand-300 bg-brand-500/15 px-1.5 py-0.5 rounded-md flex items-center gap-1 border border-brand-400/30">
                        <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse" />
                        {language === "mr" ? "वाचत आहे" : language === "hi" ? "बोल रहा है" : "Speaking"}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2">
                    {msg.timestamp && <span className="opacity-70 text-[10px] text-gray-400">{msg.timestamp}</span>}

                    {/* Text-to-Speech User-Controlled Button */}
                    {!isUser && speechSynthesis.isSupported && (
                      <button
                        type="button"
                        onClick={() => speechSynthesis.speak(stripMarkdown(msg.content), language, index)}
                        className={cn(
                          "p-1 rounded-md transition-colors focus:outline-none focus:ring-1 focus:ring-brand-400 cursor-pointer",
                          isThisSpeaking
                            ? "text-brand-300 bg-brand-500/20 hover:bg-brand-500/30"
                            : "text-gray-400 hover:text-white hover:bg-white/10"
                        )}
                        title={isThisSpeaking ? t.ai.stopSpeaking : t.ai.speakResponse}
                        aria-label={isThisSpeaking ? t.ai.stopSpeaking : t.ai.speakResponse}
                      >
                        {isThisSpeaking ? (
                          <VolumeX className="w-4 h-4 text-brand-400 animate-pulse" />
                        ) : (
                          <Volume2 className="w-4 h-4" />
                        )}
                      </button>
                    )}
                  </div>
                </div>

                {/* Content body */}
                {isUser ? (
                  <div className="text-xs sm:text-sm leading-relaxed whitespace-pre-wrap text-white">
                    {msg.content}
                  </div>
                ) : (
                  <MarkdownContent content={msg.content} className="text-xs sm:text-sm leading-relaxed text-gray-200" />
                )}

                {/* Contextual Action Pills for Assistant Replies */}
                {!isUser && msg.suggested_actions && msg.suggested_actions.length > 0 && (
                  <div className="pt-2 border-t border-white/[0.08] space-y-1.5">
                    <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
                      {t.ai.suggestedActionsTitle}
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {msg.suggested_actions.map((act, actIdx) => {
                        let Icon = FileText;
                        let variant: "primary" | "secondary" | "outline" = "outline";

                        if (act.type === "check_eligibility") {
                          Icon = CheckCircle2;
                          variant = "secondary";
                        } else if (act.type === "start_learning") {
                          Icon = BookOpen;
                          variant = "primary";
                        }

                        return (
                          <Link key={actIdx} href={act.href}>
                            <Button
                              variant={variant}
                              size="sm"
                              className={`text-xs h-8 px-3 gap-1.5 font-semibold ${
                                variant === "outline" ? "border-white/20 text-gray-200 hover:text-white" : "shadow-glow-sm"
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                              <span>{act.label}</span>
                            </Button>
                          </Link>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>

              {isUser && (
                <div className="w-8 h-8 rounded-xl bg-[#143527] border border-brand-400/30 text-brand-300 flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-glow-sm">
                  <UserIcon className="w-4 h-4" />
                </div>
              )}
            </motion.div>
          );
        })}

        {/* Loading Bubble */}
        {isLoading && (
          <div className="flex gap-3 justify-start">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 text-canvas flex items-center justify-center shrink-0 mt-0.5 text-sm font-black shadow-glow-sm">
              अ
            </div>
            <div className="bg-[#0C231A] border border-white/[0.08] rounded-2xl rounded-tl-xs p-4 shadow-elevation-2 text-gray-300 text-xs flex items-center gap-3">
              <div className="flex gap-1.5 items-center">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
              <span className="font-semibold text-gray-300">
                {language === "mr"
                  ? "प्रमाणित आर्थिक मार्गदर्शन तयार होत आहे..."
                  : language === "hi"
                  ? "प्रमाणित वित्तीय मार्गदर्शन तैयार हो रहा है..."
                  : "Grounded financial guidance is generating..."}
              </span>
            </div>
          </div>
        )}

        {/* Error Alert with Retry */}
        {error && (
          <div className="p-3.5 bg-red-950/40 rounded-xl border border-red-500/40 text-red-200 text-xs flex items-start justify-between gap-3 shadow-2xs">
            <div className="flex items-start gap-2">
              <AlertCircle className="w-4 h-4 text-red-400 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleSendMessage()}
              className="text-xs h-7 px-2.5 text-red-300 border-red-500/40 hover:bg-red-900/40 shrink-0"
            >
              {language === "mr" ? "पुन्हा प्रयत्न करा" : language === "hi" ? "पुनः प्रयास करें" : "Retry"}
            </Button>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input Composer, Live Voice Status & Mandatory Financial Safety Disclaimer */}
      <div className="pt-2 border-t border-white/[0.08] shrink-0 space-y-2">
        {/* Active Listening Indicator Banner */}
        {speechRecognition.isListening && (
          <div className="flex items-center justify-between px-3.5 py-2 bg-red-950/40 border border-red-500/40 rounded-xl text-xs text-red-200 shadow-glow-sm">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-red-500 animate-ping" />
              <span className="font-bold">
                {language === "mr"
                  ? `मराठीत ऐकत आहे... तुमचा प्रश्न आता बोला.`
                  : language === "hi"
                  ? `हिंदी में सुन रहा है... अपना वित्तीय प्रश्न अभी बोलें.`
                  : `Listening in ${getLanguageLabel(language)}... Speak your financial query now.`}
              </span>
            </div>
            <button
              type="button"
              onClick={speechRecognition.stopListening}
              className="text-xs font-bold text-red-300 underline hover:text-red-100 cursor-pointer"
            >
              {language === "mr" ? "बोलणे पूर्ण" : language === "hi" ? "बोलना समाप्त" : "Done Speaking"}
            </button>
          </div>
        )}

        {/* Speech Recognition Error Notice */}
        {speechRecognition.error && (
          <div className="flex items-center justify-between px-3 py-1.5 bg-amber-950/30 border border-amber-500/30 rounded-xl text-xs text-amber-200">
            <div className="flex items-center gap-1.5">
              <AlertCircle className="w-3.5 h-3.5 text-amber-400 shrink-0" />
              <span>{speechRecognition.error}</span>
            </div>
            <button
              type="button"
              onClick={speechRecognition.resetError}
              className="text-amber-300 font-bold hover:underline ml-2 cursor-pointer"
            >
              {language === "mr" ? "बंद करा" : language === "hi" ? "खारिज करें" : "Dismiss"}
            </button>
          </div>
        )}

        {/* Input Form with Microphone and Send buttons */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-end gap-2 bg-surface p-2 rounded-2xl border border-white/15 focus-within:border-brand-400 focus-within:ring-2 focus-within:ring-brand-400/20 transition-all shadow-elevation-2"
        >
          <textarea
            ref={inputRef}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={
              speechRecognition.isListening
                ? t.ai.listeningPlaceholder
                : t.ai.inputPlaceholder
            }
            rows={1}
            disabled={isLoading}
            className="flex-1 resize-none max-h-32 min-h-[42px] px-3 py-2 text-sm text-white bg-transparent placeholder:text-gray-500 focus:outline-none"
          />

          {/* Microphone Voice Button (if browser supported) */}
          {speechRecognition.isSupported && (
            <Button
              type="button"
              variant={speechRecognition.isListening ? "primary" : "outline"}
              size="md"
              onClick={handleToggleVoiceInput}
              disabled={isLoading}
              className={cn(
                "relative h-[42px] px-3 font-bold shrink-0 transition-all duration-200 overflow-hidden",
                speechRecognition.isListening
                  ? "bg-red-600 hover:bg-red-700 text-white border-red-600 shadow-md ring-4 ring-red-500/30"
                  : "border-white/20 text-gray-300 hover:text-white hover:border-brand-400/50"
              )}
              aria-label={speechRecognition.isListening ? "Stop listening" : "Start voice input"}
              title={
                speechRecognition.isListening
                  ? t.ai.stopSpeaking
                  : `Click to speak in ${getLanguageLabel(language)}`
              }
            >
              {speechRecognition.isListening && (
                <span
                  className="animate-ping absolute inline-flex h-full w-full rounded-xl bg-red-400 opacity-40 pointer-events-none"
                  aria-hidden="true"
                />
              )}
              {speechRecognition.isListening ? (
                <Square className="w-4 h-4 fill-current relative z-10" />
              ) : (
                <Mic className="w-4 h-4 relative z-10" />
              )}
            </Button>
          )}

          {/* Send Button */}
          <Button
            type="submit"
            size="md"
            disabled={!inputMessage.trim() || isLoading}
            isLoading={isLoading}
            className="h-[42px] px-4 font-bold shrink-0 gap-1.5 shadow-glow-sm"
            aria-label="Send message"
          >
            <span className="hidden sm:inline">{t.ai.sendButton}</span>
            <Send className="w-4 h-4" />
          </Button>
        </form>

        {/* Statutory Financial Safety Disclaimer */}
        <p className="text-[11px] text-gray-500 text-center leading-tight px-2">
          {t.ai.disclaimerBody}
        </p>
      </div>
    </div>
  );
}
