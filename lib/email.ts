// A plain `mailto:` link silently does nothing for a visitor with no default mail client
// registered at the OS level (common on machines that only use webmail) — Chrome just no-ops.
// Gmail's compose URL works in any browser regardless of local mail-client configuration, so it
// reliably "does something" for every visitor. The contact address is a Gmail address, so this
// is a safe assumption here (content/contact.ts).
export function gmailComposeUrl(email: string): string {
  return `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}`;
}
