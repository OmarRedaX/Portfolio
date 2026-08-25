import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";

function slugify(children: ReactNode): string {
  return String(children)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

// Maps raw markdown output to the site's design tokens so case-study prose
// (content/case-studies/quick-bite.mdx) reads as part of the same system as
// the hand-built sections, not generic browser-default markdown.
const components: MDXComponents = {
  h2: ({ children }) => (
    <h2
      id={slugify(children)}
      className="font-display text-h2 border-t pt-8"
      style={{ borderColor: "var(--border)" }}
    >
      {children}
    </h2>
  ),
  p: ({ children }) => <p className="text-body-lg text-foreground-muted">{children}</p>,
  ul: ({ children }) => (
    <ul className="flex flex-col gap-2 list-disc pl-5 text-body-lg text-foreground-muted">
      {children}
    </ul>
  ),
  li: ({ children }) => <li>{children}</li>,
  strong: ({ children }) => <strong className="font-semibold text-foreground">{children}</strong>,
  code: ({ children }) => (
    <code
      className="rounded-[var(--radius-sm)] border px-1.5 py-0.5 font-mono text-mono"
      style={{ borderColor: "var(--border)", background: "var(--surface)" }}
    >
      {children}
    </code>
  ),
};

export function useMDXComponents(): MDXComponents {
  return components;
}
