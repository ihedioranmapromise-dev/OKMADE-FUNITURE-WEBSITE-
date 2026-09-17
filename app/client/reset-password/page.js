"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ResetPassword() {
  const [token, setToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token || !newPassword || !confirmPassword) {
      setMessage("All fields are required.");
      return;
    }
    if (newPassword !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (newPassword.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const res = await fetch("/api/client/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setMessage("Password reset successfully! Redirecting to login...");
      setTimeout(() => router.push("/client/login"), 2000);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-2xl font-bold text-center text-amber-800 mb-4">Reset Password</h1>
        <p className="text-sm text-gray-600 text-center mb-6">Enter the reset code you received and your new password.</p>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Reset Code</label>
            <input type="text" value={token} onChange={(e) => setToken(e.target.value)} placeholder="e.g., 123456" className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">New Password</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={newPassword} onChange={(e) => setNewPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 pr-10" required />
              <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password</label>
            <div className="relative">
              <input type={showConfirm ? "text" : "password"} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 pr-10" required />
              <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700" onClick={() => setShowConfirm(!showConfirm)}>
                {showConfirm ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Resetting..." : "Reset Password"}
          </button>
          {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          <a href="/client/login" className="text-amber-600 hover:underline">← Back to Login</a>
        </p>
      </div>
    </div>
  );
}
