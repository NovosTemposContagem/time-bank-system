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

        await prisma.role.delete({
            where: { id },
        });

        return NextResponse.json({ message: "Role deleted successfully" });
    } catch (error) {
        console.error("Error deleting role:", error);
        return NextResponse.json(
            { error: "Não é possível excluir este cargo pois existem funcionários vinculados a ele." },
            { status: 500 }
        );
    }
}
