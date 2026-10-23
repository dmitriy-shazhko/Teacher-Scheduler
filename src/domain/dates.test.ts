import {
    addDays,
    addMinutesToTime,
    dateToTime,
    daysBetween,
    formatDateRu,
    formatShort,
    formatWeek,
    parseDate,
    startOfWeek,
    timeToDate,
    toDate,
    toDateString,
} from '@/domain/dates';

describe('toDateString', () => {
    it.each([
        ['обычная дата', new Date(2026, 9, 5), '2026-10-05'],
        ['нули в месяце и дне', new Date(2026, 0, 1), '2026-01-01'],
        ['конец года', new Date(2026, 11, 31), '2026-12-31'],
        // В Берлине 00:30 локально — это ещё предыдущие сутки в UTC.
        // Тест ловит замену на toISOString().
        ['00:30 локального времени', new Date(2026, 9, 5, 0, 30), '2026-10-05'],
        ['23:59 локального времени', new Date(2026, 9, 5, 23, 59), '2026-10-05'],
    ])('%s', (_title, date, expected) => {
        expect(toDateString(date)).toBe(expected);
    });
});

describe('parseDate', () => {
    it('возвращает локальную полночь указанной даты', () => {
        const d = parseDate('2026-10-05');

        expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 5]);
        expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([0, 0, 0]);
    });

    it('обратима вместе с toDateString', () => {
        expect(toDateString(parseDate('2026-01-09'))).toBe('2026-01-09');
    });
});

describe('addDays', () => {
    it.each([
        ['обычный сдвиг', '2026-10-05', 3, '2026-10-08'],
        ['ноль дней', '2026-10-05', 0, '2026-10-05'],
        ['через границу месяца', '2026-10-30', 3, '2026-11-02'],
        ['через границу года', '2026-12-31', 1, '2027-01-01'],
        ['29 февраля високосного года', '2028-02-28', 1, '2028-02-29'],
        ['назад через границу месяца', '2026-03-01', -1, '2026-02-28'],
        ['через переход на зимнее время', '2026-10-24', 2, '2026-10-26'],
        ['через переход на летнее время', '2026-03-28', 2, '2026-03-30'],
    ])('%s', (_title, start, n, expected) => {
        expect(toDateString(addDays(parseDate(start), n))).toBe(expected);
    });

    it('после перехода на зимнее время остаётся ровно полночь', () => {
        const d = addDays(new Date(2026, 9, 24), 2);

        expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
    });

    it('обнуляет время суток', () => {
        const d = addDays(new Date(2026, 9, 5, 15, 30), 1);

        expect([d.getHours(), d.getMinutes()]).toEqual([0, 0]);
    });
});

describe('startOfWeek', () => {
    it.each([
        ['понедельник', '2026-10-05', '2026-10-05'],
        ['среда', '2026-10-07', '2026-10-05'],
        ['суббота', '2026-10-10', '2026-10-05'],
        ['воскресенье (в JS это 0)', '2026-10-11', '2026-10-05'],
        ['через границу месяца', '2026-11-01', '2026-10-26'],
        ['через границу года', '2027-01-01', '2026-12-28'],
        ['воскресенье в день перехода на зимнее время', '2026-10-25', '2026-10-19'],
        ['понедельник после перехода на зимнее время', '2026-10-26', '2026-10-26'],
        ['воскресенье в день перехода на летнее время', '2026-03-29', '2026-03-23'],
    ])('%s', (_title, date, expected) => {
        expect(toDateString(startOfWeek(parseDate(date)))).toBe(expected);
    });
});

describe('daysBetween', () => {
    it.each([
        ['одна и та же дата', '2026-10-05', '2026-10-05', 0],
        ['неделя вперёд', '2026-10-05', '2026-10-12', 7],
        ['неделя назад', '2026-10-12', '2026-10-05', -7],
        ['через переход на зимнее время (25-часовые сутки)', '2026-10-24', '2026-10-26', 2],
        ['через переход на летнее время (23-часовые сутки)', '2026-03-28', '2026-03-30', 2],
    ])('%s', (_title, a, b, expected) => {
        expect(daysBetween(parseDate(a), parseDate(b))).toBe(expected);
    });
});

describe('formatShort', () => {
    it.each([
        ['2026-10-05', '5 окт'],
        ['2026-01-31', '31 янв'],
        ['2026-05-09', '9 мая'],
        ['2026-12-01', '1 дек'],
    ])('%s → %s', (date, expected) => {
        expect(formatShort(parseDate(date))).toBe(expected);
    });

    it('названия всех двенадцати месяцев на своих местах', () => {
        const names = [
            'янв',
            'фев',
            'мар',
            'апр',
            'мая',
            'июн',
            'июл',
            'авг',
            'сен',
            'окт',
            'ноя',
            'дек',
        ];

        names.forEach((name, month) => {
            expect(formatShort(new Date(2026, month, 15))).toBe(`15 ${name}`);
        });
    });
});

describe('formatWeek', () => {
    it.each([
        ['2026-10-05', '5 окт – 11 окт'],
        ['2026-10-26', '26 окт – 1 ноя'],
        ['2026-12-28', '28 дек – 3 янв'],
    ])('понедельник %s → %s', (monday, expected) => {
        expect(formatWeek(parseDate(monday))).toBe(expected);
    });
});

describe('formatDateRu', () => {
    it.each([
        ['2026-10-05', '05.10.2026'],
        ['2026-12-31', '31.12.2026'],
    ])('%s → %s', (date, expected) => {
        expect(formatDateRu(date)).toBe(expected);
    });
});

describe('toDate', () => {
    it('собирает локальную дату из даты и времени', () => {
        const d = toDate('2026-10-05', '08:30');

        expect([d.getFullYear(), d.getMonth(), d.getDate()]).toEqual([2026, 9, 5]);
        expect([d.getHours(), d.getMinutes(), d.getSeconds()]).toEqual([8, 30, 0]);
    });
});

describe('timeToDate', () => {
    beforeEach(() => {
        jest.useFakeTimers({ now: new Date(2026, 9, 5, 12, 0) });
    });

    afterEach(() => {
        jest.useRealTimers();
    });

    it('ставит время на сегодняшнюю дату', () => {
        const d = timeToDate('08:30');

        expect(toDateString(d)).toBe('2026-10-05');
        expect([d.getHours(), d.getMinutes(), d.getSeconds(), d.getMilliseconds()]).toEqual([
            8, 30, 0, 0,
        ]);
    });
});

describe('dateToTime', () => {
    it.each([
        [new Date(2026, 9, 5, 8, 5), '08:05'],
        [new Date(2026, 9, 5, 0, 0), '00:00'],
        [new Date(2026, 9, 5, 23, 59), '23:59'],
    ])('%#', (date, expected) => {
        expect(dateToTime(date)).toBe(expected);
    });

    it('обратима вместе с timeToDate', () => {
        expect(dateToTime(timeToDate('08:30'))).toBe('08:30');
    });
});

describe('addMinutesToTime', () => {
    it.each([
        ['08:30', 45, '09:15'],
        ['08:50', 20, '09:10'],
        ['08:30', 0, '08:30'],
        ['08:00', 5, '08:05'],
        ['00:00', 5, '00:05'],
        ['23:14', 45, '23:59'],
        ['23:30', 45, '23:59'],
        ['23:59', 1, '23:59'],
        ['00:00', 1440, '23:59'],
        ['08:00', 360, '14:00'],
        ['20:00', 360, '23:59'],
    ])('%s + %i мин → %s', (time, minutes, expected) => {
        expect(addMinutesToTime(time, minutes)).toBe(expected);
    });
});
