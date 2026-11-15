import { colors } from '@/domain/theme';
import { DateTimePickerAndroid } from '@react-native-community/datetimepicker';
import { StyleSheet, Text } from 'react-native';

import { FormRow } from './FormRow';

interface Props {
    label: string;
    mode: 'date' | 'time';
    value: Date;
    onChange: (d: Date) => void;
    display: string;
    isLast?: boolean;
}

// общий вызов системного Android-пикера (дата на форме урока, время — в TimePickerModal)
export function openDateTimePicker(
    mode: 'date' | 'time',
    value: Date,
    onChange: (d: Date) => void,
) {
    DateTimePickerAndroid.open({
        value,
        mode,
        is24Hour: true,
        onValueChange: (_event, date) => {
            onChange(date);
        },
    });
}

export function PickerField({ label, mode, value, onChange, display, isLast }: Props) {
    const open = () => openDateTimePicker(mode, value, onChange);

    return (
        <FormRow label={label} onPress={open} isLast={isLast}>
            <Text style={styles.value}>{display}</Text>
        </FormRow>
    );
}

const styles = StyleSheet.create({
    value: { fontSize: 14, fontWeight: '700', color: colors.text },
});
