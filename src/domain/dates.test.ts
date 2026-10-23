import { addMinutesToTime } from '@/domain/dates';

describe('addMinutesToTime', () => {
    it.each([
        ['08:30', 45, '09:15'],
        ['08:30', 0, '08:30'],
        ['08:00', 5, '08:05'],
        ['00:00', 5, '00:05'],
        ['08:50', 20, '09:10'],
        ['23:30', 45, '23:59'],
        ['23:14', 45, '23:59'],
        ['23:59', 1, '23:59'],
        ['23:59', 0, '23:59'],
        ['00:00', 1440, '23:59'],
        ['08:00', 360, '14:00'],
        ['20:00', 360, '23:50'],
    ])('%s + %i мин → %s', (time, minutes, expected) => {
        expect(addMinutesToTime(time, minutes)).toBe(expected);
    });
});
