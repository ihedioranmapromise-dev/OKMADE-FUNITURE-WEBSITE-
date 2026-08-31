"use client";
import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import { useRouter } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

export default function AdminTokens() {
  // ... existing state ...

  // Add a new state for artisans
  const [workers, setWorkers] = useState([]);
  const [selectedWorkerId, setSelectedWorkerId] = useState("");
  const [clientName, setClientName] = useState("");
  const [clientContact, setClientContact] = useState("");
  const [clientAddress, setClientAddress] = useState("");
  const [workDescription, setWorkDescription] = useState("");
  const [price, setPrice] = useState("");
  const [imageData, setImageData] = useState([]);
  const [generatedToken, setGeneratedToken] = useState("");
  const [uploading, setUploading] = useState(false);
  const [message, setMessage] = useState("");
  const router = useRouter();

  if (typeof window !== "undefined" && sessionStorage.getItem("adminAuth") !== "true") {
    router.push("/admin/login");
    return null;
  }

  useEffect(() => {
    fetchWorkers();
  }, []);

  async function fetchWorkers() {
    const { data, error } = await supabase
      .from("clients")
      .select("id, display_name, first_name, last_name, phone_number, work_address")
      .order("display_name", { ascending: true });
    if (!error) setWorkers(data || []);
  }

  const handleWorkerChange = (e) => {
    const id = e.target.value;
    setSelectedWorkerId(id);
    if (id === "manual") {
      setClientName("");
      setClientContact("");
      setClientAddress("");
      return;
    }
    const worker = workers.find(w => w.id === id);
    if (worker) {
      const name = worker.display_name || `${worker.first_name || ''} ${worker.last_name || ''}`.trim();
      setClientName(name || "");
      setClientContact(worker.phone_number || "");
      setClientAddress(worker.work_address || "");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // ... validation ...

    setUploading(true);
    setMessage("");
    try {
      const tokenString = generateTokenString();

      const { data: token, error: tokenError } = await supabase
        .from("tokens")
        .insert([
          {
            token_string: tokenString,
            client_name: clientName,
            client_contact: clientContact,
            client_address: clientAddress || null,
            work_description: workDescription || null,
            price: price ? parseFloat(price) : null,
            status: "active",
            notification_method: "manual",
            client_id: selectedWorkerId !== "manual" && selectedWorkerId !== "" ? selectedWorkerId : null,
          },
        ])
        .select()
        .single();
      if (tokenError) throw tokenError;

      // ... upload images ...

      // Send notification to the selected artisan (if any)
      if (selectedWorkerId !== "manual" && selectedWorkerId !== "") {
        await supabase.from("notifications").insert({
          client_id: selectedWorkerId,
          type: "token_generated",
          message: `A new token "${tokenString}" has been assigned to you.`,
          target_url: `/workspace/${tokenString}`,
        });
      }

      setGeneratedToken(tokenString);
      setMessage(`Token generated: ${tokenString}`);
      // reset form...
    } catch (err) {
      setMessage("Error: " + err.message);
    } finally {
      setUploading(false);
    }
  };

  // ... rest of the component (render) ...
}