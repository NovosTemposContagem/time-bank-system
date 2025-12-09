import { SessionOptions, IronSessionData } from "iron-session";

export const sessionOptions: SessionOptions = {
    password: "complex_password_at_least_32_characters_long",
    cookieName: "time_bank_session",
    cookieOptions: {
        secure: process.env.NODE_ENV === "production",
    },
};

export interface UserSession {
    id: number;
    name: string;
    email?: string;
    username: string; // email or cpf
    role: string;
    unitId: number | null;
    employeeId?: number;
    isLoggedIn: boolean;
}

declare module "iron-session" {
    interface IronSessionData {
        user?: UserSession;
    }
}
