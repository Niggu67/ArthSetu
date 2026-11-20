"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  CheckCircle2,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  Briefcase,
  Coins,
  ShieldCheck,
  FileCheck,
  RotateCcw,
  Sparkles,
  Layers,
  HelpCircle,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { eligibilityApi, schemesApi } from "@/lib/api";
import {
  EligibilityCheckRequest,
  EligibilityCheckResponse,
  Scheme,
} from "@/types";
import { cn } from "@/lib/utils";

export default function EligibilityPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <EligibilityContent />
      </AppShell>
    </ProtectedRoute>
  );
}

const BUSINESS_TYPES = [
  "Agriculture",
  "Food Processing",
  "Manufacturing",
  "Services",
  "Retail",
  "Handicrafts",
  "Trading",
  "Agri-allied",
];

const GENDERS = [
  { value: "all", label: "Not Specified / Any" },
  { value: "female", label: "Female (Special Priority under Stand-Up India)" },
  { value: "male", label: "Male" },
  { value: "other", label: "Other" },
];

const SOCIAL_CATEGORIES = [
  { value: "all", label: "General / Not Specified" },
  { value: "SC", label: "Scheduled Caste (SC)" },
  { value: "ST", label: "Scheduled Tribe (ST)" },
  { value: "OBC", label: "Other Backward Class (OBC)" },
  { value: "Minority", label: "Minority Community" },
];

function EligibilityContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const querySchemeId = searchParams.get("scheme_id");

  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [step, setStep] = useState<number>(1);
  const [isEvaluating, setIsEvaluating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Form fields mapped to EligibilityCheckRequest
  const [businessType, setBusinessType] = useState<string>(
    user?.business_type || "Food Processing"
  );
  const [annualIncome, setAnnualIncome] = useState<string>(
    user?.annual_income ? String(user.annual_income) : "300000"
  );
  const [yearsInBusiness, setYearsInBusiness] = useState<number>(
    user?.years_in_business ?? 1
  );
  const [location, setLocation] = useState<string>(user?.location || "");
  const [gender, setGender] = useState<string>("all");
  const [socialCategory, setSocialCategory] = useState<string>("all");
  const [schemeId, setSchemeId] = useState<string>(querySchemeId || "all");

  // Assessment Result
  const [result, setResult] = useState<EligibilityCheckResponse | null>(null);

  useEffect(() => {
    schemesApi
      .list()
      .then((res) => {
        setSchemes(res.schemes || []);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (querySchemeId) {
      setSchemeId(querySchemeId);
    }
  }, [querySchemeId]);

  const handleNextStep = () => {
    setError(null);
    setStep((prev) => Math.min(prev + 1, 3));
  };

  const handlePrevStep = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleEvaluate = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setIsEvaluating(true);
    setError(null);

    const payload: EligibilityCheckRequest = {
      user_id: user?.id || null,
      business_type: businessType || null,
      annual_income: annualIncome ? parseFloat(annualIncome) : null,
      years_in_business: Number(yearsInBusiness) >= 0 ? Number(yearsInBusiness) : null,
      location: location.trim() || null,
      gender: gender !== "all" ? gender : null,
      social_category: socialCategory !== "all" ? socialCategory : null,
      scheme_id: schemeId !== "all" ? Number(schemeId) : null,
    };

    try {
      const data = await eligibilityApi.check(payload);
      setResult(data);
    } catch (err: any) {
      setError(err.message || "Failed to evaluate eligibility. Please check connection.");
    } finally {
      setIsEvaluating(false);
    }
  };

  const handleReset = () => {
    setResult(null);
    setStep(1);
    setError(null);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Page Title */}
      <div className="space-y-1.5">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-400/10 border border-brand-400/25">
          <CheckCircle2 className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-bold text-brand-300 uppercase tracking-widest">
            {t.eligibility.badge}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
          <span>{t.eligibility.heading}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 leading-relaxed">
          {t.eligibility.subtitle}
        </p>
      </div>

      {/* Results View */}
      {result ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.25 }}
          className="space-y-6"
        >
          {/* Main Score Banner */}
          <Card className="p-6 sm:p-8 bg-gradient-to-br from-[#102A1E] via-[#0C231A] to-[#071A13] border-brand-400/30 text-center space-y-4 rounded-3xl shadow-elevation-2">
            <Badge variant="brand" withDot className="text-xs px-3 py-1">
              {t.eligibility.resultsHeading}
            </Badge>

            <div>
              <div className="inline-flex items-baseline gap-1.5">
                <span className="text-5xl sm:text-6xl font-black text-brand-400 tracking-tight shadow-glow-brand">
                  {result.overall_eligibility_score}
                </span>
                <span className="text-xl text-gray-500 font-bold">/ 100</span>
              </div>
              <p className="text-xs text-gray-400 font-semibold mt-1 uppercase tracking-wider">
                {t.eligibility.qualifyingScore}
              </p>
            </div>

            <p className="text-xs sm:text-sm text-gray-200 max-w-lg mx-auto leading-relaxed">
              {result.overall_eligibility_score >= 60
                ? t.eligibility.highMatch
                : t.eligibility.moderateMatch}
            </p>

            <div className="pt-2 flex justify-center">
              <Button variant="outline" size="sm" onClick={handleReset} className="gap-1.5 font-bold shadow-2xs">
                <RotateCcw className="w-4 h-4" />
                <span>{t.eligibility.recalculateButton}</span>
              </Button>
            </div>
          </Card>

          {/* Informational Disclaimer */}
          <div className="p-4 bg-[#0C231A]/90 rounded-2xl border border-white/10 text-gray-300 text-xs leading-relaxed flex items-start gap-3 shadow-2xs">
            <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
            <div>
              <strong className="block font-bold text-white">{t.eligibility.disclaimerTitle}</strong>
              <span>{result.disclaimer || t.eligibility.disclaimerBody}</span>
            </div>
          </div>

          {/* Key Positive Factors / Reasons */}
          {result.reasons && result.reasons.length > 0 && (
            <Card className="p-6 space-y-3 bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] rounded-2xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                <CheckCircle2 className="w-5 h-5 text-brand-400" />
                {t.eligibility.whyEligible}
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                {result.reasons.map((reason, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
                    <span className="text-brand-400 font-bold shrink-0 mt-0.5">✓</span>
                    <span className="leading-relaxed">{reason}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Missing Prerequisites / Action Items */}
          {result.missing_requirements && result.missing_requirements.length > 0 && (
            <Card className="p-6 space-y-3 bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] rounded-2xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                <AlertCircle className="w-5 h-5 text-amber-400" />
                {t.eligibility.criteriaBreakdown}
              </h2>
              <ul className="space-y-2 text-xs sm:text-sm text-gray-300">
                {result.missing_requirements.map((miss, idx) => (
                  <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-amber-500/[0.06] border border-amber-500/20 text-amber-200">
                    <span className="text-amber-400 font-bold shrink-0 mt-0.5">•</span>
                    <span className="leading-relaxed">{miss}</span>
                  </li>
                ))}
              </ul>
            </Card>
          )}

          {/* Evaluated Potential Matches */}
          <div className="space-y-3">
            <h2 className="text-lg font-bold text-white tracking-tight">
              {t.eligibility.matchedSchemes} ({result.potentially_eligible_schemes.length})
            </h2>

            <div className="space-y-3">
              {result.potentially_eligible_schemes.map((item) => {
                const localizedName = t.schemesData[item.scheme_id]?.name || item.scheme_name;
                const localizedCategory = t.schemesData[item.scheme_id]?.category || item.category;
                return (
                  <Card
                    key={item.scheme_id}
                    className="p-5 sm:p-6 space-y-4 bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] rounded-2xl hover:border-brand-400/40 transition-colors"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-base font-bold text-white">{localizedName}</h3>
                          <Badge variant={item.is_eligible ? "brand" : "neutral"} className="text-xs">
                            {localizedCategory}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-400 mt-1">
                          Match Score: <strong className="text-brand-300 font-bold">{item.eligibility_score}%</strong>
                        </p>
                      </div>

                      <div className="flex items-center gap-2">
                        <Link href={`/schemes/${item.scheme_id}`}>
                          <Button variant="outline" size="sm" className="font-semibold text-xs">
                            {t.schemes.viewDetails}
                          </Button>
                        </Link>

                        <Link href={`/applications?scheme_id=${item.scheme_id}`}>
                          <Button variant="secondary" size="sm" className="gap-1 font-bold text-xs shadow-2xs">
                            <Layers className="w-3.5 h-3.5 text-brand-300" />
                            <span>{t.schemes.trackThisScheme}</span>
                          </Button>
                        </Link>
                      </div>
                    </div>

                    {item.reasons.length > 0 && (
                      <div className="text-xs text-gray-300 bg-white/[0.03] p-3 rounded-xl space-y-1 border border-white/[0.06]">
                        <strong className="font-bold text-brand-300 block">{t.eligibility.whyEligible}</strong>
                        {item.reasons.map((r, i) => (
                          <p key={i}>✓ {r}</p>
                        ))}
                      </div>
                    )}
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Consolidated Required Documents */}
          {result.required_documents && result.required_documents.length > 0 && (
            <Card className="p-6 space-y-3 bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] rounded-2xl">
              <h2 className="text-base font-bold text-white flex items-center gap-2 tracking-tight">
                <FileCheck className="w-5 h-5 text-brand-400" />
                {t.schemes.documentationRequired}
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
                {result.required_documents.map((doc, idx) => (
                  <div
                    key={idx}
                    className="p-2.5 bg-white/[0.03] rounded-xl text-xs text-gray-200 border border-white/[0.06] flex items-center gap-2"
                  >
                    <CheckCircle2 className="w-4 h-4 text-brand-400 shrink-0" />
                    <span className="font-medium">{doc}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}
        </motion.div>
      ) : (
        /* Multi-Step Questionnaire Form */
        <Card className="p-6 sm:p-8 bg-[#0C231A]/90 backdrop-blur-md border border-white/[0.09] shadow-elevation-2 rounded-3xl">
          {/* Connected Step Stepper */}
          <div className="mb-8">
            <div className="flex items-center justify-between relative max-w-md mx-auto mb-3">
              {/* Background Connecting Line */}
              <div className="absolute left-6 right-6 top-1/2 -translate-y-1/2 h-0.5 bg-white/10" aria-hidden="true" />
              {/* Active Connecting Fill */}
              <div
                className="absolute left-6 top-1/2 -translate-y-1/2 h-0.5 bg-brand-400 transition-all duration-300 ease-spring-gentle shadow-glow-brand"
                style={{ width: step === 1 ? "0%" : step === 2 ? "50%" : "calc(100% - 3rem)" }}
                aria-hidden="true"
              />

              {[
                { num: 1, label: t.eligibility.step1Title },
                { num: 2, label: t.eligibility.step2Title },
                { num: 3, label: t.eligibility.step3Title },
              ].map((s) => (
                <div key={s.num} className="relative z-10 flex flex-col items-center">
                  <div
                    className={cn(
                      "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs transition-all duration-200 shadow-2xs",
                      step > s.num
                        ? "bg-brand-400 text-[#071A13]"
                        : step === s.num
                        ? "bg-brand-400 text-[#071A13] ring-4 ring-brand-400/25 shadow-glow-brand"
                        : "bg-[#0B2118] text-gray-400 border border-white/20"
                    )}
                  >
                    {step > s.num ? "✓" : s.num}
                  </div>
                  <span
                    className={cn(
                      "text-[11px] font-semibold mt-1 tracking-tight transition-colors",
                      step >= s.num ? "text-brand-300 font-bold" : "text-gray-500"
                    )}
                  >
                    {s.label}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {error && (
            <div className="mb-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/30 text-rose-300 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: BUSINESS SECTOR */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                    <Briefcase className="w-5 h-5 text-brand-400" />
                    {t.eligibility.businessTypeLabel}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Matches your enterprise against approved business activities in schemes like Mudra, PMEGP, PMFME, and ACABC.
                  </p>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 pt-2">
                  {BUSINESS_TYPES.map((type) => {
                    const typeKey = type.toLowerCase().replace(" ", "_");
                    const label = t.onboarding.businessTypes[typeKey] || type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setBusinessType(type)}
                        className={`p-3.5 rounded-xl border-2 text-left transition-all cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 ${
                          businessType === type
                            ? "border-brand-400 bg-brand-400/15 text-brand-300 font-bold shadow-glow-brand/20"
                            : "border-white/10 bg-white/[0.02] text-gray-300 hover:border-white/20 hover:text-white"
                        }`}
                      >
                        <span className="text-xs block font-semibold">{label}</span>
                      </button>
                    );
                  })}
                </div>

                <div className="pt-2">
                  <Input
                    label={t.eligibility.locationLabel}
                    placeholder={t.eligibility.locationPlaceholder}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    helperText={t.eligibility.locationPlaceholder}
                  />
                </div>
              </motion.div>
            )}

            {/* STEP 2: FINANCIAL & OPERATING DETAILS */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                    <Coins className="w-5 h-5 text-brand-400" />
                    {t.eligibility.annualTurnoverLabel}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Verifies project cost ceilings and greenfield vs. existing business rules.
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      {t.eligibility.annualTurnoverLabel}
                    </label>
                    <select
                      value={annualIncome}
                      onChange={(e) => setAnnualIncome(e.target.value)}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-2xs"
                    >
                      <option value="100000" className="bg-[#071A13] text-white">Up to ₹1,00,000</option>
                      <option value="300000" className="bg-[#071A13] text-white">₹1,00,000 - ₹3,00,000</option>
                      <option value="500000" className="bg-[#071A13] text-white">₹3,00,000 - ₹5,00,000</option>
                      <option value="1000000" className="bg-[#071A13] text-white">₹5,00,000 - ₹10,00,000</option>
                      <option value="2500000" className="bg-[#071A13] text-white">₹10,00,000 - ₹25,00,000</option>
                      <option value="5000000" className="bg-[#071A13] text-white">Above ₹25,00,000</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      {t.eligibility.operatingYearsLabel}
                    </label>
                    <select
                      value={yearsInBusiness}
                      onChange={(e) => setYearsInBusiness(Number(e.target.value))}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-2xs"
                    >
                      <option value={0} className="bg-[#071A13] text-white">New Startup (&lt; 1 year / Planning stage)</option>
                      <option value={1} className="bg-[#071A13] text-white">1 - 2 Years</option>
                      <option value={3} className="bg-[#071A13] text-white">3 - 5 Years</option>
                      <option value={6} className="bg-[#071A13] text-white">More than 5 Years</option>
                    </select>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 3: DEMOGRAPHICS & TARGET SCHEME */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 16 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -16 }}
                transition={{ duration: 0.18 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-lg sm:text-xl font-bold text-white flex items-center gap-2 tracking-tight">
                    <ShieldCheck className="w-5 h-5 text-brand-400" />
                    {t.eligibility.step3Title}
                  </h2>
                  <p className="text-xs text-gray-400 mt-1">
                    Special categories unlock enhanced subsidies (e.g. up to 35% under PMEGP or Stand-Up India priority).
                  </p>
                </div>

                <div className="space-y-3.5 pt-2">
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      {t.eligibility.socialCategoryLabel}
                    </label>
                    <select
                      value={socialCategory}
                      onChange={(e) => setSocialCategory(e.target.value)}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-2xs"
                    >
                      {Object.entries(t.eligibility.socialCategories).map(([val, lbl]) => (
                        <option key={val} value={val} className="bg-[#071A13] text-white">
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      {t.eligibility.genderLabel}
                    </label>
                    <select
                      value={gender}
                      onChange={(e) => setGender(e.target.value)}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-2xs"
                    >
                      {Object.entries(t.eligibility.genders).map(([val, lbl]) => (
                        <option key={val} value={val} className="bg-[#071A13] text-white">
                          {lbl}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                      {t.eligibility.targetSchemeLabel}
                    </label>
                    <select
                      value={schemeId}
                      onChange={(e) => setSchemeId(e.target.value)}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13] focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-2xs"
                    >
                      <option value="all" className="bg-[#071A13] text-white">{t.eligibility.allSchemesOption}</option>
                      {schemes.map((s) => {
                        const locName = t.schemesData[s.id]?.name || s.name;
                        const locCat = t.schemesData[s.id]?.category || s.category;
                        return (
                          <option key={s.id} value={String(s.id)} className="bg-[#071A13] text-white">
                            {locName} ({locCat})
                          </option>
                        );
                      })}
                    </select>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Form Step Actions */}
          <div className="mt-8 pt-4 border-t border-white/[0.08] flex items-center justify-between">
            {step > 1 ? (
              <Button variant="outline" size="md" onClick={handlePrevStep} className="gap-1.5 font-bold">
                <ArrowLeft className="w-4 h-4" />
                <span>{t.eligibility.backButton}</span>
              </Button>
            ) : (
              <div />
            )}

            {step < 3 ? (
              <Button size="md" onClick={handleNextStep} className="gap-1.5 font-extrabold shadow-xs">
                <span>{t.eligibility.nextButton}</span>
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                size="md"
                onClick={handleEvaluate}
                isLoading={isEvaluating}
                className="gap-2 font-extrabold shadow-glow-brand"
              >
                <span>{isEvaluating ? t.eligibility.evaluatingButton : t.eligibility.evaluateButton}</span>
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      )}
    </div>
  );
}
