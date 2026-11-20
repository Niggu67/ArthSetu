"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useSearchParams, useRouter } from "next/navigation";
import {
  Layers,
  Clock,
  CheckCircle2,
  AlertCircle,
  Plus,
  Edit3,
  Calendar,
  FileText,
  ShieldCheck,
  Info,
  XCircle,
  ExternalLink,
  ArrowRight,
} from "lucide-react";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AppShell } from "@/components/layout/AppShell";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Modal } from "@/components/ui/Modal";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { applicationsApi, schemesApi } from "@/lib/api";
import { Application, Scheme } from "@/types";
import { formatDate } from "@/lib/utils";

export default function ApplicationsPage() {
  return (
    <ProtectedRoute>
      <AppShell>
        <ApplicationsContent />
      </AppShell>
    </ProtectedRoute>
  );
}

// Backend supported statuses: draft, submitted, under_review, approved, rejected
const STATUS_STEPS = [
  { id: "draft", label: "Draft" },
  { id: "submitted", label: "Submitted" },
  { id: "under_review", label: "Under Review" },
  { id: "decision", label: "Decision" },
];

function ApplicationsContent() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const searchParams = useSearchParams();
  const router = useRouter();
  const querySchemeId = searchParams.get("scheme_id");

  const [applications, setApplications] = useState<Application[]>([]);
  const [schemes, setSchemes] = useState<Scheme[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // New Application Modal State (Requiring explicit user confirmation)
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [selectedSchemeId, setSelectedSchemeId] = useState<number | null>(null);
  const [newAppNotes, setNewAppNotes] = useState("");
  const [isCreating, setIsCreating] = useState(false);

  // Update Status Modal State
  const [editingApp, setEditingApp] = useState<Application | null>(null);
  const [editStatus, setEditStatus] = useState<string>("draft");
  const [editNotes, setEditNotes] = useState<string>("");
  const [isUpdating, setIsUpdating] = useState(false);

  // Load applications and schemes
  const loadData = async () => {
    if (!user?.id) return;
    setIsLoading(true);
    setError(null);
    try {
      const [appsData, schemesData] = await Promise.all([
        applicationsApi.getByUserId(user.id),
        schemesApi.list(),
      ]);
      setApplications(appsData || []);
      setSchemes(schemesData.schemes || []);
    } catch (err: any) {
      setError(err.message || "Unable to load applications.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user?.id]);

  // Handle explicit track scheme query param
  useEffect(() => {
    if (querySchemeId && schemes.length > 0) {
      const sid = Number(querySchemeId);
      const found = schemes.find((s) => s.id === sid);
      if (found) {
        setSelectedSchemeId(found.id);
        setShowCreateModal(true);
      }
    }
  }, [querySchemeId, schemes]);

  const handleConfirmCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id || !selectedSchemeId) return;

    setIsCreating(true);
    setError(null);
    try {
      await applicationsApi.create({
        user_id: user.id,
        scheme_id: selectedSchemeId,
        status: "draft",
        notes: newAppNotes.trim() || undefined,
      });

      setShowCreateModal(false);
      setNewAppNotes("");
      router.replace("/applications");
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to create application entry.");
    } finally {
      setIsCreating(false);
    }
  };

  const handleConfirmUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingApp) return;

    setIsUpdating(true);
    setError(null);
    try {
      await applicationsApi.update(editingApp.id, {
        status: editStatus,
        notes: editNotes.trim(),
      });

      setEditingApp(null);
      await loadData();
    } catch (err: any) {
      setError(err.message || "Failed to update application.");
    } finally {
      setIsUpdating(false);
    }
  };

  const getSchemeName = (app: Application) => {
    const sid = app.scheme_id;
    if (t.schemesData[sid]?.name) return t.schemesData[sid].name;
    if (app.scheme?.name) return app.scheme.name;
    const found = schemes.find((s) => s.id === sid);
    return found?.name || `Scheme #${sid}`;
  };

  const getStatusBadge = (status: string) => {
    const s = status.toLowerCase();
    switch (s) {
      case "draft":
        return <Badge variant="neutral" withDot>{t.applications.statusDraft}</Badge>;
      case "submitted":
        return <Badge variant="brand" withDot>{t.applications.statusSubmitted}</Badge>;
      case "under_review":
        return <Badge variant="ochre" withDot>{t.applications.statusUnderReview}</Badge>;
      case "approved":
        return <Badge variant="success" withDot>{t.applications.statusApproved}</Badge>;
      case "rejected":
        return <Badge variant="warning" withDot>{t.applications.statusRejected}</Badge>;
      default:
        return <Badge variant="neutral">{status}</Badge>;
    }
  };

  const getStepIndex = (status: string) => {
    const s = status.toLowerCase();
    if (s === "draft") return 0;
    if (s === "submitted") return 1;
    if (s === "under_review") return 2;
    if (s === "approved" || s === "rejected") return 3;
    return 0;
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 pb-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-2 border-b border-white/[0.08]">
        <div className="space-y-1">
          <h1 className="text-2xl sm:text-3xl font-black text-white tracking-tight flex items-center gap-2.5">
            <Layers className="w-7 h-7 text-brand-400 shrink-0" />
            <span>{t.applications.heading}</span>
          </h1>
          <p className="text-xs sm:text-sm text-gray-400 leading-relaxed">
            {t.applications.subtitle}
          </p>
        </div>

        <Button
          size="md"
          onClick={() => {
            setSelectedSchemeId(schemes[0]?.id || null);
            setShowCreateModal(true);
          }}
          className="font-bold self-start sm:self-auto gap-1.5 shadow-glow-sm"
        >
          <Plus className="w-4 h-4" />
          <span>{t.applications.newApplicationButton}</span>
        </Button>
      </div>

      {/* Prominent Self-Reported Tracking Disclaimer */}
      <div className="p-4 bg-amber-950/30 rounded-2xl border border-amber-500/30 text-amber-200/90 text-xs leading-relaxed flex items-start gap-3 backdrop-blur-xs">
        <Info className="w-4.5 h-4.5 text-amber-400 shrink-0 mt-0.5" />
        <div className="space-y-1">
          <strong className="font-bold text-amber-300 block">{t.applications.selfTrackingNoticeTitle}</strong>
          <p>{t.applications.selfTrackingNoticeBody}</p>
        </div>
      </div>

      {/* Loading State */}
      {isLoading && (
        <div className="space-y-4">
          {[1, 2].map((n) => (
            <Card key={n} className="p-6 space-y-3 rounded-2xl bg-surface border-white/[0.08]">
              <div className="h-6 w-1/3 bg-white/10 rounded animate-pulse" />
              <div className="h-4 w-1/2 bg-white/5 rounded animate-pulse" />
              <div className="h-12 bg-white/5 rounded-xl animate-pulse" />
            </Card>
          ))}
        </div>
      )}

      {/* Empty State */}
      {!isLoading && applications.length === 0 && (
        <Card className="p-10 text-center space-y-4 text-gray-400 border-dashed border-2 border-white/15 bg-surface/60 rounded-3xl backdrop-blur-xs">
          <div className="w-14 h-14 rounded-2xl bg-canvas-subtle border border-white/10 text-brand-400 flex items-center justify-center mx-auto shadow-glow-sm">
            <Layers className="w-7 h-7" />
          </div>
          <div>
            <h2 className="text-base font-bold text-white">{t.applications.noApplicationsHeading}</h2>
            <p className="text-xs text-gray-400 mt-1 max-w-sm mx-auto leading-relaxed">
              {t.applications.noApplicationsSubtitle}
            </p>
          </div>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-2.5 pt-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                setSelectedSchemeId(schemes[0]?.id || null);
                setShowCreateModal(true);
              }}
              className="font-bold border-white/20 text-gray-200 hover:text-white"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              {t.applications.newApplicationButton}
            </Button>
            <Link href="/schemes">
              <Button size="sm" className="font-bold gap-1 shadow-glow-sm">
                <span>{t.applications.exploreSchemesCta}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Button>
            </Link>
          </div>
        </Card>
      )}

      {/* Applications List */}
      {!isLoading && applications.length > 0 && (
        <div className="space-y-4">
          {applications.map((app) => {
            const currentStepIdx = getStepIndex(app.status);
            const isApproved = app.status.toLowerCase() === "approved";
            const isRejected = app.status.toLowerCase() === "rejected";

            return (
              <Card
                key={app.id}
                className="p-5 sm:p-6 space-y-4 bg-surface border-white/[0.08] shadow-elevation-2 rounded-2xl hover:border-brand-400/40 transition-all"
              >
                {/* Header row */}
                <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5 flex-wrap">
                      <h2 className="text-base sm:text-lg font-bold text-white tracking-tight">
                        {getSchemeName(app)}
                      </h2>
                      {getStatusBadge(app.status)}
                    </div>
                    <p className="text-xs text-gray-400 flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-gray-500" />
                      <span>{t.applications.timelineCreated}: {formatDate(app.created_at)}</span>
                    </p>
                  </div>

                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setEditingApp(app);
                      setEditStatus(app.status);
                      setEditNotes(app.notes || "");
                    }}
                    className="self-start sm:self-auto gap-1 text-xs font-bold border-white/20 text-gray-200 hover:text-white"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>{t.applications.changeStatusButton}</span>
                  </Button>
                </div>

                {/* Visual Status Timeline: Draft → Submitted → Under Review → Decision */}
                <div className="pt-3 pb-2 px-2">
                  <div className="relative flex items-center justify-between max-w-xl mx-auto">
                    {/* Background track */}
                    <div className="absolute left-4 right-4 top-4 h-1 bg-white/10 rounded-full -z-0" />

                    {/* Active progress track */}
                    <div
                      className="absolute left-4 top-4 h-1 bg-gradient-to-r from-brand-400 to-brand-500 rounded-full transition-all duration-300 -z-0"
                      style={{
                        width: `${(currentStepIdx / (STATUS_STEPS.length - 1)) * 90}%`,
                      }}
                    />

                    {STATUS_STEPS.map((step, idx) => {
                      const isPast = idx < currentStepIdx;
                      const isCurrent = idx === currentStepIdx;

                      let nodeColor = "bg-canvas-subtle border-white/20 text-gray-400";
                      if (isPast) {
                        nodeColor = "bg-brand-500 border-brand-400 text-canvas font-black shadow-glow-sm";
                      } else if (isCurrent) {
                        if (isRejected) {
                          nodeColor = "bg-red-500 border-red-400 text-white font-black shadow-sm ring-4 ring-red-500/20";
                        } else if (isApproved) {
                          nodeColor = "bg-emerald-500 border-emerald-400 text-canvas font-black shadow-sm ring-4 ring-emerald-500/20";
                        } else {
                          nodeColor = "bg-[#143527] border-brand-400 text-brand-300 font-black shadow-glow-sm ring-4 ring-brand-400/20";
                        }
                      }

                      let displayLabel =
                        step.id === "draft"
                          ? t.applications.statusDraft
                          : step.id === "submitted"
                          ? t.applications.statusSubmitted
                          : step.id === "under_review"
                          ? t.applications.statusUnderReview
                          : isApproved
                          ? t.applications.statusApproved
                          : isRejected
                          ? t.applications.statusRejected
                          : t.applications.statusDecision;

                      return (
                        <div key={step.id} className="relative z-10 flex flex-col items-center">
                          <div
                            className={`w-8 h-8 rounded-full border-2 flex items-center justify-center text-xs font-bold transition-all duration-300 ${nodeColor}`}
                          >
                            {isPast ? "✓" : idx + 1}
                          </div>
                          <span
                            className={`text-[11px] mt-1.5 text-center transition-colors ${
                              isCurrent ? "font-bold text-white" : "font-medium text-gray-400"
                            }`}
                          >
                            {displayLabel}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Notes box if present */}
                {app.notes && (
                  <div className="p-3 bg-canvas-subtle/80 rounded-xl text-xs text-gray-300 space-y-1 border border-white/10">
                    <span className="font-bold text-white block">{t.applications.notesLabel}:</span>
                    <p className="leading-relaxed whitespace-pre-wrap text-gray-300">{app.notes}</p>
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Explicit User Confirmation Modal: Track Scheme */}
      <Modal
        isOpen={showCreateModal}
        onClose={() => {
          setShowCreateModal(false);
          router.replace("/applications");
        }}
        title={t.applications.modalNewTitle}
        description={t.applications.modalNewSubtitle}
      >
        <form onSubmit={handleConfirmCreate} className="space-y-4 py-1">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-1.5 tracking-tight">
              {t.applications.schemeSelectLabel}
            </label>
            <select
              value={selectedSchemeId || ""}
              onChange={(e) => setSelectedSchemeId(Number(e.target.value))}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 shadow-2xs"
              required
            >
              {schemes.map((s) => {
                const locName = t.schemesData[s.id]?.name || s.name;
                const locCat = t.schemesData[s.id]?.category || s.category;
                return (
                  <option key={s.id} value={s.id} className="bg-canvas-subtle text-white">
                    {locName} ({locCat})
                  </option>
                );
              })}
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-1.5 tracking-tight">
              {t.applications.notesLabel}
            </label>
            <textarea
              value={newAppNotes}
              onChange={(e) => setNewAppNotes(e.target.value)}
              placeholder={t.applications.notesPlaceholder}
              className="w-full min-h-[85px] p-3 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 placeholder:text-gray-500 shadow-2xs"
            />
          </div>

          <div className="p-3 bg-amber-950/30 rounded-xl text-xs text-amber-200/90 border border-amber-500/30">
            <strong className="text-amber-300">{t.applications.selfTrackingNoticeTitle}:</strong> {t.applications.selfTrackingNoticeBody}
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => {
                setShowCreateModal(false);
                router.replace("/applications");
              }}
              className="border-white/20 text-gray-300 hover:text-white"
            >
              {t.applications.cancelButton}
            </Button>
            <Button type="submit" size="sm" isLoading={isCreating} className="font-bold shadow-glow-sm">
              {t.applications.saveButton}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Update Application Status & Notes Modal */}
      <Modal
        isOpen={!!editingApp}
        onClose={() => setEditingApp(null)}
        title={t.applications.modalEditTitle}
        description={t.applications.modalNewSubtitle}
      >
        <form onSubmit={handleConfirmUpdate} className="space-y-4 py-1">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-1.5 tracking-tight">
              {t.applications.statusLabel}
            </label>
            <select
              value={editStatus}
              onChange={(e) => setEditStatus(e.target.value)}
              className="w-full min-h-[46px] px-3.5 py-2.5 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 shadow-2xs"
            >
              <option value="draft" className="bg-canvas-subtle text-white">{t.applications.statusDraft}</option>
              <option value="submitted" className="bg-canvas-subtle text-white">{t.applications.statusSubmitted}</option>
              <option value="under_review" className="bg-canvas-subtle text-white">{t.applications.statusUnderReview}</option>
              <option value="approved" className="bg-canvas-subtle text-white">{t.applications.statusApproved}</option>
              <option value="rejected" className="bg-canvas-subtle text-white">{t.applications.statusRejected}</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-1.5 tracking-tight">
              {t.applications.notesLabel}
            </label>
            <textarea
              value={editNotes}
              onChange={(e) => setEditNotes(e.target.value)}
              placeholder={t.applications.notesPlaceholder}
              className="w-full min-h-[95px] p-3 rounded-xl border border-white/15 text-sm text-white bg-[#071A13]/90 focus:outline-none focus:border-brand-400 placeholder:text-gray-500 shadow-2xs"
            />
          </div>

          <div className="pt-2 flex justify-end gap-2">
            <Button type="button" variant="outline" size="sm" onClick={() => setEditingApp(null)} className="border-white/20 text-gray-300 hover:text-white">
              {t.applications.cancelButton}
            </Button>
            <Button type="submit" size="sm" isLoading={isUpdating} className="font-bold shadow-glow-sm">
              {t.applications.saveButton}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
