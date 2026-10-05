import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import { isCrossOrigin } from "@/lib/csrf";

const IP_CACHE_MS = 60_000;
const SUSPENSION_CACHE_MS = 60_000;

const ipCache = new Map();
const suspensionCache = new Map();

async function isIpBlocked(ip) {
  if (!ip || ip === "unknown") return false;

  const cached = ipCache.get(ip);
  if (cached && Date.now() - cached.at < IP_CACHE_MS) {
    return cached.blocked;
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/blocked_ips?select=id&ip=eq.${encodeURIComponent(
        ip
      )}&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const data = await res.json();
    const blocked = Array.isArray(data) && data.length > 0;
    ipCache.set(ip, { blocked, at: Date.now() });
    return blocked;
  } catch {
    return false;
  }
}

async function isSuspended(authId) {
  if (!authId) return false;

  const cached = suspensionCache.get(authId);
  if (cached && Date.now() - cached.at < SUSPENSION_CACHE_MS) {
    return cached.suspended;
  }

  try {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/clients?select=suspended&auth_id=eq.${authId}&limit=1`,
      {
        headers: {
          apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
          Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
        },
      }
    );
    const data = await res.json();
    const suspended = Array.isArray(data) && data[0]?.suspended === true;
    suspensionCache.set(authId, { suspended, at: Date.now() });
    return suspended;
  } catch {
    return false;
  }
}

export async function middleware(request) {
  const path = request.nextUrl.pathname;
  const isApi = path.startsWith("/api");

  // === CSRF for API routes only ===
  if (isApi) {
    if (isCrossOrigin(request)) {
      return new NextResponse(
        JSON.stringify({ error: "Cross-origin request blocked" }),
        { status: 403, headers: { "Content-Type": "application/json" } }
      );
    }
    return NextResponse.next();
  }

  // === Page routes: full pipeline ===
  let response = NextResponse.next({ request });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const blocked = await isIpBlocked(ip);
    if (blocked) {
      return new NextResponse("Access denied.", { status: 403 });
    }
  }

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const protectedPaths = [
    "/client/dashboard",
    "/client/messages",
    "/client/settings",
    "/client/notifications",
    "/client/profile",
    "/feed",
  ];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (user && isProtected) {
    const suspended = await isSuspended(user.id);
    if (suspended) {
      const url = request.nextUrl.clone();
      url.pathname = "/client/login";
      url.searchParams.set("suspended", "1");
      const redirect = NextResponse.redirect(url);
      request.cookies.getAll().forEach((c) => {
        if (c.name.startsWith("sb-")) {
          redirect.cookies.delete(c.name);
        }
      });
      return redirect;
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
