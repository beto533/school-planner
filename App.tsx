import { useState } from 'react';
import { NavigationContainer, TabActions } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import AddClassScreen from './src/screens/AddClassScreen';
import ClassListScreen from './src/screens/ClassListScreen';
import TasksScreen from './src/screens/TasksScreen';
import HomeScreen from './src/screens/HomeScreen';


function ScheduleScreen() {
  const [adding, setAdding] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  if (adding) {
    return (
      <AddClassScreen 
        onSaved={() => {
          setAdding(false);
          setRefreshKey(k => k + 1);
        }} 
      />
    );
  }

  return (
    <ClassListScreen
      onAddClass={() => setAdding(true)}
      refreshKey={refreshKey}
    />
  );
}

const Tab = createBottomTabNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Tab.Navigator
        screenOptions={({ route }) => ({
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
      </Tab.Navigator>
    </NavigationContainer>
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