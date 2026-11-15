// src/hooks/useNow.ts
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { AppState } from 'react-native';

const MINUTE_MS = 60_000;

// Текущее время для экранов «Сегодня»/«Неделя».
// Вкладки не размонтируются, поэтому собственные `useState` + `setInterval` держали
// замороженное время: при возврате на вкладку ещё секунду было видно урок, который
// уже закончился. Здесь время обновляется сразу при входе на вкладку, ровно на границе
// минуты и при возврате приложения из фона (в фоне JS-таймеры стоят).
export function useNow(): Date {
    const [now, setNow] = useState(() => new Date());

    useFocusEffect(
        useCallback(() => {
            const tick = () => setNow(new Date());

            tick();

            let timer: ReturnType<typeof setTimeout>;
            const schedule = () => {
                timer = setTimeout(
                    () => {
                        tick();
                        schedule();
                    },
                    MINUTE_MS - (Date.now() % MINUTE_MS),
                );
            };
            schedule();

            const subscription = AppState.addEventListener('change', (state) => {
                if (state === 'active') tick();
            });

            return () => {
                clearTimeout(timer);
                subscription.remove();
            };
        }, []),
    );

    return now;
}
