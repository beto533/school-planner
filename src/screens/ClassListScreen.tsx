import { useEffect, useState } from "react";
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
} from 'react-native';
import { Ionicons } from "@expo/vector-icons";
import { ClassItem } from "../types";
import { getClasses, deleteClass } from "../storage";

interface Props {
    onAddClass: () => void;
    refreshKey: number;
}

export default function ClassListScreen({ onAddClass, refreshKey }: Props) {
    const [classes, setClasses] = useState<ClassItem[]>([]);

    useEffect(() => {
        getClasses().then(setClasses);
    }, [refreshKey]);

    function handleDelete(item: ClassItem) {
        Alert.alert(
            'Delete Class',
            `Remove ${item.name} from your schedule?`,
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Delete',
                    style: 'destructive',
                    onPress: async () => {
                        await deleteClass(item.id);
                        setClasses(prev => prev.filter(c => c.id !== item.id));
                    },
                },
            ]
        );
    }

    return (
        <View style={styles.container}>
            <ScrollView contentContainerStyle={styles.list}>
                {classes.length === 0 ? (
                    <View style={styles.empty}>
                        <Ionicons name="calendar-outline" size={48} color="#CCC" />
                        <Text style={styles.emptyText}>No classes yet</Text>
                        <Text style={styles.emptySubtext}>Tap + to add your first class</Text>
                    </View>
                ) : (
                    classes.map(item => (
                        <View key={item.id} style={styles.card}>
                            <View style={[styles.colorBar, { backgroundColor: item.color }]} />
                            <View style={styles.cardContent}>
                                <Text style={styles.className}>{item.name}</Text>
                                {item.instructor && (
                                    <Text style={styles.cardMeta}>
                                        <Ionicons name="person-outline" size={12} /> {item.instructor}
                                    </Text>
                                )}
                                {item.location && (
                                    <Text style={styles.cardMeta}>
                                        <Ionicons name="location-outline" size={12} /> {item.location}
                                    </Text>
                                )}
                                <Text style={styles.cardMeta}>
                                    <Ionicons name="time-outline" size={12} /> {item.schedule.days.join(', ')} · {item.schedule.startTime} – {item.schedule.endTime}
                                </Text>
                                <Text style={styles.cardMeta}>
                                    <Ionicons name="notifications-outline" size={12} /> {item.notifyMinutesBefore} min before
                                </Text>
                            </View>
                            <TouchableOpacity
                                style={styles.deleteButton}
                                onPress={() => handleDelete(item)}
                            >
                                <Ionicons name="trash-outline" size={20} color="#FF6584" />
                            </TouchableOpacity>
                        </View>
                    ))
                )}
            </ScrollView>

            <TouchableOpacity style={styles.addButton} onPress={onAddClass}>
                <Ionicons name="add" size={28} color="#fff" />
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: { flex: 1, backgroundColor: '#F8F8FF' },
    list: { padding: 16, paddingBottom: 100 },
    empty: { alignItems: 'center', marginTop: 80, gap: 8 },
    emptyText: { fontSize: 18, fontWeight: '600', color: '#BBB' },
    emptySubtext: { fontSize: 14, color: '#CCC' },
    card: {
        backgroundColor: '#fff',
        borderRadius: 12,
        marginBottom: 12,
        flexDirection: 'row',
        overflow: 'hidden',
        elevation: 2,
    },
    colorBar: { width: 6 },
    cardContent: { flex: 1, padding: 14, gap: 4 },
    className: { fontSize: 16, fontWeight: '700', color: '#222' },
    cardMeta: { fontSize: 13, color: '#666' },
    deleteButton: { padding: 14, justifyContent: 'center' },
    addButton: {
        position: 'absolute',
        bottom: 24,
        right: 24,
        backgroundColor: '#6C63FF',
        width: 56,
        height: 56,
        borderRadius: 28,
        alignItems: 'center',
        justifyContent: 'center',
        elevation: 4,
    },
});