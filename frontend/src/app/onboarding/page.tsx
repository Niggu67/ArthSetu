"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles,
  Globe,
  Briefcase,
  Target,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
  Building2,
  TrendingUp,
  Landmark,
  ShieldAlert,
  GraduationCap,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { formatString } from "@/i18n";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { SupportedLanguage } from "@/types";

const businessTypes = [
  "Agriculture & Farming",
  "Dairy & Animal Husbandry",
  "Food Processing & Spices",
  "Retail & Kirana Store",
  "Handicrafts & Village Crafts",
  "Workshops & Services",
  "Manufacturing Unit",
  "Other Rural Enterprise",
];

const financialGoalOptions = [
  { id: "Start a business", title: "Start a new business", desc: "Access startup schemes and seed capital", icon: Building2 },
  { id: "Expand my business", title: "Expand my business", desc: "Purchase equipment, vehicles, or inventory", icon: TrendingUp },
  { id: "Get a loan", title: "Get a business loan", desc: "Discover low-interest loans & government subsidies", icon: Landmark },
  { id: "Protect my business", title: "Protect my business", desc: "Insurance, risk management & emergency reserves", icon: ShieldAlert },
  { id: "Learn about investing", title: "Learn financial skills", desc: "Digital bookkeeping, banking & investment basics", icon: GraduationCap },
];

export default function OnboardingPage() {
  return (
    <ProtectedRoute>
      <OnboardingWizard />
    </ProtectedRoute>
  );
}

