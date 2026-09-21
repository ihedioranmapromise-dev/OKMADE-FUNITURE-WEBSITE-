"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createSupabaseBrowser } from "@/lib/supabase-browser";

export default function ClientSignup() {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [skill, setSkill] = useState("");
  const [workAddress, setWorkAddress] = useState("");
  const [age, setAge] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();
  const supabase = createSupabaseBrowser();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!firstName || !lastName || !username || !email || !phoneNumber || !password) {
      setMessage("Please fill all required fields.");
      return;
    }
    if (password !== confirmPassword) {
      setMessage("Passwords do not match.");
      return;
    }
    if (password.length < 6) {
      setMessage("Password must be at least 6 characters.");
      return;
    }
    setLoading(true);
    setMessage("");
    try {
      // 1. Create auth user
      const { data: authData, error: authError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          emailRedirectTo: `${process.env.NEXT_PUBLIC_BASE_URL}/client/verify-email`,
        },
      });
      if (authError) throw authError;
      if (!authData.user) throw new Error("Signup failed");

      // 2. Create client profile row
      const res = await fetch("/api/client/create-profile", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          auth_id: authData.user.id,
          first_name: firstName,
          last_name: lastName,
          username,
          email,
          phone_number: phoneNumber,
          skill,
          work_address: workAddress,
          age,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to create profile");

      router.push(`/client/verify-email?email=${encodeURIComponent(email)}`);
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-md w-full bg-white rounded-2xl shadow-xl p-8">
        <h1 className="text-3xl font-bold text-center text-amber-800 mb-6 font-['Dancing_Script',_cursive]">
          Join OKMADE
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700">First Name *</label>
              <input type="text" value={firstName} onChange={(e) => setFirstName(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">Last Name *</label>
              <input type="text" value={lastName} onChange={(e) => setLastName(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" required />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Username *</label>
            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email *</label>
            <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone *</label>
            <input type="text" value={phoneNumber} onChange={(e) => setPhoneNumber(e.target.value)} placeholder="e.g., 2348123456789" className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" required />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Skill / Trade</label>
            <input type="text" value={skill} onChange={(e) => setSkill(e.target.value)} placeholder="Carpenter, Painter, Upholsterer..." className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Work Address</label>
            <input type="text" value={workAddress} onChange={(e) => setWorkAddress(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Age</label>
            <input type="number" value={age} onChange={(e) => setAge(e.target.value)} className="w-full mt-1 p-3 border rounded-lg focus:ring-2 focus:ring-amber-500" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Password *</label>
            <div className="relative">
              <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg pr-10" required />
              <button type="button" className="absolute inset-y-0 right-3 flex items-center text-gray-500" onClick={() => setShowPassword(!showPassword)}>
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Confirm Password *</label>
            <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} className="w-full mt-1 p-3 border rounded-lg" required />
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
