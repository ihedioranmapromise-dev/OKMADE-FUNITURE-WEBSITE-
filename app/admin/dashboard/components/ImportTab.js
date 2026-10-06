"use client";
import { useState } from "react";
import { adminFetch } from "@/lib/admin-client";

const SAMPLE_PRODUCTS = `description,price,sold,featured
"Handcrafted oak dining table",250000,false,true
"Rustic wooden stool",35000,false,false`;

const SAMPLE_CATALOGS = `title
"Living Room Collection 2026"
"Bedroom Essentials"`;

export default function ImportTab() {
  const [type, setType] = useState("products");
  const [csvText, setCsvText] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState(null);
  const [message, setMessage] = useState("");

  const handleFile = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setCsvText(reader.result || "");
    reader.readAsText(file);
  };

  const runImport = async () => {
    if (!csvText.trim()) {
      setMessage("Paste CSV or upload a file first.");
      return;
    }
    if (!confirm(`Import all rows into ${type}? This cannot be undone.`)) return;
    setImporting(true);
    setMessage("");
    setResult(null);
    const res = await adminFetch("/api/admin/import-csv", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, csv: csvText }),
    });
    const data = await res.json();
    setImporting(false);
    if (!res.ok) {
      setMessage("Error: " + (data.error || "Failed"));
      return;
    }
    setResult(data);
    setMessage(
      `Imported ${data.inserted} of ${data.total}.${data.failed > 0 ? ` ${data.failed} failed.` : ""}`
    );
  };

  const sample = type === "products" ? SAMPLE_PRODUCTS : SAMPLE_CATALOGS;

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-2">
        Import CSV
      </h1>
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
        Bulk-import products or catalogs from a CSV file. Images must be added manually afterwards.
      </p>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          What are you importing?
        </label>
        <div className="flex gap-2 flex-wrap">
          {[
            { id: "products", label: "Products" },
            { id: "catalogs", label: "Catalogs" },
          ].map((t) => (
            <button
              key={t.id}
              onClick={() => setType(t.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium ${
                type === t.id
                  ? "bg-amber-600 text-white"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100 mb-3">
          Required columns
        </h2>
        {type === "products" ? (
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
            <li><code>description</code> — product name/description (required)</li>
            <li><code>price</code> — number (required)</li>
            <li><code>sold</code> — true/false (optional)</li>
            <li><code>featured</code> — true/false (optional)</li>
          </ul>
        ) : (
          <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc pl-5">
            <li><code>title</code> — catalog title (required)</li>
          </ul>
        )}

        <details className="mt-4">
          <summary className="text-xs text-amber-600 dark:text-amber-400 cursor-pointer hover:underline">
            Show sample CSV
          </summary>
          <pre className="mt-2 p-3 bg-gray-100 dark:bg-gray-800 rounded text-xs text-gray-700 dark:text-gray-300 overflow-auto">
            {sample}
          </pre>
        </details>
      </div>

      <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Upload CSV file
          </label>
          <input
            type="file"
            accept=".csv,text/csv"
            onChange={handleFile}
            className="w-full border border-gray-300 dark:border-gray-600 rounded-lg p-2 text-sm bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Or paste CSV here
          </label>
          <textarea
            value={csvText}
            onChange={(e) => setCsvText(e.target.value)}
            rows="8"
            placeholder={sample}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg text-xs font-mono bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
        </div>

        <button
          onClick={runImport}
          disabled={importing || !csvText.trim()}
          className="w-full bg-amber-600 hover:bg-amber-700 text-white font-semibold py-3 rounded-lg disabled:opacity-50"
        >
          {importing ? "Importing..." : `Import ${type}`}
        </button>

        {message && (
          <p
            className={`mt-3 text-sm ${
              message.startsWith("Error") ? "text-red-500" : "text-green-600 dark:text-green-400"
            }`}
          >
            {message}
          </p>
        )}

        {result && (
          <div className="mt-3 grid grid-cols-3 gap-3">
            <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-green-700 dark:text-green-300">
                {result.inserted}
              </p>
              <p className="text-xs text-green-700 dark:text-green-400">Imported</p>
            </div>
            <div className="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-red-700 dark:text-red-300">
                {result.failed}
              </p>
              <p className="text-xs text-red-700 dark:text-red-400">Failed</p>
            </div>
            <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 text-center">
              <p className="text-2xl font-bold text-gray-700 dark:text-gray-300">
                {result.total}
              </p>
              <p className="text-xs text-gray-700 dark:text-gray-400">Total rows</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
