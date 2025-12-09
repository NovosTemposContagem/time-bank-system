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

        await prisma.unit.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Unit deleted successfully" });
    } catch (error) {
        console.error("Error deleting unit:", error);
        return NextResponse.json(
            { error: "Não é possível excluir esta unidade pois existem funcionários ou registros vinculados a ela." },
            { status: 500 }
        );
    }
}
