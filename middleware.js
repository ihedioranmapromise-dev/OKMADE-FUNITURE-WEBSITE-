import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";

const IP_CACHE_MS = 60_000;
const ipCache = new Map();

async function isIpBlocked(ip, supabaseUrl, serviceKey) {
  if (!ip || ip === "unknown") return false;

  const cached = ipCache.get(ip);
  if (cached && Date.now() - cached.at < IP_CACHE_MS) {
    return cached.blocked;
  }

  try {
    const res = await fetch(
      `${supabaseUrl}/rest/v1/blocked_ips?select=id&ip=eq.${encodeURIComponent(ip)}&limit=1`,
      {
        headers: {
          apikey: serviceKey,
          Authorization: `Bearer ${serviceKey}`,
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

export async function middleware(request) {
  let response = NextResponse.next({ request });

  const ip =
    request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    request.headers.get("x-real-ip") ||
    "unknown";

  // IP block check — server-side only
  if (
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
    process.env.SUPABASE_SERVICE_ROLE_KEY
  ) {
    const blocked = await isIpBlocked(
      ip,
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
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

  // Suspension check — only for authenticated users hitting protected routes
  const path = request.nextUrl.pathname;
  const protectedPaths = ["/client/dashboard", "/client/messages", "/client/settings", "/feed", "/client/notifications", "/client/profile"];
  const isProtected = protectedPaths.some((p) => path.startsWith(p));

  if (user && isProtected) {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/clients?select=suspended&auth_id=eq.${user.id}&limit=1`,
        {
          headers: {
            apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
            Authorization: `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
          },
        }
      );
      const data = await res.json();
      if (Array.isArray(data) && data[0]?.suspended === true) {
        // Force sign-out by clearing cookies and redirecting
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
    } catch {
      // ignore — fail open
    }
  }

  return response;
}

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|ico)$).*)",
  ],
};
