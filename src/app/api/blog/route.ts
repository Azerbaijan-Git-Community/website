import { NextRequest, NextResponse } from "next/server";
import { getBlogPosts } from "@/data/blog/get";

export async function GET(req: NextRequest) {
  const cursor = req.nextUrl.searchParams.get("cursor") ?? undefined;
  const data = await getBlogPosts(cursor);
  return NextResponse.json(data);
}
