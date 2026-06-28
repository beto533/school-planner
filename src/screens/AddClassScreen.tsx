import { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { ClassItem, DayOfWeek } from '../types';
import { saveClass } from '../storage';
import { generateId } from '../utils';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];

const COLORS = [
  '#6C63FF', '#FF6584', '#43BCCD', '#F9A825',
  '#66BB6A', '#EF5350', '#AB47BC', '#26A69A',
];

interface Props {
  onSaved: () => void;
}

export default function AddClassScreen({ onSaved }: Props) {
  const [name, setName] = useState('');
  const [instructor, setInstructor] = useState('');
  const [location, setLocation] = useState('');
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>([]);
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
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
    if (!startTime || !endTime) {
      Alert.alert('Missing info', 'Please enter start and end times.');
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
        startTime,
        endTime,
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

      <Text style={styles.label}>Start Time * (HH:MM, 24hr)</Text>
      <TextInput
        style={styles.input}
        value={startTime}
        onChangeText={setStartTime}
        placeholder="e.g. 09:00"
        placeholderTextColor="#999"
        keyboardType="numeric"
        maxLength={5}
      />

      <Text style={styles.label}>End Time * (HH:MM, 24hr)</Text>
      <TextInput
        style={styles.input}
        value={endTime}
        onChangeText={setEndTime}
        placeholder="e.g. 10:30"
        placeholderTextColor="#999"
        keyboardType="numeric"
        maxLength={5}
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
});