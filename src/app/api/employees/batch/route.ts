import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employees, defaultUnitId, defaultRoleId } = body;

        if (!Array.isArray(employees) || employees.length === 0) {
            return NextResponse.json({ message: "No employees provided" }, { status: 400 });
        }

        let createdCount = 0;
        let errors = [];

        for (const emp of employees) {
            try {
                // Ensure unique CPF constraint check or handle error
                await prisma.employee.create({
                    data: {
                        name: emp.name,
                        cpf: emp.cpf,
                        unitId: parseInt(defaultUnitId),
                        roleId: parseInt(defaultRoleId)
                    }
                });
                createdCount++;
            } catch (error) {
                console.error(`Error importing ${emp.name}:`, error);
                errors.push({ name: emp.name, error: "CPF likely duplicated or invalid" });
            }
        }

        return NextResponse.json({
            message: `Imported ${createdCount} employees`,
            errors,
            count: createdCount
        }, { status: 201 });

    } catch (error) {
        console.error("Batch import error:", error);
        return NextResponse.json({ message: "Server error" }, { status: 500 });
    }
}
