"use client";
import { useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";
import bcrypt from "bcryptjs"; // You'll need to install: npm install bcryptjs

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function ClientSignup() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
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
      // Check if username already exists
      const { data: existing, error: checkError } = await supabase
        .from("clients")
        .select("id")
        .eq("username", username)
        .single();
      if (existing) {
        setMessage("Username already taken.");
        setLoading(false);
        return;
      }
      // Hash password
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(password, salt);
      // Insert client
      const { error: insertError } = await supabase.from("clients").insert([
        {
          username,
          password_hash: hash,
          display_name: displayName || username,
          phone,
          email,
        },
      ]);
      if (insertError) throw insertError;
      setMessage("Account created! Please log in.");
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
        <h1 className="text-3xl font-bold text-center text-amber-800 mb-6 font-['Dancing_Script',_cursive]">Join OKMADE</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Username *</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Display Name</label>
            <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone (for verification)</label>
            <input type="text" value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email (optional)</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500" />
          </div>
          <button type="submit" disabled={loading} className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg transition disabled:opacity-50">
            {loading ? "Creating..." : "Create Account"}
          </button>
          {message && <p className={`text-center text-sm ${message.includes("Error") ? "text-red-500" : "text-green-600"}`}>{message}</p>}
        </form>
        <p className="text-center text-sm text-gray-600 mt-4">
          Already have an account? <a href="/client/login" className="text-amber-600 hover:underline">Log in</a>
        </p>
      </div>
    </div>
  );
}
