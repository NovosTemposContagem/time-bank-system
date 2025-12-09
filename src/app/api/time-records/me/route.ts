import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSessionData } from "iron-session";
import { sessionOptions } from "@/lib/session";
import { prisma } from "@/lib/prisma";
import { differenceInMinutes } from "date-fns";

export async function GET(request: NextRequest) {
    const session = await getIronSession<IronSessionData>(request, new NextResponse(), sessionOptions);
    const user = session.user;

    if (!user || !user.isLoggedIn || !user.employeeId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const records = await prisma.timeRecord.findMany({
        where: { employeeId: user.employeeId },
        orderBy: { date: 'desc' },
        include: { employee: true } // optional
    });

    return NextResponse.json(records);
}

export async function POST(request: NextRequest) {
    const session = await getIronSession<IronSessionData>(request, new NextResponse(), sessionOptions);
    const user = session.user;

    if (!user || !user.isLoggedIn || !user.employeeId) {
        return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    try {
        const body = await request.json();
        const { date, startTime, endTime, description } = body;

        const start = new Date(`${date}T${startTime}`);
        const end = new Date(`${date}T${endTime}`);

        const diffMinutes = differenceInMinutes(end, start);
        // Still storing as float for DB compatibility, but UI handles new math
        const totalHours = parseFloat((diffMinutes / 60).toFixed(2));

        const record = await prisma.timeRecord.create({
            data: {
                employeeId: user.employeeId,
                date: new Date(date),
                startTime: start,
                endTime: end,
                totalHours,
                description,
                status: 'PENDING'
            }
        });

        return NextResponse.json(record, { status: 201 });
    } catch (error) {
        console.error(error);
        return NextResponse.json({ message: "Error creating record" }, { status: 500 });
    }
}
