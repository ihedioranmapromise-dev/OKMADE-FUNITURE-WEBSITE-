"use client";
import { useEffect, useState } from "react";

const Facebook = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
  </svg>
);

const XIcon = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const WhatsApp = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
  </svg>
);

const Telegram = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
  </svg>
);

const LinkedIn = () => (
  <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
    <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.225 0z" />
  </svg>
);

const CopyIcon = () => (
  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-6 h-6">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
  </svg>
);

const ShareIcon = ({ className = "w-5 h-5" }) => (
  <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
    <path strokeLinecap="round" strokeLinejoin="round" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z" />
  </svg>
);

export default function ShareMenu({
  url,
  title = "Check this out on OKMADE",
  text = "",
  className = "",
  label,
  iconOnly = false,
}) {
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const fullUrl =
    typeof window !== "undefined" && url
      ? url.startsWith("http")
        ? url
        : `${window.location.origin}${url}`
      : url || "";

  useEffect(() => {
    if (!open) return;
    const onEsc = (e) => e.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onEsc);
    return () => window.removeEventListener("keydown", onEsc);
  }, [open]);

  const handleOpen = async () => {
    // Try native share on mobile
    if (typeof navigator !== "undefined" && navigator.share) {
      try {
        await navigator.share({
          title,
          text: text || title,
          url: fullUrl,
        });
        return;
      } catch {
        // user cancelled or failed — fall through to custom menu
      }
    }
    setOpen(true);
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(fullUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {}
  };

  const encodedUrl = encodeURIComponent(fullUrl);
  const encodedText = encodeURIComponent(text || title);

  const options = [
    {
      name: "WhatsApp",
      color: "bg-green-500 hover:bg-green-600",
      href: `https://wa.me/?text=${encodedText}%20${encodedUrl}`,
      icon: <WhatsApp />,
    },
    {
      name: "Facebook",
      color: "bg-blue-600 hover:bg-blue-700",
      href: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      icon: <Facebook />,
    },
    {
      name: "X",
      color: "bg-black hover:bg-gray-800",
      href: `https://x.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      icon: <XIcon />,
    },
    {
      name: "Telegram",
      color: "bg-sky-500 hover:bg-sky-600",
      href: `https://t.me/share/url?url=${encodedUrl}&text=${encodedText}`,
      icon: <Telegram />,
    },
    {
      name: "LinkedIn",
      color: "bg-blue-700 hover:bg-blue-800",
      href: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      icon: <LinkedIn />,
    },
  ];

  return (
    <>
      {iconOnly ? (
        <button
          onClick={handleOpen}
          className={`p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition ${className}`}
          aria-label="Share"
        >
          <ShareIcon className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className={`flex items-center gap-2 text-sm font-medium ${className}`}
        >
          <ShareIcon className="w-4 h-4" />
          {label || "Share"}
        </button>
      )}

      {open && (
        <div
          className="fixed inset-0 z-[100] bg-black/60 flex items-end md:items-center justify-center p-0 md:p-4"
          onClick={() => setOpen(false)}
        >
          <div
            className="bg-white dark:bg-gray-900 w-full md:max-w-md md:rounded-2xl rounded-t-2xl shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100 dark:border-gray-800">
              <h3 className="font-bold text-gray-800 dark:text-gray-100">
                Share
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="p-1.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition"
                aria-label="Close"
              >
                <svg className="w-5 h-5 text-gray-600 dark:text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="p-5">
              <div className="grid grid-cols-5 gap-3 mb-5">
                {options.map((o) => (
                  <a
                    key={o.name}
                    href={o.href}
                    target="_blank"
                    rel="noopener noreferrer"
                    className={`flex flex-col items-center gap-2 text-white transition ${o.color} rounded-xl py-3`}
                  >
                    {o.icon}
                    <span className="text-[10px] font-medium">{o.name}</span>
                  </a>
                ))}
              </div>

              <button
                onClick={copy}
                className="w-full flex items-center gap-3 px-4 py-3 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition text-left"
              >
                <CopyIcon />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    {copied ? "Copied!" : "Copy link"}
                  </p>
                  <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                    {fullUrl}
                  </p>
                </div>
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
