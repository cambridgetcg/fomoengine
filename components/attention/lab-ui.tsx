import type { ReactNode } from "react";

export const labInputClass = "w-full min-w-0 rounded-none border border-[var(--lab-line,#b9b0a2)] bg-white/60 px-3 py-2.5 text-base leading-relaxed text-[var(--lab-ink,#211e19)] placeholder:text-[#71695f] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[var(--lab-accent,#ac391f)] disabled:opacity-60";
export const labButtonClass = "inline-flex min-h-11 items-center justify-center gap-2 border border-transparent bg-[var(--lab-accent,#ac391f)] px-5 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-[#852b19] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lab-accent,#ac391f)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
export const labSecondaryClass = "inline-flex min-h-11 items-center justify-center border border-[var(--lab-line,#b9b0a2)] px-4 py-2 text-sm font-medium text-[var(--lab-ink,#211e19)] transition-colors hover:bg-black/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lab-accent,#ac391f)] disabled:cursor-not-allowed disabled:opacity-50 motion-reduce:transition-none";
export const labLinkClass = "underline decoration-[var(--lab-accent,#ac391f)] underline-offset-4 hover:text-[var(--lab-accent,#ac391f)] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-[var(--lab-accent,#ac391f)]";

export function LabSectionHeading({ number, title, children }: { number: string; title: string; children?: ReactNode }) {
  return <header className="mb-6 border-t border-[var(--lab-ink,#211e19)] pt-5">
    <p className="mb-2 font-mono text-xs uppercase tracking-[0.16em] text-[var(--lab-accent,#ac391f)]">{number} / Working notes</p>
    <h2 className="text-3xl leading-tight [font-family:var(--font-editorial,Georgia,serif)]">{title}</h2>
    {children && <div className="mt-3 max-w-3xl text-sm leading-relaxed text-[#625a50]">{children}</div>}
  </header>;
}

export function LabField({ id, label, hint, children }: { id: string; label: string; hint?: string; children: ReactNode }) {
  return <div className="min-w-0 space-y-2">
    <label htmlFor={id} className="block text-sm font-semibold">{label}</label>
    {children}
    {hint && <p id={`${id}-hint`} className="text-sm leading-relaxed text-[#625a50]">{hint}</p>}
  </div>;
}
