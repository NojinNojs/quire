import type { SupabaseClient } from "@supabase/supabase-js";
import { useEffect, useState } from "react";

export interface AuthMode {
  mode: "signin" | "signup";
  email: string;
  setEmail: React.Dispatch<React.SetStateAction<string>>;
  password: string;
  setPassword: React.Dispatch<React.SetStateAction<string>>;
  repeat: string;
  setRepeat: React.Dispatch<React.SetStateAction<string>>;
  message: string | null;
  failed: boolean;
  busy: boolean;
  switched: boolean;
  reveal: boolean;
  setReveal: React.Dispatch<React.SetStateAction<boolean>>;
  mismatch: boolean;
  strength: "Weak" | "Fair" | "Strong";
  switchMode: () => void;
  sendReset: () => Promise<void>;
  submit: (event: React.FormEvent) => Promise<void>;
}

export function passwordStrength(password: string): "Weak" | "Fair" | "Strong" {
  if (password.length < 8) return "Weak";
  const variety = [/[a-z]/, /[A-Z]/, /\d/, /[^a-zA-Z\d]/].filter((rule) =>
    rule.test(password),
  ).length;
  return password.length >= 12 && variety >= 3 ? "Strong" : "Fair";
}

function initialMode(): "signin" | "signup" {
  return new URLSearchParams(window.location.search).get("auth") === "signup" ? "signup" : "signin";
}

export function useAuthMode(client: SupabaseClient): AuthMode {
  const [mode, setMode] = useState(initialMode);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [repeat, setRepeat] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [switched, setSwitched] = useState(false);
  const [reveal, setReveal] = useState(false);
  const mismatch = mode === "signup" && repeat.length > 0 && repeat !== password;
  const strength = passwordStrength(password);

  useEffect(() => {
    const restore = () => {
      setMode(initialMode());
      setMessage(null);
      setFailed(false);
    };
    window.addEventListener("popstate", restore);
    return () => window.removeEventListener("popstate", restore);
  }, []);

  function switchMode() {
    if (busy) return;
    const next = mode === "signin" ? "signup" : "signin";
    const url = new URL(window.location.href);
    if (next === "signup") url.searchParams.set("auth", next);
    else url.searchParams.delete("auth");
    window.history.replaceState(null, "", url);
    setSwitched(true);
    setMode(next);
    setRepeat("");
    setFailed(false);
    setMessage(null);
  }

  async function sendReset() {
    if (busy) return;
    if (!email) {
      setFailed(true);
      setMessage("Enter your email address first, then ask for a reset link.");
      return;
    }
    setBusy(true);
    setFailed(false);
    setMessage(null);
    try {
      const { error } = await client.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: window.location.origin + window.location.pathname,
      });
      if (error) throw error;
      setMessage("Reset link sent. Open the link in your email to choose a new password.");
    } catch {
      setFailed(true);
      setMessage("Could not send a reset link. Check your connection and try again.");
    } finally {
      setBusy(false);
    }
  }

  async function submit(event: React.FormEvent) {
    event.preventDefault();
    if (busy || mismatch) return;
    setBusy(true);
    setMessage(null);
    setFailed(false);
    try {
      const result =
        mode === "signin"
          ? await client.auth.signInWithPassword({ email, password })
          : await client.auth.signUp({ email, password });
      if (result.error) {
        setBusy(false);
        setFailed(true);
        setMessage(result.error.message);
        return;
      }
      if (mode === "signup" && !result.data.session) {
        setBusy(false);
        setMessage("Check your email to confirm the account, then sign in.");
      }
      if (result.data.session) {
        const url = new URL(window.location.href);
        url.searchParams.delete("auth");
        window.history.replaceState(null, "", url);
      }
      // Keep the issuing state until the session listener mounts the shell.
    } catch {
      setBusy(false);
      setFailed(true);
      setMessage("Could not reach your account. Check your connection and try again.");
    }
  }

  return {
    mode,
    email,
    setEmail,
    password,
    setPassword,
    repeat,
    setRepeat,
    message,
    failed,
    busy,
    switched,
    reveal,
    setReveal,
    mismatch,
    strength,
    switchMode,
    sendReset,
    submit,
  };
}
