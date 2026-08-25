"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, X } from "lucide-react";
import { Container } from "./Container";
import { ThemeToggle } from "./ThemeToggle";

// Route-absolute so these still resolve correctly when clicked from a route
// other than "/" (e.g. a 404 page) — a bare "#about" resolves against the
// current path instead of the homepage and silently breaks there. `id` is
// the section id scrollspy watches, kept separate from `href` since the
// href also carries the "/" prefix.
const navItems = [
  { label: "About", href: "/#about", id: "about" },
  { label: "Tech Stack", href: "/#tech-stack", id: "tech-stack" },
  { label: "Work", href: "/#projects", id: "projects" },
  { label: "Experience", href: "/#experience", id: "experience" },
  { label: "Contact", href: "/#contact", id: "contact" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const [activeId, setActiveId] = useState<string | null>(null);
  const pathname = usePathname();
  const isActive = (id: string) => pathname === "/" && activeId === id;

  // Scrollspy: keep the nav link for whichever section is passing through
  // the "reading band" near the top of the viewport highlighted the same
  // way :hover would, so the current section stays legible while scrolling —
  // not just at the moment of clicking. Only the homepage has these section
  // ids, so skip the observer elsewhere.
  useEffect(() => {
    if (pathname !== "/") return;

    const sections = navItems
      .map((item) => document.getElementById(item.id))
      .filter((el): el is HTMLElement => el !== null);
    if (sections.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) setActiveId(entry.target.id);
        }
      },
      // Counts a section "current" once it crosses the upper-middle band of
      // the viewport, rather than requiring the whole section to be visible.
      { rootMargin: "-40% 0px -55% 0px", threshold: 0 },
    );
    sections.forEach((section) => observer.observe(section));
    return () => observer.disconnect();
  }, [pathname]);

  // Escape closes the mobile menu from anywhere — required for a non-trapping,
  // fully keyboard-operable nav (Phase 4 acceptance criteria).
  useEffect(() => {
    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, []);

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <header
      className="sticky top-0 z-50 border-b bg-background/90 backdrop-blur"
      style={{ borderColor: "var(--border)" }}
    >
      <Container className="flex items-center justify-between py-4">
        <Link href="/" className="font-display text-h3" onClick={() => setOpen(false)}>
          OR
        </Link>

        <nav className="hidden items-center gap-8 md:flex" aria-label="Primary">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={`nav-link${isActive(item.id) ? " active" : ""}`}
              aria-current={isActive(item.id) ? "location" : undefined}
              onClick={() => setActiveId(item.id)}
            >
              {item.label}
            </Link>
          ))}
          <Link
            href="/resume"
            className={`btn btn-secondary${pathname === "/resume" ? " active" : ""}`}
            aria-current={pathname === "/resume" ? "page" : undefined}
          >
            Resume
          </Link>
          <ThemeToggle />
        </nav>

        <div className="flex items-center gap-3 md:hidden">
          <ThemeToggle />
          <button
            type="button"
            className="nav-link inline-flex h-11 w-11 items-center justify-center"
            aria-expanded={open}
            aria-controls="mobile-nav"
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X size={22} aria-hidden /> : <Menu size={22} aria-hidden />}
            <span className="sr-only">{open ? "Close menu" : "Open menu"}</span>
          </button>
        </div>
      </Container>

      {open && (
        <nav
          id="mobile-nav"
          aria-label="Mobile"
          className="border-t md:hidden"
          style={{ borderColor: "var(--border)" }}
        >
          <Container className="flex flex-col gap-1 py-4">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`nav-link flex items-center py-3${isActive(item.id) ? " active" : ""}`}
                aria-current={isActive(item.id) ? "location" : undefined}
                onClick={() => {
                  setActiveId(item.id);
                  setOpen(false);
                }}
              >
                {item.label}
              </Link>
            ))}
            <Link
              href="/resume"
              className={`btn btn-secondary mt-2 self-start${pathname === "/resume" ? " active" : ""}`}
              aria-current={pathname === "/resume" ? "page" : undefined}
              onClick={() => setOpen(false)}
            >
              Resume
            </Link>
          </Container>
        </nav>
      )}
    </header>
  );
}
