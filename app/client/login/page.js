"use client";
import { useState } from "react";
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
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

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
      // Store client in sessionStorage (simple session)
      sessionStorage.setItem("clientId", client.id);
      sessionStorage.setItem("clientUsername", client.username);
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
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Logging in..." : "Log In"}
          </button>
          {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          No account? <a href="/client/signup" className="text-amber-600 hover:underline">Sign up</a>
        </p>
      </div>
    </div>
  );
}
