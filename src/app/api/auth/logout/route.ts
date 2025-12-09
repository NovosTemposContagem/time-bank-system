import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSessionData } from "iron-session";
import { sessionOptions } from "@/lib/session";

export async function POST(request: NextRequest) {
    const response = new NextResponse(JSON.stringify({ isLoggedIn: false }), { status: 200 });
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    session.destroy();

    return response;
}
