"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ForgotPassword() {
  const [username, setUsername] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [resetToken, setResetToken] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username.trim()) {
      setMessage("Please enter your username.");
      return;
    }
    setLoading(true);
    setMessage("");
    setResetToken("");
    try {
      const res = await fetch("/api/client/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResetToken(data.token);
      setMessage("A reset code has been generated.");
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
        <p className="text-sm text-gray-600 text-center mb-6">Enter your username. We'll generate a reset code for you.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Generating..." : "Generate Reset Code"}
          </button>
          {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
          {resetToken && (
            <div className="bg-amber-50 border border-amber-200 p-4 rounded-lg text-center">
              <p className="text-sm text-gray-600">Your reset code:</p>
              <p className="text-2xl font-mono font-bold text-amber-700 tracking-widest">{resetToken}</p>
              <p className="text-xs text-gray-500 mt-2">This code expires in 15 minutes.</p>
              <a href="/client/reset-password" className="inline-block mt-3 text-amber-600 hover:underline text-sm">Go to Reset Password →</a>
            </div>
          )}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          <a href="/client/login" className="text-amber-600 hover:underline">← Back to Login</a>
        </p>
      </div>
    </div>
  );
}
