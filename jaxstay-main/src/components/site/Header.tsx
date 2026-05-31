import { Link } from "@tanstack/react-router";
import { useState } from "react";
import { Menu, X, LayoutDashboard } from "lucide-react";
import { Logo } from "./Logo";
import { useAuth } from "@/hooks/use-auth";

const nav = [
  { to: "/sitters", label: "Find a Sitter" },
  { to: "/become-a-sitter", label: "Become a Sitter" },
  { to: "/how-it-works", label: "How it Works" },
  { to: "/about", label: "About" },
];

export function Header() {
  const [open, setOpen] = useState(false);
  const { user, loading } = useAuth();

  return (
    <header className="sticky top-0 z-40 border-b border-border/60 bg-background/80 backdrop-blur-md">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Logo />

        <nav className="hidden items-center gap-8 md:flex">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="text-sm font-500 text-foreground/80 transition-colors hover:text-foreground"
              activeProps={{ className: "text-foreground font-600" }}
            >
              {n.label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          {!loading && user ? (
            <Link
              to="/dashboard"
              className="flex items-center gap-2 rounded-full bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
            >
              <LayoutDashboard className="h-4 w-4" /> Dashboard
            </Link>
          ) : (
            <>
              <Link
                to="/login"
                className="text-sm font-500 text-foreground/80 hover:text-foreground"
              >
                Log in
              </Link>

              <Link
                to="/login"
                search={{ mode: "signup" }}
                className="rounded-full bg-primary px-5 py-2.5 text-sm font-600 text-primary-foreground shadow-soft transition-transform hover:scale-[1.03]"
              >
                Sign up
              </Link>
            </>
          )}
        </div>

        <button
          className="flex h-10 w-10 items-center justify-center rounded-full text-foreground hover:bg-muted md:hidden"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
        </button>
      </div>

      {open && (
        <div className="fixed inset-x-0 top-16 bottom-0 z-50 flex flex-col border-t border-border/60 bg-background md:hidden">
          <div className="flex flex-1 flex-col overflow-y-auto px-4 py-6">
            <div className="space-y-1">
              {nav.map((n) => (
                <Link
                  key={n.to}
                  to={n.to}
                  onClick={() => setOpen(false)}
                  className="flex rounded-xl px-4 py-3 text-lg font-600 text-foreground transition-colors hover:bg-muted"
                  activeProps={{ className: "bg-primary/5 text-primary" }}
                >
                  {n.label}
                </Link>
              ))}
            </div>

            <div className="mt-auto border-t border-border/60 pt-6 pb-8">
              {!loading && user ? (
                <Link
                  to="/dashboard"
                  onClick={() => setOpen(false)}
                  className="flex w-full items-center justify-center gap-2 rounded-2xl bg-primary px-5 py-4 text-base font-600 text-primary-foreground shadow-soft"
                >
                  <LayoutDashboard className="h-5 w-5" /> Go to Dashboard
                </Link>
              ) : (
                <div className="grid gap-3">
                  <Link
                    to="/login"
                    onClick={() => setOpen(false)}
                    className="flex w-full items-center justify-center rounded-2xl bg-primary px-5 py-4 text-base font-600 text-primary-foreground shadow-soft"
                  >
                    Log in / Sign up
                  </Link>
                  <p className="text-center text-xs text-muted-foreground">
                    Trusted by 240,000+ dog parents.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </header>
  );
}