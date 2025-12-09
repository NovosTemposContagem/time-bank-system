import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getIronSession, IronSessionData } from "iron-session";
import { sessionOptions } from "@/lib/session";
import * as bcrypt from "bcryptjs";

// GET: List all system users (only for admins)
export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    if (!session.user?.isLoggedIn || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const users = await prisma.user.findMany({
        select: {
            id: true,
            name: true,
            email: true,
            role: true,
            unit: {
                select: { name: true }
            },
            createdAt: true
        },
        orderBy: { name: 'asc' }
    });

    return NextResponse.json(users);
}

// POST: Create a new system user
export async function POST(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    if (!session.user?.isLoggedIn || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Unauthorized: Apenas Master pode criar usuários." }, { status: 403 });
    }

    try {
        const { name, email, password, role, unitId } = await request.json();

        if (!name || !email || !password || !role) {
            return NextResponse.json({ message: "Dados incompletos." }, { status: 400 });
        }

        // Check already exists
        const existing = await prisma.user.findUnique({ where: { email } });
        if (existing) {
            return NextResponse.json({ message: "Email já cadastrado." }, { status: 409 });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const newUser = await prisma.user.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role, // ADMIN or COORDINATOR
                unitId: unitId ? parseInt(unitId) : null
            }
        });

        // Don't return password
        const { password: _, ...userWithoutPass } = newUser;

        return NextResponse.json(userWithoutPass, { status: 201 });

    } catch (e) {
        console.error("Error creating user:", e);
        return NextResponse.json({ message: "Erro ao criar usuário." }, { status: 500 });
    }
}

// DELETE: Delete a user
export async function DELETE(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    if (!session.user?.isLoggedIn || session.user.role !== 'ADMIN') {
        return NextResponse.json({ message: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) return NextResponse.json({ message: "ID missing" }, { status: 400 });

    // Prevent self-delete
    if (parseInt(id) === session.user.id) {
        return NextResponse.json({ message: "Não pode excluir a si mesmo." }, { status: 400 });
    }

    // Optional: Prevent deleting 'carlos@ient.com.br' explicitly if needed?
    // Let's rely on self-delete check and common sense for now.

    try {
        await prisma.user.delete({ where: { id: parseInt(id) } });
        return NextResponse.json({ message: "Usuário deletado." });
    } catch (e) {
        return NextResponse.json({ message: "Erro ao deletar." }, { status: 500 });
    }
}
