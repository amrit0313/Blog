"use client";

import Link from "next/link";
import Button from "../../../components/ui/Button";
import Navbar from "../../../components/navbar/Navbar";
import { useAuth } from "../../../context/AuthContext";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "../../../lib/api";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");

  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError("");

    if (!email.trim()) {
      setError("Enter your email to continue.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setError("Enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    try {
      await authApi.forgotPassword({email: email.trim()});
    } catch (submitError) {
      setError(
        submitError instanceof Error
          ? submitError.message
          : "Unable to log in. Please try again.",
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
            <h1 className="mt-3 text-3xl">Enter you email</h1>
            <p className="mt-3">
              We'll send you reset link on the mail you provide.
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
                placeholder="you@gmail.com"
                autoComplete="email"
                aria-invalid={Boolean(error)}
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
              {isSubmitting ? "Requesting..." : "Forget password"}
            </Button>
          </form>
        </section>
      </main>
    </>
  );
}
