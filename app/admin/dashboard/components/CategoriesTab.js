"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

export default function CategoriesTab() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editingName, setEditingName] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const res = await adminFetch("/api/admin/categories");
    if (res.ok) setCategories(await res.json());
    setLoading(false);
  }

  const add = async () => {
    if (!newName.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setNewName("");
      setMessage("Category added.");
      load();
    } else {
      setMessage("Failed to add.");
    }
  };

  const saveEdit = async (id) => {
    if (!editingName.trim()) return;
    setBusy(true);
    const res = await adminFetch("/api/admin/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, name: editingName.trim() }),
    });
    setBusy(false);
    if (res.ok) {
      setEditingId(null);
      setEditingName("");
      setMessage("Category updated.");
      load();
    } else {
      setMessage("Failed to update.");
    }
  };

  const remove = async (id, name) => {
    if (!confirm(`Delete category "${name}"? Projects using it will lose their category.`)) return;
    setBusy(true);
    const res = await adminFetch(`/api/admin/categories?id=${id}`, { method: "DELETE" });
    setBusy(false);
    if (res.ok) {
      setMessage("Category deleted.");
      load();
    } else {
      setMessage("Failed to delete.");
    }
  };

  if (loading) {
    return (
      <div className="space-y-3">
        <div className="h-8 w-48 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-12 bg-gray-100 dark:bg-gray-800 rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 dark:text-gray-100 mb-6">
        Manage Categories
      </h1>

      <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-5 mb-6">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Add New Category
        </label>
        <div className="flex gap-2 flex-wrap">
          <input
            type="text"
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && add()}
            placeholder="e.g., Restaurant"
            className="flex-1 min-w-[200px] p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
          />
          <button
            onClick={add}
            disabled={busy || !newName.trim()}
            className="bg-amber-600 hover:bg-amber-700 text-white px-5 py-3 rounded-lg font-medium disabled:opacity-50"
          >
            Add
          </button>
        </div>
        {message && (
          <p className="text-sm text-green-600 dark:text-green-400 mt-2">{message}</p>
        )}
      </div>

      {categories.length === 0 ? (
        <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 p-8 text-center text-gray-500 dark:text-gray-400">
          No categories yet. Add your first one above.
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <table className="min-w-full">
            <thead className="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th className="py-3 px-4 text-left text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Name</th>
                <th className="py-3 px-4 text-right text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody>
              {categories.map((cat) => (
                <tr
                  key={cat.id}
                  className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/50"
                >
                  <td className="py-3 px-4">
                    {editingId === cat.id ? (
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && saveEdit(cat.id)}
                        autoFocus
                        className="w-full p-2 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-800 dark:text-gray-100"
                      />
                    ) : (
                      <span className="text-sm text-gray-800 dark:text-gray-200">{cat.name}</span>
                    )}
                  </td>
                  <td className="py-3 px-4 text-right">
                    {editingId === cat.id ? (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => saveEdit(cat.id)}
                          disabled={busy}
                          className="bg-green-600 text-white px-3 py-1 rounded text-xs hover:bg-green-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          onClick={() => {
                            setEditingId(null);
                            setEditingName("");
                          }}
                          className="bg-gray-300 dark:bg-gray-700 text-gray-800 dark:text-gray-200 px-3 py-1 rounded text-xs"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => {
                            setEditingId(cat.id);
                            setEditingName(cat.name);
                          }}
                          className="bg-blue-500 text-white px-3 py-1 rounded text-xs hover:bg-blue-600"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => remove(cat.id, cat.name)}
                          className="bg-red-500 text-white px-3 py-1 rounded text-xs hover:bg-red-600"
                        >
                          Delete
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
