"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientLogin() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  useEffect(() => {
    // Auto-fill username if "Remember Me" was checked last time
    const savedUsername = localStorage.getItem("rememberedUsername");
    if (savedUsername) {
      setUsername(savedUsername);
      setRememberMe(true);
    }
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!username || !password) {
      setMessage("Username and password are required.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      const { data: client, error } = await supabase
        .from("clients")
        .select("*")
        .eq("username", username)
        .single();
      if (error || !client) {
        setMessage("Invalid username or password.");
        setLoading(false);
        return;
      }
      const isValid = bcrypt.compareSync(password, client.password_hash);
      if (!isValid) {
        setMessage("Invalid username or password.");
        setLoading(false);
        return;
      }
      // Store client in sessionStorage
      sessionStorage.setItem("clientId", client.id);
      sessionStorage.setItem("clientUsername", client.username);

      // Remember me: save username to localStorage
      if (rememberMe) {
        localStorage.setItem("rememberedUsername", username);
      } else {
        localStorage.removeItem("rememberedUsername");
      }

      router.push("/client/dashboard");
    } catch (err) {
      setMessage("Error: " + err.message);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-amber-800 mb-6 font-['Dancing_Script',_cursive]">Welcome Back</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username</label>
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <div className="relative">
              <input
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 pr-10"
                required
              />
              <button
                type="button"
                className="absolute inset-y-0 right-3 flex items-center text-gray-500 hover:text-gray-700"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? "👁️" : "👁️‍🗨️"}
              </button>
            </div>
          </div>
          <div className="flex items-center justify-between">
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="rounded border-gray-300 text-amber-600 focus:ring-amber-500"
              />
              Remember me
            </label>
            {/* Forgot password link */}
            <a href="/client/forgot-password" className="text-sm text-amber-600 hover:underline">
              Forgot password?
            </a>
          </div>
          <button
            type="submit"
            disabled={loading}
            className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50"
          >
            {loading ? "Logging in..." : "Log In"}
          </button>
          {message && (
            <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>
              {message}
            </p>
          )}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          No account? <a href="/client/signup" className="text-amber-600 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}