import * as Notifications from 'expo-notifications';
import * as Device from 'expo-device';
import { Platform } from 'react-native';
import { ClassItem, DayOfWeek } from './types';

const DAY_MAP: DayOfWeek[] = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

Notifications.setNotificationHandler({
    handleNotification: async () => ({
        shouldShowAlert: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
        shouldShowBanner: true,
        shouldShowList: true,
    }),
});

export async function requestNotificationPermission(): Promise<boolean> {
    if (!Device.isDevice) {
        return false;
    }

    if (Platform.OS === 'android') {
        await Notifications.setNotificationChannelAsync('class-reminders', {
            name: 'Class Reminders',
            importance: Notifications.AndroidImportance.HIGH,
            sound: 'default',
        });
    }

    const { status: existingStatus } = await Notifications.getPermissionsAsync();
    if (existingStatus === 'granted') return true;

    const { status } = await Notifications.requestPermissionsAsync();
    return status === 'granted';
}

// Returns next N dates for a given day of week starting from today
function getUpcomingDatesForDay(day: DayOfWeek, weeksAhead: number): Date[] {
    const targetDayIndex = DAY_MAP.indexOf(day);
    const dates: Date[] = [];
    const now = new Date();

    for (let week = 0; week < weeksAhead; week++) {
        const date = new Date(now);
        const currentDay = date.getDay();
        let daysUntilTarget = targetDayIndex - currentDay;
        if (daysUntilTarget < 0) daysUntilTarget += 7;
        if (daysUntilTarget === 0 && week === 0) {
        // today — include it, the time check below handles past times
        }
        date.setDate(date.getDate() + daysUntilTarget + week * 7);
        dates.push(date);
    }

    return dates;
}

export async function scheduleClassNotifications(item: ClassItem): Promise<void> {
    const [hourStr, minuteStr] = item.schedule.startTime.split(':');
    const classHour = parseInt(hourStr, 10);
    const classMinute = parseInt(minuteStr, 10);

    for (const day of item.schedule.days) {
        // gets 4 weeks worth of class notifications
        const dates = getUpcomingDatesForDay(day, 4);

        for (const date of dates) {
            // notification fire time
            const notifyTime = new Date(date);
            notifyTime.setHours(classHour, classMinute - item.notifyMinutesBefore, 0, 0);

            if (notifyTime <= new Date()) continue;

            await Notifications.scheduleNotificationAsync({
                identifier: `${item.id}-${day}-${date.toISOString().split('T')[0]}`,
                content: {
                    title: `${item.name} in ${item.notifyMinutesBefore} min`,
                    body: [item.location, item.instructor].filter(Boolean).join(' · ') || 'Time to head to class!',
                    data: { classId: item.id },
                },
                trigger: {
                    type: 'date' as any,
                    date: notifyTime,
                },
            });
        }
    }
}

export async function cancelClassNotifications(classId: string): Promise<void> {
    const scheduled = await Notifications.getAllScheduledNotificationsAsync();
    const toCancel = scheduled.filter(n => n.identifier.startsWith(classId));
    await Promise.all(toCancel.map(n => Notifications.cancelScheduledNotificationAsync(n.identifier)));
}