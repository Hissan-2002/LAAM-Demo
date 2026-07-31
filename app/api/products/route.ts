import { NextResponse } from "next/server";
import { getProductListing } from "@/lib/products";

export async function GET() {
  try {
    const products = await getProductListing();
    return NextResponse.json(products);
  } catch (error) {
    console.error("GET /api/products failed:", error);
    return NextResponse.json(
      { error: "Failed to fetch products" },
      { status: 500 }
    );
  }
}
