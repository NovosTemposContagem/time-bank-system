import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const roles = await prisma.role.findMany();
    return NextResponse.json(roles);
}

export async function POST(req: NextRequest) {
    const data = await req.json();
    const role = await prisma.role.create({ data });
    return NextResponse.json(role);
}
