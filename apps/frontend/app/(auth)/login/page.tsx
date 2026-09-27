"use client";

import Link from "next/link";
import Button from "../../../components/ui/Button";
import Navbar from "../../../components/navbar/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { getErrorMessage } from "../../../lib/toast";

export default function LoginPage() {
  const router = useRouter();
  const { login } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password) {
      setError("Enter your email and password to continue.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await login({ email: email.trim(), password });
      router.push("/blogs");
    } catch (submitError) {
      toast.error(getErrorMessage(submitError, "Unable to log in."));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <>
      <Navbar />
      <main className="flex min-h-full flex-1 items-center justify-center px-6 py-12 sm:py-20">
        <section className="w-full max-w-md">
          <div className="mb-8 text-center">
            <p className="eyebrow">Welcome back</p>
            <h1 className="mt-3 text-3xl">Log in to your account</h1>
            <p className="mt-3">
              Log in to continue writing and discovering stories.
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="card space-y-5 p-6 sm:p-8"
            noValidate
          >
            <div>
              <label
                htmlFor="email"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                placeholder="you@example.com"
                autoComplete="email"
                aria-invalid={Boolean(error)}
                className="w-full px-3 py-3"
                required
              />
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-4">
                <label
                  htmlFor="password"
                  className="block text-sm font-semibold text-foreground"
                >
                  Password
                </label>
                <Link
                  href="/forgot-password"
                  className="text-sm text-muted-foreground hover:text-primary"
                >
                  Forgot password?
                </Link>
              </div>
              <div className="relative">
                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  aria-invalid={Boolean(error)}
                  className="w-full px-3 py-3 pr-20"
                  required
                />
                <Button
                  type="button"
                  variant="ghost"
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-muted-foreground hover:text-primary"
                  aria-label={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "Hide" : "Show"}
                </Button>
              </div>
            </div>

            {error && (
              <p
                role="alert"
                className="rounded-md border border-primary/30 bg-secondary px-3 py-2 text-sm text-secondary-foreground"
              >
                {error}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSubmitting}
              className="w-full rounded-md px-4 py-3 font-semibold shadow-sm"
            >
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="font-semibold no-underline hover:underline"
            >
              Get Started
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
