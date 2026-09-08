"use client";

import { useState, type ChangeEvent } from "react";
import { deleteWorkspace, loadWorkspace, saveWorkspace } from "@/lib/attention/workspace";
import { exportMarkdown, parseWorkspace, serializeWorkspace } from "@/lib/attention/export";
import { MAX_WORKSPACE_BYTES } from "@/lib/attention/workspace-schema";
import { useWorkspace } from "./workspace-provider";
import { labSecondaryClass } from "./lab-ui";

function downloadText(text: string, filename: string, type: string) {
  const url = URL.createObjectURL(new Blob([text], { type }));
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  try {
    document.body.append(anchor);
    anchor.click();
  } finally {
    anchor.remove();
    window.setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
}

export function LabWorkspaceTools() {
  const { state, dispatch } = useWorkspace();
  const [message, setMessage] = useState<{ text: string; error: boolean } | null>(null);
  const [reading, setReading] = useState(false);
  const report = (text: string, error = false) => setMessage({ text, error });

  function save() {
    const result = saveWorkspace(() => window.localStorage, state.draft);
    if (!result.ok) return report(result.error, true);
    report("Saved one draft on this device. Later edits are not saved automatically.");
  }
  function load() {
    const result = loadWorkspace(() => window.localStorage);
    if (!result.ok) return report(result.error, true);
    if (state.touched && !window.confirm("Replace the entire active draft, including unsaved edits, notes and results, with the saved device copy?")) return report("Load cancelled. Active draft unchanged.");
    dispatch({ type: "replace", draft: result.value });
    report("Loaded the validated device copy. No automatic save is enabled.");
  }
  function remove() {
    if (!window.confirm("Delete the one saved Attention Lab draft on this device? The active draft in memory will stay open.")) return;
    const result = deleteWorkspace(() => window.localStorage);
    if (!result.ok) return report(result.error, true);
    report("Saved device copy deleted. Your active in-memory draft is unchanged.");
  }
  function exportFile(format: "json" | "markdown") {
    const result = format === "json" ? serializeWorkspace(state.draft) : exportMarkdown(state.draft);
    if (!result.ok) return report(result.error, true);
    try {
      downloadText(result.value, `fomoengine-attention-lab-v1.${format === "json" ? "json" : "md"}`, format === "json" ? "application/json;charset=utf-8" : "text/markdown;charset=utf-8");
      report(`${format === "json" ? "JSON" : "Markdown"} download requested. Check your browser's downloads; nothing was sent to a server.`);
    } catch { report("The browser could not start a download. Your active draft is unchanged.", true); }
  }
  async function copy() {
    const result = exportMarkdown(state.draft);
    if (!result.ok) return report(result.error, true);
    try {
      await navigator.clipboard.writeText(result.value);
      report("Markdown copied, including the edited brief, measurement record and attached notes.");
    } catch { report("Clipboard access was unavailable or denied. Use Download Markdown, or select the editable brief and copy it manually.", true); }
  }
  async function importFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.currentTarget.files?.[0];
    event.currentTarget.value = "";
    if (!file) return;
    if (file.size > MAX_WORKSPACE_BYTES) return report("File exceeds the 256 KiB limit. Your active draft is unchanged.", true);
    setReading(true);
    try {
      const result = parseWorkspace(await file.text());
      if (!result.ok) return report(result.error, true);
      // 讀檔期間都可能有人繼續改字；驗證後永遠再確認，唔靠舊 closure 嘅 touched。
      if (!window.confirm("Import this validated version 1 workspace and replace the entire active draft, including unsaved edits, notes and results?")) return report("Import cancelled. Active draft unchanged.");
      dispatch({ type: "replace", draft: result.value });
      report("Imported the validated workspace into memory. It has not been saved on this device.");
    } catch { report("Could not read this file. Your active draft has not changed.", true); }
    finally { setReading(false); }
  }

  return <section aria-label="Workspace storage and exports" className="my-8 border-y border-[var(--lab-line,#b9b0a2)] py-5">
    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
      <div className="max-w-md">
        <h2 className="!text-sm !font-semibold !tracking-normal">One active draft. Yours to keep.</h2>
        <p className="mt-1 text-sm leading-relaxed text-[#625a50]">Across Lab and Trends, edits stay in this tab&apos;s memory. Reload clears them. No content fetch, analytics or server submission. Save explicitly to replace the single local device copy; Load is never automatic.</p>
      </div>
      <div className="flex max-w-2xl flex-wrap gap-2">
        <button type="button" className={labSecondaryClass} onClick={save}>Save on this device</button>
        <button type="button" className={labSecondaryClass} onClick={load}>Load saved draft</button>
        <button type="button" className={labSecondaryClass} onClick={remove}>Delete saved draft</button>
        <button type="button" className={labSecondaryClass} onClick={() => exportFile("json")}>Export JSON</button>
        <button type="button" className={labSecondaryClass} disabled={!state.draft.generated} onClick={copy}>Copy Markdown</button>
        <button type="button" className={labSecondaryClass} disabled={!state.draft.generated} onClick={() => exportFile("markdown")}>Download Markdown</button>
      </div>
    </div>
    <div className="mt-4 flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-4">
      <label htmlFor="workspace-import" className="text-sm font-semibold">Import JSON <span className="font-normal">(version 1, ≤256 KiB)</span></label>
      <input id="workspace-import" type="file" accept=".json,application/json" disabled={reading} onChange={importFile} className="min-w-0 max-w-full text-sm file:mr-3 file:cursor-pointer file:border file:border-[#b9b0a2] file:bg-transparent file:px-3 file:py-2 file:text-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lab-accent,#ac391f)]" aria-describedby="workspace-import-hint" />
    </div>
    <p id="workspace-import-hint" className="mt-2 text-xs leading-relaxed text-[#625a50]">JSON preserves input, edited Markdown, metric definitions, counts and notes. Imports are validated before replacement. Device storage is browser-local, not encrypted; do not include secrets or private customer records.</p>
    <div role="status" aria-live="polite" aria-atomic="true" className="mt-3 min-h-5 text-sm">
      {reading ? "Reading and validating the selected file locally…" : message && <p className={message.error ? "font-semibold text-[#9b2f1b]" : "text-[#51483e]"}>{message.text}</p>}
    </div>
  </section>;
}
