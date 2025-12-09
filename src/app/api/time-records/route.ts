import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { differenceInMinutes, parseISO } from "date-fns";
import { getIronSession, IronSessionData } from "iron-session";
import { sessionOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { employeeId, date, startTime, endTime, description, status } = body;

        const start = parseISO(`${date}T${startTime}`);
        const end = parseISO(`${date}T${endTime}`);

        if (end <= start) {
            return NextResponse.json({ message: "A hora final deve ser posterior à hora inicial." }, { status: 400 });
        }

        const diffMinutes = differenceInMinutes(end, start);
        const totalHours = parseFloat((diffMinutes / 60).toFixed(2));

        const data: any = {
            date: parseISO(date),
            startTime: start,
            endTime: end,
            description,
            totalHours,
            status: status || "PENDING",
            employeeId: parseInt(employeeId),
        };

        // If creating with status (Admin), add validator relation if we have session info
        // But for public POST this might be tricky. Public POST doesn't have session usually.
        // Let's check session.
        const response = new NextResponse();
        const session = await getIronSession<IronSessionData>(request, response, sessionOptions);
        if (session.user?.isLoggedIn && status) {
            data.validatorId = session.user.id;
        }

        const record = await prisma.timeRecord.create({
            data
        });
        return NextResponse.json(record, { status: 201 });
    } catch (error) {
        console.error("Error creating record:", error);
        return NextResponse.json({ message: "Erro ao salvar registro." }, { status: 500 });
    }
}

export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    if (!session.user?.isLoggedIn) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');

    const where: any = {};
    if (status) where.status = status;

    const employeeId = searchParams.get('employeeId');
    if (employeeId) where.employeeId = parseInt(employeeId);

    if (session.user.role === 'COORDINATOR' && session.user.unitId) {
        where.employee = {
            unitId: session.user.unitId
        };
    }

    const records = await prisma.timeRecord.findMany({
        where,
        include: {
            employee: {
                select: { name: true, cpf: true, unit: { select: { name: true } } }
            }
        },
        orderBy: { date: 'desc' }
    });

    return NextResponse.json(records);
}

export async function PUT(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    if (!session.user?.isLoggedIn) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { id, status, date, startTime, endTime, description } = body;

        const updateData: any = { status };

        // If validation status update
        if (status && !date) {
            updateData.validatorId = session.user.id;
        }

        // If full edit (Admin editing details)
        if (date && startTime && endTime) {
            const start = parseISO(`${date}T${startTime}`);
            const end = parseISO(`${date}T${endTime}`);

            if (end <= start) {
                return NextResponse.json({ message: "Hora final deve ser maior que inicial" }, { status: 400 });
            }

            const diffMinutes = differenceInMinutes(end, start);
            updateData.date = parseISO(date);
            updateData.startTime = start;
            updateData.endTime = end;
            updateData.totalHours = parseFloat((diffMinutes / 60).toFixed(2));
            if (description !== undefined) updateData.description = description;

            // If admin edits, we can assume they also validate/maintain current status or set to APPROVED?
            // Usually editing keeps status or might be used to fix errors. 
            // Let's trust the passed 'status' or keep existing if not passed.
        }

        const updated = await prisma.timeRecord.update({
            where: { id: parseInt(id) },
            data: updateData
        });
        return NextResponse.json(updated);
    } catch (error) {
        console.error("Error updating:", error);
        return NextResponse.json({ message: "Error updating" }, { status: 500 });
    }
}

export async function DELETE(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    if (!session.user?.isLoggedIn) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    // Only ADMIN (Master) should delete? Or Coordinator too? 
    // Requirement says "USUÁRIO MASTER". Let's restrict to ADMIN for now or both if implicit.
    // Let's allow both for flexibility but usually deleting is sensitive.
    // For now I'll check role.
    if (session.user.role !== 'ADMIN') {
        // Maybe Coordinator can delete records of their unit? 
        // Let's stick to requirement "USUÁRIO MASTER".
        return NextResponse.json({ message: "Only Admin can delete" }, { status: 403 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
        return NextResponse.json({ message: "ID required" }, { status: 400 });
    }

    try {
        await prisma.timeRecord.delete({
            where: { id: parseInt(id) }
        });
        return NextResponse.json({ message: "Deleted successfully" });
    } catch (error) {
        console.error("Error deleting:", error);
        return NextResponse.json({ message: "Error deleting" }, { status: 500 });
    }
}
