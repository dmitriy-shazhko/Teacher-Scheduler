import { SQLiteDatabase } from 'expo-sqlite';
import notifee, { AndroidVisibility, TimestampTrigger, TriggerType } from 'react-native-notify-kit';

import { getLessonsForRange } from '@/db/lessons';
import { addDays, toDate } from '@/domain/dates';
import {
    NotificationText,
    buildCurrentLessonText,
    buildEndingText,
    buildNextLessonText,
} from '@/domain/notificationTexts';
import { buildStatusTimeline } from '@/domain/statusTimeline';

import { loadSettings } from '@/db/settings';
import { SCHEDULER_WINDOW_DAYS } from '@/domain/constants';
import { StatusStep } from '@/domain/types';
import { CHANNELS } from './channels';

let lastSync: Promise<void> = Promise.resolve();

function textFor(step: StatusStep): NotificationText {
    if (step.kind === 'current') return buildCurrentLessonText(step.lesson);
    if (step.kind === 'ending') return buildEndingText(step.lesson.endTime);

    return buildNextLessonText(step.lesson)!;
}

// timeoutMs: через сколько уведомление исчезнет само (к моменту следующего состояния)
function toNotification(step: StatusStep, timeoutMs: number) {
    const text = textFor(step);

    // Таймер: до начала урока для «следующего», до конца урока для остальных
    const countdownTo = toDate(
        step.lesson.date,
        step.kind === 'upcoming' ? step.lesson.startTime : step.lesson.endTime,
    );

    return {
        id: step.id,
        title: text.title,
        body: text.body,
        android: {
            channelId: step.kind === 'ending' ? CHANNELS.endingSoon : CHANNELS.status,
            visibility: AndroidVisibility.PUBLIC,
            onlyAlertOnce: true,
            timeoutAfter: timeoutMs,
            showChronometer: true,
            chronometerDirection: 'down' as const,
            timestamp: countdownTo.getTime(),
            pressAction: { id: 'default' },
        },
    };
}

async function doSync(db: SQLiteDatabase): Promise<void> {
    // Все ещё не показанные триггеры пересобираем с нуля
    await notifee.cancelTriggerNotifications();

    const now = new Date();
    const settings = await loadSettings();
    const lessons = await getLessonsForRange(db, now, addDays(now, SCHEDULER_WINDOW_DAYS));
    const steps = buildStatusTimeline(lessons, now, settings);

    const running = steps.filter((s) => s.showAt <= now);
    const future = steps.filter((s) => s.showAt > now);

    // Убираем показанные уведомления, которых в новом плане уже нет (например, урок удалили)
    const keep = new Set(running.map((s) => s.id));
    for (const shown of await notifee.getDisplayedNotifications()) {
        if (shown.id && !keep.has(shown.id)) {
            await notifee.cancelDisplayedNotification(shown.id);
        }
    }

    // Состояние, которое идёт прямо сейчас: показываем сразу
    for (const step of running) {
        await notifee.displayNotification(
            toNotification(step, step.hideAt.getTime() - now.getTime()),
        );
    }

    // Будущие состояния: каждое срабатывает по таймеру системы и само исчезает к следующему
    for (const step of future) {
        const trigger: TimestampTrigger = {
            type: TriggerType.TIMESTAMP,
            timestamp: step.showAt.getTime(),
            alarmManager: { allowWhileIdle: true },
        };

        await notifee.createTriggerNotification(
            toNotification(step, step.hideAt.getTime() - step.showAt.getTime()),
            trigger,
        );
    }
}

export function syncNotifications(db: SQLiteDatabase): Promise<void> {
    const run = lastSync.then(() => doSync(db));
    lastSync = run.catch(() => {});

    return run;
}
