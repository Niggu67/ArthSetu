"use client";

import React, { useState, useEffect } from "react";
import { User as UserIcon, Save, CheckCircle2, AlertCircle, LogOut } from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
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

export default function ProfilePage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ProfileContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function ProfileContent() {
  const { user, updateProfile, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [name, setName] = useState(user?.name || "");
  const [email, setEmail] = useState(user?.email || "");
  const [languagePref, setLanguagePref] = useState<SupportedLanguage>(
    (user?.language_preference as SupportedLanguage) || language || "en"
  );
  const [businessName, setBusinessName] = useState(user?.business_name || "");
  const [businessType, setBusinessType] = useState(user?.business_type || "Food Processing & Spices");
  const [location, setLocation] = useState(user?.location || "");
  const [yearsInBusiness, setYearsInBusiness] = useState(user?.years_in_business ?? 1);
  const [annualIncome, setAnnualIncome] = useState(user?.annual_income ? String(user.annual_income) : "250000");
  const [financialGoals, setFinancialGoals] = useState(user?.financial_goals || "");

  const [isSaving, setIsSaving] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      setName(user.name);
      setEmail(user.email || "");
      setBusinessName(user.business_name || "");
      setBusinessType(user.business_type || "Food Processing & Spices");
      setLocation(user.location || "");
      setYearsInBusiness(user.years_in_business ?? 1);
      setAnnualIncome(user.annual_income ? String(user.annual_income) : "250000");
      setFinancialGoals(user.financial_goals || "");
    }
  }, [user]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setSuccessMessage(null);
    setErrorMessage(null);

    try {
      await updateProfile({
        name: name.trim(),
        email: email.trim() || undefined,
        language_preference: languagePref,
        business_name: businessName.trim() || undefined,
        business_type: businessType || undefined,
        location: location.trim() || undefined,
        years_in_business: Number(yearsInBusiness) || 0,
        annual_income: Number(annualIncome) || 0,
        financial_goals: financialGoals.trim() || undefined,
      });
      setLanguage(languagePref);
      setSuccessMessage(t.profile.successMessage || "Your profile and enterprise details were updated successfully!");
    } catch (err: any) {
      setErrorMessage(err.message || (language === "mr" ? "प्रोफाइल सेव्ह करण्यात अयशस्वी." : language === "hi" ? "प्रोफ़ाइल सहेजने में विफल।" : "Failed to update profile."));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-2 border-b border-white/[0.08]">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight flex items-center gap-2.5">
            <UserIcon className="w-7 h-7 text-brand-400" />
            {t.profile.heading}
          </h1>
          <p className="text-sm text-gray-400 mt-1">
            {t.profile.subtitle}
          </p>
        </div>

        <button
          onClick={logout}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold text-red-400 border border-red-500/30 hover:bg-red-950/30 transition-colors self-start sm:self-auto cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          {t.profile.logoutButton || t.nav.logout}
        </button>
      </div>

      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
          <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          <span>{successMessage}</span>
        </div>
      )}

      {errorMessage && (
        <div className="p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-center gap-2.5 animate-in fade-in duration-200">
          <AlertCircle className="w-5 h-5 text-red-400 shrink-0" />
          <span>{errorMessage}</span>
        </div>
      )}

      <form onSubmit={handleSave} className="space-y-6">
        {/* Personal Details */}
        <Card className="p-5 sm:p-6 space-y-4 bg-surface border-white/[0.08] shadow-elevation-2 rounded-2xl">
          <h2 className="text-base font-bold text-white border-b border-white/[0.08] pb-2">
            {t.profile.personalDetailsTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t.profile.nameLabel}
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <Input
              label={t.profile.phoneLabel}
              value={user?.phone || ""}
              disabled
              helperText={
                language === "mr"
                  ? "पडताळणी झाल्यानंतर मोबाईल क्रमांक बदलता येत नाही"
                  : language === "hi"
                  ? "सत्यापित होने के बाद मोबाइल नंबर बदला नहीं जा सकता"
                  : "Mobile number cannot be changed once verified"
              }
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t.profile.emailLabel}
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@example.com"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                {t.profile.languagePrefLabel}
              </label>
              <select
                value={languagePref}
                onChange={(e) => setLanguagePref(e.target.value as SupportedLanguage)}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-elevation-1"
              >
                <option value="en" className="bg-canvas-subtle text-white">English</option>
                <option value="hi" className="bg-canvas-subtle text-white">हिंदी (Hindi)</option>
                <option value="mr" className="bg-canvas-subtle text-white">मराठी (Marathi)</option>
              </select>
            </div>
          </div>
        </Card>

        {/* Enterprise Details */}
        <Card className="p-5 sm:p-6 space-y-4 bg-surface border-white/[0.08] shadow-elevation-2 rounded-2xl">
          <h2 className="text-base font-bold text-white border-b border-white/[0.08] pb-2">
            {t.profile.businessDetailsTitle}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label={t.profile.businessNameLabel}
              value={businessName}
              onChange={(e) => setBusinessName(e.target.value)}
              placeholder="e.g. Patil Organic Grains"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                {t.profile.businessTypeLabel}
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
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <Input
              label={t.profile.locationLabel}
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. Kolhapur, Maharashtra"
            />

            <div>
              <label className="block text-sm font-semibold text-gray-300 mb-1.5">
                {t.profile.yearsLabel}
              </label>
              <select
                value={yearsInBusiness}
                onChange={(e) => setYearsInBusiness(Number(e.target.value))}
                className="w-full min-h-[46px] px-4 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 shadow-elevation-1"
              >
                <option value={0} className="bg-canvas-subtle text-white">
                  {language === "mr" ? "नवीन व्यवसाय (< १ वर्ष)" : language === "hi" ? "नया स्टार्टअप (< 1 वर्ष)" : "New Startup (< 1 yr)"}
                </option>
                <option value={1} className="bg-canvas-subtle text-white">
                  {language === "mr" ? "१ ते २ वर्षे" : language === "hi" ? "1 - 2 वर्ष" : "1 - 2 Years"}
                </option>
                <option value={3} className="bg-canvas-subtle text-white">
                  {language === "mr" ? "३ ते ५ वर्षे" : language === "hi" ? "3 - 5 वर्ष" : "3 - 5 Years"}
                </option>
                <option value={6} className="bg-canvas-subtle text-white">
                  {language === "mr" ? "५ वर्षांपेक्षा जास्त" : language === "hi" ? "5 वर्ष से अधिक" : "5+ Years"}
                </option>
              </select>
            </div>

            <Input
              label={t.profile.turnoverLabel}
              type="number"
              value={annualIncome}
              onChange={(e) => setAnnualIncome(e.target.value)}
              placeholder="e.g. 300000"
            />
          </div>

          <Input
            label={t.profile.goalsLabel}
            value={financialGoals}
            onChange={(e) => setFinancialGoals(e.target.value)}
            placeholder="e.g. Purchase cold storage unit and apply for PMEGP subsidy"
            helperText={
              language === "mr"
                ? "अर्थसेतू एआय आणि योजना जुळवणीसाठी योग्य अनुदान शोधण्यासाठी वापरले जाते"
                : language === "hi"
                ? "अर्थसेतु एआई और योजना मिलानकर्ता द्वारा प्रासंगिक अनुदान खोजने के लिए प्रयुक्त"
                : "Used by ArthSetu AI and Scheme matchers to surface relevant grants"
            }
          />
        </Card>

        {/* Save Button */}
        <div className="flex justify-end pt-2">
          <Button
            type="submit"
            size="lg"
            isLoading={isSaving}
            className="w-full sm:w-auto font-bold shadow-glow-sm"
          >
            <Save className="w-4 h-4 mr-2" />
            {isSaving ? t.profile.savingButton : t.profile.saveButton}
          </Button>
        </div>
      </form>
    </div>
  );
}
