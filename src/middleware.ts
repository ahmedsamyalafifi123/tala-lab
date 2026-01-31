import { createServerClient } from "@supabase/ssr";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export async function middleware(req: NextRequest) {
  let response = NextResponse.next({
    request: {
      headers: req.headers,
    },
  });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return req.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            req.cookies.set(name, value),
          );
          response = NextResponse.next({
            request: req,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const path = req.nextUrl.pathname;

  // Manager portal protection
  if (path.startsWith("/manager")) {
    if (!user) {
      return NextResponse.redirect(new URL("/login", req.url));
    }

    // Check if user is manager
    const { data: labUser } = await supabase
      .from("lab_users")
      .select("is_manager, status")
      .eq("user_id", user.id)
      .eq("is_manager", true)
      .eq("status", "active")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!labUser) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", req.url),
      );
    }
  }

  // Lab portal protection
  // Matches /slug or /slug/something, but avoids reserved paths
  const reservedPaths = ["login", "api", "_next", "manager", "static"];
  const firstSegment = path.split('/')[1];

  if (firstSegment && !reservedPaths.includes(firstSegment)) {
    // It's likely a lab slug
    const labSlug = firstSegment;

    // Skip validation for login page inside lab (/lab-slug/login)
    // and strictly check if it IS the login page
    if (path === `/${labSlug}/login`) {
      // Still validate lab exists
      const { data: lab } = await supabase
        .from("labs")
        .select("uuid, slug")
        .eq("slug", labSlug)
        .eq("status", "active")
        .single();

      if (!lab) {
        return NextResponse.redirect(
          new URL("/login?error=invalid_lab", req.url),
        );
      }

      // Store lab context in headers for the page to use
      response.headers.set("x-lab-id", lab.uuid);
      response.headers.set("x-lab-slug", lab.slug);
      return response;
    }

    console.log("Middleware: Checking lab slug:", labSlug);
    // For non-login pages in the lab portal
    const { data: lab, error } = await supabase
      .from("labs")
      .select("uuid, slug, status")
      .eq("slug", labSlug)
      .limit(1)
      .maybeSingle(); // Use maybeSingle to prevent PGRST116 error noise

    console.log(`Middleware: Lab result for ${labSlug}:`, lab ? "Found" : "Not Found", error ? error.message : "No Error");
    
    if (lab) console.log("Middleware: Lab status:", lab.status);
    if (user) console.log("Middleware: User ID:", user.id);

    // If it's not a valid lab, we might just let it 404 naturally if we aren't strict,
    // but the plan says "return to login?error=invalid_lab"
    if (error || !lab || lab.status !== "active") {
        // Only redirect if it really looks like a lab path we want to protect
        // If it's just a random 404 url, maybe we shouldn't redirect to login? 
        // But adhering to the plan:
        return NextResponse.redirect(
            new URL("/login?error=invalid_lab", req.url),
        );
    }

    // Check authentication
    if (!user) {
      return NextResponse.redirect(new URL(`/${labSlug}/login`, req.url));
    }

    // Check if user has access to this lab (via RLS, but also check here)
    const { data: labUser } = await supabase
      .from("lab_users")
      .select("role, status")
      .eq("user_id", user.id)
      .eq("lab_id", lab.uuid)
      .eq("status", "active")
      .eq("status", "active")
      .limit(1)
      .maybeSingle();

    if (!labUser) {
      return NextResponse.redirect(
        new URL("/login?error=unauthorized", req.url),
      );
    }

    // Store lab context in headers
    response.headers.set("x-lab-id", lab.uuid);
    response.headers.set("x-lab-slug", lab.slug);
    response.headers.set("x-user-role", labUser.role);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     * - api routes (if needed, but usually we want middleware on api too?)
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
