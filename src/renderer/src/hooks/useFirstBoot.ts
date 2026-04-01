import React from "react";
import steps from "../config/first_boot_steps.json";
import { appendRuntimeEvent } from "../runtime/runtimeEventBus.ts";

const PROGRESS_KEY = "neuralshell_first_boot_progress_v1";
const EVENTS_KEY = "neuralshell_first_boot_events_v1";
const DISMISSED_KEY = "neuralshell_first_boot_dismissed_v1";

type ProgressShape = Record<string, boolean>;

function readProgress(): ProgressShape {
  if (typeof window === "undefined" || !window.localStorage) return {};
  try {
    const parsed = JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "{}");
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return {};
  }
}

function writeProgress(progress: ProgressShape) {
  if (typeof window === "undefined" || !window.localStorage) return;
  window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(progress || {}));
}

function appendFirstBootEvent(type: string, stepId = "", detail: Record<string, any> = {}) {
  if (typeof window === "undefined" || !window.localStorage) return;
  try {
    const parsed = JSON.parse(window.localStorage.getItem(EVENTS_KEY) || "[]");
    const list = Array.isArray(parsed) ? parsed : [];
    const entry = {
      at: new Date().toISOString(),
      type: String(type || ""),
      stepId: String(stepId || ""),
      detail: detail && typeof detail === "object" ? detail : {},
    };
    list.push(entry);
    window.localStorage.setItem(EVENTS_KEY, JSON.stringify(list.slice(-250)));
  } catch {
    // best effort only
  }
}

export function useFirstBoot() {
  const [progress, setProgress] = React.useState<ProgressShape>(() => readProgress());
  const [open, setOpen] = React.useState(() => {
    if (typeof window === "undefined" || !window.localStorage) return true;
    const dismissed = window.localStorage.getItem(DISMISSED_KEY) === "1";
    return !dismissed;
  });
  const [busyStepId, setBusyStepId] = React.useState("");

  const completedCount = React.useMemo(() => (
    (Array.isArray(steps) ? steps : []).filter((step) => Boolean(progress[String(step.id || "")])).length
  ), [progress]);

  const allDone = React.useMemo(() => (
    completedCount >= (Array.isArray(steps) ? steps.length : 0)
  ), [completedCount]);

  const completeStep = React.useCallback((stepId: string) => {
    const safeStepId = String(stepId || "");
    if (!safeStepId) return;
    setProgress((prev) => {
      const next = { ...(prev || {}), [safeStepId]: true };
      writeProgress(next);
      return next;
    });
    appendFirstBootEvent("step_completed", safeStepId);
    appendRuntimeEvent("firstboot.step.completed", { stepId: safeStepId }, { source: "firstboot", severity: "info" });
  }, []);

  const markSkipped = React.useCallback((stepId: string) => {
    const safeStepId = String(stepId || "");
    if (!safeStepId) return;
    appendFirstBootEvent("step_skipped", safeStepId);
    appendRuntimeEvent("firstboot.step.skipped", { stepId: safeStepId }, { source: "firstboot", severity: "info" });
  }, []);

  const dismiss = React.useCallback(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.setItem(DISMISSED_KEY, "1");
    }
    setOpen(false);
    appendFirstBootEvent("wizard_dismissed");
  }, []);

  const reopen = React.useCallback(() => {
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(DISMISSED_KEY);
    }
    setOpen(true);
    appendFirstBootEvent("wizard_reopened");
  }, []);

  const reset = React.useCallback(() => {
    setProgress({});
    writeProgress({});
    if (typeof window !== "undefined" && window.localStorage) {
      window.localStorage.removeItem(DISMISSED_KEY);
    }
    setOpen(true);
    appendFirstBootEvent("wizard_reset");
    appendRuntimeEvent("firstboot.reset", {}, { source: "firstboot", severity: "warning" });
  }, []);

  const runStep = React.useCallback(async (stepId: string, handler?: () => Promise<void> | void) => {
    const safeStepId = String(stepId || "");
    if (!safeStepId) return false;
    setBusyStepId(safeStepId);
    appendFirstBootEvent("step_started", safeStepId);
    appendRuntimeEvent("firstboot.step.started", { stepId: safeStepId }, { source: "firstboot", severity: "info" });
    try {
      if (typeof handler === "function") {
        await Promise.resolve(handler());
      }
      completeStep(safeStepId);
      return true;
    } catch (err: any) {
      const message = err && err.message ? err.message : String(err);
      appendFirstBootEvent("step_failed", safeStepId, { message });
      appendRuntimeEvent(
        "firstboot.step.failed",
        { stepId: safeStepId, message },
        { source: "firstboot", severity: "warning" },
      );
      return false;
    } finally {
      setBusyStepId("");
    }
  }, [completeStep]);

  return {
    steps,
    progress,
    open,
    setOpen,
    busyStepId,
    completedCount,
    allDone,
    completeStep,
    markSkipped,
    runStep,
    dismiss,
    reopen,
    reset,
  };
}

export default useFirstBoot;

