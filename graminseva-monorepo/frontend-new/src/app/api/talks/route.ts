import { NextRequest, NextResponse } from "next/server";
import { getBackendUrl } from "@/lib/backend-url";

export async function GET(req: NextRequest) {
  try {
    const backendUrl = getBackendUrl();
    const res = await fetch(`${backendUrl}/api/talks`, {
      method: "GET",
      headers: { "Content-Type": "application/json" },
      cache: "no-store",
    });
    if (!res.ok) throw new Error("Backend error");
    const data = await res.json();
    return NextResponse.json({ talks: data.talks || [] });
  } catch (error) {
    return NextResponse.json({ talks: [] }, { status: 200 });
  }
}
