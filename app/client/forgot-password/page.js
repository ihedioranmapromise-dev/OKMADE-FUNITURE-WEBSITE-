"use client";
import { useState } from "react";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [sent, setSent] = useState(false);
  const supabase = createSupabaseBrowser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      setMessage("Please enter your email.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/client/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      setMessage("A password reset link has been sent to your email.");
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-amber-800 mb-4">Forgot Password</h1>
        <p className="text-sm text-gray-600 text-center mb-6">
          Enter your email. We'll send you a link to reset your password.
        </p>
        {!sent ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
            >
              {loading ? "Sending..." : "Send Reset Link"}
            </button>
            {message && (
              <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>
                {message}
              </p>
            )}
          </form>
        ) : (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 text-center">
            <p className="text-sm text-gray-700">
              Check your inbox at <strong>{email}</strong>. Click the link in the email to reset your password.
            </p>
            <p className="text-xs text-gray-500 mt-3">
              Didn't get it? Check spam or{" "}
              <button onClick={() => setSent(false)} className="text-amber-600 hover:underline">
                try again
              </button>
              .
            </p>
          </div>
        )}
        <p className="text-center text-sm text-gray-600 mt-4">
          <a href="/client/login" className="text-amber-600 hover:underline">← Back to Login</a>
        </p>
      </div>
    </div>
  );
}
