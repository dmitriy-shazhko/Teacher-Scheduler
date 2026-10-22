describe('часовой пояс тестов', () => {
    it('зафиксирован на Europe/Berlin (летнее и зимнее время различаются)', () => {
        expect(new Date(2026, 6, 1, 12).getTimezoneOffset()).toBe(-120);
        expect(new Date(2026, 0, 1, 12).getTimezoneOffset()).toBe(-60);
    });
});
