import { useState, useEffect } from 'react';
import { NavigationContainer, TabActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, 
  Text, 
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddClassScreen from './src/screens/AddClassScreen';
import ClassListScreen from './src/screens/ClassListScreen';
import TasksScreen from './src/screens/TasksScreen';
import HomeScreen from './src/screens/HomeScreen';
import { requestNotificationPermission } from './src/notifications';
import ScheduleViewScreen from './src/screens/ScheduleViewScreen';
import { SettingsProvider } from './src/context/SettingsContext';
import SettingsScreen from './src/screens/SettingsScreen';

function ScheduleScreen({ navigation }: any) {
  const [mode, setMode] = useState<'view' | 'list' | 'add'>('view');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    if (mode === 'view') {
      navigation.setOptions({
        headerTitle: 'Schedule',
        headerLeft: () => null,
      });
    } else if (mode === 'list') {
      navigation.setOptions({
        headerTitle: 'My Classes',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => setMode('view')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}
          >
            <Ionicons name="arrow-back" size={24} color="#6C63FF" />
            <Text style={{ color: '#6C63FF', fontSize: 16 }}>Back</Text>
          </TouchableOpacity>
        ),
      });
    } else if (mode === 'add') {
      navigation.setOptions({
        headerTitle: 'Add Class',
        headerLeft: () => (
          <TouchableOpacity
            onPress={() => setMode('view')}
            style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginLeft: 8 }}
            >
              <Ionicons name="arrow-back" size={24} color="#6C63FF" />
              <Text style={{ color: '#6C63FF', fontSize: 16 }}>Back</Text>
            </TouchableOpacity>
        ),
      });
    }
  }, [mode]);

  if (mode === 'add') {
    return (
      <AddClassScreen 
        onSaved={() => {
          setMode('view');
          setRefreshKey(k => k + 1);
        }} 
        onCancel={() => setMode('view')}
      />
    );
  }

  if (mode === 'list') {
    return (
      <ClassListScreen
        onAddClass={() => setMode('add')}
        onBack={() => setMode('view')}
        refreshKey={refreshKey}
      />
    );
  }

  return (
    <View style={{ flex: 1 }}>
      <ScheduleViewScreen />
      {/* Floating action buttons */}
      <View style={fabStyles.row}>
        <TouchableOpacity
          style={fabStyles.secondaryFab}
          onPress={() => setMode('list')}
        >
          <Ionicons name="list" size={22} color="#6C63FF" />
        </TouchableOpacity>
        <TouchableOpacity
          style={fabStyles.primaryFab}
          onPress={() => setMode('add')}
        >
          <Ionicons name="add" size={28} color="#fff" />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  useEffect(() => {
    requestNotificationPermission();
  }, []);

  return (
    <SettingsProvider>
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            headerStyle: { backgroundColor: '#F8F8FF' },
            headerTitleStyle: { fontWeight: '700', color: '#222' },
            headerShadowVisible: false,
            tabBarIcon: ({ focused, color, size }) => {
              let iconName: keyof typeof Ionicons.glyphMap;
              if (route.name === 'Home') {
                iconName = focused ? 'home' : 'home-outline';
              } else if (route.name === 'Schedule') {
                iconName = focused ? 'calendar' : 'calendar-outline';
              } else {
                iconName = focused ? 'checkmark-circle' : 'checkmark-circle-outline';
              }
              return <Ionicons name={iconName} size={size} color={color} />;
            },
            tabBarActiveTintColor: '#6C63FF',
            tabBarInactiveTintColor: 'gray',
          })}
        >
          <Tab.Screen name="Home" component={HomeScreen} />
          <Tab.Screen name="Schedule" component={ScheduleScreen} />
          <Tab.Screen name="Tasks" component={TasksScreen} />
          <Tab.Screen
            name="Settings"
            component={SettingsScreen}
            options={{
              tabBarIcon: ({ focused, color, size }) => (
                <Ionicons
                  name={focused ? 'settings' : 'settings-outline'}
                  size={size}
                  color={color}
                />
              ),
            }}
          />
        </Tab.Navigator>
      </NavigationContainer>
    </SettingsProvider>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: '#F8F8FF' },
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

const fabStyles = StyleSheet.create({
  row: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    gap: 12,
    alignItems: 'center',
  },
  primaryFab: {
    backgroundColor: '#6C63FF',
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
  },
  secondaryFab: {
    backgroundColor: '#fff',
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 3,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
});