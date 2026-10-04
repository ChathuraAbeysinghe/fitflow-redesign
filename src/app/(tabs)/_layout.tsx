import { View } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

// Floating pill tab bar: icons only, the active tab sits in an indigo circle (as in the Figma design).
const tab = (name: string, title: string, icon: IconName) => (
  <Tabs.Screen
    name={name}
    options={{
      title,
      tabBarAccessibilityLabel: title,
      tabBarIcon: ({ focused }) => (
        <View style={{ width: 46, height: 46, borderRadius: 23, alignItems: 'center', justifyContent: 'center', backgroundColor: focused ? colors.primary : 'transparent' }}>
          <Ionicons name={icon} size={22} color={focused ? '#fff' : colors.muted} />
        </View>
      ),
    }}
  />
);

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarShowLabel: false,
        tabBarStyle: {
          position: 'absolute', left: 16, right: 16, bottom: 14, height: 68, borderRadius: 34,
          backgroundColor: colors.surface, borderTopWidth: 0, borderWidth: 1, borderColor: colors.border,
          elevation: 8, paddingTop: 0, paddingBottom: 0,
        },
        tabBarItemStyle: { justifyContent: 'center' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {tab('index', 'Home', 'home-outline')}
      {tab('plan', 'Plan', 'calendar-outline')}
      {tab('progress', 'Progress', 'stats-chart-outline')}
      {tab('community', 'Feed', 'people-outline')}
      {tab('log', 'Log', 'add-circle-outline')}
    </Tabs>
  );
}
