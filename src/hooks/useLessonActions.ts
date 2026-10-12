import { useLessonStore } from '@/store/lessonsStore';
import { router } from 'expo-router';
import { useSQLiteContext } from 'expo-sqlite';
import { Alert } from 'react-native';

export function useLessonActions() {
    const db = useSQLiteContext();
    const removeLesson = useLessonStore((s) => s.removeLesson);

    const addLesson = (dateStr: string) =>
        router.push({ pathname: '/lesson', params: { date: dateStr } });

    const openLesson = (id: number) =>
        router.push({ pathname: '/lesson', params: { id: String(id) } });

    const confirmRemove = (id: number) =>
        Alert.alert('Удалить урок?', '', [
            { text: 'Отмена', style: 'cancel' },
            { text: 'Удалить', style: 'destructive', onPress: () => removeLesson(db, id) },
        ]);

    return { addLesson, openLesson, confirmRemove };
}
