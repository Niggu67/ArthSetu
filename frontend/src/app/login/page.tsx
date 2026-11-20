"use client";

import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Globe, Lock, ShieldCheck, AlertCircle, Info, CheckCircle2, Mail, ArrowRight, KeyRound } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { Button } from "@/components/ui/Button";
import { Input } from "@/components/ui/Input";
import { Card } from "@/components/ui/Card";
import { Modal } from "@/components/ui/Modal";
import { SupportedLanguage } from "@/types";
import { authApi } from "@/lib/api/auth";

export default function LoginPage() {
  const router = useRouter();
  const { login, isLoading } = useAuth();
  const { language, setLanguage, t } = useLanguage();

  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isUnverified, setIsUnverified] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Forgot password modal state
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [recoveryStep, setRecoveryStep] = useState<"request" | "reset">("request");
  const [recoveryEmail, setRecoveryEmail] = useState("");
  const [recoveryCode, setRecoveryCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [recoveryError, setRecoveryError] = useState<string | null>(null);
  const [recoverySuccess, setRecoverySuccess] = useState<string | null>(null);
  const [isRecoverySubmitting, setIsRecoverySubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsUnverified(false);

    const cleanIdentifier = identifier.trim();
    if (!cleanIdentifier) {
      setError("Please enter your registered email address or mobile number");
      return;
    }
    if (!password) {
      setError("Please enter your password");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ identifier: cleanIdentifier, password });
      router.push("/dashboard");
    } catch (err: any) {
      const errMsg = err.message || "Invalid credentials. Please check and try again.";
      if (err.status === 403 || errMsg.toLowerCase().includes("verify your email")) {
        setIsUnverified(true);
        setError("Your email address is not verified yet. Please enter the verification code sent to your inbox.");
      } else {
        setError(errMsg);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRequestResetCode = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    const cleanEmail = recoveryEmail.trim();
    if (!cleanEmail || !/^\S+@\S+\.\S+$/.test(cleanEmail)) {
      setRecoveryError("Please enter a valid email address");
      return;
    }

    setIsRecoverySubmitting(true);
    try {
      const res = await authApi.forgotPassword({ email: cleanEmail });
      setRecoverySuccess(res.message || "If an account exists with this email, a 6-digit code has been sent.");
      setRecoveryStep("reset");
    } catch (err: any) {
      setRecoveryError(err.message || "Unable to request reset code. Please try again.");
    } finally {
      setIsRecoverySubmitting(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setRecoveryError(null);
    setRecoverySuccess(null);

    const cleanCode = recoveryCode.trim();
    if (!cleanCode || cleanCode.length !== 6 || !/^\d{6}$/.test(cleanCode)) {
      setRecoveryError("Please enter a valid 6-digit numeric reset code");
      return;
    }
    if (!newPassword || newPassword.length < 6) {
      setRecoveryError("New password must be at least 6 characters long");
      return;
    }
    if (newPassword !== confirmNewPassword) {
      setRecoveryError("Passwords do not match. Please re-check both fields.");
      return;
    }

    setIsRecoverySubmitting(true);
    try {
      const res = await authApi.resetPassword({
        email: recoveryEmail.trim(),
        code: cleanCode,
        new_password: newPassword,
      });
      setRecoverySuccess(res.message || "Password reset successfully! You can now log in.");
      setIdentifier(recoveryEmail.trim());
      setPassword("");
      setTimeout(() => {
        setShowForgotModal(false);
        setRecoveryStep("request");
        setRecoveryCode("");
        setNewPassword("");
        setConfirmNewPassword("");
        setRecoverySuccess(null);
      }, 1500);
    } catch (err: any) {
      setRecoveryError(err.message || "Invalid or expired reset code. Please try again.");
    } finally {
      setIsRecoverySubmitting(false);
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

        {/* Language Selection */}
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

      {/* Main Login Card */}
      <div className="max-w-md w-full mx-auto my-auto py-6 relative z-10">
        <Card className="p-6 sm:p-8 bg-surface border-white/[0.08] shadow-elevation-2 rounded-3xl backdrop-blur-xs">
          <div className="mb-6">
            <h1 className="text-2xl font-extrabold text-white tracking-tight">
              {t.auth.loginTitle}
            </h1>
            <p className="text-sm text-gray-400 mt-1.5 leading-relaxed">
              {t.auth.loginSubtitle}
            </p>
          </div>

          {error && (
            <div
              role="alert"
              className="mb-5 p-4 rounded-xl bg-red-950/40 border border-red-500/40 text-red-200 text-sm flex items-start gap-3 animate-in fade-in duration-200"
            >
              <AlertCircle className="w-5 h-5 text-red-400 shrink-0 mt-0.5" />
              <div className="space-y-1 text-xs sm:text-sm">
                <span className="leading-snug block">{error}</span>
                {isUnverified && (
                  <Link
                    href={`/register?verifyEmail=${encodeURIComponent(identifier.trim())}`}
                    className="inline-flex items-center gap-1 font-bold text-brand-300 hover:text-brand-200 hover:underline mt-1"
                  >
                    Enter verification code now <ArrowRight className="w-3.5 h-3.5" />
                  </Link>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <Input
              label={t.auth.emailOrPhoneLabel}
              type="text"
              placeholder={t.auth.emailOrPhonePlaceholder}
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setIsUnverified(false);
              }}
              required
              autoComplete="username"
            />

            <div>
              <Input
                label={t.auth.passwordLabel}
                type="password"
                placeholder={t.auth.passwordPlaceholder}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                autoComplete="current-password"
              />
              <div className="flex justify-end mt-2">
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryEmail(identifier.includes("@") ? identifier.trim() : "");
                    setRecoveryStep("request");
                    setRecoveryError(null);
                    setRecoverySuccess(null);
                    setShowForgotModal(true);
                  }}
                  className="text-xs font-semibold text-brand-300 hover:text-brand-200 hover:underline p-1 focus:outline-none focus:ring-2 focus:ring-brand-400 rounded"
                >
                  {t.auth.forgotPassword}
                </button>
              </div>
            </div>

            <Button
              type="submit"
              size="lg"
              className="w-full mt-2 shadow-glow-sm font-bold"
              isLoading={isSubmitting || isLoading}
            >
              {isSubmitting ? t.auth.loggingIn : t.auth.loginButton}
            </Button>
          </form>

          {/* Demo / Evaluator Access */}
          <div className="mt-5 pt-4 border-t border-white/[0.08] bg-[#0C231A] p-3.5 rounded-xl text-xs space-y-2 border border-white/10">
            <div className="flex items-center justify-between">
              <span className="font-bold text-white flex items-center gap-1.5">
                <Info className="w-3.5 h-3.5 text-brand-400" />
                {language === "mr" ? "डेमो / मूल्यांकनकर्ता प्रवेश" : language === "hi" ? "डेमो / मूल्यांकनकर्ता प्रवेश" : "Demo / Evaluator Access"}
              </span>
              <span className="text-[10px] uppercase tracking-wider font-semibold text-brand-300 bg-brand-500/10 px-1.5 py-0.5 rounded border border-brand-400/20">
                {language === "mr" ? "प्रकल्प मूल्यांकन" : language === "hi" ? "परियोजना मूल्यांकन" : "Academic Evaluation"}
              </span>
            </div>
            <p className="text-gray-400 leading-snug">
              {language === "mr"
                ? "मूल्यांकनासाठी, पूर्वरचित योजना आणि अर्जांसह पडताळलेले उद्योजक प्रोफाइल लोड करा."
                : language === "hi"
                ? "मूल्यांकन हेतु, पूर्व-कॉन्फ़िगर की गई योजनाओं और आवेदनों के साथ सत्यापित उद्यमी प्रोफ़ाइल लोड करें।"
                : "For project evaluation, load the verified demo entrepreneur profile with pre-configured applications and schemes."}
            </p>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setIdentifier("sunita.devi@example.com");
                setPassword("Devi@12345");
                setError(null);
                setIsUnverified(false);
              }}
              className="w-full text-xs font-bold text-brand-300 hover:text-white border-brand-400/40 hover:bg-brand-500/10"
            >
              {language === "mr" ? "डेमो खाते वापरा (मूल्यांकन प्रवेश)" : language === "hi" ? "डेमो खाता उपयोग करें (मूल्यांकन प्रवेश)" : "Use Demo Account (Evaluator Access)"}
            </Button>
          </div>

          <div className="mt-6 text-center text-sm text-gray-400">
            <span>{t.auth.noAccount} </span>
            <Link
              href="/register"
              className="font-bold text-brand-300 hover:text-brand-200 hover:underline inline-flex items-center gap-0.5 ml-1"
            >
              {t.auth.registerLink}
            </Link>
          </div>
        </Card>
      </div>

      {/* Trust Footer */}
      <div className="max-w-md w-full mx-auto text-center pb-2 text-xs text-gray-400 flex items-center justify-center gap-2 relative z-10">
        <ShieldCheck className="w-4 h-4 text-brand-400" />
        <span>
          {language === "mr"
            ? "SHA-256 PBKDF2 एनक्रिप्शन आणि JWT टोकन सुरक्षेसह सुरक्षित प्रमाणीकरण."
            : language === "hi"
            ? "SHA-256 PBKDF2 एन्क्रिप्शन और JWT टोकन सुरक्षा के साथ सुरक्षित प्रमाणीकरण।"
            : "Secure authentication with SHA-256 PBKDF2 encryption & JWT token security."}
        </span>
      </div>

      {/* Password Recovery Modal */}
      <Modal
        isOpen={showForgotModal}
        onClose={() => setShowForgotModal(false)}
        title={t.auth.resetPasswordTitle}
        description={
          recoveryStep === "request"
            ? t.auth.resetPasswordSubtitle
            : language === "mr"
            ? "तुमचा ६ अंकी कोड प्रविष्ट करा आणि नवीन पासवर्ड निवडा"
            : language === "hi"
            ? "अपना 6 अंकों का कोड दर्ज करें और नया पासवर्ड चुनें"
            : "Enter your 6-digit code and choose a new password"
        }
      >
        <div className="space-y-4 py-2 text-sm text-gray-700">
          {recoveryError && (
            <div
              role="alert"
              className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-700 text-xs flex items-start gap-2"
            >
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
              <span>{recoveryError}</span>
            </div>
          )}

          {recoverySuccess && (
            <div
              role="status"
              className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs flex items-start gap-2"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
              <span>{recoverySuccess}</span>
            </div>
          )}

          {recoveryStep === "request" ? (
            <form onSubmit={handleRequestResetCode} className="space-y-3.5" noValidate>
              <Input
                label={t.auth.emailLabel}
                type="email"
                placeholder="name@example.com"
                value={recoveryEmail}
                onChange={(e) => setRecoveryEmail(e.target.value)}
                required
                autoComplete="email"
                helperText={
                  language === "mr"
                    ? "आम्ही या पत्त्यावर ६ अंकी पासवर्ड रीसेट कोड पाठवू"
                    : language === "hi"
                    ? "हम इस पते पर 6 अंकों का पासवर्ड रीसेट कोड भेजेंगे"
                    : "We will send a 6-digit password reset code to this address"
                }
              />

              <div className="pt-2 flex items-center justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setShowForgotModal(false)}
                >
                  {t.common.cancel}
                </Button>
                <Button
                  type="submit"
                  size="sm"
                  isLoading={isRecoverySubmitting}
                >
                  {t.auth.sendResetCode}
                </Button>
              </div>
            </form>
          ) : (
            <form onSubmit={handleResetPassword} className="space-y-3.5" noValidate>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  {t.auth.verificationCodeLabel}
                </label>
                <input
                  type="text"
                  inputMode="numeric"
                  maxLength={6}
                  placeholder="123456"
                  value={recoveryCode}
                  onChange={(e) => setRecoveryCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  className="w-full text-center text-xl font-mono tracking-widest py-2 px-3 rounded-xl border border-gray-300 focus:outline-none focus:ring-2 focus:ring-brand-500 bg-white shadow-xs"
                  required
                  autoFocus
                />
                <p className="text-[11px] text-gray-500 mt-1 text-center">
                  {language === "mr"
                    ? `${recoveryEmail} वर पाठवला आहे. कोड १५ मिनिटांत कालबाह्य होईल.`
                    : language === "hi"
                    ? `${recoveryEmail} पर भेजा गया। कोड 15 मिनट में समाप्त हो जाएगा।`
                    : `Sent to ${recoveryEmail}. Code expires in 15 minutes.`}
                </p>
              </div>

              <Input
                label={language === "mr" ? "नवीन पासवर्ड" : language === "hi" ? "नया पासवर्ड" : "New Password"}
                type="password"
                placeholder="Enter at least 6 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <Input
                label={language === "mr" ? "नवीन पासवर्डची पुष्टी करा" : language === "hi" ? "नए पासवर्ड की पुष्टि करें" : "Confirm New Password"}
                type="password"
                placeholder="Confirm your new password"
                value={confirmNewPassword}
                onChange={(e) => setConfirmNewPassword(e.target.value)}
                required
                autoComplete="new-password"
              />

              <div className="pt-2 flex items-center justify-between">
                <button
                  type="button"
                  onClick={() => {
                    setRecoveryStep("request");
                    setRecoveryError(null);
                  }}
                  className="text-xs text-gray-500 hover:text-gray-800 underline focus:outline-none cursor-pointer"
                >
                  {language === "mr" ? "ईमेल बदला" : language === "hi" ? "ईमेल बदलें" : "Change email"}
                </button>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowForgotModal(false)}
                  >
                    {t.common.cancel}
                  </Button>
                  <Button
                    type="submit"
                    size="sm"
                    isLoading={isRecoverySubmitting}
                    disabled={recoveryCode.length !== 6}
                  >
                    {t.auth.resetPasswordButton}
                  </Button>
                </div>
              </div>
            </form>
          )}
        </div>
      </Modal>
    </div>
  );
}
