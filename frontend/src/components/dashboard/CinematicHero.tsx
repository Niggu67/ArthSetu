"use client";

import React, { useState, useEffect, useCallback, useRef, useMemo } from "react";
import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  Compass,
  CheckCircle2,
  BookOpen,
  Layers,
  Store,
  Scissors,
  Wrench,
  UtensilsCrossed,
  Sprout,
  Factory,
  UserCheck,
} from "lucide-react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/Button";
import { User } from "@/types";
import { useLanguage } from "@/context/LanguageContext";

export interface CinematicHeroProps {
  user: User | null;
  schemesCount?: number;
  applicationsCount?: number;
  learningPercentage?: number;
}

interface SceneDefinition {
  id: string;
  businessType: string;
  keywords: string[];
  narrativeStep: string;
  narrativeTag: string;
  headline: string;
  supporting: string;
  ctaText: string;
  ctaHref: string;
  secondaryCtaText?: string;
  secondaryCtaHref?: string;
  imageSrc: string;
  imageAlt: string;
  categoryIcon: React.ElementType;
}

/**
 * 6 Core ArthSetu Business Categories mapped directly to existing onboarding & eligibility taxonomy:
 * 1. Retail & Kirana Store
 * 2. Handicrafts & Village Crafts
 * 3. Workshops & Services
 * 4. Food Processing & Spices
 * 5. Agriculture & Farming
 * 6. Manufacturing Unit
 */
