import { Resend } from "resend";
import type { ContactFormValues } from "./schemas/contact";

// Sends from Resend's shared testing address (no custom domain verified yet —
// see implementation-plan.md's Domain decision: subdomain now, custom domain
// later). replyTo is the visitor's address so replying goes straight to them.
//
// The client is constructed lazily, inside the request handler, rather than at module scope.
// `new Resend(undefined)` throws immediately, and Next evaluates route modules during the
// build's "collecting page data" step regardless of env vars being set yet — a module-scope
// client would fail the production build itself whenever RESEND_API_KEY isn't configured yet
// (e.g. before it's been added in the Vercel dashboard), not just fail at request time.
export function sendContactEmail({ name, email, message }: ContactFormValues) {
  const resend = new Resend(process.env.RESEND_API_KEY);
  return resend.emails.send({
    from: "Omar Reda Portfolio <onboarding@resend.dev>",
    to: process.env.CONTACT_TO_EMAIL as string,
    replyTo: email,
    subject: `Portfolio contact from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
}
