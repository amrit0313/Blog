"use client";

import Link from "next/link";
import { FormEvent, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Button from "../../../../components/ui/Button";
import Navbar from "../../../../components/navbar/Navbar";
import { authApi } from "../../../../lib/api";

export default function ResetPasswordPage() {
  const router = useRouter();
  const { token } = useParams<{ token: string }>();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !password || !confirmPassword) {
      setError("Complete all fields to reset your password.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.resetPassword({
        email: email.trim(),
        password,
        token,
      });
      router.push("/login?reset=success");
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to reset your password. Please try again.",
      );
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
            <p className="eyebrow">Account security</p>
            <h1 className="mt-3 text-3xl">Reset your password</h1>
            <p className="mt-3">
              Create a new password to get back to your stories.
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
                className="w-full px-3 py-3"
                required
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                New password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder="Create a new password"
                autoComplete="new-password"
                className="w-full px-3 py-3"
                required
              />
            </div>

            <div>
              <label
                htmlFor="confirm-password"
                className="mb-2 block text-sm font-semibold text-foreground"
              >
                Confirm password
              </label>
              <input
                id="confirm-password"
                name="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
                placeholder="Confirm your new password"
                autoComplete="new-password"
                className="w-full px-3 py-3"
                required
              />
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
              {isSubmitting ? "Resetting password..." : "Reset password"}
            </Button>
          </form>

          <p className="mt-6 text-center text-sm">
            Remembered your password?{" "}
            <Link
              href="/login"
              className="font-semibold no-underline hover:underline"
            >
              Log in
            </Link>
          </p>
        </section>
      </main>
    </>
  );
}
