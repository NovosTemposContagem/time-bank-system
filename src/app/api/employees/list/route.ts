import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const employees = await prisma.employee.findMany({
        select: {
            id: true,
            name: true,
            cpf: true,
        },
        orderBy: {
            name: 'asc'
        }
    });

    return NextResponse.json(employees);
}
