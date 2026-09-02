"use client";

import { useState } from "react";
import {
  auditRequestSchema,
  buildAuditMailto,
  buildAuditRequestText,
} from "@/lib/services/audit/offer";

interface AuditRequestFormProps {
  contactEmail: string | null;
}

export function AuditRequestForm({ contactEmail }: AuditRequestFormProps) {
  const [preparedRequest, setPreparedRequest] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [copyState, setCopyState] = useState<"idle" | "copied" | "failed">("idle");

  function prepareRequest(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPreparedRequest(null);
    setCopyState("idle");

    const data = new FormData(event.currentTarget);
    const parsed = auditRequestSchema.safeParse({
      requesterName: data.get("requesterName") ?? "",
      organization: data.get("organization") ?? "",
      surfaces: data.get("surfaces") ?? "",
      goal: data.get("goal") ?? "",
      permissionConfirmed: data.get("permissionConfirmed") === "on",
      metadataOnlyConfirmed: data.get("metadataOnlyConfirmed") === "on",
    });

    if (!parsed.success) {
      const nextErrors: Record<string, string> = {};
      for (const issue of parsed.error.issues) {
        const field = String(issue.path[0] ?? "form");
        if (!nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      return;
    }

    setErrors({});
    setPreparedRequest(buildAuditRequestText(parsed.data));
  }

  async function copyRequest() {
    if (!preparedRequest) return;
    try {
      await navigator.clipboard.writeText(preparedRequest);
      setCopyState("copied");
    } catch {
      setCopyState("failed");
    }
  }

  const mailto = contactEmail && preparedRequest ? buildAuditMailto(contactEmail, preparedRequest) : null;

  return (
    <div>
      <form onSubmit={prepareRequest} noValidate>
        {Object.keys(errors).length > 0 && (
          <div role="alert" className="mb-5 rounded-lg border border-red-200 bg-red-50 p-4 text-sm text-red-800">
            <p className="font-semibold">Please check the marked fields.</p>
            <ul className="mt-2 list-disc space-y-1 pl-5">
              {Object.entries(errors).map(([field, message]) => (
                <li key={field}>{message}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="grid gap-5 sm:grid-cols-2">
          <Field label="Your name (optional)" error={errors.requesterName}>
            <input
              id="requesterName"
              name="requesterName"
              maxLength={100}
              autoComplete="name"
              className={fieldClass(Boolean(errors.requesterName))}
            />
          </Field>

          <Field label="Organization or project" error={errors.organization} required>
            <input
              id="organization"
              name="organization"
              maxLength={120}
              autoComplete="organization"
              required
              aria-invalid={Boolean(errors.organization)}
              className={fieldClass(Boolean(errors.organization))}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field
            label="Public URLs or surface names"
            help="Up to three. Name a private surface without pasting its copy; we will agree a safer route first."
            error={errors.surfaces}
            required
          >
            <textarea
              id="surfaces"
              name="surfaces"
              rows={3}
              maxLength={600}
              required
              aria-invalid={Boolean(errors.surfaces)}
              placeholder={"https://example.com/pricing\nCheckout cancellation screen"}
              className={fieldClass(Boolean(errors.surfaces))}
            />
          </Field>
        </div>

        <div className="mt-5">
          <Field
            label="What do you want to improve?"
            help="Describe the outcome, not confidential copy or customer information."
            error={errors.goal}
            required
          >
            <textarea
              id="goal"
              name="goal"
              rows={3}
              maxLength={500}
              required
              aria-invalid={Boolean(errors.goal)}
              placeholder="Make our pricing page clear without accidental urgency."
              className={fieldClass(Boolean(errors.goal))}
            />
          </Field>
        </div>

        <div className="mt-5 space-y-3 rounded-xl border border-neutral-200 bg-neutral-50 p-4">
          <CheckField name="permissionConfirmed" error={errors.permissionConfirmed}>
            I control this copy or have permission to request its audit.
          </CheckField>
          <CheckField name="metadataOnlyConfirmed" error={errors.metadataOnlyConfirmed}>
            This request contains no private copy, credentials, customer records, or other personal data.
          </CheckField>
        </div>

        <button
          type="submit"
          className="mt-5 rounded-lg bg-neutral-900 px-5 py-2.5 font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
        >
          Prepare request
        </button>
        <p className="mt-2 text-xs leading-relaxed text-neutral-500">
          Preparing a request does not send, store, reserve, or purchase anything.
        </p>
      </form>

      {preparedRequest && (
        <section aria-live="polite" className="mt-7 rounded-xl border border-emerald-200 bg-emerald-50/60 p-5">
          <h3 className="font-semibold text-emerald-950">Review your request</h3>
          <p className="mt-1 text-sm leading-relaxed text-emerald-900/80">
            This draft was assembled in your browser. The site has not received or stored it.
          </p>
          <pre className="mt-4 max-h-80 overflow-auto whitespace-pre-wrap break-words rounded-lg border border-emerald-200 bg-white p-4 text-xs leading-relaxed text-neutral-700">
            {preparedRequest}
          </pre>
          <div className="mt-4 flex flex-wrap gap-3">
            {mailto ? (
              <a
                href={mailto}
                className="rounded-lg bg-neutral-900 px-4 py-2 text-sm font-medium text-white hover:bg-neutral-700 focus:outline-none focus:ring-2 focus:ring-neutral-900/30"
              >
                Open email draft
              </a>
            ) : (
              <span className="rounded-lg border border-amber-300 bg-amber-50 px-4 py-2 text-sm text-amber-900">
                Email intake is not configured yet
              </span>
            )}
            <button
              type="button"
              onClick={copyRequest}
              className="rounded-lg border border-neutral-300 bg-white px-4 py-2 text-sm font-medium text-neutral-800 hover:border-neutral-500 focus:outline-none focus:ring-2 focus:ring-neutral-900/20"
            >
              Copy request
            </button>
          </div>
          {copyState === "copied" && <p className="mt-2 text-sm text-emerald-800">Copied.</p>}
          {copyState === "failed" && (
            <p role="alert" className="mt-2 text-sm text-red-700">
              Your browser blocked clipboard access. Select and copy the draft above instead.
            </p>
          )}
          <p className="mt-3 text-xs leading-relaxed text-neutral-600">
            Opening the draft still sends nothing automatically. Review the recipient and contents in your email app before choosing Send.
          </p>
        </section>
      )}
    </div>
  );
}

function Field({
  label,
  help,
  error,
  required,
  children,
}: {
  label: string;
  help?: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  const id = childId(children);
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-neutral-800">
        {label} {required && <span className="text-neutral-500">(required)</span>}
      </label>
      {help && <p className="mt-1 text-xs leading-relaxed text-neutral-500">{help}</p>}
      <div className="mt-2">{children}</div>
      {error && <p className="mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function CheckField({ name, error, children }: { name: string; error?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="flex items-start gap-3 text-sm leading-relaxed text-neutral-700">
        <input
          type="checkbox"
          name={name}
          aria-invalid={Boolean(error)}
          className="mt-1 h-4 w-4 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-800"
        />
        <span>{children}</span>
      </label>
      {error && <p className="ml-7 mt-1 text-xs text-red-700">{error}</p>}
    </div>
  );
}

function fieldClass(hasError: boolean): string {
  return `w-full rounded-lg border bg-white p-3 text-sm leading-relaxed text-neutral-900 focus:outline-none focus:ring-2 ${
    hasError
      ? "border-red-400 focus:border-red-600 focus:ring-red-600/20"
      : "border-neutral-300 focus:border-neutral-800 focus:ring-neutral-800/20"
  }`;
}

function childId(children: React.ReactNode): string | undefined {
  if (typeof children !== "object" || children === null || !("props" in children)) return undefined;
  const props = (children as React.ReactElement<{ id?: string }>).props;
  return props.id;
}
