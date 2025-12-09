import { differenceInMinutes, parseISO } from "date-fns";

/**
 * Calculates the difference in minutes between two dates.
 * Uses string input "YYYY-MM-DD" and "HH:mm" usually, but here we expect
 * full Date objects or ISO strings if passed directly from DB.
 * 
 * If passing raw times from inputs (e.g. "09:00", "18:00") and a date reference:
 * Construct full ISO strings first.
 */
export function getDurationInMinutes(start: Date | string, end: Date | string): number {
    const startDate = typeof start === 'string' ? new Date(start) : start;
    const endDate = typeof end === 'string' ? new Date(end) : end;
    return differenceInMinutes(endDate, startDate);
}

/**
 * Formats minutes into "HH:mm" string.
 * Example: 90 -> "01:30"
 * Example: 65 -> "01:05"
 */
export function formatMinutesToHM(minutes: number): string {
    const h = Math.floor(minutes / 60);
    const m = Math.round(minutes % 60); // Round to handle floating point errors if any input was loose

    // Pad with zeros
    const hStr = h < 10 ? `0${h}` : `${h}`;
    const mStr = m < 10 ? `0${m}` : `${m}`;

    return `${hStr}:${mStr}h`;
}
