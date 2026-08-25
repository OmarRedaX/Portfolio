import { Resend } from "resend";
import type { ContactFormValues } from "./schemas/contact";

const resend = new Resend(process.env.RESEND_API_KEY);

// Sends from Resend's shared testing address (no custom domain verified yet —
// see implementation-plan.md's Domain decision: subdomain now, custom domain
// later). replyTo is the visitor's address so replying goes straight to them.
export function sendContactEmail({ name, email, message }: ContactFormValues) {
  return resend.emails.send({
    from: "Omar Reda Portfolio <onboarding@resend.dev>",
    to: process.env.CONTACT_TO_EMAIL as string,
    replyTo: email,
    subject: `Portfolio contact from ${name}`,
    text: `From: ${name} <${email}>\n\n${message}`,
  });
}
