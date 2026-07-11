import { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { ClassItem, DayOfWeek } from '../types';
import { getClasses } from '../storage';

const DAYS: DayOfWeek[] = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'];
const DAY_LABELS: Record<DayOfWeek, string> = {
  Mon: 'M', Tue: 'T', Wed: 'W', Thu: 'T', Fri: 'F', Sat: 'S', Sun: 'S',
};
const DAY_FULL: Record<DayOfWeek, string> = {
  Mon: 'Monday', Tue: 'Tuesday', Wed: 'Wednesday',
  Thu: 'Thursday', Fri: 'Friday', Sat: 'Saturday', Sun: 'Sunday',
};

// Visible time range
const START_HOUR = 7;  // 7am
const END_HOUR = 22;   // 10pm
const TOTAL_MINUTES = (END_HOUR - START_HOUR) * 60;
const HOUR_HEIGHT = 64; // pixels per hour
const TOTAL_HEIGHT = (END_HOUR - START_HOUR) * HOUR_HEIGHT;

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return h * 60 + m;
}

function minutesFromStart(time: string): number {
  return timeToMinutes(time) - START_HOUR * 60;
}

function formatHour(hour: number): string {
  if (hour === 0 || hour === 12) return `${hour === 0 ? 12 : 12} AM`;
  if (hour < 12) return `${hour} AM`;
  if (hour === 12) return `12 PM`;
  return `${hour - 12} PM`;
}

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - 48) / 7; // 48 = time label width

// JS getDay() returns 0=Sun, so map to our DayOfWeek
const JS_DAY_TO_DOW: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export default function ScheduleViewScreen() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [mode, setMode] = useState<'daily' | 'weekly'>('daily');

  const today = JS_DAY_TO_DOW[new Date().getDay()];
  const [selectedDay, setSelectedDay] = useState<DayOfWeek>(today);

  useFocusEffect(
    useCallback(() => {
      getClasses().then(setClasses);
    }, [])
  );

  const classesForDay = (day: DayOfWeek) =>
    classes
      .filter(c => c.schedule.days.includes(day))
      .sort((a, b) => a.schedule.startTime.localeCompare(b.schedule.startTime));

  return (
    <View style={styles.container}>

      {/* Mode toggle */}
      <View style={styles.toggleRow}>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'daily' && styles.toggleActive]}
          onPress={() => setMode('daily')}
        >
          <Text style={[styles.toggleText, mode === 'daily' && styles.toggleTextActive]}>
            Daily
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.toggleBtn, mode === 'weekly' && styles.toggleActive]}
          onPress={() => setMode('weekly')}
        >
          <Text style={[styles.toggleText, mode === 'weekly' && styles.toggleTextActive]}>
            Weekly
          </Text>
        </TouchableOpacity>
      </View>

      {mode === 'daily' ? (
        <DailyView
          classes={classes}
          selectedDay={selectedDay}
          today={today}
          onSelectDay={setSelectedDay}
          classesForDay={classesForDay}
        />
      ) : (
        <WeeklyView
          classes={classes}
          today={today}
          classesForDay={classesForDay}
        />
      )}

    </View>
  );
}

// --- Daily View ---

