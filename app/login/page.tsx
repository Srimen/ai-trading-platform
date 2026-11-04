import type { Metadata } from "next";
import LoginForm from "@/components/LoginForm";

export const metadata: Metadata = {
  title: "Sign in | AI Trading Platform (Paper)",
};

export default function LoginPage() {
  return (
    <div className="mx-auto max-w-sm py-12">
      <h1 className="text-2xl font-semibold">Sign in to your paper account</h1>
      <p className="mt-1 text-sm text-muted">
        Practice trading and review portfolio risk without real money.
      </p>
      <div className="mt-6 rounded-lg border border-line bg-panel p-6">
        <LoginForm />
      </div>
    </div>
  );
}
