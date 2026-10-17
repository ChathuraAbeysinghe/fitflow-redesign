import { View, StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../theme/theme';

type IconName = React.ComponentProps<typeof Ionicons>['name'];

const tab = (name: string, title: string, iconActive: IconName, iconInactive: IconName) => (
  <Tabs.Screen
    name={name}
    options={{
      title,
      tabBarAccessibilityLabel: title,
      tabBarIcon: ({ focused }) => (
        <View style={[styles.tabIconContainer, focused && styles.tabIconActive]}>
          <Ionicons
            name={focused ? iconActive : iconInactive}
            size={22}
            color={focused ? '#080C16' : colors.muted}
          />
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
        tabBarStyle: styles.tabBar,
        tabBarItemStyle: { justifyContent: 'center' },
        sceneStyle: { backgroundColor: colors.bg },
      }}
    >
      {tab('index', 'Home', 'home', 'home-outline')}
      {tab('plan', 'Plan', 'calendar', 'calendar-outline')}
      {tab('progress', 'Progress', 'stats-chart', 'stats-chart-outline')}
      {tab('community', 'Feed', 'people', 'people-outline')}
      {tab('log', 'Log', 'camera', 'camera-outline')}
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    left: 18,
    right: 18,
    bottom: 16,
    height: 66,
    borderRadius: 33,
    backgroundColor: 'rgba(17, 22, 37, 0.94)',
    borderTopWidth: 0,
    borderWidth: 1.5,
    borderColor: colors.borderLight,
    elevation: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    paddingTop: 0,
    paddingBottom: 0,
  },
  tabIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabIconActive: {
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.45,
    shadowRadius: 6,
  },
});