const BASE_SCENES: SceneDefinition[] = [
  {
    id: "retail",
    businessType: "Retail & Kirana Store",
    keywords: ["retail", "kirana", "store", "shop", "trading", "merchandise"],
    narrativeStep: "01",
    narrativeTag: "DISCOVER",
    headline: "Financial opportunities are closer than you think.",
    supporting:
      "Discover verified central and state credit schemes, working capital facilities, and inventory subsidies tailored to retail enterprises.",
    ctaText: "Explore Schemes",
    ctaHref: "/schemes",
    secondaryCtaText: "Ask AI Guide",
    secondaryCtaHref: "/ai",
    imageSrc: "/images/entrepreneurs/retail/01.webp",
    imageAlt: "Indian village Kirana store owner at retail counter with digital weighing scale and UPI payment",
    categoryIcon: Store,
  },
  {
    id: "handicrafts",
    businessType: "Handicrafts & Village Crafts",
    keywords: ["handicraft", "craft", "artisan", "textile", "weaver", "pottery", "village craft"],
    narrativeStep: "02",
    narrativeTag: "UNDERSTAND",
    headline: "Understand what your business qualifies for.",
    supporting:
      "Check rules-based eligibility instantly with complete clarity on turnover limits, artisan subsidy ceilings, and cluster development grants.",
    ctaText: "Check Eligibility",
    ctaHref: "/eligibility",
    secondaryCtaText: "View Schemes",
    secondaryCtaHref: "/schemes",
    imageSrc: "/images/entrepreneurs/handicrafts/01.webp",
    imageAlt: "Indian rural woman handloom weaver and textile artisan examining handwoven fabrics in workshop",
    categoryIcon: Scissors,
  },
  {
    id: "services",
    businessType: "Workshops & Services",
    keywords: ["service", "workshop", "repair", "electrical", "mechanic", "technical", "solar"],
    narrativeStep: "03",
    narrativeTag: "DECIDE",
    headline: "Make financial decisions with confidence.",
    supporting:
      "Get simple, multilingual AI advisory and grounded step-by-step guidance before applying for service workshop equipment financing.",
    ctaText: "Ask AI Financial Guide",
    ctaHref: "/ai",
    secondaryCtaText: "Check Eligibility",
    secondaryCtaHref: "/eligibility",
    imageSrc: "/images/entrepreneurs/services/01.webp",
    imageAlt: "Indian rural service technician holding smartphone checking digital orders in modern repair workshop",
    categoryIcon: Wrench,
  },
  {
    id: "food_processing",
    businessType: "Food Processing & Spices",
    keywords: ["food", "spice", "processing", "milling", "flour", "organic", "agro-processing", "bakery"],
    narrativeStep: "04",
    narrativeTag: "LEARN",
    headline: "Build financial knowledge that grows with your business.",
    supporting:
      "Master working capital, credit scores, and micro-insurance through practical, bite-sized lessons designed for food-processing micro-enterprises.",
    ctaText: "Start Learning",
    ctaHref: "/learn",
    secondaryCtaText: "Ask AI Guide",
    secondaryCtaHref: "/ai",
    imageSrc: "/images/entrepreneurs/food-processing/01.webp",
    imageAlt: "Indian rural food processing entrepreneur inspecting neatly sealed spice pouches beside milling equipment",
    categoryIcon: UtensilsCrossed,
  },
  {
    id: "agriculture",
    businessType: "Agriculture & Farming",
    keywords: ["agri", "farm", "crop", "dairy", "animal husbandry", "greenhouse", "horticulture", "irrigation"],
    narrativeStep: "05",
    narrativeTag: "ACT",
    headline: "Turn opportunities into action.",
    supporting:
      "Track required documents, application milestones, and bank branch visits in one unified workspace for modern agricultural enterprises.",
    ctaText: "Track Applications",
    ctaHref: "/applications",
    secondaryCtaText: "Explore Schemes",
    secondaryCtaHref: "/schemes",
    imageSrc: "/images/entrepreneurs/agriculture/01.webp",
    imageAlt: "Indian commercial agricultural entrepreneur with digital tablet inside modern drip-irrigation greenhouse",
    categoryIcon: Sprout,
  },
  {
    id: "manufacturing",
    businessType: "Manufacturing Unit",
    keywords: ["manufactur", "unit", "fabrication", "lathe", "machinery", "parts", "engineering", "industrial"],
    narrativeStep: "06",
    narrativeTag: "GROW",
    headline: "Build a stronger financial future.",
    supporting:
      "ArthSetu connects verified equipment subsidies, transparent guidance, and measurable progress to empower small manufacturing units.",
    ctaText: "Explore Solutions",
    ctaHref: "/schemes",
    secondaryCtaText: "Ask AI Guide",
    secondaryCtaHref: "/ai",
    imageSrc: "/images/entrepreneurs/manufacturing/01.webp",
    imageAlt: "Indian small-scale manufacturing entrepreneur inspecting precision machined component with digital caliper",
    categoryIcon: Factory,
  },
];

const AUTO_ADVANCE_MS = 7500;
const HERO_IMAGE_WIDTH = 1376;
const HERO_IMAGE_HEIGHT = 768;

function getMatchedSceneIndex(businessType?: string | null): number {
  if (!businessType) return 0;
  const lower = businessType.toLowerCase();
  const idx = BASE_SCENES.findIndex(
    (s) =>
      s.keywords.some((kw) => lower.includes(kw)) ||
      lower.includes(s.businessType.toLowerCase())
  );
  return idx >= 0 ? idx : 0;
}

function resolveInitialSceneIndex(user: User | null): number {
  if (user?.business_type) {
    return getMatchedSceneIndex(user.business_type);
  }
  if (typeof window !== "undefined") {
    try {
      const cached = localStorage.getItem("arthsetu_user");
      if (cached) {
        const parsed = JSON.parse(cached) as User;
        if (parsed?.business_type) {
          return getMatchedSceneIndex(parsed.business_type);
        }
      }
    } catch {
      // Ignore storage read errors
    }
  }
  return 0;
}

// Kick off high-priority fetch for the single initial hero image as soon as client bundle evaluates,
// before auth hydration or dashboard API calls even start.
if (typeof window !== "undefined") {
  const earlyIdx = resolveInitialSceneIndex(null);
  const earlySrc = BASE_SCENES[earlyIdx]?.imageSrc;
  if (earlySrc) {
    const earlyImg = new window.Image();
    earlyImg.decoding = "async";
    earlyImg.src = earlySrc;
  }
}

