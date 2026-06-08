import { BlurView } from "expo-blur";
import { isLiquidGlassAvailable } from "expo-glass-effect";
import { Tabs } from "expo-router";
import { Icon, Label, NativeTabs } from "expo-router/unstable-native-tabs";
import { SymbolView } from "expo-symbols";
import { Feather } from "@expo/vector-icons";
import React, { useEffect } from "react";
import { Platform, StyleSheet, View, useColorScheme } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withSpring,
} from "react-native-reanimated";

import { useColors } from "@/hooks/useColors";

// ─── Animated tab icon — springs on focus ──────────────────────────────────────
function AnimatedTabIcon({
  featherName,
  sfName,
  sfNameSelected,
  color,
  focused,
  isIOS,
}: {
  featherName: string;
  sfName: string;
  sfNameSelected: string;
  color: string;
  focused: boolean;
  isIOS: boolean;
}) {
  const scale = useSharedValue(1);

  useEffect(() => {
    if (focused) {
      scale.value = withSequence(
        withSpring(1.28, { damping: 3, stiffness: 280 }),
        withSpring(1.0,  { damping: 10, stiffness: 200 }),
      );
    } else {
      scale.value = withSpring(1.0, { damping: 12, stiffness: 180 });
    }
  }, [focused]);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  return (
    <Animated.View style={animStyle}>
      {isIOS ? (
        <SymbolView name={focused ? sfNameSelected : sfName} tintColor={color} size={24} />
      ) : (
        <Feather name={featherName as "home"} size={22} color={color} />
      )}
    </Animated.View>
  );
}

function NativeTabLayout() {
  return (
    <NativeTabs>
      <NativeTabs.Trigger name="index">
        <Icon sf={{ default: "house", selected: "house.fill" }} />
        <Label>Dashboard</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="search">
        <Icon sf={{ default: "magnifyingglass", selected: "magnifyingglass" }} />
        <Label>Search</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="identify">
        <Icon sf={{ default: "camera", selected: "camera.fill" }} />
        <Label>Identify</Label>
      </NativeTabs.Trigger>
      <NativeTabs.Trigger name="admin">
        <Icon sf={{ default: "gearshape", selected: "gearshape.fill" }} />
        <Label>Admin</Label>
      </NativeTabs.Trigger>
    </NativeTabs>
  );
}

function ClassicTabLayout() {
  const colors = useColors();
  const colorScheme = useColorScheme();
  const isDark = colorScheme === "dark";
  const isIOS = Platform.OS === "ios";
  const isWeb = Platform.OS === "web";

  const tabs = [
    { name: "index",    title: "Dashboard", feather: "home",     sfDefault: "house",          sfSelected: "house.fill"      },
    { name: "search",   title: "Search",    feather: "search",   sfDefault: "magnifyingglass", sfSelected: "magnifyingglass" },
    { name: "identify", title: "Identify",  feather: "camera",   sfDefault: "camera",          sfSelected: "camera.fill"     },
    { name: "admin",    title: "Admin",     feather: "settings", sfDefault: "gearshape",       sfSelected: "gearshape.fill"  },
  ];

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.mutedForeground,
        headerShown: false,
        tabBarStyle: {
          position: "absolute",
          backgroundColor: isIOS ? "transparent" : colors.card,
          borderTopWidth: 1,
          borderTopColor: colors.border,
          elevation: 0,
          ...(isWeb ? { height: 84 } : {}),
        },
        tabBarBackground: () =>
          isIOS ? (
            <BlurView
              intensity={100}
              tint={isDark ? "dark" : "dark"}
              style={StyleSheet.absoluteFill}
            />
          ) : isWeb ? (
            <View style={[StyleSheet.absoluteFill, { backgroundColor: colors.card }]} />
          ) : null,
        tabBarLabelStyle: {
          fontFamily: "Inter_500Medium",
          fontSize: 11,
        },
      }}
    >
      {tabs.map(tab => (
        <Tabs.Screen
          key={tab.name}
          name={tab.name}
          options={{
            title: tab.title,
            tabBarIcon: ({ color, focused }) => (
              <AnimatedTabIcon
                featherName={tab.feather}
                sfName={tab.sfDefault}
                sfNameSelected={tab.sfSelected}
                color={color}
                focused={focused}
                isIOS={isIOS}
              />
            ),
          }}
        />
      ))}
    </Tabs>
  );
}

export default function TabLayout() {
  if (isLiquidGlassAvailable()) {
    return <NativeTabLayout />;
  }
  return <ClassicTabLayout />;
}
