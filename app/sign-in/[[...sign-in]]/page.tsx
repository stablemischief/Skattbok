"use client";

import { SignIn } from "@clerk/nextjs";

export default function SignInPage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-norse-bg px-4">
      <h1 className="mb-8 text-4xl font-bold text-norse-gold">Skattbók</h1>
      <p className="mb-6 text-norse-text-muted">Record the Spoils</p>
      <SignIn />
    </div>
  );
}
