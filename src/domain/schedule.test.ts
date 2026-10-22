import { toMinutes } from '@/domain/schedule';

describe('toMinutes', () => {
    it.each([
        ['00:00', 0],
        ['08:30', 510],
        ['09:05', 545],
        ['23:59', 1439],
    ])('%s → %i мин', (time, expected) => {
        expect(toMinutes(time)).toBe(expected);
    });
});
