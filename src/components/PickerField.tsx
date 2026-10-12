import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { Pressable, StyleSheet, Text } from 'react-native';

interface Props {
    label: string;
    mode: 'date' | 'time';
    value: Date;
    onChange: (d: Date) => void;
    display: string;
}

export function PickerField({ label, mode, value, onChange, display }: Props) {
    const open = () =>
        DateTimePickerAndroid.open({
            value,
            mode,
            is24Hour: true,
            onValueChange: (_event, date) => {
                onChange(date);
            },
        });

    return (
        <>
            <Text style={styles.label}>{label}</Text>
            <Pressable style={styles.input} onPress={open}>
                <Text style={styles.text}>{display}</Text>
            </Pressable>
        </>
    );
}

const styles = StyleSheet.create({
    label: { fontWeight: '600', marginBottom: 4, marginTop: 12 },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        borderRadius: 8,
        padding: 10,
    },
    text: { fontSize: 16 },
});
