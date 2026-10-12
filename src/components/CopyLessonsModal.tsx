import { formatWeek, toDateString } from '@/domain/dates';
import { CopyLessonsSource } from '@/domain/types';
import { Modal, Pressable, StyleSheet, Text, View } from 'react-native';

interface Props {
    targetWeekStart: Date;
    sources: CopyLessonsSource[];
    isOpen: boolean;
    onClose: () => void;
    pickSource: (sourceWeekStart: Date) => void;
}

export function CopyLessonsModal({ isOpen, targetWeekStart, sources, onClose, pickSource }: Props) {
    return (
        <Modal visible={isOpen} transparent animationType='fade' onRequestClose={onClose}>
            <View style={styles.backdrop}>
                <View style={styles.sheet}>
                    <Text style={styles.sheetTitle}>Какую неделю скопировать?</Text>
                    <Text style={styles.sheetSub}>
                        Копия появится на неделе {formatWeek(targetWeekStart)}
                    </Text>

                    {sources.length === 0 ? (
                        <Text style={styles.empty}>В предыдущих 8 неделях уроков не найдено</Text>
                    ) : (
                        sources.map((s) => (
                            <Pressable
                                key={toDateString(s.start)}
                                style={styles.sourceRow}
                                onPress={() => pickSource(s.start)}
                            >
                                <Text style={styles.sourceText}>{formatWeek(s.start)}</Text>
                                <Text style={styles.sourceCount}>уроков: {s.count}</Text>
                            </Pressable>
                        ))
                    )}

                    <Pressable style={styles.cancel} onPress={onClose}>
                        <Text style={styles.cancelText}>Отмена</Text>
                    </Pressable>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    empty: { color: '#888', marginBottom: 4 },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(0,0,0,0.4)',
        justifyContent: 'center',
        padding: 24,
    },
    sheet: { backgroundColor: 'white', borderRadius: 12, padding: 16 },
    sheetTitle: { fontSize: 20, fontWeight: 'bold' },
    sheetSub: { color: '#666', marginTop: 4, marginBottom: 12 },
    sourceRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        padding: 14,
        borderRadius: 8,
        backgroundColor: '#eef',
        marginBottom: 8,
    },
    sourceText: { fontSize: 16, fontWeight: '600' },
    sourceCount: { color: '#555' },
    cancel: { padding: 12, marginTop: 4 },
    cancelText: { textAlign: 'center', color: '#4a4ae0', fontWeight: '600' },
});
