import { NextResponse } from "next/server";

import { saveBonusPick } from "@/lib/bonus/actions";

export async function POST(req: Request) {
  const body = await req.json();
  const result = await saveBonusPick(body);
  if ("error" in result) {
    return NextResponse.json(result, { status: 400 });
  }
  return NextResponse.json(result);
}
