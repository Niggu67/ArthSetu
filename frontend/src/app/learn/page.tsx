"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpen,
  CheckCircle2,
  Clock,
  Sparkles,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Lightbulb,
  Award,
  RotateCcw,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { progressApi } from "@/lib/api";
import { LearningModule, UserProgress } from "@/types";
import { getLocalizedModules } from "@/i18n/dynamicContent";

export default function LearnPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <LearnContent />
      </AppShell>
    </ProtectedRoute>
  );
}

const MODULES: LearningModule[] = [
  {
    id: "learn-loan-basics",
    title: "1. What is a Business Loan?",
    category: "Credit & Borrowing",
    readTime: "3 min read",
    description:
      "A business loan is borrowed capital from a bank or financial institution that you invest into your enterprise—such as buying raw materials, machinery, or stock—and pay back over time with interest.",
    realWorldExample:
      "Sunita runs an organic spice grinding unit in Nashik. To buy an electric pulverizer costing ₹1,50,000, she takes a Mudra Kishore loan at a low bank interest rate instead of borrowing from local moneylenders who charge 5% per month.",
    keyTakeaway:
      "Always borrow from formal banks or authorized cooperatives. Compare the repayment tenure and monthly EMI before signing loan agreements.",
  },
  {
    id: "learn-micro-insurance",
    title: "2. What is Micro-Insurance?",
    category: "Risk Protection",
    readTime: "4 min read",
    description:
      "Micro-insurance provides affordable financial protection tailored specifically for low-income and rural households against unexpected events like cattle loss, fire, crop damage, or medical emergencies.",
    realWorldExample:
      "Ramesh owns two dairy cows. He pays an annual premium of ₹600 for livestock insurance. When an unseasonal infection affects one cow, the insurance company compensates him ₹45,000, preventing his family from falling into severe debt.",
    keyTakeaway:
      "A small yearly premium protects your enterprise from catastrophic losses. Inquire about government-subsidized cattle and crop insurance schemes.",
  },
  {
    id: "learn-credit-score",
    title: "3. What is a Credit Score (CIBIL)?",
    category: "Financial Health",
    readTime: "3 min read",
    description:
      "A credit score is a 3-digit number (between 300 and 900) that tells banks how reliably you repay loans and credit cards. A score of 700 or above helps you secure faster loan sanctions with lower interest rates.",
    realWorldExample:
      "Ganesh always pays his monthly tractor EMI three days before the due date. His credit score rose to 765. When he applied for a ₹5 Lakh working capital loan under PMEGP, the bank manager approved it without demanding third-party guarantees.",
    keyTakeaway:
      "Repay your loan installments and utility bills on time. Even a single delayed payment can lower your score and make future bank loans harder to obtain.",
  },
  {
    id: "learn-digital-banking",
    title: "4. What is Digital Banking & UPI?",
    category: "Modern Transactions",
    readTime: "3 min read",
    description:
      "Digital banking enables you to send and receive payments instantly using your smartphone (via UPI, QR codes, and NetBanking) without traveling to distant bank branches.",
    realWorldExample:
      "Kavita displays a bank UPI QR code at her village grocery store. Customers scan and pay directly into her savings account. She now has a digital record of her daily ₹4,000 sales, which she uses as bank proof to apply for a business expansion loan.",
    keyTakeaway:
      "Digital transactions build a verifiable financial footprint. Never share your 4-digit or 6-digit UPI PIN with anyone claiming to send you money.",
  },
  {
    id: "learn-govt-schemes",
    title: "5. What are Government Schemes?",
    category: "Public Assistance",
    readTime: "4 min read",
    description:
      "Central and state governments create special welfare programs to provide subsidized loans, capital grants, and collateral-free credit guarantees to encourage rural self-employment.",
    realWorldExample:
      "Mahesh wants to set up a mini flour mill. Under PMEGP, he applies through the KVIC portal and receives a 35% government capital subsidy on his ₹6 Lakh project cost, reducing his personal loan liability significantly.",
    keyTakeaway:
      "Never pay middlemen or unauthorized agents for scheme application forms. Application guidelines and portals are completely free on official government websites.",
  },
  {
    id: "learn-investing-basics",
    title: "6. What is Investing & Wealth Protection?",
    category: "Savings & Growth",
    readTime: "4 min read",
    description:
      "Investing means putting surplus business profits to work in assets that grow faster than inflation—such as recurring bank deposits (RD), fixed deposits (FD), and gold bonds—so you have emergency funds.",
    realWorldExample:
      "After paying all monthly expenses, Balu saves ₹1,50,0 every month into an automatic bank Recurring Deposit (RD). After 3 years, he has accumulated ₹60,000 in savings, which allows him to buy bulk fertilizer at a wholesale discount.",
    keyTakeaway:
      "Keep at least 3 months of basic business expenses in a liquid bank account before considering long-term investments.",
  },
];

function LearnContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [progressMap, setProgressMap] = useState<Record<string, UserProgress>>({});
  const [expandedId, setExpandedId] = useState<string | null>(MODULES[0].id);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [justCompletedId, setJustCompletedId] = useState<string | null>(null);

  const localizedModules = getLocalizedModules(MODULES, t);

  // Load progress from backend
  const loadProgress = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    try {
      const records = await progressApi.getByUserId(user.id);
      const map: Record<string, UserProgress> = {};
      records.forEach((r) => {
        map[r.module_id] = r;
      });
      setProgressMap(map);
    } catch {
      // Fallback
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadProgress();
  }, [user?.id]);

  // Mark module as completed and persist to backend
  const handleToggleComplete = async (module: LearningModule) => {
    if (!user?.id) return;
    const current = progressMap[module.id];
    const isCompleted = current?.completion_status === "completed";

    const newStatus = isCompleted ? "in_progress" : "completed";
    const newPercentage = isCompleted ? 50.0 : 100.0;

    try {
      const saved = await progressApi.record({
        user_id: user.id,
        module_id: module.id,
        completion_status: newStatus,
        completion_percentage: newPercentage,
        completed_at: !isCompleted ? new Date().toISOString() : undefined,
      });

      setProgressMap((prev) => ({
        ...prev,
        [module.id]: saved,
      }));

      if (!isCompleted) {
        setJustCompletedId(module.id);
        setTimeout(() => setJustCompletedId(null), 3000);
      }
    } catch (err: any) {
      alert("Failed to update progress: " + err.message);
    }
  };

  const completedCount = Object.values(progressMap).filter(
    (p) => p.completion_status === "completed"
  ).length;
  const overallPercentage = Math.round((completedCount / MODULES.length) * 100);

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="space-y-1">
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <BookOpen className="w-7 h-7 text-brand-400 shrink-0" />
          <span>{t.learn.heading}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
          {t.learn.subtitle}
        </p>
      </div>

      {/* Progress Card */}
      <Card className="p-5 sm:p-6 bg-surface border-white/[0.08] shadow-elevation-2 rounded-3xl space-y-3.5 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-32 bg-brand-500/5 rounded-full blur-2xl pointer-events-none" />
        <div className="flex items-center justify-between relative z-10">
          <div>
            <span className="text-[11px] font-bold text-gray-400 uppercase tracking-wider block">
              {t.learn.overallProgress}
            </span>
            <p className="text-base sm:text-lg font-bold text-white mt-0.5">
              {t.learn.modulesCount.replace("{completed}", String(completedCount)).replace("{total}", String(MODULES.length))}
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl sm:text-3xl font-black text-brand-300">
              {overallPercentage}%
            </span>
          </div>
        </div>

        {/* Progress Bar with animated fill */}
        <div className="w-full h-2.5 bg-canvas-subtle rounded-full overflow-hidden border border-white/10 relative z-10">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-400 to-emerald-400 rounded-full shadow-glow-sm"
            initial={{ width: 0 }}
            animate={{ width: `${overallPercentage}%` }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          />
        </div>

        {overallPercentage === 100 && (
          <div className="p-3 bg-emerald-950/30 rounded-xl text-xs text-emerald-300 font-semibold flex items-center gap-2 border border-emerald-500/30 shadow-2xs relative z-10">
            <Award className="w-4.5 h-4.5 text-emerald-400 shrink-0" />
            <span>Congratulations! You have completed all foundational financial literacy modules.</span>
          </div>
        )}
      </Card>

      {/* Modules List */}
      <div className="space-y-4">
        {localizedModules.map((module) => {
          const prog = progressMap[module.id];
          const isDone = prog?.completion_status === "completed";
          const isExpanded = expandedId === module.id;
          const isJustCompleted = justCompletedId === module.id;

          return (
            <Card
              key={module.id}
              className={`p-5 sm:p-6 transition-all duration-200 border-white/[0.08] rounded-2xl ${
                isDone
                  ? "bg-surface border-l-4 border-l-brand-400 shadow-elevation-1"
                  : "bg-surface hover:border-brand-400/40"
              }`}
            >
              {/* Module Header Row */}
              <div
                className="flex items-start justify-between gap-3 cursor-pointer select-none"
                onClick={() => setExpandedId(isExpanded ? null : module.id)}
              >
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-xs font-semibold text-brand-300 bg-brand-500/10 px-2.5 py-0.5 rounded-md border border-brand-400/20">
                      {module.category}
                    </span>
                    <span className="text-xs text-gray-400 flex items-center gap-1 font-medium">
                      <Clock className="w-3 h-3 text-gray-500" />
                      {module.readTime}
                    </span>
                    {isDone && (
                      <Badge variant="success" withDot pulseDot className="text-[10.5px]">
                        {t.learn.completedBadge}
                      </Badge>
                    )}
                  </div>
                  <h2 className="text-base sm:text-lg font-bold text-white pt-0.5 tracking-tight">
                    {module.title}
                  </h2>
                </div>

                <button
                  type="button"
                  aria-label={isExpanded ? "Collapse module" : "Expand module"}
                  className="p-1.5 text-gray-400 hover:text-white hover:bg-white/10 rounded-lg cursor-pointer transition-colors"
                >
                  {isExpanded ? <ChevronUp className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
                </button>
              </div>

              {/* Just Completed Polished Checkmark Animation Banner */}
              {isJustCompleted && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9, y: -6 }}
                  animate={{ opacity: 1, scale: [0.9, 1.03, 1], y: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
                  className="my-3 p-3 bg-brand-500/10 border border-brand-400/30 rounded-xl text-xs text-brand-300 font-bold flex items-center gap-2 shadow-glow-sm"
                >
                  <div className="w-5 h-5 rounded-full bg-brand-500 text-canvas flex items-center justify-center text-xs shrink-0 font-black">
                    ✓
                  </div>
                  <span>Module completed and updated in your curriculum tracker!</span>
                </motion.div>
              )}

              {/* Expandable Body with smooth height */}
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }}
                    animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-4 pt-4 border-t border-white/[0.08] mt-4 text-xs sm:text-sm text-gray-300"
                  >
                    {/* Explanation */}
                    <div>
                      <h3 className="font-bold text-gray-400 text-xs uppercase tracking-wider mb-1">
                        {t.learn.badge}:
                      </h3>
                      <p className="leading-relaxed text-gray-200">{module.description}</p>
                    </div>

                    {/* Real-World Example */}
                    <div className="p-3.5 bg-amber-950/20 rounded-xl border border-amber-500/20 space-y-1">
                      <div className="flex items-center gap-1.5 font-bold text-amber-300 text-xs">
                        <Lightbulb className="w-4 h-4 text-amber-400 shrink-0" />
                        <span>{t.learn.realWorldExampleTitle}:</span>
                      </div>
                      <p className="text-xs text-gray-300 leading-relaxed pl-5.5">
                        {module.realWorldExample}
                      </p>
                    </div>

                    {/* Key Takeaway */}
                    <div className="p-3 bg-[#0C231A] rounded-xl border border-brand-400/20 text-xs text-gray-200">
                      <strong className="text-brand-300">{t.learn.keyTakeawayTitle}: </strong>
                      <span>{module.keyTakeaway}</span>
                    </div>

                    {/* Action Button */}
                    <div className="pt-2 flex justify-end">
                      <Button
                        size="sm"
                        variant={isDone ? "outline" : "primary"}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleToggleComplete(module);
                        }}
                        className={`font-bold gap-1.5 ${isDone ? "border-white/20 text-gray-300 hover:text-white" : "shadow-glow-sm"}`}
                      >
                        {isDone ? (
                          <>
                            <RotateCcw className="w-3.5 h-3.5" />
                            <span>{t.learn.resetProgress}</span>
                          </>
                        ) : (
                          <>
                            <CheckCircle2 className="w-4 h-4" />
                            <span>{t.learn.markCompleted}</span>
                          </>
                        )}
                      </Button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
