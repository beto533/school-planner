import { useState, useCallback } from "react";
import {
    View,
    Text,
    ScrollView,
    StyleSheet,
    TouchableOpacity,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { useFocusEffect } from "@react-navigation/native";
import { ClassItem, Task, DayOfWeek } from "../types";
import { getClasses, getTasks, updateTask } from "../storage";

// import AsyncStorage from "@react-native-async-storage/async-storage";

// Maps JS getDay() (0=Sunday) to our DayOfWeek type
const DAY_MAP: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

function getNextClass(classes: ClassItem[]): ClassItem | null {
    const now = new Date();
    const today = DAY_MAP[now.getDay()];
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;

    // Classes that meet today and haven't ended yet
    const todayClasses = classes.filter(
        c => c.schedule.days.includes(today) && c.schedule.endTime > currentTime
    );

    if (todayClasses.length === 0) return null;

    // Sort by start time and return the earliest upcoming one
    return todayClasses.sort((a, b) =>
        a.schedule.startTime.localeCompare(b.schedule.startTime)
    )[0];
}

function formatTime(time: string): string {
    const [hourStr, minute] = time.split(':');
    const hour = parseInt(hourStr);
    const ampm = hour >= 12 ? 'PM' : 'AM';
    const hour12 = hour % 12 || 12;
    return `${hour12}:${minute} ${ampm}`;
}

function getUpcomingTasks(tasks: Task[], classes: ClassItem[]): (Task & { className: string; classColor: string })[] {
    const classMap = Object.fromEntries(classes.map(c => [c.id, c]));

    return tasks
        .filter(t => !t.completed)
        .map(t => ({
        ...t,
        className: classMap[t.classId]?.name ?? 'Unknown',
        classColor: classMap[t.classId]?.color ?? '#999',
        }))
        .sort((a, b) => {
        // Tasks with due dates come first
        if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
        if (a.dueDate) return -1;
        if (b.dueDate) return 1;
        return a.createdAt.localeCompare(b.createdAt);
        })
        .slice(0, 5); // Show at most 5
}

export default function HomeScreen() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);

    useFocusEffect(
        useCallback(() => {
            async function load() {
                const [cls, tsk] = await Promise.all([getClasses(), getTasks()]);
                setClasses(cls);
                setTasks(tsk);
            }
            load();
        }, [])
    );

    const nextClass = getNextClass(classes);
    const upcomingTasks = getUpcomingTasks(tasks, classes);
    const now = new Date();
    const greeting = now.getHours() < 12 ? 'Good morning' : now.getHours() < 17 ? 'Good afternoon' : 'Good evening';
    
    // async function clearAll() {
    //     await AsyncStorage.clear();
    //     setClasses([]);
    //     setTasks([]);
    // }

    async function handleCompleteTask(task: Task) {
        const updated = { ...task, completed: true };
        await updateTask(updated);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }

    return (
        <ScrollView style={styles.container} contentContainerStyle={styles.content}>

            {/* Greeting */}
            <Text style={styles.greeting}>{greeting} 👋</Text>
            <Text style={styles.date}>
                {now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </Text>

            {/* <TouchableOpacity onPress={clearAll} style={{ backgroundColor: '#FF6584', padding: 8, borderRadius: 8, marginBottom: 16 }}>
                <Text style={{ color: '#fff', textAlign: 'center' }}>Clear Storage (dev only)</Text>
            </TouchableOpacity> */}

            {/* Next class card */}
            <Text style={styles.sectionLabel}>Next Class</Text>
            {nextClass ? (
                <View style={[styles.nextClassCard, { borderLeftColor: nextClass.color }]}>
                    <View style={styles.nextClassTop}>
                        <Text style={styles.nextClassName}>{nextClass.name}</Text>
                        <View style={[styles.colorDot, { backgroundColor: nextClass.color }]} />
                    </View>
                    {nextClass.instructor && (
                        <Text style={styles.nextClassMeta}>
                        <Ionicons name="person-outline" size={13} /> {nextClass.instructor}
                        </Text>
                    )}
                    {nextClass.location && (
                        <Text style={styles.nextClassMeta}>
                        <Ionicons name="location-outline" size={13} /> {nextClass.location}
                        </Text>
                    )}
                    <Text style={styles.nextClassTime}>
                        <Ionicons name="time-outline" size={13} /> {formatTime(nextClass.schedule.startTime)} – {formatTime(nextClass.schedule.endTime)}
                    </Text>
                </View>
            ) : (
                <View style={styles.emptyCard}>
                    <Ionicons name="checkmark-circle-outline" size={28} color="#CCC" />
                    <Text style={styles.emptyCardText}>No more classes today!</Text>
                </View>
            )}

            {/* Upcoming tasks */}
            <Text style={styles.sectionLabel}>Upcoming Tasks</Text>
            {upcomingTasks.length === 0 ? (
                <View style={styles.emptyCard}>
                    <Ionicons name="checkmark-circle-outline" size={28} color="#CCC" />
                    <Text style={styles.emptyCardText}>All caught up!</Text>
                </View>
            ) : (
                upcomingTasks.map(task => (
                    <View key={task.id} style={styles.taskCard}>
                        <View style={[styles.taskAccent, { backgroundColor: task.classColor }]} />
                        <View style={styles.taskContent}>
                            <Text style={styles.taskTitle}>{task.title}</Text>
                            <Text style={styles.taskClass}>{task.className}</Text>
                        </View>
                        {task.dueDate && (
                            <Text style={styles.taskDue}>
                                Due: {new Date(task.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                            </Text>
                        )}
                        <TouchableOpacity
                            onPress={() => handleCompleteTask(task)}
                            style={styles.taskCompleteBtn}
                        >
                            <Ionicons name="checkmark-circle-outline" size={24} color="#CCC" />
                        </TouchableOpacity>
                    </View>
                ))
            )}

        </ScrollView>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8FF' },
    content: { padding: 20, paddingBottom: 40 },
    greeting: { fontSize: 26, fontWeight: '800', color: '#222', marginTop: 8 },
    date: { fontSize: 14, color: '#999', marginTop: 4, marginBottom: 24 },
    sectionLabel: {
        fontSize: 12,
        fontWeight: '700',
        color: '#BBB',
        textTransform: 'uppercase',
        letterSpacing: 1,
        marginBottom: 10,
        marginTop: 8,
    },
    nextClassCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 16,
        borderLeftWidth: 5,
        elevation: 2,
        marginBottom: 24,
        gap: 6,
    },
    nextClassTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    nextClassName: { fontSize: 18, fontWeight: '700', color: '#222' },
    colorDot: { width: 12, height: 12, borderRadius: 6 },
    nextClassMeta: { fontSize: 13, color: '#666' },
    nextClassTime: { fontSize: 14, fontWeight: '600', color: '#444', marginTop: 4 },
    emptyCard: {
        backgroundColor: '#fff',
        borderRadius: 12,
        padding: 20,
        alignItems: 'center',
        gap: 8,
        elevation: 1,
        marginBottom: 24,
    },
    emptyCardText: { fontSize: 14, color: '#CCC' },
    taskCard: {
        backgroundColor: '#fff',
        borderRadius: 10,
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 8,
        overflow: 'hidden',
        elevation: 1,
    },
    taskAccent: { width: 5, alignSelf: 'stretch' },
    taskContent: { flex: 1, padding: 12, gap: 2 },
    taskTitle: { fontSize: 14, fontWeight: '600', color: '#222' },
    taskClass: { fontSize: 12, color: '#999' },
    taskDue: { fontSize: 12, color: '#999', paddingRight: 0 },
    taskCompleteBtn: { paddingHorizontal: 12 },
});