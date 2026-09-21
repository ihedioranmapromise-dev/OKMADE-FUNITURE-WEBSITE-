"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const email = searchParams.get("email") || "";
  const [code, setCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleVerify = async (e) => {
    e.preventDefault();
    if (!code.trim()) {
      setMessage("Enter the code from your email.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.verifyOtp({
        email,
        token: code.trim(),
        type: "signup",
      });
      if (error) throw error;
      router.push("/client/onboarding/profile-picture");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-amber-800 mb-4">Verify Your Email</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          We sent a 6-digit code to <strong>{email}</strong>. Enter it below to activate your account.
        </p>
        <form onSubmit={handleVerify} className="space-y-4">
          <input
            type="text"
            inputMode="numeric"
            maxLength={6}
            value={code}
            onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
            placeholder="123456"
            className="w-full text-center text-3xl tracking-[0.5em] p-4 border rounded-lg focus:ring-2 focus:ring-amber-500 font-mono"
            required
          />
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Verifying..." : "Verify Email"}
          </button>
          {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
        </form>
        <p className="text-center text-sm text-gray-500 mt-6">
          Didn't get the code? Check spam, or <a href="/client/signup" className="text-amber-600 hover:underline">sign up again</a>.
        </p>
      </div>
    </div>
  );
}

export default function VerifyEmail() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center">Loading...</div>}>
      <VerifyEmailContent />
    </Suspense>
  );
}
