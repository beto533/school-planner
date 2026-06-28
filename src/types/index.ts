export type DayOfWeek = 'Mon' | 'Tue' | 'Wed' | 'Thu' | 'Fri' | 'Sat' | 'Sun';

export interface ClassItem {
  id: string;
  name: string;
  instructor?: string;
  location?: string;
  color: string;
  schedule: {
    days: DayOfWeek[];
    startTime: string; // "HH:MM" 24hr format
    endTime: string;
  };
  notifyMinutesBefore: number;
}

export interface Task {
  id: string;
  classId: string;
  title: string;
  dueDate?: string; // ISO string
  completed: boolean;
  createdAt: string; // ISO string
}