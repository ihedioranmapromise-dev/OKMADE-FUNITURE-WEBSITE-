"use client";
import { useEffect, useState } from "react";
import { adminFetch } from "@/lib/admin-client";

const PAGES = [
  { id: "home", label: "Homepage" },
  { id: "portfolio", label: "Portfolio" },
  { id: "showroom", label: "Showroom" },
  { id: "catalog", label: "Catalog" },
  { id: "workers", label: "Artisans" },
];

export default function SeoTab() {
  const [page, setPage] = useState("home");
  const [form, setForm] = useState({ title: "", description: "", og_image: "" });
  const [loading
