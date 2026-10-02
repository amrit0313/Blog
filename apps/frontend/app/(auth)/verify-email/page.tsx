"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import Navbar from "../../../components/navbar/Navbar";
import { authApi } from "../../../lib/api";

type VerificationState = "verifying" | "success" | "error";

export default function VerifyEmailPage() {
  const [state, setState] = useState<VerificationState>("verifying");
  const verificationRequest = useRef<Promise<{ message?: string }> | null>(null);

  useEffect(() => {
    const token = new URLSearchParams(window.location.search).get("token");
    if (!token) {
      setState("error");
      return;
    }

    verificationRequest.current ??= authApi.verifyEmail(token);
    void verificationRequest.current.then(
      () => setState("success"),
      () => setState("error"),
    );
  }, []);

  const message = {
    verifying: "Verifying your email...",
    success: "Your email is verified. You can now log in.",
    error: "This verification link is invalid or has expired.",
  }[state];

  return (
    <>
      <Navbar />
      <main className="flex min-h-full flex-1 items-center justify-center px-6 py-12">
        <section className="card w-full max-w-md space-y-5 p-6 text-center sm:p-8">
          <h1 className="text-2xl font-semibold">Email verification</h1>
          <p role="status">{message}</p>
          {state !== "verifying" && (
            <Link href="/login" className="font-semibold no-underline hover:underline">
              Continue to login
            </Link>
          )}
        </section>
      </main>
    </>
  );
}