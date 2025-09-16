// app/api/log/route.ts (or route.js)
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  const body = await req.json();
  console.log("Frontend Log:", body.message); // ✅ Prints in VS Code terminal
  return NextResponse.json({ success: true });
}

export async function GET() {
  return NextResponse.json({ error: "Method not allowed" }, { status: 405 });
}
