export function toDateString(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
}

// "2026-10-05" -> Date (в локальном времени)
export function parseDate(s: string): Date {
    const [y, m, d] = s.split('-').map(Number);
    return new Date(y, m - 1, d);
}

export function addDays(d: Date, n: number): Date {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate() + n);
}

// понедельник той недели, в которую попадает дата
export function startOfWeek(d: Date): Date {
    const weekday = d.getDay() === 0 ? 7 : d.getDay(); // JS: вс = 0
    return addDays(d, -(weekday - 1));
}
// сколько дней от a до b
export function daysBetween(a: Date, b: Date): number {
    return Math.round((b.getTime() - a.getTime()) / 86400000);
}

const MONTHS = ['янв', 'фев', 'мар', 'апр', 'мая', 'июн', 'июл', 'авг', 'сен', 'окт', 'ноя', 'дек'];

export function formatShort(d: Date): string {
    return `${d.getDate()} ${MONTHS[d.getMonth()]}`;
}

// "5 окт – 11 окт"
export function formatWeek(monday: Date): string {
    return `${formatShort(monday)} – ${formatShort(addDays(monday, 6))}`;
}

// "08:30" -> Date (сегодняшняя дата с этим временем)
export function timeToDate(t: string): Date {
    const [h, m] = t.split(':').map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d;
}

// Date -> "08:30"
export function dateToTime(d: Date): string {
    const h = String(d.getHours()).padStart(2, '0');
    const m = String(d.getMinutes()).padStart(2, '0');
    return `${h}:${m}`;
}

export function formatDateRu(s: string): string {
    const [y, m, d] = s.split('-');

    return `${d}.${m}.${y}`;
}

export function toDate(date: string, time: string): Date {
    const [year, month, day] = date.split('-').map(Number);
    const [hours, minutes] = time.split(':').map(Number);

    return new Date(year, month - 1, day, hours, minutes);
}
