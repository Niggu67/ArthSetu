"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  FileText,
  Clock,
  GraduationCap,
  Bell,
  Sparkles,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Layers,
  Coins,
  BookOpen,
  Compass,
  Mic,
  ArrowUpRight,
  TrendingUp,
  Activity,
  Store,
} from "lucide-react";
import { motion } from "framer-motion";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { OverviewCard } from "@/components/dashboard/OverviewCard";
import { ActionCard } from "@/components/dashboard/ActionCard";
import { CinematicHero } from "@/components/dashboard/CinematicHero";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { getGreeting, formatDate } from "@/lib/utils";
import { schemesApi, applicationsApi, progressApi, notificationsApi } from "@/lib/api";
import { Scheme, Application, UserProgress, Notification } from "@/types";
import { getLocalizedScheme } from "@/i18n/dynamicContent";

const LEARNING_MODULES_LIST = [
  { id: "learn-loan-basics", title: "1. What is a Business Loan?", readTime: "3 min read" },
  { id: "learn-micro-insurance", title: "2. What is Micro-Insurance?", readTime: "4 min read" },
  { id: "learn-credit-score", title: "3. What is a Credit Score?", readTime: "3 min read" },
  { id: "learn-digital-banking", title: "4. What is Digital Banking & UPI?", readTime: "3 min read" },
  { id: "learn-govt-schemes", title: "5. What are Government Schemes?", readTime: "4 min read" },
  { id: "learn-investing-basics", title: "6. What is Investing & Wealth Protection?", readTime: "4 min read" },
];

