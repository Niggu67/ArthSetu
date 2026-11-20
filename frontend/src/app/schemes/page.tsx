"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import {
  Search,
  ArrowRight,
  ShieldCheck,
  FileCheck,
  Filter,
  AlertCircle,
  HelpCircle,
  Landmark,
  Coins,
  CheckCircle2,
  X,
  Compass,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { useLanguage } from "@/context/LanguageContext";
import { schemesApi } from "@/lib/api";
import { Scheme } from "@/types";
import { getLocalizedSchemes } from "@/i18n/dynamicContent";

export default function SchemesPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <SchemesContent />
      </AppShell>
    </ProtectedRoute>
  );
}

function SchemesContent() {
  const { t, format } = useLanguage();
  const [rawSchemes, setRawSchemes] = useState<Scheme[]>([]);
  const [search, setSearch] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [disclaimer, setDisclaimer] = useState("");

  const categories = [
    { label: t.schemes.filterAll, value: "All" },
    { label: t.schemes.filterLoans, value: "Credit" },
    { label: t.schemes.filterSubsidies, value: "Subsidy" },
    { label: t.schemes.filterFood, value: "Food Processing" },
    { label: t.schemes.filterAgri, value: "Agriculture" },
    { label: t.schemes.filterWomen, value: "Women" },
  ];

  const fetchSchemes = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const catParam = selectedCategory === "All" ? undefined : selectedCategory;
      const res = await schemesApi.list(catParam, search.trim() || undefined);
      setRawSchemes(res.schemes || []);
      setDisclaimer(res.disclaimer || "");
    } catch (err: any) {
      setError(err.message || t.common.error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    const timer = setTimeout(fetchSchemes, 220);
    return () => clearTimeout(timer);
  }, [search, selectedCategory]);

  const schemes = getLocalizedSchemes(rawSchemes, t);

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page Header */}
      <div className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-400/10 border border-brand-400/25">
          <Compass className="w-3.5 h-3.5 text-brand-400" />
          <span className="text-[11px] font-bold text-brand-300 uppercase tracking-widest">
            {t.schemes.badge}
          </span>
        </div>
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-black text-white tracking-tight flex items-center gap-3">
          <span>{t.schemes.heading}</span>
        </h1>
        <p className="text-xs sm:text-sm text-gray-300 max-w-2xl leading-relaxed">
          {t.schemes.subtitle}
        </p>
      </div>

      {/* Informational Guidance Notice */}
      <div className="p-4 bg-[#0C231A]/90 rounded-2xl border border-white/10 text-gray-300 text-xs leading-relaxed flex items-start gap-3 shadow-card">
        <AlertCircle className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
        <p>
          <strong className="font-bold text-white">{t.schemes.guidanceNoticeTitle} </strong>
          {t.schemes.guidanceNoticeBody}
        </p>
      </div>

      {/* Search & Category Filter Controls */}
      <div className="space-y-3.5">
        <div className="relative w-full">
          <Input
            placeholder={t.schemes.searchPlaceholder}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            leftIcon={<Search className="w-4 h-4 text-gray-400" />}
            rightIcon={
              search ? (
                <button
                  onClick={() => setSearch("")}
                  className="p-1 rounded-md text-gray-400 hover:text-white hover:bg-white/10 cursor-pointer"
                  aria-label={t.schemes.clearSearch}
                >
                  <X className="w-4 h-4" />
                </button>
              ) : undefined
            }
            aria-label={t.schemes.searchPlaceholder}
          />
        </div>

        {/* Category Chips */}
        <div
          className="flex gap-2 overflow-x-auto pb-1.5 scrollbar-none"
          role="tablist"
          aria-label="Scheme Categories"
        >
          {categories.map((cat) => {
            const isSelected = selectedCategory === cat.value;
            return (
              <button
                key={cat.value}
                onClick={() => setSelectedCategory(cat.value)}
                className={`px-4 py-2 text-xs font-bold rounded-xl border transition-all duration-200 ease-spring-gentle shrink-0 select-none cursor-pointer focus:outline-none focus:ring-2 focus:ring-brand-400 active:scale-95 ${
                  isSelected
                    ? "bg-brand-400 text-[#071A13] border-brand-300 shadow-glow-brand font-black scale-[1.02]"
                    : "bg-white/[0.04] text-gray-300 border-white/10 hover:bg-white/[0.08] hover:text-white hover:border-brand-400/40"
                }`}
                role="tab"
                aria-selected={isSelected}
              >
                {cat.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Error State */}
      {error && (
        <Card className="p-6 text-center text-rose-300 bg-rose-950/40 border-rose-500/30 space-y-3 rounded-2xl">
          <AlertCircle className="w-8 h-8 mx-auto text-rose-400" />
          <p className="text-sm font-semibold">{error}</p>
          <Button variant="outline" size="sm" onClick={fetchSchemes}>
            {t.common.retry}
          </Button>
        </Card>
      )}

      {/* Loading Skeleton */}
      {isLoading && !error && (
        <div className="space-y-4">
          {[1, 2, 3].map((n) => (
            <Card key={n} className="p-6 space-y-3 rounded-2xl bg-[#0C231A]/70 border-white/[0.06]">
              <div className="h-6 w-1/3 bg-white/10 rounded shimmer-effect" />
              <div className="h-4 w-3/4 bg-white/5 rounded shimmer-effect" />
              <div className="h-4 w-1/2 bg-white/5 rounded shimmer-effect" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && !error && schemes.length === 0 && (
        <Card className="p-10 text-center space-y-3 text-gray-400 rounded-2xl bg-[#0C231A]/70 border-white/[0.08]">
          <HelpCircle className="w-10 h-10 mx-auto text-gray-500" />
          <p className="text-base font-bold text-white">{t.schemes.noSchemesFound}</p>
          <p className="text-xs max-w-sm mx-auto text-gray-400">
            {t.schemes.noSchemesSuggestion}
          </p>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              setSearch("");
              setSelectedCategory("All");
            }}
          >
            {t.schemes.clearFilters}
          </Button>
        </Card>
      )}

      {/* Schemes Grid */}
      {!isLoading && !error && schemes.length > 0 && (
        <div className="space-y-4">
          {schemes.map((scheme) => (
            <Card
              key={scheme.id}
              hoverable
              className="p-6 space-y-4 bg-[#0C231A]/85 backdrop-blur-md border border-white/[0.08] hover:border-brand-400/40 rounded-2xl group transition-all duration-200 border-l-4 border-l-brand-400 shadow-card"
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="space-y-1.5 flex-1">
                  <div className="flex items-center gap-2.5 flex-wrap">
                    <h2 className="text-lg font-bold text-white group-hover:text-brand-300 transition-colors tracking-tight">
                      {scheme.name}
                    </h2>
                    <Badge variant="brand" className="text-[11px] py-0.5 px-2">
                      {scheme.category}
                    </Badge>
                  </div>
                  <p className="text-xs sm:text-sm text-gray-300 leading-relaxed max-w-3xl">
                    {scheme.description}
                  </p>
                </div>

                <div className="flex items-center gap-2.5 shrink-0 self-start sm:self-auto">
                  <Link href={`/eligibility?scheme_id=${scheme.id}`}>
                    <Button variant="ghost" size="sm" className="text-xs font-bold text-brand-300 hover:text-white">
                      {t.schemes.checkEligibilityForThis}
                    </Button>
                  </Link>
                  <Link href={`/schemes/${scheme.id}`}>
                    <Button variant="outline" size="sm" className="font-bold text-xs gap-1.5 whitespace-nowrap shadow-2xs">
                      <span>{t.schemes.viewDetails}</span>
                      <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
                    </Button>
                  </Link>
                </div>
              </div>

              {/* Financial Benefits Box */}
              <div className="p-3.5 bg-white/[0.04] rounded-xl border border-white/[0.08] text-xs sm:text-sm text-gray-200 flex items-start gap-2.5">
                <Coins className="w-4.5 h-4.5 text-brand-400 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-bold text-brand-300">{t.schemes.benefitLabel} </strong>
                  <span>{scheme.benefits}</span>
                </div>
              </div>

              {/* Required Documents Highlights */}
              {scheme.required_documents && scheme.required_documents.length > 0 && (
                <div className="pt-1">
                  <span className="text-[11px] font-bold text-gray-400 block mb-1.5 uppercase tracking-wider">
                    {t.schemes.requiredDocsLabel}
                  </span>
                  <div className="flex flex-wrap gap-1.5">
                    {scheme.required_documents.slice(0, 4).map((doc, idx) => (
                      <span
                        key={idx}
                        className="text-[11px] bg-white/[0.04] text-gray-300 px-2.5 py-1 rounded-lg border border-white/10"
                      >
                        ✓ {doc}
                      </span>
                    ))}
                    {scheme.required_documents.length > 4 && (
                      <span className="text-[11px] text-gray-400 self-center pl-1">
                        +{scheme.required_documents.length - 4} {t.common.more || "more"}
                      </span>
                    )}
                  </div>
                </div>
              )}
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
