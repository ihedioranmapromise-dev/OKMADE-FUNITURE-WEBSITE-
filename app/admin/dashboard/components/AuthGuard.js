"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

export default function AuthGuard({ children }) {
  const router = useRouter();
  const [ok, setOk] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const auth = sessionStorage.getItem("adminAuth");
    const key = sessionStorage.getItem("adminKey");
    if (auth === "true" && key) {
      setOk(true);
    } else {
      router.replace("/admin/login");
    }
  }, [router]);

  if (!ok) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-amber-50 to-white dark:from-gray-950 dark:to-gray-900">
        <div className="text-amber-600 dark:text-amber-400 animate-pulse">
          Verifying session...
        </div>
      </div>
    );
  }

  return children;
}
