"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams, useRouter } from "next/navigation";
import { WhatsAppIcon, CloseIcon } from "@/lib/icons";
import Navbar from "@/app/components/Navbar";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

const WHATSAPP_NUMBER = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

const HeartIcon = ({ filled, className = "w-5 h-5" }) => (
  <svg className={className} fill={filled ? "currentColor" : "none"} stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
  </svg>
);

const REACTIONS = [
  { type: "like", emoji: "👍" },
  { type: "heart", emoji: "❤️" },
  { type: "love", emoji: "😍" },
  { type: "haha", emoji: "😂" },
  { type: "wow", emoji: "😮" },
  { type: "sad", emoji: "😢" },
];

function StarRating({ rating, interactive = false, onChange = null, size = "text-xl" }) {
  const [hoverRating, setHoverRating] = useState(0);
  const display = interactive ? hoverRating || rating : rating;
  return (
    <div className="flex items-center gap-0.5">
      {[1, 2, 3, 4, 5].map((star) => (
        <button
          key={star}
          type="button"
          onClick={interactive ? () => onChange(star) : undefined}
          onMouseEnter={interactive ? () => setHoverRating(star) : undefined}
          onMouseLeave={interactive ? () => setHoverRating(0) : undefined}
          className={`${size} ${interactive ? "cursor-pointer" : "cursor-default"} ${star <= display ? "text-yellow-500" : "text-gray-300"}`}
        >
          ★
        </button>
      ))}
    </div>
  );
}

const getViewerId = () => {
  if (typeof window === "undefined") return "anonymous";
  let id = localStorage.getItem("viewer_id");
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15);
    localStorage.setItem("viewer_id", id);
  }
  return id;
};

export default function ProductDetail() {
  const { id } = useParams();
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [images, setImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [avgRating, setAvgRating] = useState(0);
  const [userName, setUserName] = useState("");
  const [userRating, setUserRating] = useState(5);
  const [userComment, setUserComment] = useState("");
  const
