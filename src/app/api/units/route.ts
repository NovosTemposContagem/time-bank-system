import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const units = await prisma.unit.findMany();
    return NextResponse.json(units);
}

export async function POST(req: NextRequest) {
    const data = await req.json();
    const unit = await prisma.unit.create({ data });
    return NextResponse.json(unit);
}
