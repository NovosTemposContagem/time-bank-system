import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSessionData } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import * as bcrypt from "bcryptjs";

export async function POST(request: NextRequest) {
    const { email, password } = await request.json(); // email field is used for 'username' input

    // 1. Try as Admin/Coordinator User
    const user = await prisma.user.findUnique({
        where: { email },
    });

    if (user) {
        const isValid = await bcrypt.compare(password, user.password);
        if (isValid) {
            const response = new NextResponse(JSON.stringify({
                user: { id: user.id, name: user.name, role: user.role }
            }), { status: 200 });

            const session = await getIronSession<IronSessionData>(request, response, sessionOptions);
            session.user = {
                id: user.id,
                name: user.name,
                email: user.email,
                username: user.email,
                role: user.role,
                unitId: user.unitId,
                isLoggedIn: true,
            };
            await session.save();
            return response;
        }
    }

    // 2. Try as Employee (CPF)
    // sanitize input to just numbers for CPF check
    const cpfInput = email.replace(/\D/g, '');
    const passInput = password.replace(/\D/g, '');

    const employee = await prisma.employee.findUnique({
        where: { cpf: cpfInput }
    });

    if (employee) {
        // Password must match CPF for first login / default
        if (passInput === cpfInput) {
            const response = new NextResponse(JSON.stringify({
                user: { id: employee.id, name: employee.name, role: 'EMPLOYEE' }
            }), { status: 200 });

            const session = await getIronSession<IronSessionData>(request, response, sessionOptions);
            session.user = {
                id: employee.id, // Using employee ID as user ID for session
                employeeId: employee.id,
                name: employee.name,
                username: employee.cpf,
                role: 'EMPLOYEE',
                unitId: employee.unitId,
                isLoggedIn: true,
            };
            await session.save();
            return response;
        }
    }

    return NextResponse.json({ message: "Credenciais inválidas" }, { status: 401 });
}
