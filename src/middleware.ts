import { NextRequest, NextResponse } from "next/server";

/**
 * Middleware supporting dual-domain architecture:
 * 1. Dedicated admin subdomain: admin.awssbg.online (or admi.awssbg.online) -> rewrites root to /admin
 * 2. Main domain route: awssbg.online/admin -> directly serves /admin
 */
export function middleware(req: NextRequest) {
  const url = req.nextUrl.clone();
  const hostname = req.headers.get("host") || "";

  // Check if request comes from an admin subdomain (e.g., admin.awssbg.online, admi.awssbg.online, admin.localhost:3000)
  const isAdminSubdomain =
    hostname.startsWith("admin.") ||
    hostname.startsWith("admi.") ||
    hostname.includes("admin.awssbg") ||
    hostname.includes("admi.awssbg");

  if (isAdminSubdomain) {
    // If on admin subdomain and accessing root '/', rewrite to '/admin'
    if (url.pathname === "/") {
      url.pathname = "/admin";
      return NextResponse.rewrite(url);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, logo.png, icon.svg, etc. (public static files)
     */
    "/((?!_next/static|_next/image|favicon.ico|logo.png|favicon.svg|icon.svg).*)",
  ],
};
