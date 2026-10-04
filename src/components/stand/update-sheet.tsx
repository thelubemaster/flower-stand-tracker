import { useEffect, useState } from "react";
import { APP_SOURCE_URL, APP_VERSION } from "@/lib/version";
import {
  applyPublishedUpdate,
  changelogFor,
  checkForUpdate,
  summaryFor,
  stepsFor,
  updateAvailable,
  type UpdateCheckResult,
} from "@/lib/stand/updates";
import { PressButton, Sheet } from "@/components/stand/ui";

export function useUpdateStatus(active: boolean) {
  const [result, setResult] = useState<UpdateCheckResult | null>(null);

  useEffect(() => {
    if (!active) return;
    let cancel = false;
    const run = (force: boolean) => {
      void checkForUpdate(force).then((next) => {
        if (!cancel) setResult(next);
      });
    };
    run(false);
    const onVis = () => {
      if (document.visibilityState === "visible") run(true);
    };
    document.addEventListener("visibilitychange", onVis);
    return () => {
      cancel = true;
      document.removeEventListener("visibilitychange", onVis);
    };
  }, [active]);

  return result;
}

export function UpdateBanner({
  result,
  onOpen,
}: {
  result: UpdateCheckResult | null;
  onOpen: () => void;
}) {
  if (!updateAvailable(result) || result?.status !== "available") return null;
  return (
    <section className="mb-4 rounded-card border border-line bg-card px-4 py-4" aria-label="Update available">
      <p className="text-sm text-clay">Update on GitHub</p>
      <p className="mt-1 font-display text-2xl text-balance">v{result.manifest.version} is published</p>
      <p className="mt-2 text-sm text-pretty text-muted">
        This phone is still v{APP_VERSION}. The book stays here. Only the app copy comes from GitHub.
      </p>
      <PressButton className="mt-4 w-full" onClick={onOpen}>
        Get up to date
      </PressButton>
    </section>
  );
}

export function UpdateSheet({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const [result, setResult] = useState<UpdateCheckResult | null>(null);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancel = false;
    setStatus(null);
    void checkForUpdate(true).then((next) => {
      if (!cancel) setResult(next);
    });
    return () => {
      cancel = true;
    };
  }, [open]);

  const latest =
    result?.status === "available"
      ? result.manifest.version
      : result && result.status !== "error"
        ? result.latest
        : null;
  const behind = result?.status === "available";
  const notes = changelogFor(behind && latest ? latest : APP_VERSION);
  const githubTone: "ok" | "update" | "wait" =
    result == null ? "wait" : behind ? "update" : result.status === "error" ? "update" : "ok";

  return (
    <Sheet
      open={open}
      onOpenChange={onOpenChange}
      title={behind && latest ? `Version ${latest}` : `Version ${APP_VERSION}`}
      description="This number changes with every update."
    >
      <div className="grid gap-3 text-sm">
        <p className="text-pretty text-muted">{summaryFor(result)}</p>
        <div className="grid gap-2 rounded-card border border-line bg-paper p-3">
          <VersionRow label="This phone" value={`v${APP_VERSION}`} tone={behind ? "update" : "ok"} />
          <VersionRow
            label="GitHub"
            value={latest ? `v${latest}` : result?.status === "error" ? "Not reached" : "Checking…"}
            tone={githubTone}
          />
        </div>
        <ol className="grid list-decimal gap-1 pl-5 text-pretty">
          {stepsFor(result).map((step) => (
            <li key={step}>{step}</li>
          ))}
        </ol>
        <PressButton
          className="w-full"
          disabled={busy || result == null}
          onClick={() => {
            if (!result) return;
            setBusy(true);
            const job =
              result.status === "available"
                ? applyPublishedUpdate(result)
                : checkForUpdate(true).then((next) => {
                    setResult(next);
                    return summaryFor(next);
                  });
            void job
              .then((message) => setStatus(message))
              .catch(() => setStatus("Update failed. Check your internet, then try again."))
              .finally(() => setBusy(false));
          }}
        >
          {busy ? "Working…" : behind ? "Get up to date" : "Check again"}
        </PressButton>
        {status ? (
          <p className="text-pretty text-muted" role="status">
            {status}
          </p>
        ) : null}
        {notes ? (
          <div className="grid gap-2">
            <p className="font-medium">What's new in v{notes.version}</p>
            <p className="text-muted">{notes.title}</p>
            <ul className="grid list-disc gap-1 pl-5 text-pretty text-muted">
              {notes.changes.map((change) => (
                <li key={change}>{change}</li>
              ))}
            </ul>
          </div>
        ) : null}
        <p className="text-pretty text-muted">
          Flower Stand runs on this phone. The book is saved here. Nothing is uploaded.{" "}
          <a className="underline" href={APP_SOURCE_URL}>
            thelubemaster/flower-stand-tracker
          </a>
        </p>
      </div>
    </Sheet>
  );
}

function VersionRow({ label, value, tone }: { label: string; value: string; tone: "ok" | "update" | "wait" }) {
  const pill =
    tone === "ok" ? "ok" : tone === "wait" ? "…" : "update";
  return (
    <div className="flex items-center justify-between gap-3">
      <span>{label}</span>
      <span className="flex items-center gap-2">
        <span className="font-medium tabular-nums">{value}</span>
        <span
          className={
            tone === "ok"
              ? "rounded-full bg-moss px-2 py-0.5 text-xs text-card"
              : tone === "wait"
                ? "rounded-full border border-line px-2 py-0.5 text-xs text-muted"
                : "rounded-full bg-clay px-2 py-0.5 text-xs text-card"
          }
        >
          {pill}
        </span>
      </span>
    </div>
  );
}
