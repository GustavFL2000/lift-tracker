import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

function generateUid(): string {
  // Simple uid for PoC
  return "uid_" + Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function middleware(request: NextRequest) {
  const uid = request.cookies.get("uid")?.value;
  const response = NextResponse.next();
  if (!uid) {
    response.cookies.set("uid", generateUid(), {
      httpOnly: true,
      sameSite: "lax",
      path: "/",
      maxAge: 60 * 60 * 24 * 365
    });
  }
  const url = new URL(request.url);
  const setAdmin = url.searchParams.get("admin");
  if (setAdmin === "1") {
    response.cookies.set("isAdmin", "1", { httpOnly: true, sameSite: "lax", path: "/", maxAge: 60 * 60 * 24 * 30 });
  }
  return response;
}

export const config = {
  matcher: ["/((?!_next|favicon.ico).*)"],
};


