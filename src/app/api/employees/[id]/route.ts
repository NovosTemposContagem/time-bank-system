import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function DELETE(
    request: NextRequest,
    props: { params: Promise<{ id: string }> }
) {
    const params = await props.params;

    if (!params.id) {
        return NextResponse.json({ error: "ID is required" }, { status: 400 });
    }

    try {
        const id = parseInt(params.id);

        await prisma.employee.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Employee deleted successfully" });
    } catch (error) {
        console.error("Error deleting employee:", error);
        return NextResponse.json(
            { error: "Error deleting employee. They might have related time records." },
            { status: 500 }
        );
    }
}
