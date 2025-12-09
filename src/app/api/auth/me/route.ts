import { NextRequest, NextResponse } from "next/server";
import { getIronSession, IronSessionData } from "iron-session";
import { sessionOptions } from "@/lib/session";

export async function GET(request: NextRequest) {
    const response = new NextResponse();
    const session = await getIronSession<IronSessionData>(request, response, sessionOptions);

    if (session.user?.isLoggedIn) {
        return NextResponse.json(session.user);
    }

    return NextResponse.json({
        isLoggedIn: false,
    });
}
