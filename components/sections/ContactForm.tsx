"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { CheckCircle2, AlertCircle } from "lucide-react";
import { contactFormSchema, type ContactFormValues } from "@/lib/schemas/contact";

type SubmitState = "idle" | "success" | "error";

const inputClass =
  "w-full rounded-[var(--radius-md)] border bg-surface px-4 py-3 text-body text-foreground placeholder:text-foreground-muted focus:outline-none focus:ring-2 focus:ring-accent";

export function ContactForm() {
  const [state, setState] = useState<SubmitState>("idle");
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<ContactFormValues>({
    resolver: zodResolver(contactFormSchema),
  });

  async function onSubmit(values: ContactFormValues) {
    setState("idle");
    try {
      const response = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!response.ok) throw new Error("Request failed");

      setState("success");
      reset();
    } catch {
      setState("error");
    }
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="flex flex-col gap-5">
      <div className="flex flex-col gap-2">
        <label htmlFor="name" className="text-small text-foreground-muted">
          Name
        </label>
        <input
          id="name"
          type="text"
          autoComplete="name"
          className={inputClass}
          style={{ borderColor: "var(--border)" }}
          aria-invalid={!!errors.name}
          aria-describedby={errors.name ? "name-error" : undefined}
          {...register("name")}
        />
        {errors.name && (
          <p id="name-error" className="flex items-center gap-1 text-small text-foreground">
            <AlertCircle size={14} aria-hidden />
            {errors.name.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="email" className="text-small text-foreground-muted">
          Email
        </label>
        <input
          id="email"
          type="email"
          autoComplete="email"
          className={inputClass}
          style={{ borderColor: "var(--border)" }}
          aria-invalid={!!errors.email}
          aria-describedby={errors.email ? "email-error" : undefined}
          {...register("email")}
        />
        {errors.email && (
          <p id="email-error" className="flex items-center gap-1 text-small text-foreground">
            <AlertCircle size={14} aria-hidden />
            {errors.email.message}
          </p>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <label htmlFor="message" className="text-small text-foreground-muted">
          Message
        </label>
        <textarea
          id="message"
          rows={5}
          className={inputClass}
          style={{ borderColor: "var(--border)" }}
          aria-invalid={!!errors.message}
          aria-describedby={errors.message ? "message-error" : undefined}
          {...register("message")}
        />
        {errors.message && (
          <p id="message-error" className="flex items-center gap-1 text-small text-foreground">
            <AlertCircle size={14} aria-hidden />
            {errors.message.message}
          </p>
        )}
      </div>

      <button type="submit" className="btn btn-primary self-start" disabled={isSubmitting}>
        {isSubmitting ? "Sending…" : "Send message"}
      </button>

      <div role="status" aria-live="polite">
        {state === "success" && (
          <p className="flex items-center gap-2 text-small text-foreground">
            <CheckCircle2 size={16} aria-hidden />
            Message sent — thanks, I&apos;ll get back to you soon.
          </p>
        )}
        {state === "error" && (
          <p className="flex items-center gap-2 text-small text-foreground">
            <AlertCircle size={16} aria-hidden />
            Something went wrong. Please email me directly instead.
          </p>
        )}
      </div>
    </form>
  );
}
