import { useState, useCallback } from "react";
import { useFocusEffect } from "@react-navigation/native";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    TextInput,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { ClassItem, Task } from "../types";
import { getClasses, getTasks, saveTask, updateTask, deleteTask } from "../storage";
import { generateId } from "../utils";

export default function TasksScreen() {
    const [classes, setClasses] = useState<ClassItem[]>([]);
    const [tasks, setTasks] = useState<Task[]>([]);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [adding, setAdding] = useState(false);
    const [newTaskTitle, setNewTaskTitle] = useState('');

    useFocusEffect(
        useCallback(() => {
            async function load() {
                const [cls, tsk] = await Promise.all([getClasses(), getTasks()]);
                setClasses(cls);
                setTasks(tsk);
                if (cls.length > 0 && !selectedClassId) {
                    setSelectedClassId(cls[0].id);
                }
            }
            load();
        }, [])
    );

    const selectedClass = classes.find(c => c.id === selectedClassId);
    const visibleTasks = tasks.filter(t => t.classId === selectedClassId);
    const pending = visibleTasks.filter(t => !t.completed);
    const completed = visibleTasks.filter(t => t.completed);

    async function handleAddTask() {
        if (!newTaskTitle.trim() || !selectedClassId) return;

        const task: Task = {
            id: generateId(),
            classId: selectedClassId,
            title: newTaskTitle.trim(),
            completed: false,
            createdAt: new Date().toISOString(),
        };

        await saveTask(task);
        setTasks(prev => [...prev, task]);
        setNewTaskTitle('');
        setAdding(false);
    }

    async function handleToggle(task: Task) {
        const updated = { ...task, completed: !task.completed };
        await updateTask(updated);
        setTasks(prev => prev.map(t => t.id === updated.id ? updated : t));
    }

    function handleDelete(task: Task) {
        Alert.alert('Delete Task', `Remove ${task.title}?`, [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Delete',
                style: 'destructive',
                onPress: async () => {
                    await deleteTask(task.id);
                    setTasks(prev => prev.filter(t => t.id !== task.id));
                },
            },
        ]);
    }

    if (classes.length === 0) {
        return (
            <View style={styles.empty}>
                <Ionicons name="book-outline" size={48} color="#CCC" />
                <Text style={styles.emptyText}>No classes yet</Text>
                <Text style={styles.emptySubtext}>Add a class in the Schedule tab first</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>

            {/* Class selector */}
            <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.classBar}
                contentContainerStyle={styles.classBarContent}
            >
                {classes.map(cls => (
                    <TouchableOpacity
                        key={cls.id}
                        style={[
                            styles.classChip,
                            selectedClassId === cls.id && { backgroundColor: cls.color },
                        ]}
                        onPress={() => setSelectedClassId(cls.id)}
                    >
                        <Text
                            style={[
                                styles.classChipText,
                                selectedClassId === cls.id && { color: '#fff' },
                            ]}
                        >
                            {cls.name}
                        </Text>
                    </TouchableOpacity>
                ))}
            </ScrollView>

            {/* Task list */}
            <ScrollView contentContainerStyle={styles.list}>

                {visibleTasks.length === 0 && !adding && (
                    <View style={styles.empty}>
                        <Ionicons name="checkmark-done-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No tasks yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to add one for {selectedClass?.name}</Text>
                    </View>
                )}

                {/* Pending tasks */}
                {pending.map(task => (
                    <TaskRow
                        key={task.id}
                        task={task}
                        color={selectedClass?.color ?? '#6C63FF'}
                        onToggle={() => handleToggle(task)}
                        onDelete={() => handleDelete(task)}
                    />
                ))}

                {/* Completed section */}
                {completed.length > 0 && (
                    <>
                        <Text style={styles.sectionLabel}>Completed</Text>
                        {completed.map(task => (
                            <TaskRow
                                key={task.id}
                                task={task}
                                color={selectedClass?.color ?? '#6C63FF'}
                                onToggle={() => handleToggle(task)}
                                onDelete={() => handleDelete(task)}
                            />
                        ))}
                    </>
                )}

                {/* Inline add input */}
                {adding && (
                    <View style={styles.addRow}>
                        <TextInput
                            style={styles.addInput}
                            value={newTaskTitle}
                            onChangeText={setNewTaskTitle}
                            placeholder="Task title..."
                            placeholderTextColor="#999"
                            autoFocus
                            onSubmitEditing={handleAddTask}
                            returnKeyType="done"
                        />
                        <TouchableOpacity onPress={handleAddTask} style={styles.addConfirm}>
                            <Ionicons name="checkmark" size={22} color="#fff" />
                        </TouchableOpacity>
                        <TouchableOpacity onPress={() => setAdding(false)} style={styles.addCancel}>
                            <Ionicons name="close" size={22} color="#999" />
                        </TouchableOpacity>
                    </View>
                )}

            </ScrollView>

            {/* FAB */}
            {!adding && (
                <TouchableOpacity
                    style={[styles.fab, { backgroundColor: selectedClass?.color ?? '#6C63FF' }]}
                    onPress={() => setAdding(true)}
                >
                    <Ionicons name="add" size={28} color="#fff" />
                </TouchableOpacity>
            )}

        </View>
    );
}

// Separate component for a single task row
function TaskRow({
    task,
    color,
    onToggle,
    onDelete,
}: {
    task: Task;
    color: string;
    onToggle: () => void;
    onDelete: () => void;
}) {
    return (
        <View style={styles.taskRow}>
            <TouchableOpacity onPress={onToggle} style={styles.taskCheck}>
                <Ionicons
                    name={task.completed ? 'checkmark-circle' : 'ellipse-outline'}
                    size={24}
                    color={task.completed ? color : '#CCC'}
                />
            </TouchableOpacity>
            <Text style={[styles.taskTitle, task.completed && styles.taskDone]}>
                {task.title}
            </Text>
            <TouchableOpacity onPress={onDelete} style={styles.taskDelete}>
                <Ionicons name="trash-outline" size={18} color="#FF6584" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8FF' },
    classBar: { maxHeight: 56, borderBottomWidth: 1, borderBottomColor: '#EFEFEF' },
    classBarContent: { paddingHorizontal: 12, paddingVertical: 10, gap: 8, flexDirection: 'row' },
    classChip: {
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 20,
        backgroundColor: '#EFEFEF',
    },
    classChipText: { fontSize: 13, fontWeight: '600', color: '#555' },
    list: { padding: 16, paddingBottom: 100 },
    sectionLabel: { fontSize: 12, fontWeight: '700', color: '#BBB', marginTop: 20, marginBottom: 8, textTransform: 'uppercase' },
    taskRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 8,
        padding: 12,
        elevation: 1,
    },
    taskCheck: { marginRight: 12 },
    taskTitle: { flex: 1, fontSize: 15, color: '#222' },
    taskDone: { textDecorationLine: 'line-through', color: '#BBB' },
    taskDelete: { paddingLeft: 12 },
    addRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#fff',
        borderRadius: 10,
        marginBottom: 8,
        padding: 8,
        elevation: 1,
        gap: 8,
    },
    addInput: { flex: 1, fontSize: 15, color: '#222', padding: 4 },
    addConfirm: { backgroundColor: '#6C63FF', borderRadius: 8, padding: 6 },
    addCancel: { padding: 6 },
    fab: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', marginTop: 80, gap: 8 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#BBB' },
    emptySubtext: { fontSize: 14, color: '#CCC', textAlign: 'center' },
});