function OnboardingWizard() {
  const router = useRouter();
  const { user, updateProfile } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Form State
  const [selectedLanguage, setSelectedLanguage] = useState<SupportedLanguage>(
    (user?.language_preference as SupportedLanguage) || language || "en"
  );
  const [businessName, setBusinessName] = useState(user?.business_name || "");
  const [businessType, setBusinessType] = useState(user?.business_type || "Food Processing & Spices");
  const [location, setLocation] = useState(user?.location || "");
  const [yearsInBusiness, setYearsInBusiness] = useState<number>(user?.years_in_business ?? 1);
  const [annualIncome, setAnnualIncome] = useState<string>(
    user?.annual_income ? String(user.annual_income) : "250000"
  );
  const [selectedGoals, setSelectedGoals] = useState<string[]>(
    user?.financial_goals ? user.financial_goals.split(", ") : ["Expand my business", "Get a loan"]
  );

  const toggleGoal = (goalId: string) => {
    if (selectedGoals.includes(goalId)) {
      setSelectedGoals(selectedGoals.filter((g) => g !== goalId));
    } else {
      setSelectedGoals([...selectedGoals, goalId]);
    }
  };

  const handleNext = () => {
    setError(null);
    if (step === 2) {
      setLanguage(selectedLanguage);
    }
    if (step === 3) {
      if (!businessName.trim()) {
        setError(language === "mr" ? "कृपया तुमच्या व्यवसायाचे किंवा दुकानाचे नाव प्रविष्ट करा" : language === "hi" ? "कृपया अपने व्यवसाय या दुकान का नाम दर्ज करें" : "Please enter your business or trade name");
        return;
      }
      if (!location.trim()) {
        setError(language === "mr" ? "कृपया तुमचा जिल्हा आणि राज्य प्रविष्ट करा" : language === "hi" ? "कृपया अपना जिला और राज्य दर्ज करें" : "Please provide your district and state");
        return;
      }
    }
    setStep((prev) => Math.min(prev + 1, 4));
  };

  const handleBack = () => {
    setError(null);
    setStep((prev) => Math.max(prev - 1, 1));
  };

  const handleFinish = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      await updateProfile({
        language_preference: selectedLanguage,
        business_name: businessName.trim() || undefined,
        business_type: businessType || undefined,
        location: location.trim() || undefined,
        years_in_business: Number(yearsInBusiness) || 0,
        annual_income: Number(annualIncome) || 0,
        financial_goals: selectedGoals.join(", "),
      });
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || (language === "mr" ? "प्रोफाइल सेव्ह करण्यात त्रुटी आली. कृपया पुन्हा प्रयत्न करा." : language === "hi" ? "प्रोफ़ाइल सहेजने में त्रुटि। कृपया पुनः प्रयास करें।" : "Failed to update profile. Please try again."));
    } finally {
      setIsSubmitting(false);
    }
  };

  const stepTitles = [
    t.onboarding.step1Title,
    t.onboarding.step2Title,
    t.onboarding.step3Title,
    t.onboarding.step4Title,
  ];

  return (
    <div className="min-h-screen bg-canvas subtle-geo-pattern flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Top ambient radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header & Step Tracker */}
      <div className="max-w-xl w-full mx-auto pt-2 relative z-10">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-canvas font-black text-base shadow-glow-sm">
              अ
            </div>
            <span className="font-extrabold text-lg text-white tracking-tight">
              ArthSetu Onboarding
            </span>
          </div>
          <span className="text-xs font-bold text-brand-300 bg-brand-500/15 px-3 py-1 rounded-full border border-brand-400/30">
            {formatString(t.onboarding.stepCount, { current: step, total: 4 })}: {stepTitles[step - 1]}
          </span>
        </div>

        {/* Progress Bar */}
        <div className="w-full h-2 bg-canvas-subtle rounded-full overflow-hidden border border-white/10">
          <motion.div
            className="h-full bg-gradient-to-r from-brand-400 to-brand-500 shadow-glow-sm"
            initial={{ width: "25%" }}
            animate={{ width: `${(step / 4) * 100}%` }}
            transition={{ duration: 0.3 }}
          />
        </div>
      </div>

      {/* Main Multi-Step Form */}
      <div className="max-w-xl w-full mx-auto my-auto py-6 relative z-10">
        <Card className="p-6 sm:p-8 bg-surface border-white/[0.08] shadow-elevation-2 rounded-3xl overflow-hidden backdrop-blur-xs">
          {error && (
            <div className="mb-4 p-3 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-xs font-medium">
              ⚠️ {error}
            </div>
          )}

          <AnimatePresence mode="wait">
            {/* STEP 1: WELCOME */}
            {step === 1 && (
              <motion.div
                key="step1"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-6 text-center py-4"
              >
                <div className="w-16 h-16 rounded-3xl bg-brand-500/10 border-2 border-brand-400/30 text-brand-400 flex items-center justify-center mx-auto shadow-glow-sm">
                  <Sparkles className="w-8 h-8" />
                </div>

                <div>
                  <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
                    {formatString(t.onboarding.step1Title, {
                      name: user?.name ? user.name.split(" ")[0] : (language === "mr" ? "उद्योजक" : language === "hi" ? "उद्यमी" : "Entrepreneur")
                    })}
                  </h1>
                  <p className="text-base text-gray-400 mt-2 max-w-md mx-auto leading-relaxed">
                    {t.onboarding.step1Subtitle}
                  </p>
                </div>

                <div className="bg-canvas-subtle p-4 rounded-2xl border border-white/10 text-left space-y-2.5 text-xs text-gray-300">
                  <div className="flex items-center gap-2 font-bold text-white text-sm">
                    <CheckCircle2 className="w-4 h-4 text-brand-400" />
                    {language === "mr" ? "आम्ही २ मिनिटांत काय सेट करणार आहोत:" : language === "hi" ? "हम 2 मिनट में क्या सेट करेंगे:" : "What we will set up in 2 minutes:"}
                  </div>
                  {language === "mr" ? (
                    <>
                      <p>• व्हॉइस आणि मजकूर मार्गदर्शनासाठी तुमची प्राधान्यकृत भाषा</p>
                      <p>• केंद्र व राज्य योजना फिल्टर करण्यासाठी तुमचे व्यवसाय क्षेत्र</p>
                      <p>• अचूक शिफारशींसाठी तुमची व्यावसायिक आर्थिक उद्दिष्टे</p>
                    </>
                  ) : language === "hi" ? (
                    <>
                      <p>• आवाज़ और पाठ मार्गदर्शन हेतु आपकी पसंदीदा क्षेत्रीय भाषा</p>
                      <p>• केंद्रीय और राज्य योजनाओं को फ़िल्टर करने के लिए आपका व्यवसाय क्षेत्र</p>
                      <p>• अनुकूल अनुशंसाओं के लिए आपके व्यावसायिक वित्तीय लक्ष्य</p>
                    </>
                  ) : (
                    <>
                      <p>• Your preferred regional language for voice and text guidance</p>
                      <p>• Your enterprise sector to filter relevant central & state schemes</p>
                      <p>• Your business financial goals for tailored recommendations</p>
                    </>
                  )}
                </div>
              </motion.div>
            )}

            {/* STEP 2: CHOOSE LANGUAGE */}
            {step === 2 && (
              <motion.div
                key="step2"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-5"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Globe className="w-6 h-6 text-brand-400" />
                    {t.onboarding.step2Title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {t.onboarding.step2Subtitle}
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-3 pt-2">
                  {[
                    { code: "en" as SupportedLanguage, title: "English", sub: "Default business language", script: "A" },
                    { code: "hi" as SupportedLanguage, title: "हिंदी (Hindi)", sub: "उत्तरी और मध्य भारत में सुलभ", script: "अ" },
                    { code: "mr" as SupportedLanguage, title: "मराठी (Marathi)", sub: "महाराष्ट्रातील उद्योजकांसाठी", script: "म" },
                  ].map((item) => (
                    <button
                      key={item.code}
                      type="button"
                      onClick={() => setSelectedLanguage(item.code)}
                      className={`w-full flex items-center justify-between p-4 rounded-2xl border-2 transition-all text-left ${
                        selectedLanguage === item.code
                          ? "border-brand-400 bg-brand-500/10 shadow-glow-sm"
                          : "border-white/10 hover:border-white/20 bg-surface/80"
                      }`}
                    >
                      <div className="flex items-center gap-4">
                        <div
                          className={`w-12 h-12 rounded-xl flex items-center justify-center font-bold text-xl border ${
                            selectedLanguage === item.code
                              ? "bg-brand-500 text-canvas font-black border-brand-400"
                              : "bg-canvas-subtle text-gray-300 border-white/10"
                          }`}
                        >
                          {item.script}
                        </div>
                        <div>
                          <p className="font-bold text-base text-white">{item.title}</p>
                          <p className="text-xs text-gray-400">{item.sub}</p>
                        </div>
                      </div>
                      <div
                        className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${
                          selectedLanguage === item.code
                            ? "border-brand-400 bg-brand-400 text-canvas"
                            : "border-white/20"
                        }`}
                      >
                        {selectedLanguage === item.code && <div className="w-2 h-2 rounded-full bg-canvas" />}
                      </div>
                    </button>
                  ))}
                </div>
              </motion.div>
            )}

            {/* STEP 3: BUSINESS INFORMATION */}
            {step === 3 && (
              <motion.div
                key="step3"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Briefcase className="w-6 h-6 text-brand-400" />
                    {t.onboarding.step3Title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {t.onboarding.step3Subtitle}
                  </p>
                </div>

                <div className="space-y-3.5 pt-1">
                  <Input
                    label={t.onboarding.businessNameLabel}
                    placeholder={t.onboarding.businessNamePlaceholder}
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    required
                  />

                  <div>
                    <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                      {t.onboarding.businessTypeLabel} <span className="text-red-400">*</span>
                    </label>
                    <select
                      value={businessType}
                      onChange={(e) => setBusinessType(e.target.value)}
                      className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-elevation-1"
                    >
                      {businessTypes.map((type) => (
                        <option key={type} value={type} className="bg-canvas-subtle text-white">
                          {t.onboarding.businessTypes[type] || type}
                        </option>
                      ))}
                    </select>
                  </div>

                  <Input
                    label={t.onboarding.locationLabel}
                    placeholder={t.onboarding.locationPlaceholder}
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    required
                  />

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                        {t.onboarding.yearsLabel}
                      </label>
                      <select
                        value={yearsInBusiness}
                        onChange={(e) => setYearsInBusiness(Number(e.target.value))}
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-elevation-1"
                      >
                        <option value={0} className="bg-canvas-subtle text-white">
                          {language === "mr" ? "नवीन व्यवसाय (< १ वर्ष)" : language === "hi" ? "नया स्टार्टअप (< 1 वर्ष)" : "New Startup (< 1 year)"}
                        </option>
                        <option value={1} className="bg-canvas-subtle text-white">
                          {language === "mr" ? "१ ते २ वर्षे" : language === "hi" ? "1 - 2 वर्ष" : "1 - 2 Years"}
                        </option>
                        <option value={3} className="bg-canvas-subtle text-white">
                          {language === "mr" ? "३ ते ५ वर्षे" : language === "hi" ? "3 - 5 वर्ष" : "3 - 5 Years"}
                        </option>
                        <option value={6} className="bg-canvas-subtle text-white">
                          {language === "mr" ? "५ वर्षांपेक्षा जास्त" : language === "hi" ? "5 वर्ष से अधिक" : "More than 5 Years"}
                        </option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                        {t.onboarding.annualTurnoverLabel}
                      </label>
                      <select
                        value={annualIncome}
                        onChange={(e) => setAnnualIncome(e.target.value)}
                        className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-elevation-1"
                      >
                        <option value="150000" className="bg-canvas-subtle text-white">
                          {language === "mr" ? "₹१.५ लाखांपर्यंत" : language === "hi" ? "₹1.5 लाख तक" : "Up to ₹1.5 Lakhs"}
                        </option>
                        <option value="300000" className="bg-canvas-subtle text-white">
                          {language === "mr" ? "₹१.५ लाख - ₹३ लाख" : language === "hi" ? "₹1.5 लाख - ₹3 लाख" : "₹1.5 Lakhs - ₹3 Lakhs"}
                        </option>
                        <option value="600000" className="bg-canvas-subtle text-white">
                          {language === "mr" ? "₹३ लाख - ₹६ लाख" : language === "hi" ? "₹3 लाख - ₹6 लाख" : "₹3 Lakhs - ₹6 Lakhs"}
                        </option>
                        <option value="1200000" className="bg-canvas-subtle text-white">
                          {language === "mr" ? "₹६ लाख - ₹१२ लाख" : language === "hi" ? "₹6 लाख - ₹12 लाख" : "₹6 Lakhs - ₹12 Lakhs"}
                        </option>
                        <option value="2500000" className="bg-canvas-subtle text-white">
                          {language === "mr" ? "₹१२ लाखांपेक्षा जास्त" : language === "hi" ? "₹12 लाख से अधिक" : "Above ₹12 Lakhs"}
                        </option>
                      </select>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {/* STEP 4: FINANCIAL GOALS */}
            {step === 4 && (
              <motion.div
                key="step4"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="space-y-4"
              >
                <div>
                  <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                    <Target className="w-6 h-6 text-brand-400" />
                    {t.onboarding.step4Title}
                  </h2>
                  <p className="text-sm text-gray-400 mt-1">
                    {t.onboarding.step4Subtitle}
                  </p>
                </div>

                <div className="space-y-2.5 pt-2">
                  {financialGoalOptions.map((option) => {
                    const isSelected = selectedGoals.includes(option.id);
                    const Icon = option.icon;
                    const localizedTitle = t.onboarding.goals[option.id]?.title || option.title;
                    const localizedDesc = t.onboarding.goals[option.id]?.desc || option.desc;

                    return (
                      <button
                        key={option.id}
                        type="button"
                        onClick={() => toggleGoal(option.id)}
                        className={`w-full flex items-start gap-3.5 p-3.5 rounded-2xl border-2 transition-all text-left cursor-pointer ${
                          isSelected
                            ? "border-brand-400 bg-brand-500/10 shadow-glow-sm"
                            : "border-white/10 hover:border-white/20 bg-surface/80"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-xl shrink-0 ${
                            isSelected
                              ? "bg-brand-500 text-canvas font-bold"
                              : "bg-canvas-subtle text-gray-400 border border-white/10"
                          }`}
                        >
                          <Icon className="w-5 h-5" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-sm text-white">{localizedTitle}</p>
                          <p className="text-xs text-gray-400 mt-0.5">{localizedDesc}</p>
                        </div>
                        <div
                          className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 mt-0.5 ${
                            isSelected
                              ? "border-brand-400 bg-brand-400 text-canvas"
                              : "border-white/20"
                          }`}
                        >
                          {isSelected && <CheckCircle2 className="w-4 h-4" />}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Navigation Controls */}
          <div className="mt-8 pt-5 border-t border-white/[0.08] flex items-center justify-between gap-3">
            {step > 1 ? (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handleBack}
                disabled={isSubmitting}
                className="border-white/20 text-gray-300 hover:text-white"
              >
                <ArrowLeft className="w-4 h-4" />
                {t.onboarding.prevStep}
              </Button>
            ) : (
              <div />
            )}

            {step < 4 ? (
              <Button type="button" size="md" onClick={handleNext} className="font-bold shadow-glow-sm">
                {t.onboarding.nextStep}
                <ArrowRight className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                type="button"
                size="md"
                onClick={handleFinish}
                isLoading={isSubmitting}
                className="font-bold shadow-glow-sm"
              >
                {isSubmitting ? t.onboarding.completingButton : t.onboarding.completeButton}
                <CheckCircle2 className="w-4 h-4" />
              </Button>
            )}
          </div>
        </Card>
      </div>

      {/* Footer */}
      <div className="max-w-xl w-full mx-auto text-center pb-2 text-xs text-gray-400 relative z-10">
        {language === "mr"
          ? "तुम्ही तुमच्या प्रोफाइल सेटिंग्जमधून ही प्राधान्ये कधीही अद्यतनित करू शकता."
          : language === "hi"
          ? "आप अपनी प्रोफ़ाइल सेटिंग से कभी भी इन प्राथमिकताओं को अपडेट कर सकते हैं।"
          : "You can always update these preferences anytime from your Profile settings."}
      </div>
    </div>
  );
}
