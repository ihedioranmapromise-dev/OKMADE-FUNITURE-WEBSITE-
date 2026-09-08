"use client";
import { useEffect, useState } from "react";
import { createClient } from "@supabase/supabase-js";
import { useParams } from "next/navigation";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

// SVG Icons
const LocationIcon = () => (
  <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
  </svg>
);

const PhoneIcon = () => (
  <svg className="w-4 h-4 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
  </svg>
);

// ... rest of the SocialIcon and other functions remain the same ...

export default function ClientPortfolio() {
  // ... state and fetch logic (unchanged) ...

  // In the JSX, replace the location and phone emojis with:
  // <LocationIcon /> and <PhoneIcon /> inside the respective paragraphs.

  // I'll show the changed part only:

  return (
    <div className="min-h-screen bg-gradient-to-b from-amber-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        <div className="text-center mb-12">
          {client.profile_pic && <img ... />}
          <h1 className="...">{client.display_name || client.username}</h1>
          <p className="text-sm text-gray-500">@{client.username}</p>
          {client.bio && <p className="text-gray-600 mt-2 max-w-2xl mx-auto">{client.bio}</p>}
          {client.work_address && (
            <p className="text-gray-500 text-sm mt-1 flex items-center justify-center">
              <LocationIcon /> {client.work_address}
            </p>
          )}
          {client.calling_phone && (
            <p className="text-gray-500 text-sm mt-1 flex items-center justify-center">
              <PhoneIcon /> {client.calling_phone}
            </p>
          )}
          {client.age && <p className="text-gray-500 text-sm mt-1">Age: {client.age}</p>}
          {client.skill && <p className="text-gray-500 text-sm mt-1">Skill: {client.skill}</p>}
          <div className="flex justify-center gap-3 mt-4">
            {/* Social icons (already SVGs) */}
          </div>
        </div>

        {/* Stories, Projects sections unchanged */}
      </div>
    </div>
  );
}