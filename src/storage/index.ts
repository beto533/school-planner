import AsyncStorage from '@react-native-async-storage/async-storage';
import { ClassItem, Task } from '../types';
import { scheduleClassNotifications, cancelClassNotifications } from '../notifications';

const KEYS = {
  classes: 'classes',
  tasks: 'tasks',
};

// --- Classes ---

export async function getClasses(): Promise<ClassItem[]> {
  const raw = await AsyncStorage.getItem(KEYS.classes);
  return raw ? JSON.parse(raw) : [];
}

export async function saveClass(item: ClassItem): Promise<void> {
  const existing = await getClasses();
  const updated = [...existing, item];
  await AsyncStorage.setItem(KEYS.classes, JSON.stringify(updated));
  await scheduleClassNotifications(item);
}

export async function deleteClass(id: string): Promise<void> {
  const [existingClasses, existingTasks] = await Promise.all([getClasses(), getTasks()]);
  const updatedClasses = existingClasses.filter(c => c.id !== id);
  const updatedTasks = existingTasks.filter(t => t.classId !== id);
  await Promise.all([ 
    AsyncStorage.setItem(KEYS.classes, JSON.stringify(updatedClasses)),
    AsyncStorage.setItem(KEYS.tasks, JSON.stringify(updatedTasks)),
    cancelClassNotifications(id),
  ]);
}

// --- Tasks ---

export async function getTasks(): Promise<Task[]> {
  const raw = await AsyncStorage.getItem(KEYS.tasks);
  return raw ? JSON.parse(raw) : [];
}

export async function saveTask(task: Task): Promise<void> {
  const existing = await getTasks();
  const updated = [...existing, task];
  await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(updated));
}

export async function updateTask(updated: Task): Promise<void> {
  const existing = await getTasks();
  const list = existing.map(t => t.id === updated.id ? updated : t);
  await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(list));
}

export async function deleteTask(id: string): Promise<void> {
  const existing = await getTasks();
  const updated = existing.filter(t => t.id !== id);
  await AsyncStorage.setItem(KEYS.tasks, JSON.stringify(updated));
}