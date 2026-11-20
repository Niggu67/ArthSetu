"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Globe, AlertCircle, ShieldCheck, CheckCircle2, Mail, RefreshCw, ArrowLeft } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { SupportedLanguage } from "@/types";
import { authApi } from "@/lib/api/auth";

function RegisterContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { register, verifyEmail } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [step, setStep] = useState<"register" | "verify">("register");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  // Verification step state
  const [registeredEmail, setRegisteredEmail] = useState("");
  const [verificationCode, setVerificationCode] = useState("");
  const [resendCooldown, setResendCooldown] = useState(0);
  const [isResending, setIsResending] = useState(false);

  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Check if opened with an email to verify directly
  useEffect(() => {
    const emailParam = searchParams.get("verifyEmail");
    if (emailParam) {
      setRegisteredEmail(emailParam);
      setEmail(emailParam);
      setStep("verify");
    }
  }, [searchParams]);

  // Resend cooldown timer
  useEffect(() => {
    if (resendCooldown <= 0) return;
    const interval = setInterval(() => {
      setResendCooldown((prev) => (prev > 0 ? prev - 1 : 0));
    }, 1000);
    return () => clearInterval(interval);
  }, [resendCooldown]);

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    // Form Validations
    if (!name.trim() || name.trim().length < 2) {
      setError("Please enter your full name (at least 2 characters)");
      return;
    }
    const cleanPhone = phone.trim();
    if (!cleanPhone || cleanPhone.length < 10) {
      setError("Please enter a valid 10-digit mobile number");
      return;
    }
    const cleanEmail = email.trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setError("Please enter a valid email address for account verification");
      return;
    }
    if (!password || password.length < 6) {
      setError("Password must be at least 6 characters long");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match. Please re-check both password fields.");
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await register({
        name: name.trim(),
        phone: cleanPhone,
        email: cleanEmail,
        password,
        language_preference: language,
      });

      setRegisteredEmail(response.email || cleanEmail);
      setStep("verify");
      setResendCooldown(60);
      setSuccessMessage(
        response.message || "Registration successful. Please enter the 6-digit verification code sent to your email."
      );
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    const cleanCode = verificationCode.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setError("Please enter a valid 6-digit numeric verification code");
      return;
    }

    setIsSubmitting(true);
    try {
      await verifyEmail({
        email: registeredEmail,
        code: cleanCode,
      });
      setSuccessMessage("Email verified successfully! Setting up your workspace...");
      setTimeout(() => {
        router.push("/onboarding");
      }, 800);
    } catch (err: any) {
      setError(err.message || "Invalid or expired verification code. Please check the code or request a new one.");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleResendCode = async () => {
    if (resendCooldown > 0 || isResending) return;
    setIsResending(true);
    setError(null);
    try {
      const res = await authApi.resendVerification({ email: registeredEmail });
      setResendCooldown(60);
      setSuccessMessage(res.message || t.auth.codeSentSuccess);
    } catch (err: any) {
      setError(err.message || "Could not resend verification code. Please try again shortly.");
    } finally {
      setIsResending(false);
    }
  };

  const languages: { code: SupportedLanguage; label: string }[] = [
    { code: "en", label: "English" },
    { code: "hi", label: "हिंदी" },
    { code: "mr", label: "मराठी" },
  ];

  return (
    <div className="min-h-screen bg-canvas subtle-geo-pattern flex flex-col justify-between p-4 sm:p-6 lg:p-8 relative overflow-hidden">
      {/* Top ambient radial glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[700px] h-[350px] bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar with Language Selector */}
      <div className="max-w-md w-full mx-auto flex items-center justify-between pt-2 relative z-10">
        <div className="flex items-center gap-2">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-brand-400 to-brand-500 flex items-center justify-center text-canvas font-black text-lg shadow-glow-sm">
            अ
          </div>
          <span className="font-extrabold text-xl text-white tracking-tight">
            ArthSetu
          </span>
        </div>

        <div className="flex items-center bg-[#0C231A] rounded-xl p-1 border border-white/10 shadow-elevation-1">
          <Globe className="w-3.5 h-3.5 text-gray-400 ml-1.5 mr-1" />
          {languages.map((l) => (
            <button
              key={l.code}
              type="button"
              onClick={() => setLanguage(l.code)}
              className={`px-2 py-1 text-xs font-semibold rounded-lg transition-all ${
                language === l.code
                  ? "bg-brand-500/20 text-brand-300 font-bold border border-brand-400/30"
                  : "text-gray-400 hover:text-white"
              }`}
            >
              {l.label}
            </button>
          ))}
        </div>
      </div>

      {/* Main Registration / Verification Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6 relative z-10">
        <Card className="p-6 sm:p-8 bg-surface border-white/[0.08] shadow-elevation-2 rounded-3xl backdrop-blur-xs">
          {step === "register" ? (
            <>
              <div className="mb-6">
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {t.auth.registerTitle}
                </h1>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  {t.auth.registerSubtitle}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              <form onSubmit={handleRegisterSubmit} className="space-y-4" noValidate>
                <Input
                  label={t.auth.nameLabel}
                  type="text"
                  placeholder={t.auth.namePlaceholder}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  autoComplete="name"
                />

                <Input
                  label={t.auth.emailLabel}
                  type="email"
                  placeholder={t.auth.emailPlaceholder}
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  autoComplete="email"
                  helperText={
                    language === "mr"
                      ? "या ईमेल पत्त्यावर पडताळणी कोड पाठवला जाईल"
                      : language === "hi"
                      ? "सत्यापन कोड इस ईमेल पते पर भेजा जाएगा"
                      : "Verification code will be sent to this email address"
                  }
                />

                <Input
                  label={t.auth.phoneLabel}
                  type="tel"
                  placeholder={t.auth.phonePlaceholder}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  autoComplete="tel"
                  helperText={
                    language === "mr"
                      ? "१० अंकी भारतीय मोबाईल क्रमांक"
                      : language === "hi"
                      ? "10 अंकों का भारतीय मोबाइल नंबर"
                      : "10-digit Indian mobile number"
                  }
                />

                <Input
                  label={t.auth.passwordLabel}
                  type="password"
                  placeholder={t.auth.passwordPlaceholder}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                  helperText={
                    language === "mr"
                      ? "किमान ६ अक्षरे"
                      : language === "hi"
                      ? "कम से कम 6 वर्ण"
                      : "At least 6 characters"
                  }
                />

                <Input
                  label={t.auth.confirmPasswordLabel}
                  type="password"
                  placeholder={t.auth.confirmPasswordPlaceholder}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  autoComplete="new-password"
                />

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-4 font-bold shadow-glow-sm"
                  isLoading={isSubmitting}
                >
                  {isSubmitting ? t.auth.registering : t.auth.registerButton}
                </Button>
              </form>

              <div className="mt-6 text-center text-sm text-gray-400">
                <span>{t.auth.haveAccount} </span>
                <Link
                  href="/login"
                  className="font-bold text-brand-300 hover:text-brand-200 hover:underline inline-flex items-center gap-0.5 ml-1"
                >
                  {t.auth.loginLink}
                </Link>
              </div>
            </>
          ) : (
            /* Email Verification Step */
            <div className="animate-in fade-in duration-200">
              <div className="mb-6">
                <div className="w-12 h-12 rounded-2xl bg-brand-500/10 border border-brand-400/20 flex items-center justify-center text-brand-400 mb-3 shadow-glow-sm">
                  <Mail className="w-6 h-6" />
                </div>
                <h1 className="text-2xl font-extrabold text-white tracking-tight">
                  {t.auth.verifyEmailTitle}
                </h1>
                <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
                  {language === "mr" ? (
                    <>
                      आम्ही <span className="font-semibold text-brand-300">{registeredEmail}</span> वर ६ अंकी पडताळणी कोड पाठवला आहे. खाते सक्रिय करण्यासाठी खाली कोड प्रविष्ट करा.
                    </>
                  ) : language === "hi" ? (
                    <>
                      हमने <span className="font-semibold text-brand-300">{registeredEmail}</span> पर 6 अंकों का सत्यापन कोड भेजा है। खाता सक्रिय करने हेतु नीचे कोड दर्ज करें।
                    </>
                  ) : (
                    <>
                      We sent a 6-digit verification code to{" "}
                      <span className="font-semibold text-brand-300">{registeredEmail}</span>.
                      Enter it below to activate your account.
                    </>
                  )}
                </p>
              </div>

              {error && (
                <div
                  role="alert"
                  className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3 animate-in fade-in duration-200"
                >
                  <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{error}</span>
                </div>
              )}

              {successMessage && (
                <div
                  role="status"
                  className="mb-5 p-4 rounded-xl bg-emerald-950/40 border border-emerald-500/40 text-emerald-300 text-sm flex items-start gap-3 animate-in fade-in duration-200"
                >
                  <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
                  <span className="leading-snug">{successMessage}</span>
                </div>
              )}

              <form onSubmit={handleVerifySubmit} className="space-y-4" noValidate>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-gray-300 mb-1.5">
                    {t.auth.verificationCodeLabel}
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    pattern="[0-9]*"
                    placeholder="123456"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    className="w-full text-center text-2xl font-mono tracking-[0.35em] py-3 px-4 rounded-xl border border-white/15 focus:outline-none focus:border-brand-400 focus:ring-2 focus:ring-brand-400/20 bg-[#071A13]/90 text-white shadow-elevation-1 transition-all"
                    required
                    autoFocus
                  />
                  <p className="text-xs text-gray-400 mt-1.5 text-center">
                    {language === "mr"
                      ? "कोड १५ मिनिटांत कालबाह्य होईल. न दिसल्यास स्पॅम/जंक फोल्डर तपासा."
                      : language === "hi"
                      ? "कोड 15 मिनट में समाप्त हो जाएगा। दिखाई न देने पर स्पैम/जंक फ़ोल्डर जाँचें।"
                      : "Code expires in 15 minutes. Check your spam/junk folder if not visible."}
                  </p>
                </div>

                <Button
                  type="submit"
                  size="lg"
                  className="w-full mt-2 font-bold shadow-glow-sm"
                  isLoading={isSubmitting}
                  disabled={verificationCode.length !== 6}
                >
                  {isSubmitting ? t.auth.verifying : t.auth.verifyButton}
                </Button>
              </form>

              <div className="mt-5 pt-4 border-t border-white/[0.08] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setStep("register");
                    setError(null);
                    setSuccessMessage(null);
                  }}
                  className="text-gray-400 hover:text-white font-medium inline-flex items-center gap-1 focus:outline-none focus:underline cursor-pointer"
                >
                  <ArrowLeft className="w-3.5 h-3.5" />
                  {language === "mr" ? "नोंदणी तपशील बदला" : language === "hi" ? "पंजीकरण विवरण संपादित करें" : "Edit registration details"}
                </button>

                <button
                  type="button"
                  onClick={handleResendCode}
                  disabled={resendCooldown > 0 || isResending}
                  className={`font-semibold inline-flex items-center gap-1 cursor-pointer ${
                    resendCooldown > 0
                      ? "text-gray-500 cursor-not-allowed"
                      : "text-brand-300 hover:text-brand-200 hover:underline"
                  }`}
                >
                  <RefreshCw className={`w-3 h-3 ${isResending ? "animate-spin" : ""}`} />
                  {resendCooldown > 0
                    ? language === "mr"
                      ? `${resendCooldown} सेकंदात कोड पुन्हा पाठवा`
                      : language === "hi"
                      ? `${resendCooldown}s में पुनः कोड भेजें`
                      : `Resend code in ${resendCooldown}s`
                    : isResending
                    ? t.auth.resending
                    : t.auth.resendCode}
                </button>
              </div>
            </div>
          )}
        </Card>
      </div>

      {/* Trust Footer */}
      <div className="max-w-md w-full mx-auto text-center pb-2 text-xs text-gray-400 flex items-center justify-center gap-2 relative z-10">
        <ShieldCheck className="w-4 h-4 text-brand-400" />
        <span>
          {language === "mr"
            ? "तुमचा डेटा गोपनीय असून उद्योग-प्रमाणित एनक्रिप्शनसह सुरक्षित आहे."
            : language === "hi"
            ? "आपका डेटा गोपनीय है और उद्यम-स्तर के एन्क्रिप्शन से सुरक्षित है।"
            : "Your data is confidential and protected with enterprise encryption."}
        </span>
      </div>
    </div>
  );
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-canvas" />}>
      <RegisterContent />
    </Suspense>
  );
}