export default function DashboardPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <DashboardContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function DashboardContent() {
  const { user } = useAuth();
  const { language, t } = useLanguage();

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [applications, setApplications] = useState<Application[]>([]);
  const [progress, setProgress] = useState<UserProgress[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  useEffect(() => {
    async function loadDashboardData() {
      setIsLoading(true);
      try {
        const schemesRes = await schemesApi.list().catch(() => ({ total: 5, schemes: [], disclaimer: "" }));
        setSchemes(schemesRes.schemes || []);

        if (user?.id) {
          const [appsRes, progRes, notifsRes] = await Promise.all([
            applicationsApi.getByUserId(user.id).catch(() => []),
            progressApi.getByUserId(user.id).catch(() => []),
            notificationsApi.getByUserId(user.id).catch(() => []),
          ]);
          setApplications(appsRes);
          setProgress(progRes);
          setNotifications(notifsRes);
        }
      } finally {
        setIsLoading(false);
      }
    }

    loadDashboardData();
  }, [user?.id]);

  const greetingWord = getGreeting(language);
  const userName = user?.name ? user.name.split(" ")[0] : "Entrepreneur";

  // Calculate learning progress
  const completedModuleIds = new Set(
    progress.filter((p) => p.completion_status === "completed").map((p) => p.module_id)
  );
  const completedCount = completedModuleIds.size;
  const overallPercentage = Math.round((completedCount / LEARNING_MODULES_LIST.length) * 100);

  // Next incomplete module
  const nextModule = LEARNING_MODULES_LIST.find((m) => !completedModuleIds.has(m.id)) || LEARNING_MODULES_LIST[0];

  const unreadNotifications = notifications.filter((n) => !n.read_status).length;

  // Transparent Rules-Based Opportunity Matching (based on user profile)
  const userSector = (user?.business_type || "").toLowerCase();
  const recommendedSchemes = schemes
    .filter((s) => {
      const allowed = (s.eligibility_criteria?.allowed_business_types || []).map((t: string) => t.toLowerCase());
      if (allowed.includes("all")) return true;
      if (userSector && allowed.some((t: string) => t.includes(userSector) || userSector.includes(t))) return true;
      return false;
    })
    .slice(0, 2);

  return (
    <div className="space-y-8 sm:space-y-10">
      {/* ------------------------------------------------------------- */}
      {/* 1. AUTHENTICATED CINEMATIC DASHBOARD HERO                     */}
      {/* ------------------------------------------------------------- */}
      <CinematicHero
        user={user}
        schemesCount={schemes.length || 5}
        applicationsCount={applications.length}
        learningPercentage={overallPercentage}
      />

      {/* ------------------------------------------------------------- */}
      {/* 2. METRIC STRIP (Inspired by Reference 25K+, 1.2M+, 40%, 30%) */}
      {/* ------------------------------------------------------------- */}
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1, ease: [0.16, 1, 0.3, 1] }}
        className="grid grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5"
      >
        <OverviewCard
          title={t.dashboard.verifiedSchemes}
          value={schemes.length || 5}
          subtitle={t.dashboard.verifiedSchemesSub}
          icon={FileText}
          color="brand"
          href="/schemes"
          isLoading={isLoading}
        />
        <OverviewCard
          title={t.dashboard.activeApplications}
          value={applications.length}
          subtitle={applications.length > 0 ? t.dashboard.activeApplicationsSub : t.dashboard.noApplicationsSub}
          icon={Layers}
          color="navy"
          href="/applications"
          isLoading={isLoading}
        />
        <OverviewCard
          title={t.dashboard.learningProgress}
          value={`${overallPercentage}%`}
          subtitle={`${completedCount} / ${LEARNING_MODULES_LIST.length} ${t.dashboard.learningProgressSub}`}
          icon={GraduationCap}
          color="ochre"
          href="/learn"
          isLoading={isLoading}
        />
        <OverviewCard
          title={t.dashboard.newAlerts}
          value={unreadNotifications}
          subtitle={t.dashboard.newAlertsSub}
          icon={Bell}
          color="neutral"
          href="#notifications"
          isLoading={isLoading}
        />
      </motion.div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CORE SERVICES GRID (Inspired by "Solutions for Every Farm")*/}
      {/* ------------------------------------------------------------- */}
      <div className="space-y-4">
        <div>
          <span className="text-[11px] font-bold text-brand-400 uppercase tracking-widest block">
            {t.dashboard.whatWeDo}
          </span>
          <h2 className="text-xl sm:text-2xl font-black text-white tracking-tight mt-0.5">
            {t.dashboard.solutionsHeading}
          </h2>
          <p className="text-xs sm:text-sm text-gray-400 mt-1 max-w-2xl leading-relaxed">
            {t.dashboard.solutionsDesc}
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <ActionCard
            title={t.dashboard.exploreSchemes}
            description={t.dashboard.exploreSchemesDesc}
            icon={FileText}
            href="/schemes"
            color="brand"
            tag="5 Live Schemes"
            badgeVariant="brand"
          />

          <ActionCard
            title={t.dashboard.checkEligibility}
            description={t.dashboard.checkEligibilityDesc}
            icon={CheckCircle2}
            href="/eligibility"
            color="navy"
            tag="Rules-Based"
            badgeVariant="navy"
          />

          <ActionCard
            title={t.dashboard.trackApplications}
            description={t.dashboard.trackApplicationsDesc}
            icon={Layers}
            href="/applications"
            color="ochre"
            tag="Self-Tracking"
            badgeVariant="ochre"
          />

          <ActionCard
            title={t.dashboard.askAi}
            description={t.dashboard.askAiDesc}
            icon={Sparkles}
            href="/ai"
            color="brand"
            tag="AI & Voice"
            badgeVariant="success"
          />
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. PROMINENT "ASK ARTHSETU AI" FEATURE BANNER                 */}
      {/* ------------------------------------------------------------- */}
      <div className="relative overflow-hidden rounded-3xl bg-[#091E16] text-white p-6 sm:p-8 lg:p-9 shadow-elevation-2 border border-brand-400/20">
        <div className="absolute right-0 top-0 w-80 h-80 bg-brand-400/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 flex flex-col lg:flex-row lg:items-center justify-between gap-6 lg:gap-8">
          <div className="space-y-3.5 max-w-2xl">
            <div className="flex items-center gap-2 flex-wrap">
              <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-brand-400/15 text-brand-300 border border-brand-400/30">
                <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse shadow-glow-brand" />
                {t.dashboard.askAiMultilingualBadge}
              </span>
              <span className="text-xs text-gray-400 font-medium">
                {t.dashboard.askAiLangList}
              </span>
            </div>

            <h2 className="text-xl sm:text-2xl lg:text-[26px] font-black tracking-tight text-white flex items-center gap-2.5 leading-tight">
              <Sparkles className="w-6 h-6 text-brand-400 shrink-0" />
              <span>{t.dashboard.askAiBannerTitle}</span>
            </h2>

            <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-xl">
              {t.dashboard.askAiBannerDesc}
            </p>

            {/* Starter question quick chips */}
            <div className="flex items-center gap-2 pt-1 flex-wrap">
              <Link
                href="/ai"
                className="text-xs bg-white/[0.05] hover:bg-brand-400/15 text-gray-300 hover:text-brand-300 px-3 py-1.5 rounded-xl border border-white/10 hover:border-brand-400/30 transition-all cursor-pointer"
              >
                &ldquo;{t.dashboard.askAiChip1}&rdquo;
              </Link>
              <Link
                href="/ai"
                className="text-xs bg-white/[0.05] hover:bg-brand-400/15 text-gray-300 hover:text-brand-300 px-3 py-1.5 rounded-xl border border-white/10 hover:border-brand-400/30 transition-all cursor-pointer"
              >
                &ldquo;{t.dashboard.askAiChip2}&rdquo;
              </Link>
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 shrink-0 pt-1 lg:pt-0">
            <Link href="/ai">
              <Button
                size="lg"
                className="w-full sm:w-auto font-extrabold shadow-glow-brand/50 gap-2"
              >
                <span>{t.dashboard.chatWithAiButton}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
            <Link href="/ai">
              <Button
                variant="outline"
                size="lg"
                className="w-full sm:w-auto font-bold border-white/20 text-white bg-white/[0.04] hover:bg-white/[0.08] gap-2"
              >
                <Mic className="w-4 h-4 text-brand-300" />
                <span>{t.dashboard.voiceInputButton}</span>
              </Button>
            </Link>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 5. RECOMMENDED OPPORTUNITIES                                  */}
      {/* ------------------------------------------------------------- */}
      {recommendedSchemes.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-[11px] font-bold text-brand-400 uppercase tracking-widest block">
                {t.dashboard.tailoredMatchesBadge}
              </span>
              <h2 className="text-xl font-black text-white tracking-tight mt-0.5 flex items-center gap-2">
                <Compass className="w-5 h-5 text-brand-400" />
                {t.dashboard.recommendedHeading}
              </h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {t.dashboard.recommendedSubtitle}:{" "}
                <strong className="text-white">{user?.business_type || "Micro-Enterprise"}</strong>
              </p>
            </div>
            <Link
              href="/schemes"
              className="text-xs font-bold text-brand-300 hover:text-white flex items-center gap-1 transition-colors"
            >
              <span>{t.dashboard.viewAll}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {recommendedSchemes.map((rawS) => {
              const s = getLocalizedScheme(rawS, t);
              return (
                <Card
                  key={s.id}
                  hoverable
                  className="p-6 space-y-4 bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] group hover:border-brand-400/40 transition-all duration-200"
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="space-y-1">
                      <Badge variant="brand" className="text-[10px] py-0.5 px-2">
                        {s.category}
                      </Badge>
                      <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition-colors">
                        {s.name}
                      </h3>
                    </div>
                    <Link href={`/schemes/${s.id}`}>
                      <Button variant="outline" size="sm" className="text-xs font-bold shrink-0">
                        {t.dashboard.viewButton}
                      </Button>
                    </Link>
                  </div>
                  <p className="text-xs text-gray-400 line-clamp-2 leading-relaxed">{s.description}</p>
                  <div className="p-3 bg-white/[0.04] rounded-xl text-xs text-gray-200 border border-white/[0.06]">
                    <strong className="font-semibold text-brand-300">{t.dashboard.benefitLabel} </strong>
                    <span className="line-clamp-1">{s.benefits}</span>
                  </div>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 6. CONTINUE LEARNING SPOTLIGHT                                */}
      {/* ------------------------------------------------------------- */}
      <div className="p-6 sm:p-7 bg-[#0C231A]/85 backdrop-blur-md rounded-2xl border border-white/[0.08] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5 shadow-card">
        <div className="flex items-start gap-4">
          <div className="p-3.5 bg-ochre-500/15 text-ochre-300 rounded-xl shrink-0 border border-ochre-500/25 shadow-2xs">
            <BookOpen className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-bold text-ochre-300 uppercase tracking-widest">
                {t.dashboard.financialEducationBadge}
              </span>
              <span className="text-[11px] text-gray-400">• {nextModule.readTime}</span>
            </div>
            <h3 className="text-base sm:text-lg font-bold text-white mt-1">
              {t.learningData[nextModule.id]?.title || nextModule.title}
            </h3>
            <p className="text-xs sm:text-sm text-gray-400 mt-1 leading-relaxed">
              {completedCount === LEARNING_MODULES_LIST.length
                ? t.dashboard.allModulesCompleted
                : t.dashboard.modulesCompletedCount
                    .replace("{completed}", String(completedCount))
                    .replace("{total}", String(LEARNING_MODULES_LIST.length))
                    .replace("{percent}", String(overallPercentage))}
            </p>
          </div>
        </div>

        <Link href="/learn" className="shrink-0 self-end sm:self-center">
          <Button variant="amber" size="sm" className="font-bold gap-1.5 shadow-2xs">
            <span>{t.dashboard.resumeLearning}</span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </Link>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 7. NOTIFICATIONS SECTION (Preserves Click-to-Read & Header Sync)*/}
      {/* ------------------------------------------------------------- */}
      <div id="notifications" className="pt-2 scroll-mt-20 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold text-white flex items-center gap-2 tracking-tight">
            <Bell className="w-5 h-5 text-gray-400" />
            {t.dashboard.newAlerts}
          </h2>
          {unreadNotifications > 0 && (
            <Badge variant="ochre" withDot>
              {t.dashboard.unreadCount.replace("{count}", String(unreadNotifications))}
            </Badge>
          )}
        </div>

        {notifications.length === 0 ? (
          <Card className="p-6 text-center text-gray-400 text-sm bg-[#0C231A]/60 border-white/[0.06]">
            <p>{t.dashboard.noAlerts}</p>
          </Card>
        ) : (
          <div className="space-y-2.5">
            {notifications.map((notif) => (
              <Card
                key={notif.id}
                className={`p-4 border-l-4 transition-all ${
                  notif.read_status
                    ? "border-l-white/20 bg-[#0C231A]/50 border-white/[0.06]"
                    : "border-l-brand-400 bg-brand-400/[0.06] border-brand-400/25 cursor-pointer hover:bg-brand-400/[0.12]"
                }`}
                onClick={
                  notif.read_status
                    ? undefined
                    : async () => {
                        // Optimistic local update
                        setNotifications((prev) =>
                          prev.map((n) =>
                            n.id === notif.id ? { ...n, read_status: true } : n
                          )
                        );
                        try {
                          await notificationsApi.markAsRead(notif.id);
                        } catch {
                          // Revert on failure
                          setNotifications((prev) =>
                            prev.map((n) =>
                              n.id === notif.id ? { ...n, read_status: false } : n
                            )
                          );
                          return;
                        }
                        // Notify Header to re-sync its unread badge
                        window.dispatchEvent(new CustomEvent("notif-read"));
                      }
                }
                aria-label={notif.read_status ? undefined : `Mark "${notif.title}" as read`}
                role={notif.read_status ? undefined : "button"}
                tabIndex={notif.read_status ? undefined : 0}
                onKeyDown={
                  notif.read_status
                    ? undefined
                    : (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          (e.currentTarget as HTMLElement).click();
                        }
                      }
                }
              >
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h3 className="text-sm font-bold text-white">{notif.title}</h3>
                    <p className="text-xs text-gray-400 mt-1 leading-relaxed">
                      {notif.message}
                    </p>
                  </div>
                  {!notif.read_status && (
                    <span className="w-2 h-2 rounded-full bg-brand-400 shrink-0 mt-1 shadow-glow-brand" />
                  )}
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
