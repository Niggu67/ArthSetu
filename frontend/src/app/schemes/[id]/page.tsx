"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import {
  ArrowLeft,
  ExternalLink,
  ShieldCheck,
  FileCheck,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Landmark,
  Coins,
  Clock,
  Briefcase,
  Layers,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { schemesApi } from "@/lib/api";
import { Scheme } from "@/types";
import { useLanguage } from "@/context/LanguageContext";
import { getLocalizedScheme } from "@/i18n/dynamicContent";

export default function SchemeDetailPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SchemeDetailContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SchemeDetailContent() {
  const params = useParams();
  const router = useRouter();
  const { t } = useLanguage();
  const schemeId = Number(params.id);

  const [rawScheme, setRawScheme] = useState<Scheme | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showExternalWarning, setShowExternalWarning] = useState(false);

  useEffect(() => {
    async function loadScheme() {
      if (!schemeId || isNaN(schemeId)) {
        setError("Invalid scheme identifier.");
        setIsLoading(false);
        return;
      }
      setIsLoading(true);
      setError(null);
      try {
        const data = await schemesApi.getById(schemeId);
        setRawScheme(data);
      } catch (err: any) {
        setError(err.message || "Failed to load scheme details.");
      } finally {
        setIsLoading(false);
      }
    }

    loadScheme();
  }, [schemeId]);

  if (isLoading) {
    return (
      <div className="max-w-4xl mx-auto space-y-6">
        <div className="h-6 w-32 bg-white/10 rounded shimmer-effect" />
        <Card className="p-8 space-y-4 rounded-2xl bg-[#0C231A]/70 border-white/[0.08]">
          <div className="h-8 w-2/3 bg-white/10 rounded shimmer-effect" />
          <div className="h-4 w-full bg-white/5 rounded shimmer-effect" />
          <div className="h-4 w-4/5 bg-white/5 rounded shimmer-effect" />
          <div className="h-24 bg-white/5 rounded-xl mt-4 shimmer-effect" />
        </Card>
      </div>
    );
  }

  if (error || !rawScheme) {
    return (
      <div className="max-w-2xl mx-auto py-12 text-center space-y-4">
        <AlertCircle className="w-12 h-12 mx-auto text-rose-400" />
        <h2 className="text-xl font-bold text-white">{t.schemes.noSchemesFound}</h2>
        <p className="text-sm text-gray-400">{error || t.schemes.noSchemesSuggestion}</p>
        <Link href="/schemes">
          <Button variant="outline" size="md">
            <ArrowLeft className="w-4 h-4 mr-2" />
            {t.schemes.backToSchemes}
          </Button>
        </Link>
      </div>
    );
  }

  const scheme = getLocalizedScheme(rawScheme, t);
  const criteria = scheme.eligibility_criteria || {};
  const allowedTypes = criteria.allowed_business_types || ["All rural enterprises"];

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Back Button */}
      <Link
        href="/schemes"
        className="inline-flex items-center gap-1.5 text-xs font-bold text-gray-400 hover:text-white transition-colors cursor-pointer group"
      >
        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />
        <span>{t.schemes.backToSchemes}</span>
      </Link>

      {/* Main Header Card */}
      <Card className="p-6 sm:p-8 space-y-5 bg-[#0C231A]/90 backdrop-blur-md border border-white/[0.09] shadow-elevation-2 rounded-3xl relative overflow-hidden">
        <div className="space-y-2.5">
          <div className="flex items-center gap-2.5 flex-wrap">
            <Badge variant="brand" withDot className="text-xs px-3 py-0.5">
              {scheme.category}
            </Badge>
            <span className="text-xs text-gray-400 font-medium">{t.schemes.verifiedGuidelines}</span>
          </div>
          <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight">
            {scheme.name}
          </h1>
          <p className="text-xs sm:text-sm text-gray-300 leading-relaxed pt-1 max-w-3xl">
            {scheme.description}
          </p>
        </div>

        {/* Primary Action Buttons */}
        <div className="pt-4 flex flex-col sm:flex-row gap-3 border-t border-white/[0.08]">
          <Link href={`/eligibility?scheme_id=${scheme.id}`} className="flex-1">
            <Button size="lg" className="w-full font-extrabold shadow-glow-brand/40">
              <CheckCircle2 className="w-5 h-5 mr-2" />
              {t.schemes.checkEligibilityForThis}
            </Button>
          </Link>

          <Link href={`/applications?scheme_id=${scheme.id}`} className="flex-1">
            <Button variant="secondary" size="lg" className="w-full font-bold shadow-xs">
              <Layers className="w-5 h-5 mr-2 text-brand-300" />
              {t.schemes.trackThisScheme}
            </Button>
          </Link>
        </div>
      </Card>

      {/* Financial Benefits Section */}
      <Card className="p-6 space-y-3 bg-gradient-to-br from-[#102A1E] to-[#0C231A] border-brand-400/30 rounded-2xl shadow-card">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-brand-400/15 text-brand-300 border border-brand-400/25 shadow-2xs">
            <Coins className="w-5 h-5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">{t.schemes.keyHighlights}</h2>
        </div>
        <p className="text-xs sm:text-sm text-gray-200 leading-relaxed font-medium pl-1">
          {scheme.benefits}
        </p>
      </Card>

      {/* Eligibility Criteria Breakdown */}
      <Card className="p-6 space-y-4 rounded-2xl bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08]">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <div className="p-1.5 rounded-lg bg-white/[0.06] text-brand-300">
            <Briefcase className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">{t.schemes.eligibilityCriteria}</h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs sm:text-sm">
          <div className="p-4 bg-white/[0.03] rounded-xl space-y-1 border border-white/[0.06]">
            <span className="font-bold text-white block uppercase text-[11px] tracking-wider text-brand-300">
              {t.schemes.allowedSectors}:
            </span>
            <p className="text-gray-300 leading-relaxed">{allowedTypes.join(", ")}</p>
          </div>

          <div className="p-4 bg-white/[0.03] rounded-xl space-y-1 border border-white/[0.06]">
            <span className="font-bold text-white block uppercase text-[11px] tracking-wider text-brand-300">
              {t.schemes.operatingVintage}:
            </span>
            <p className="text-gray-300 leading-relaxed">
              {criteria.min_years_in_business === 0 || criteria.min_years_in_business === undefined
                ? "Open to both new greenfield startups and existing operating units"
                : `Minimum ${criteria.min_years_in_business} year(s) in active business`}
            </p>
          </div>

          <div className="p-4 bg-white/[0.03] rounded-xl space-y-1 border border-white/[0.06]">
            <span className="font-bold text-white block uppercase text-[11px] tracking-wider text-brand-300">
              {t.schemes.targetBeneficiaries}:
            </span>
            <p className="text-gray-300 leading-relaxed">
              {criteria.target_genders?.includes("female")
                ? "Women entrepreneurs & priority groups"
                : "Open to all qualified rural entrepreneurs"}
            </p>
          </div>

          <div className="p-4 bg-white/[0.03] rounded-xl space-y-1 border border-white/[0.06]">
            <span className="font-bold text-white block uppercase text-[11px] tracking-wider text-brand-300">
              {t.schemes.turnoverCeiling}:
            </span>
            <p className="text-gray-300 leading-relaxed">
              {criteria.max_annual_income
                ? `Max project / income ceiling ₹${criteria.max_annual_income.toLocaleString("en-IN")}`
                : "Conforms to standard MSME micro-enterprise definitions"}
            </p>
          </div>
        </div>
      </Card>

      {/* Required Documents Checklist */}
      <Card className="p-6 space-y-4 rounded-2xl bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08]">
        <div className="flex items-center gap-2 border-b border-white/[0.08] pb-3">
          <div className="p-1.5 rounded-lg bg-brand-400/15 text-brand-300">
            <FileCheck className="w-4.5 h-4.5" />
          </div>
          <h2 className="text-lg font-bold text-white tracking-tight">{t.schemes.documentationRequired}</h2>
        </div>

        <ul className="space-y-2.5 text-xs sm:text-sm text-gray-300">
          {scheme.required_documents.map((doc, idx) => (
            <li key={idx} className="flex items-start gap-2.5 p-2.5 rounded-xl bg-white/[0.03] border border-white/[0.06]">
              <span className="w-5 h-5 rounded-full bg-brand-400/20 text-brand-300 font-bold text-xs flex items-center justify-center shrink-0 mt-0.5 shadow-2xs border border-brand-400/30">
                ✓
              </span>
              <span className="leading-snug pt-0.5">{doc}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* Official Government Portal Card */}
      <Card className="p-6 space-y-3 bg-[#0C231A]/90 border border-white/10 rounded-2xl">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <Landmark className="w-5 h-5 text-brand-400" />
              <h2 className="text-base font-bold text-white">{t.schemes.officialPortal}</h2>
            </div>
            <p className="text-xs text-gray-300 leading-relaxed max-w-xl">
              Official application submissions, statutory sanctions, and circulars are maintained exclusively on the ministry portal.
            </p>
          </div>

          <button
            onClick={() => setShowExternalWarning(true)}
            className="shrink-0 inline-flex items-center gap-1.5 px-4 py-2.5 bg-white/10 hover:bg-white/15 text-white rounded-xl text-xs font-bold transition-colors border border-white/15 cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400"
          >
            <span>{t.schemes.officialPortal}</span>
            <ExternalLink className="w-3.5 h-3.5 text-brand-300" />
          </button>
        </div>
      </Card>

      {/* Statutory Informational Disclaimer */}
      <div className="p-4 bg-[#0C231A]/80 rounded-2xl border border-white/10 text-gray-300 text-xs leading-relaxed flex items-start gap-3 shadow-2xs">
        <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <p className="font-bold text-white">{t.schemes.guidanceNoticeTitle}</p>
          <p>{t.schemes.guidanceNoticeBody}</p>
        </div>
      </div>

      {/* External Portal Confirmation Modal */}
      <Modal
        isOpen={showExternalWarning}
        onClose={() => setShowExternalWarning(false)}
        title={t.schemes.externalWarningTitle}
        description={t.schemes.externalWarningBody.replace("{url}", scheme.name)}
      >
        <div className="space-y-4 text-xs text-gray-300">
          <p>
            You are about to open the external portal for <strong className="text-white">{scheme.name}</strong>:
          </p>
          <div className="p-3 bg-[#071A13] rounded-xl font-mono text-[11px] text-brand-300 break-all border border-white/10">
            {scheme.official_link}
          </div>
          <p className="text-amber-300 bg-amber-500/10 p-3 rounded-xl border border-amber-500/20">
            Ensure you only submit sensitive financial documents on official <code className="font-bold text-amber-200">.gov.in</code> or authorized commercial bank domains.
          </p>

          <div className="flex justify-end gap-2.5 pt-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowExternalWarning(false)}
            >
              {t.schemes.stayOnArthSetu}
            </Button>
            <a
              href={scheme.official_link}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setShowExternalWarning(false)}
            >
              <Button size="sm" className="font-bold gap-1.5">
                {t.schemes.proceedToGovtPortal}
                <ExternalLink className="w-3.5 h-3.5" />
              </Button>
            </a>
          </div>
        </div>
      </Modal>
    </div>
  );
}