export function CinematicHero({
  user,
  schemesCount = 5,
  applicationsCount = 0,
  learningPercentage = 0,
}: CinematicHeroProps) {
  // Determine if authenticated user's business type matches one of our 6 categories
  const userBusinessType = user?.business_type || "";
  const matchedIndex = useMemo(
    () => getMatchedSceneIndex(userBusinessType),
    [userBusinessType]
  );

  // Synchronously resolve the initial scene so the first render requests the right image immediately
  const initialIndexRef = useRef<number | null>(null);
  if (initialIndexRef.current === null) {
    initialIndexRef.current = resolveInitialSceneIndex(user);
  }
  const initialIdx = initialIndexRef.current;

  const [currentIdx, setCurrentIdx] = useState<number>(initialIdx);
  const [mountedIndices, setMountedIndices] = useState<number[]>([initialIdx]);
  const [isInitialImageLoaded, setIsInitialImageLoaded] = useState<boolean>(false);
  const [hasTransitioned, setHasTransitioned] = useState<boolean>(false);
  const [isPaused, setIsPaused] = useState<boolean>(false);
  const [hasScrolled, setHasScrolled] = useState<boolean>(false);

  const shouldReduceMotion = useReducedMotion();
  const heroRef = useRef<HTMLDivElement>(null);
  const initialImgRef = useRef<HTMLImageElement | null>(null);
  const preloadedUrlsRef = useRef<Set<string>>(new Set());
  const userInteractedRef = useRef<boolean>(false);

  // Sync if user profile arrives after initial render and user hasn't manually changed slides
  useEffect(() => {
    if (userBusinessType && !userInteractedRef.current && currentIdx !== matchedIndex && !hasTransitioned) {
      initialIndexRef.current = matchedIndex;
      setMountedIndices((prev) => (prev.includes(matchedIndex) ? prev : [...prev, matchedIndex]));
      setCurrentIdx(matchedIndex);
    }
  }, [userBusinessType, matchedIndex, currentIdx, hasTransitioned]);

  // If the initial image is already complete in browser cache on mount, mark it loaded immediately
  useEffect(() => {
    if (initialImgRef.current?.complete) {
      setIsInitialImageLoaded(true);
    }
  }, []);

  const { t } = useLanguage();

  const scenes = useMemo(() => {
    return BASE_SCENES.map((scene) => {
      switch (scene.id) {
        case "retail":
          return {
            ...scene,
            businessType: t.onboarding.businessTypes["retail"] || scene.businessType,
            narrativeTag: t.hero.discoverTag,
            headline: t.hero.retailHeadline,
            supporting: t.hero.retailSupporting,
            ctaText: t.hero.retailCta,
            secondaryCtaText: t.hero.askAiGuide,
          };
        case "handicrafts":
          return {
            ...scene,
            businessType: t.onboarding.businessTypes["handicrafts"] || scene.businessType,
            narrativeTag: t.hero.understandTag,
            headline: t.hero.handicraftsHeadline,
            supporting: t.hero.handicraftsSupporting,
            ctaText: t.hero.handicraftsCta,
            secondaryCtaText: t.hero.exploreSchemes,
          };
        case "services":
          return {
            ...scene,
            businessType: t.onboarding.businessTypes["services"] || scene.businessType,
            narrativeTag: t.hero.decideTag,
            headline: t.hero.servicesHeadline,
            supporting: t.hero.servicesSupporting,
            ctaText: t.hero.servicesCta,
            secondaryCtaText: t.hero.checkEligibility,
          };
        case "food_processing":
          return {
            ...scene,
            businessType: t.onboarding.businessTypes["food_processing"] || scene.businessType,
            narrativeTag: t.hero.learnTag,
            headline: t.hero.foodHeadline,
            supporting: t.hero.foodSupporting,
            ctaText: t.hero.foodCta,
            secondaryCtaText: t.hero.askAiGuide,
          };
        case "agriculture":
          return {
            ...scene,
            businessType: t.onboarding.businessTypes["agriculture"] || scene.businessType,
            narrativeTag: t.hero.actTag,
            headline: t.hero.agriHeadline,
            supporting: t.hero.agriSupporting,
            ctaText: t.hero.agriCta,
            secondaryCtaText: t.hero.exploreSchemes,
          };
        case "manufacturing":
          return {
            ...scene,
            businessType: t.onboarding.businessTypes["manufacturing"] || scene.businessType,
            narrativeTag: t.hero.growTag,
            headline: t.hero.manufacturingHeadline,
            supporting: t.hero.manufacturingSupporting,
            ctaText: t.hero.manufacturingCta,
            secondaryCtaText: t.hero.askAiGuide,
          };
        default:
          return scene;
      }
    });
  }, [t]);

  const currentScene = scenes[currentIdx];
  const totalScenes = scenes.length;

  const activateScene = useCallback((nextIdx: number, isManual = false) => {
    if (isManual) {
      userInteractedRef.current = true;
    }
    setHasTransitioned(true);
    setMountedIndices((prev) => (prev.includes(nextIdx) ? prev : [...prev, nextIdx]));
    setCurrentIdx(nextIdx);
  }, []);

  const nextScene = useCallback(() => {
    setHasTransitioned(true);
    setCurrentIdx((prev) => {
      const next = (prev + 1) % totalScenes;
      setMountedIndices((m) => (m.includes(next) ? m : [...m, next]));
      return next;
    });
  }, [totalScenes]);

  const prevScene = useCallback(() => {
    userInteractedRef.current = true;
    setHasTransitioned(true);
    setCurrentIdx((prev) => {
      const next = (prev - 1 + totalScenes) % totalScenes;
      setMountedIndices((m) => (m.includes(next) ? m : [...m, next]));
      return next;
    });
  }, [totalScenes]);

  const goToScene = useCallback(
    (index: number) => {
      activateScene(index, true);
    },
    [activateScene]
  );

  // Auto advance timer
  useEffect(() => {
    if (isPaused) return;

    const timer = setInterval(() => {
      nextScene();
    }, AUTO_ADVANCE_MS);

    return () => clearInterval(timer);
  }, [isPaused, nextScene]);

  // Progressively preload ONLY the next slide after the initial image has finished loading
  useEffect(() => {
    if (!isInitialImageLoaded || typeof window === "undefined") return;

    preloadedUrlsRef.current.add(BASE_SCENES[currentIdx].imageSrc);

    const nextIdx = (currentIdx + 1) % totalScenes;
    const nextSrc = BASE_SCENES[nextIdx].imageSrc;

    if (preloadedUrlsRef.current.has(nextSrc)) {
      setMountedIndices((prev) => (prev.includes(nextIdx) ? prev : [...prev, nextIdx]));
      return;
    }

    const preloadImg = new window.Image();
    preloadImg.decoding = "async";
    preloadImg.src = nextSrc;

    const handlePreloadDone = () => {
      preloadedUrlsRef.current.add(nextSrc);
      setMountedIndices((prev) => (prev.includes(nextIdx) ? prev : [...prev, nextIdx]));
    };

    preloadImg.onload = handlePreloadDone;
    preloadImg.onerror = handlePreloadDone;
  }, [currentIdx, isInitialImageLoaded, totalScenes]);

  // Track scroll position to fade the "Scroll to explore" cue
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 40) {
        setHasScrolled(true);
      } else {
        setHasScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowRight") {
      e.preventDefault();
      userInteractedRef.current = true;
      nextScene();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      prevScene();
    }
  };

  const scrollToContent = () => {
    if (heroRef.current) {
      const bottom = heroRef.current.getBoundingClientRect().bottom + window.scrollY;
      window.scrollTo({
        top: bottom - 16,
        behavior: "smooth",
      });
    }
  };

  const userName = user?.name ? user.name.split(" ")[0] : null;
  const businessName = user?.business_name || null;
  const isDirectMatch = userBusinessType && BASE_SCENES[currentIdx].keywords.some((kw) =>
    userBusinessType.toLowerCase().includes(kw)
  );

  return (
    <section
      ref={heroRef}
      role="region"
      aria-roledescription="carousel"
      aria-label="ArthSetu Rural Entrepreneur Stories"
      tabIndex={0}
      onKeyDown={handleKeyDown}
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onFocus={() => setIsPaused(true)}
      onBlur={() => setIsPaused(false)}
      className="relative w-full rounded-3xl overflow-hidden bg-[#071A13] border border-white/[0.12] shadow-elevation-3 select-none outline-none focus-visible:ring-2 focus-visible:ring-brand-400/50 transition-all duration-300 min-h-[580px] sm:min-h-[620px] lg:min-h-[660px] flex flex-col justify-between"
    >
      {/* ------------------------------------------------------------- */}
      {/* 1. CINEMATIC BACKGROUND PHOTOGRAPHY WITH GRADIENT OVERLAYS     */}
      {/* ------------------------------------------------------------- */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden bg-[#071A13]">
        {BASE_SCENES.map((scene, idx) => {
          const isMounted = mountedIndices.includes(idx);
          if (!isMounted) return null;

          const isActive = idx === currentIdx;
          const isInitialSlide = idx === initialIdx;

          return (
            <motion.div
              key={scene.id}
              initial={
                isInitialSlide && !hasTransitioned
                  ? { opacity: 1, scale: shouldReduceMotion ? 1 : 1.04 }
                  : { opacity: 0, scale: shouldReduceMotion ? 1 : 1.04 }
              }
              animate={{
                opacity: isActive ? 1 : 0,
                scale: isActive ? 1 : shouldReduceMotion ? 1 : 1.04,
              }}
              transition={{
                opacity: {
                  duration: isInitialSlide && !hasTransitioned ? 0 : 0.85,
                  ease: [0.16, 1, 0.3, 1],
                },
                scale: {
                  duration: isActive ? 7.5 : 0.85,
                  ease: "easeOut",
                },
              }}
              className="absolute inset-0"
              style={{ zIndex: isActive ? 2 : 1 }}
              aria-hidden={!isActive}
            >
              <img
                ref={isInitialSlide ? initialImgRef : undefined}
                src={scene.imageSrc}
                alt={scene.imageAlt}
                width={HERO_IMAGE_WIDTH}
                height={HERO_IMAGE_HEIGHT}
                loading={isInitialSlide ? "eager" : "lazy"}
                fetchPriority={isInitialSlide ? "high" : "auto"}
                decoding="async"
                onLoad={
                  isInitialSlide
                    ? () => setIsInitialImageLoaded(true)
                    : undefined
                }
                className="w-full h-full object-cover object-center filter saturate-[1.08] contrast-[1.04]"
              />
            </motion.div>
          );
        })}

        {/* Cinematic Multi-layered Vignettes & Overlays */}
        {/* Layer A: Base Deep Forest Solid Fade at Bottom & Left */}
        <div className="absolute inset-0 bg-gradient-to-t from-[#071A13] via-[#071A13]/85 to-[#071A13]/35" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#071A13]/95 via-[#071A13]/75 to-transparent hidden sm:block" />

        {/* Layer B: Vignette around edges to focus on subject and text */}
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_40%,rgba(7,26,19,0.75)_100%)]" />

        {/* Layer C: Atmospheric Emerald & Lime Ambient Glow */}
        <div className="absolute -top-24 -right-24 w-96 h-96 rounded-full bg-brand-400/[0.12] blur-3xl" />
        <div className="absolute -bottom-32 left-1/4 w-96 h-96 rounded-full bg-emerald-500/[0.08] blur-3xl" />
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 2. TOP HERO BAR: BRANDING + SCENE COUNTER                      */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 px-6 sm:px-8 lg:px-10 pt-6 sm:pt-8 flex items-center justify-between gap-4">
        {/* ArthSetu Brand Mark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-brand-400 via-brand-400 to-brand-500 flex items-center justify-center text-[#071A13] font-black text-lg sm:text-xl shadow-glow-brand/60 shrink-0">
            अ
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base sm:text-lg text-white tracking-tight leading-tight">
                ArthSetu
              </span>
              <span className="hidden xs:inline-flex items-center text-[10px] font-bold text-brand-300 uppercase tracking-widest px-2 py-0.5 rounded-full bg-brand-400/10 border border-brand-400/20">
                Fintech
              </span>
            </div>
            <span className="text-[10px] sm:text-[11px] font-medium text-gray-400 tracking-wider block">
              अर्थसेतू • {t.hero.taglineBadge}
            </span>
          </div>
        </div>

        {/* Scene Index & Scene Tag */}
        <div className="flex items-center gap-2.5">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-black/45 backdrop-blur-md border border-white/10 text-xs font-mono">
            <span className="text-brand-300 font-bold">{currentScene.narrativeStep}</span>
            <span className="text-gray-500">/</span>
            <span className="text-gray-400">0{totalScenes}</span>
            <span className="w-1.5 h-1.5 rounded-full bg-brand-400 animate-pulse ml-0.5" />
            <span className="text-[11px] font-sans font-bold text-white tracking-wider ml-1 hidden sm:inline">
              {currentScene.narrativeTag}
            </span>
          </div>

          {/* Minimal Prev / Next arrows */}
          <div className="flex items-center gap-1">
            <button
              onClick={prevScene}
              aria-label="Previous scene"
              className="p-1.5 sm:p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-gray-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={nextScene}
              aria-label="Next scene"
              className="p-1.5 sm:p-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.14] text-gray-300 hover:text-white border border-white/10 transition-colors backdrop-blur-md"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 3. CENTER / MAIN EDITORIAL NARRATIVE CONTENT                   */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 px-6 sm:px-8 lg:px-10 py-8 sm:py-10 max-w-4xl">
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={currentScene.id}
            initial={{ opacity: 0, y: shouldReduceMotion ? 0 : 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: shouldReduceMotion ? 0 : -8 }}
            transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
            className="space-y-4 sm:space-y-5"
          >
            {/* Eyebrow & Personalization Pill */}
            <div className="flex flex-wrap items-center gap-2.5">
              {/* Business Category Pill */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-400/15 border border-brand-400/30 text-brand-300 text-xs font-bold tracking-wider backdrop-blur-md">
                <currentScene.categoryIcon className="w-3.5 h-3.5 text-brand-400 shrink-0" />
                <span>{currentScene.businessType}</span>
              </div>

              {/* Personalized Enterprise Badge */}
              {isDirectMatch ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold backdrop-blur-md">
                  <UserCheck className="w-3.5 h-3.5" />
                  <span>{t.hero.builtForEnterprise}</span>
                </div>
              ) : userName ? (
                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/10 text-gray-200 text-xs font-medium backdrop-blur-md">
                  <span>{t.dashboard.welcomeBack}, <strong className="text-white font-bold">{userName}</strong></span>
                </div>
              ) : null}
            </div>

            {/* Editorial Headline */}
            <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-[54px] font-black text-white tracking-tight leading-[1.12]">
              {currentScene.headline}
            </h1>

            {/* Supporting Story Message */}
            <p className="text-base sm:text-lg text-gray-300 leading-relaxed max-w-2xl font-normal">
              {isDirectMatch && businessName ? (
                <>
                  Empowering <strong className="text-white font-bold">{businessName}</strong> with {currentScene.supporting.toLowerCase()}
                </>
              ) : (
                currentScene.supporting
              )}
            </p>

            {/* Action Buttons */}
            <div className="pt-2 flex flex-wrap items-center gap-3 sm:gap-4">
              <Link href={currentScene.ctaHref}>
                <Button size="lg" className="font-extrabold gap-2 shadow-glow-brand/50 text-sm sm:text-base">
                  <span>{currentScene.ctaText}</span>
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>

              {currentScene.secondaryCtaHref && currentScene.secondaryCtaText && (
                <Link href={currentScene.secondaryCtaHref}>
                  <Button
                    variant="outline"
                    size="lg"
                    className="font-bold gap-2 bg-black/45 hover:bg-white/[0.12] border-white/20 text-white backdrop-blur-md text-sm sm:text-base"
                  >
                    <span>{currentScene.secondaryCtaText}</span>
                  </Button>
                </Link>
              )}
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ------------------------------------------------------------- */}
      {/* 4. BOTTOM BAR: SCENE INDICATORS + NATURAL SCROLL CUE           */}
      {/* ------------------------------------------------------------- */}
      <div className="relative z-20 px-6 sm:px-8 lg:px-10 pb-6 sm:pb-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-white/[0.08] pt-4 bg-gradient-to-t from-[#071A13]/90 to-transparent">
        {/* Interactive Scene Segment Indicators */}
        <div
          role="tablist"
          aria-label="Scene pagination"
          className="flex items-center gap-2 sm:gap-3"
        >
          {BASE_SCENES.map((scene, idx) => {
            const isActive = idx === currentIdx;
            return (
              <button
                key={scene.id}
                role="tab"
                aria-selected={isActive}
                aria-label={`Go to scene ${idx + 1}: ${scene.businessType} - ${scene.narrativeTag}`}
                onClick={() => goToScene(idx)}
                className="group py-2 flex items-center cursor-pointer transition-all focus:outline-none"
              >
                <div
                  className={`h-1.5 rounded-full transition-all duration-300 relative overflow-hidden ${
                    isActive
                      ? "w-10 sm:w-14 bg-white/20"
                      : "w-4 sm:w-6 bg-white/20 group-hover:bg-white/40"
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="active-scene-progress"
                      initial={{ width: "0%" }}
                      animate={{ width: "100%" }}
                      transition={{
                        duration: AUTO_ADVANCE_MS / 1000,
                        ease: "linear",
                      }}
                      key={currentIdx}
                      className="absolute inset-0 bg-brand-400 rounded-full shadow-glow-brand"
                    />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {/* Minimal Enterprise Status summary pill */}
        <div className="hidden md:flex items-center gap-4 text-xs text-gray-300">
          <span className="flex items-center gap-1.5">
            <span className="w-2 h-2 rounded-full bg-brand-400 shadow-glow-brand" />
            <span className="text-white font-semibold">
              {t.dashboard.schemesActive.replace("{count}", String(schemesCount))}
            </span>
          </span>
          <span className="text-gray-600">•</span>
          <span>{t.dashboard.trackedBadge.replace("{count}", String(applicationsCount))}</span>
          <span className="text-gray-600">•</span>
          <span className="text-brand-300 font-semibold">
            {t.dashboard.progressBadge.replace("{percent}", String(learningPercentage))}
          </span>
        </div>

        {/* Natural Scroll to explore indicator */}
        <button
          onClick={scrollToContent}
          className={`flex items-center gap-1.5 text-xs text-gray-400 hover:text-white transition-opacity duration-300 ${
            hasScrolled ? "opacity-0 pointer-events-none" : "opacity-100"
          }`}
          aria-label={t.dashboard.scrollExplore}
        >
          <span className="tracking-wide">{t.dashboard.scrollExplore}</span>
          <motion.div
            animate={shouldReduceMotion ? {} : { y: [0, 4, 0] }}
            transition={{ repeat: Infinity, duration: 1.6, ease: "easeInOut" }}
          >
            <ChevronDown className="w-3.5 h-3.5 text-brand-400" />
          </motion.div>
        </button>
      </div>
    </section>
  );
}
