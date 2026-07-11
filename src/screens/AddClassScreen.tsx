import { useEffect, useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
  Modal,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import { ClassItem, DayOfWeek } from '../types';
import { saveClass } from '../storage';
import { generateId } from '../utils';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F9A825',
  '#66BB6A', '#EF5350', '#AB47BC', '#26A69A',
];

function timeToDate(time: string): Date {
  const [hours,minutes] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(hours, minutes, 0, 0);
  return d;
}

function dateToTime(date: Date): string {
  return `${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
}

function formatTimeDisplay(date: Date): string {
  const hours = date.getHours();
  const minutes = String(date.getMinutes()).padStart(2, '0');
  const ampm = hours >= 12 ? 'PM' : 'AM';
  const h = hours % 12 || 12;
  return `${h}:${minutes} ${ampm}`;
}

interface Props {
  onSaved: () => void;
  onCancel: () => void;
}

export default function AddClassScreen({ onSaved, onCancel }: Props) {
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [startTime, setStartTime] = useState<Date>(timeToDate('09:00'));
  const [endTime, setEndTime] = useState<Date>(timeToDate('10:00'));
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);
  const [notifyMinutes, setNotifyMinutes] = useState('15');
  const [selectedColor, setSelectedColor] = useState(COLORS[0]);

  function toggleDay(day: DayOfWeek) {
    setSelectedDays(prev =>
      prev.includes(day) ? prev.filter(d => d !== day) : [...prev, day]
    );
  }

  async function handleSave() {
    if (!name.trim()) {
      Alert.alert('Missing info', 'Please enter a class name.');
      return;
    }
    if (selectedDays.length === 0) {
      Alert.alert('Missing info', 'Please select at least one day.');
      return;
    }
    if (dateToTime(startTime) >= dateToTime(endTime)) {
      Alert.alert('Invalid times', 'Start time must be before end time. ');
      return;
    }

    const newClass: ClassItem = {
      id: generateId(),
      name: name.trim(),
      instructor: instructor.trim() || undefined,
      location: location.trim() || undefined,
      color: selectedColor,
      schedule: {
        days: selectedDays,
        startTime: dateToTime(startTime),
        endTime: dateToTime(endTime),
      },
      notifyMinutesBefore: parseInt(notifyMinutes) || 15,
    };

    await saveClass(newClass);
    onSaved();
  }

  return (
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.label}>Class Name *</Text>
        <TextInput
          style={styles.input}
          value={name}
          onChangeText={setName}
          placeholder="e.g. Calculus II"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Instructor</Text>
        <TextInput
          style={styles.input}
          value={instructor}
          onChangeText={setInstructor}
          placeholder="e.g. Prof. Smith"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Location</Text>
        <TextInput
          style={styles.input}
          value={location}
          onChangeText={setLocation}
          placeholder="e.g. Room 204"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Days *</Text>
        <View style={styles.daysRow}>
          {DAYS.map(day => (
            <TouchableOpacity
              key={day}
              style={[
                styles.dayButton,
                selectedDays.includes(day) && { backgroundColor: selectedColor },
              ]}
              onPress={() => toggleDay(day)}
            >
              <Text
                style={[
                  styles.dayText,
                  selectedDays.includes(day) && { color: '#fff' },
                ]}
              >
                {day}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        <Text style={styles.label}>Start Time *</Text>
        <TouchableOpacity style={styles.timeButton} onPress={() => setShowStartPicker(true)}>
          <Ionicons name="time-outline" size={18} color="#6C63FF" />
          <Text style={styles.timeButtonText}>{formatTimeDisplay(startTime)}</Text>
        </TouchableOpacity>

        <Text style={styles.label}>End Time *</Text>
        <TouchableOpacity style={styles.timeButton} onPress={() => setShowEndPicker(true)}>
          <Ionicons name="time-outline" size={18} color="#6C63FF" />
          <Text style={styles.timeButtonText}>{formatTimeDisplay(endTime)}</Text>
        </TouchableOpacity>

        <TimePickerModal
          visible={showStartPicker}
          value={startTime}
          onChange={setStartTime}
          onClose={() => setShowStartPicker(false)}
        />
        
        <TimePickerModal
          visible={showEndPicker}
          value={endTime}
          onChange={setEndTime}
          onClose={() => setShowEndPicker(false)}
        />

        <Text style={styles.label}>Notify me before class (minutes)</Text>
        <TextInput
          style={styles.input}
          value={notifyMinutes}
          onChangeText={setNotifyMinutes}
          keyboardType="numeric"
          placeholderTextColor="#999"
        />

        <Text style={styles.label}>Color</Text>
        <View style={styles.colorsRow}>
          {COLORS.map(color => (
            <TouchableOpacity
              key={color}
              style={[
                styles.colorDot,
                { backgroundColor: color },
                selectedColor === color && styles.colorDotSelected,
              ]}
              onPress={() => setSelectedColor(color)}
            />
          ))}
        </View>

        <TouchableOpacity style={[styles.saveButton, { backgroundColor: selectedColor }]} onPress={handleSave}>
          <Text style={styles.saveButtonText}>Save Class</Text>
        </TouchableOpacity>
      </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },
  content: { padding: 20, paddingBottom: 40 },
  label: { fontSize: 13, fontWeight: '600', color: '#555', marginTop: 16, marginBottom: 6 },
  input: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    fontSize: 15,
    color: '#222',
  },
  daysRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayButton: {
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 8,
    paddingVertical: 6,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  dayText: { fontSize: 13, color: '#444', fontWeight: '500' },
  colorsRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
  colorDot: { width: 32, height: 32, borderRadius: 16 },
  colorDotSelected: { borderWidth: 3, borderColor: '#222' },
  saveButton: { marginTop: 32, borderRadius: 12, padding: 16, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 16, fontWeight: '700' },
  timeButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    borderRadius: 10,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  timeButtonText: { fontSize: 15, color: '#222' },
});

function TimePickerModal({
  visible,
  value,
  onChange,
  onClose,
}: {
  visible: boolean;
  value: Date;
  onChange: (date: Date) => void;
  onClose: () => void;
}) {
  const [tempTime, setTempTime] = useState(value);

  useEffect(() => {
    setTempTime(value);
  }, [value, visible]);

  return (
    <Modal visible={visible} transparent animationType='slide'>
      <TouchableOpacity
        style={pickerStyles.overlay}
        activeOpacity={1}
        onPress={onClose}
      >
        <TouchableOpacity activeOpacity={1} style={pickerStyles.sheet}>
          <View style={pickerStyles.header}>
            <TouchableOpacity onPress={onClose}>
              <Text style={pickerStyles.cancel}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => { onChange(tempTime); onClose(); }}>
              <Text style={pickerStyles.done}>Done</Text>
            </TouchableOpacity>
          </View>

          <View style={pickerStyles.pickerContainer}>
            <DateTimePicker
              value={tempTime}
              mode="time"
              display={Platform.OS === 'ios' ? 'spinner' : 'default'}
              is24Hour={false}
              onChange={(_, date) => { if (date) setTempTime(date); }}

              themeVariant='light'
              textColor='black'
              style={pickerStyles.nativePicker}
            />
          </View>
        </TouchableOpacity>
      </TouchableOpacity>
    </Modal>
  );
}

const pickerStyles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    backgroundColor: '#fff',
  },
  pickerContainer: {
    width: '100%',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  nativePicker: {
    width: '100%',
    backgroundColor: '#fff',
  },
  cancel: { fontSize: 16, color: '#999' },
  done: { fontSize: 16, color: '#6C63FF', fontWeight: '700' },
});