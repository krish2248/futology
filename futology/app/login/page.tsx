"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Mail, ArrowRight, CheckCircle2, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useSession } from "@/lib/store/session";
import { cn } from "@/lib/utils/cn";

type Step = "form" | "sent" | "ready";

export default function LoginPage() {
  const router = useRouter();
  const signIn = useSession((s) => s.signIn);
  const onboardingComplete = useSession((s) => s.onboardingComplete);

  const [email, setEmail] = useState("");
  const [step, setStep] = useState<Step>("form");
  const [pending, startTransition] = useTransition();

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!isValidEmail(email)) return;
    startTransition(() => {
      // Demo: pretend we sent an email. In Phase 1.5 this calls Supabase auth.signInWithOtp.
      setTimeout(() => setStep("sent"), 600);
    });
  }

  function handleContinue() {
    signIn(email);
    setStep("ready");
    // Tiny pause so the success animation reads
    setTimeout(() => {
      router.push(onboardingComplete ? "/" : "/onboarding");
    }, 400);
  }

  return (
    <div className="grid min-h-[calc(100vh-3.5rem)] place-items-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <Link
            href="/"
            className="inline-flex items-center gap-2 text-base font-semibold tracking-tight"
            aria-label="FUTOLOGY home"
          >
            <span
              aria-hidden
              className="grid h-8 w-8 place-items-center rounded-lg bg-accent text-bg-primary"
            >
              <span className="text-sm font-black">F</span>
            </span>
            FUTOLOGY
          </Link>
          <p className="mt-3 text-sm text-text-secondary">
            Sign in with your email. No password required.
          </p>
        </div>

        <div className="surface relative overflow-hidden p-6 md:p-8">
          <div
            aria-hidden
            className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-accent/10 blur-3xl"
          />
          <div className="relative">
            <span className="inline-flex items-center gap-1.5 rounded-full border border-accent/30 bg-accent-muted px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-accent">
              <Sparkles className="h-3 w-3" aria-hidden /> Demo mode
            </span>

            <AnimatePresence mode="wait">
              {step === "form" ? (
                <motion.form
                  key="form"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  onSubmit={handleSubmit}
                  className="mt-4 space-y-4"
                >
                  <h1 className="text-xl font-semibold tracking-tight">
                    Welcome back
                  </h1>
                  <p className="text-sm text-text-secondary">
                    Enter any email to continue. Real Supabase email-OTP wires
                    up in Phase 1.5 of the build plan.
                  </p>
                  <label className="block">
                    <span className="text-xs uppercase tracking-wider text-text-secondary">
                      Email
                    </span>
                    <div className="mt-1 flex items-center gap-2 rounded-lg border border-border-strong bg-bg-elevated px-3 py-2 transition-colors focus-within:border-accent/60">
                      <Mail
                        className="h-4 w-4 text-text-muted"
                        aria-hidden
                      />
                      <input
                        autoFocus
                        type="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        className="flex-1 bg-transparent text-sm text-text-primary outline-none placeholder:text-text-muted"
                        aria-label="Email address"
                      />
                    </div>
                  </label>
                  <button
                    type="submit"
                    disabled={!isValidEmail(email) || pending}
                    className={cn(
                      "inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover",
                      "disabled:cursor-not-allowed disabled:opacity-50",
                    )}
                  >
                    {pending ? "Sending…" : "Send magic link"}
                    {!pending ? (
                      <ArrowRight className="h-4 w-4" aria-hidden />
                    ) : null}
                  </button>
                  <p className="text-center text-xs text-text-muted">
                    By continuing you agree to play nice with football data.
                  </p>
                </motion.form>
              ) : null}

              {step === "sent" ? (
                <motion.div
                  key="sent"
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -8 }}
                  transition={{ duration: 0.18, ease: "easeOut" }}
                  className="mt-4 space-y-4"
                >
                  <div className="flex items-start gap-3">
                    <div
                      aria-hidden
                      className="grid h-10 w-10 place-items-center rounded-lg bg-accent-muted text-accent"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </div>
                    <div>
                      <h2 className="font-semibold">Check your inbox</h2>
                      <p className="mt-1 text-sm text-text-secondary">
                        We sent a magic link to{" "}
                        <span className="font-medium text-text-primary">
                          {email}
                        </span>
                        . Click it, or continue here in demo mode.
                      </p>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleContinue}
                    className="inline-flex w-full items-center justify-center gap-1.5 rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-bg-primary transition-colors hover:bg-accent-hover"
                  >
                    Continue in demo mode
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep("form")}
                    className="block w-full rounded-lg px-4 py-2 text-center text-xs text-text-secondary transition-colors hover:text-text-primary"
                  >
                    Use a different email
                  </button>
                </motion.div>
              ) : null}

              {step === "ready" ? (
                <motion.div
                  key="ready"
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.2, ease: "easeOut" }}
                  className="mt-4 flex flex-col items-center gap-3 py-4 text-center"
                >
                  <div
                    aria-hidden
                    className="grid h-12 w-12 place-items-center rounded-full bg-accent-muted text-accent"
                  >
                    <CheckCircle2 className="h-6 w-6" />
                  </div>
                  <p className="font-medium">Signed in</p>
                  <p className="text-sm text-text-secondary">
                    Taking you to{" "}
                    {onboardingComplete ? "your feed" : "onboarding"}…
                  </p>
                </motion.div>
              ) : null}
            </AnimatePresence>
          </div>
        </div>

        <p className="mt-6 text-center text-xs text-text-muted">
          Already onboarded?{" "}
          <Link
            href="/"
            className="text-text-secondary transition-colors hover:text-text-primary"
          >
            Browse as guest
          </Link>
        </p>
      </div>
    </div>
  );
}

function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}