function DailyView({
  selectedDay,
  today,
  onSelectDay,
  classesForDay,
}: {
  classes: ClassItem[];
  selectedDay: DayOfWeek;
  today: DayOfWeek;
  onSelectDay: (d: DayOfWeek) => void;
  classesForDay: (d: DayOfWeek) => ClassItem[];
}) {
  const dayClasses = classesForDay(selectedDay);

  return (
    <View style={{ flex: 1 }}>
      {/* Day selector */}
      <View style={styles.daySelector}>
        {DAYS.map(day => (
          <TouchableOpacity
            key={day}
            style={[
              styles.daySelectorBtn,
              selectedDay === day && styles.daySelectorActive,
              today === day && styles.daySelectorToday,
            ]}
            onPress={() => onSelectDay(day)}
          >
            <Text style={[
              styles.daySelectorText,
              selectedDay === day && styles.daySelectorTextActive,
            ]}>
              {DAY_LABELS[day]}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <Text style={styles.dayTitle}>{DAY_FULL[selectedDay]}</Text>

      <ScrollView contentContainerStyle={styles.dailyList}>
        {dayClasses.length === 0 ? (
          <View style={styles.emptyDay}>
            <Text style={styles.emptyDayText}>No classes</Text>
          </View>
        ) : (
          dayClasses.map(item => (
            <DailyClassBlock key={item.id} item={item} />
          ))
        )}
      </ScrollView>
    </View>
  );
}

function DailyClassBlock({ item }: { item: ClassItem }) {
  const start = timeToMinutes(item.schedule.startTime);
  const end = timeToMinutes(item.schedule.endTime);
  const duration = end - start;
  const hours = Math.floor(duration / 60);
  const minutes = duration % 60;
  const durationLabel = hours > 0
    ? `${hours}h${minutes > 0 ? ` ${minutes}m` : ''}`
    : `${minutes}m`;

  return (
    <View style={[styles.dailyBlock, { borderLeftColor: item.color }]}>
      <View style={styles.dailyBlockTime}>
        <Text style={styles.dailyBlockTimeText}>
          {formatTimeStr(item.schedule.startTime)}
        </Text>
        <Text style={styles.dailyBlockDuration}>{durationLabel}</Text>
      </View>
      <View style={styles.dailyBlockContent}>
        <View style={[styles.dailyBlockDot, { backgroundColor: item.color }]} />
        <View>
          <Text style={styles.dailyBlockName}>{item.name}</Text>
          {item.location && (
            <Text style={styles.dailyBlockMeta}>{item.location}</Text>
          )}
          {item.instructor && (
            <Text style={styles.dailyBlockMeta}>{item.instructor}</Text>
          )}
        </View>
      </View>
    </View>
  );
}

// --- Weekly View ---

function WeeklyView({
  today,
  classesForDay,
}: {
  classes: ClassItem[];
  today: DayOfWeek;
  classesForDay: (d: DayOfWeek) => ClassItem[];
}) {
  return (
    <ScrollView style={{ flex: 1 }}>
      {/* Day headers */}
      <View style={styles.weekHeader}>
        <View style={{ width: 40 }} />
        {DAYS.map(day => (
          <View
            key={day}
            style={[
              styles.weekDayHeader,
              today === day && styles.weekDayHeaderToday,
            ]}
          >
            <Text style={[
              styles.weekDayHeaderText,
              today === day && styles.weekDayHeaderTextToday,
            ]}>
              {DAY_LABELS[day]}
            </Text>
          </View>
        ))}
      </View>

      {/* Grid */}
      <View style={styles.weekGrid}>
        {/* Time labels */}
        <View style={styles.timeLabels}>
          {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
            <View key={i} style={{ height: HOUR_HEIGHT }}>
              <Text style={styles.timeLabel}>{formatHour(START_HOUR + i)}</Text>
            </View>
          ))}
        </View>

        {/* Day columns */}
        {DAYS.map(day => (
          <View
            key={day}
            style={[
              styles.dayColumn,
              today === day && styles.dayColumnToday,
            ]}
          >
            {/* Hour lines */}
            {Array.from({ length: END_HOUR - START_HOUR }, (_, i) => (
              <View key={i} style={[styles.hourLine, { top: i * HOUR_HEIGHT }]} />
            ))}

            {/* Class blocks */}
            {classesForDay(day).map(item => {
              const topMinutes = minutesFromStart(item.schedule.startTime);
              const durationMinutes =
                timeToMinutes(item.schedule.endTime) - timeToMinutes(item.schedule.startTime);

              const top = (topMinutes / TOTAL_MINUTES) * TOTAL_HEIGHT;
              const height = Math.max((durationMinutes / TOTAL_MINUTES) * TOTAL_HEIGHT, 24);

              return (
                <View
                  key={item.id}
                  style={[
                    styles.weekBlock,
                    {
                      top,
                      height,
                      backgroundColor: item.color + '33', // 20% opacity
                      borderLeftColor: item.color,
                    },
                  ]}
                >
                  <Text style={[styles.weekBlockText, { color: item.color }]} numberOfLines={2}>
                    {item.name}
                  </Text>
                </View>
              );
            })}
          </View>
        ))}
      </View>
    </ScrollView>
  );
}

function formatTimeStr(time: string): string {
  const [hourStr, minute] = time.split(':');
  const hour = parseInt(hourStr);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const h = hour % 12 || 12;
  return `${h}:${minute} ${ampm}`;
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F8F8FF' },

  // Toggle
  toggleRow: {
    flexDirection: 'row',
    margin: 16,
    backgroundColor: '#EFEFEF',
    borderRadius: 10,
    padding: 3,
  },
  toggleBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleActive: { backgroundColor: '#fff', elevation: 2 },
  toggleText: { fontSize: 14, fontWeight: '600', color: '#999' },
  toggleTextActive: { color: '#6C63FF' },

  // Daily
  daySelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    gap: 6,
    marginBottom: 8,
  },
  daySelectorBtn: {
    flex: 1,
    height: 36,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFEFEF',
  },
  daySelectorActive: { backgroundColor: '#6C63FF' },
  daySelectorToday: { borderWidth: 2, borderColor: '#6C63FF' },
  daySelectorText: { fontSize: 13, fontWeight: '600', color: '#999' },
  daySelectorTextActive: { color: '#fff' },
  dayTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#222',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  dailyList: { paddingHorizontal: 16, paddingBottom: 40, gap: 10 },
  emptyDay: { alignItems: 'center', marginTop: 60 },
  emptyDayText: { fontSize: 15, color: '#CCC' },
  dailyBlock: {
    backgroundColor: '#fff',
    borderRadius: 10,
    borderLeftWidth: 4,
    padding: 12,
    flexDirection: 'row',
    gap: 12,
    elevation: 1,
  },
  dailyBlockTime: { alignItems: 'flex-end', minWidth: 48 },
  dailyBlockTimeText: { fontSize: 13, fontWeight: '600', color: '#444' },
  dailyBlockDuration: { fontSize: 11, color: '#BBB', marginTop: 2 },
  dailyBlockContent: { flex: 1, flexDirection: 'row', alignItems: 'flex-start', gap: 8 },
  dailyBlockDot: { width: 10, height: 10, borderRadius: 5, marginTop: 3 },
  dailyBlockName: { fontSize: 15, fontWeight: '700', color: '#222' },
  dailyBlockMeta: { fontSize: 12, color: '#888', marginTop: 2 },

  // Weekly
  weekHeader: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#EFEFEF',
    paddingVertical: 8,
  },
  weekDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 4,
    borderRadius: 8,
  },
  weekDayHeaderToday: { backgroundColor: '#6C63FF' },
  weekDayHeaderText: { fontSize: 13, fontWeight: '600', color: '#999' },
  weekDayHeaderTextToday: { color: '#fff' },
  weekGrid: {
    flexDirection: 'row',
    height: TOTAL_HEIGHT,
  },
  timeLabels: { width: 40, paddingTop: 0 },
  timeLabel: { fontSize: 10, color: '#BBB', textAlign: 'right', paddingRight: 4 },
  dayColumn: {
    flex: 1,
    borderLeftWidth: 1,
    borderLeftColor: '#F0F0F0',
    position: 'relative',
  },
  dayColumnToday: { backgroundColor: '#6C63FF08' },
  hourLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#F0F0F0',
  },
  weekBlock: {
    position: 'absolute',
    left: 1,
    right: 1,
    borderLeftWidth: 3,
    borderRadius: 4,
    padding: 2,
    overflow: 'hidden',
  },
  weekBlockText: { fontSize: 9, fontWeight: '700' },
});