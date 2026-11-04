"use client";

import { useActionState, useState } from "react";
import { signIn, signUp } from "@/app/auth/actions";
import type { AuthState } from "@/lib/types";

const initialState: AuthState = { error: null, message: null };

const inputClass =
  "w-full rounded-md border border-line bg-ink px-3 py-2 text-text focus:outline-none focus-visible:ring-2 focus-visible:ring-paper";

export default function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signingIn] = useActionState(signIn, initialState);
  const [signUpState, signUpAction, signingUp] = useActionState(signUp, initialState);

  const isSignUp = mode === "signup";
  const state = isSignUp ? signUpState : signInState;
  const pending = signingIn || signingUp;

  return (
    <form action={isSignUp ? signUpAction : signInAction} className="space-y-4">
      <div className="space-y-1">
        <label htmlFor="email" className="text-sm text-muted">
          Email
        </label>
        <input id="email" name="email" type="email" autoComplete="email" required className={inputClass} />
      </div>

      <div className="space-y-1">
        <label htmlFor="password" className="text-sm text-muted">
          Password
        </label>
        <input
          id="password"
          name="password"
          type="password"
          autoComplete={isSignUp ? "new-password" : "current-password"}
          minLength={isSignUp ? 8 : undefined}
          required
          className={inputClass}
        />
      </div>

      {state.error && (
        <p role="alert" className="text-sm text-danger">
          {state.error}
        </p>
      )}
      {state.message && <p className="text-sm text-fresh">{state.message}</p>}

      <button
        type="submit"
        disabled={pending}
        className="w-full rounded-md bg-paper px-4 py-2 font-medium text-ink disabled:opacity-60 focus:outline-none focus-visible:ring-2 focus-visible:ring-text"
      >
        {pending ? "Please wait…" : isSignUp ? "Create account" : "Sign in"}
      </button>

      <button
        type="button"
        onClick={() => setMode(isSignUp ? "signin" : "signup")}
        className="w-full text-sm text-muted underline-offset-4 hover:underline"
      >
        {isSignUp ? "Already have an account? Sign in" : "New here? Create an account"}
      </button>
    </form>
  );
}

