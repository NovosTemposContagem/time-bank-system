import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET() {
    const employees = await prisma.employee.findMany({
        include: { role: true, unit: true },
        orderBy: { name: 'asc' }
    });
    return NextResponse.json(employees);
}

export async function POST(req: NextRequest) {
    try {
        const data = await req.json();
        const employee = await prisma.employee.create({
            data: {
                name: data.name,
                cpf: data.cpf,
                roleId: parseInt(data.roleId),
                unitId: parseInt(data.unitId)
            }
        });
        return NextResponse.json(employee);
    } catch (error) {
        return NextResponse.json({ message: "Error or duplicate CPF" }, { status: 400 });
    }
}
