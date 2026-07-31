import { NextResponse } from "next/server";
import { getConfidencePayload } from "@/lib/confidence-service";

type RouteContext = {
  params: { id: string };
};

export async function GET(request: Request, context: RouteContext) {
  try {
    const { searchParams } = new URL(request.url);
    const size = searchParams.get("size");

    if (!size) {
      return NextResponse.json(
        { error: "Missing required query parameter: size" },
        { status: 400 }
      );
    }

    const payload = await getConfidencePayload(context.params.id, size);

    if (!payload) {
      return NextResponse.json({ error: "Product not found" }, { status: 404 });
    }

    if ("error" in payload && payload.error === "invalid_size") {
      return NextResponse.json(
        { error: `Invalid size: ${size}` },
        { status: 400 }
      );
    }

    const { showAlternativesSection: _hidden, ...response } = payload;
    return NextResponse.json(response);
  } catch (error) {
    console.error("GET /api/products/[id]/confidence failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch confidence data" },
      { status: 500 }
    );
  }
}
