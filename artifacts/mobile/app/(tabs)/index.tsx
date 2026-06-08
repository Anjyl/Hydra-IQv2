import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withDelay,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
} from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { PumpCard } from "@/components/PumpCard";
import { SearchBar } from "@/components/SearchBar";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

// ─── Animated Stat Card ────────────────────────────────────────────────────────
function StatCard({
  icon,
  value,
  label,
  delay,
}: {
  icon: string;
  value: number;
  label: string;
  delay: number;
}) {
  const colors = useColors();
  const scale = useSharedValue(0.78);
  const opacity = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(delay, withSpring(1, { damping: 12, stiffness: 180 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 280 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }, animStyle]}>
      <Feather name={icon as "briefcase"} size={18} color={colors.primary} />
      <Text style={[styles.statVal, { color: colors.foreground }]}>{value}</Text>
      <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{label}</Text>
    </Animated.View>
  );
}

// ─── Animated Series Card ──────────────────────────────────────────────────────
function SeriesCard({
  series,
  mfrName,
  count,
  delay,
  onPress,
}: {
  series: { id: string; seriesName: string; type: string };
  mfrName: string;
  count: number;
  delay: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const translateX = useSharedValue(48);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateX.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 160 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 320 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }));

  const isBearing = series.type === "Bearing";
  const accentColor = isBearing ? "#f59e0b" : colors.primary;
  const badgeBg = isBearing ? "#f59e0b18" : colors.primary + "18";

  return (
    <Animated.View style={animStyle}>
      <TouchableOpacity
        style={[styles.seriesCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.72}
      >
        <View style={[styles.seriesIcon, { backgroundColor: accentColor + "22" }]}>
          <Feather name={isBearing ? "disc" : "layers"} size={20} color={accentColor} />
        </View>
        <Text style={[styles.seriesName, { color: colors.foreground }]}>Series {series.seriesName}</Text>
        <Text style={[styles.seriesMfr, { color: colors.mutedForeground }]}>{mfrName}</Text>
        <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
          <Text style={[styles.typeBadgeText, { color: accentColor }]}>
            {isBearing ? "BEARING" : "BUSHING"}
          </Text>
        </View>
        <Text style={[styles.seriesCount, { color: accentColor }]}>{count} models</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Animated Action Card ──────────────────────────────────────────────────────
function ActionCard({
  icon,
  label,
  delay,
  onPress,
}: {
  icon: string;
  label: string;
  delay: number;
  onPress: () => void;
}) {
  const colors = useColors();
  const translateY = useSharedValue(22);
  const opacity = useSharedValue(0);

  useEffect(() => {
    translateY.value = withDelay(delay, withSpring(0, { damping: 14, stiffness: 160 }));
    opacity.value = withDelay(delay, withTiming(1, { duration: 300 }));
  }, []);

  const animStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
    opacity: opacity.value,
  }));

  return (
    <Animated.View style={[styles.actionCardWrap, animStyle]}>
      <TouchableOpacity
        style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={onPress}
        activeOpacity={0.72}
      >
        <View style={[styles.actionIcon, { backgroundColor: colors.primary + "1A" }]}>
          <Feather name={icon as "search"} size={20} color={colors.primary} />
        </View>
        <Text style={[styles.actionLabel, { color: colors.foreground }]}>{label}</Text>
      </TouchableOpacity>
    </Animated.View>
  );
}

// ─── Main Screen ───────────────────────────────────────────────────────────────
export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { manufacturers, pumpSeries, pumpModels, recentlyViewed, getSeriesForManufacturer, getModelsForSeries } = useData();

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  // Sort: Bearing first, then Bushing
  const sortedSeries = [...pumpSeries].sort((a, b) => {
    const order: Record<string, number> = { Bearing: 0, Bushing: 1, "PTO Gear": 2, "PTO Piston": 3, Other: 4 };
    return (order[a.type] ?? 4) - (order[b.type] ?? 4);
  });

  // ── Logo animation
  const logoOpacity = useSharedValue(0);
  const logoY = useSharedValue(-10);
  const underlineWidth = useSharedValue(0);

  // ── Camera button pulse ring
  const pulseScale = useSharedValue(1);
  const pulseOpacity = useSharedValue(0.6);

  useEffect(() => {
    logoOpacity.value = withTiming(1, { duration: 500 });
    logoY.value = withSpring(0, { damping: 14, stiffness: 120 });
    underlineWidth.value = withDelay(300, withTiming(1, { duration: 500 }));

    pulseScale.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(1.7, { duration: 1000 }),
          withTiming(1.0, { duration: 700 }),
        ),
        -1,
        false,
      ),
    );
    pulseOpacity.value = withDelay(
      800,
      withRepeat(
        withSequence(
          withTiming(0, { duration: 1000 }),
          withTiming(0.5, { duration: 0 }),
          withTiming(0.5, { duration: 700 }),
        ),
        -1,
        false,
      ),
    );
  }, []);

  const logoStyle = useAnimatedStyle(() => ({
    opacity: logoOpacity.value,
    transform: [{ translateY: logoY.value }],
  }));

  const underlineStyle = useAnimatedStyle(() => ({
    width: `${underlineWidth.value * 100}%` as unknown as number,
  }));

  const pulseRingStyle = useAnimatedStyle(() => ({
    transform: [{ scale: pulseScale.value }],
    opacity: pulseOpacity.value,
  }));

  const stats = [
    { label: "Manufacturers", value: manufacturers.length, icon: "briefcase" },
    { label: "Series",        value: pumpSeries.length,    icon: "layers"    },
    { label: "Models",        value: pumpModels.length,    icon: "settings"  },
  ];

  const actions = [
    { icon: "search",    label: "Search Pumps",  onPress: () => router.push("/(tabs)/search")   },
    { icon: "camera",    label: "Identify Pump", onPress: () => router.push("/(tabs)/identify") },
    { icon: "file-text", label: "PDF Import",    onPress: () => router.push("/pdf-import")      },
    { icon: "settings",  label: "Admin Panel",   onPress: () => router.push("/(tabs)/admin")    },
  ];

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ── */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Animated.View style={logoStyle}>
          <Text style={[styles.brand, { color: colors.primary }]}>HYDRA IQ</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Hydraulic Pump Database</Text>
          <Animated.View style={[styles.underline, { backgroundColor: colors.primary }, underlineStyle]} />
        </Animated.View>

        {/* Camera button with pulse ring */}
        <View style={styles.cameraWrap}>
          <Animated.View
            style={[styles.pulseRing, { borderColor: colors.primary }, pulseRingStyle]}
            pointerEvents="none"
          />
          <TouchableOpacity
            style={[styles.identifyBtn, { backgroundColor: colors.primary }]}
            onPress={() => router.push("/(tabs)/identify")}
          >
            <Feather name="camera" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.content}>
        {/* ── Search bar ── */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/(tabs)/search")}>
          <View pointerEvents="none">
            <SearchBar value="" onChangeText={() => {}} placeholder="Search by model, displacement, series…" />
          </View>
        </TouchableOpacity>

        {/* ── Stats row ── */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <StatCard key={s.label} icon={s.icon} value={s.value} label={s.label} delay={120 + i * 90} />
          ))}
        </View>

        {/* ── Series ── */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Series</Text>
            <View style={styles.seriesLegend}>
              <View style={[styles.legendDot, { backgroundColor: "#f59e0b" }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Bearing</Text>
              <View style={[styles.legendDot, { backgroundColor: colors.primary }]} />
              <Text style={[styles.legendText, { color: colors.mutedForeground }]}>Bushing</Text>
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seriesScroll}>
            {sortedSeries.map((series, i) => {
              const mfr = manufacturers.find(m => m.id === series.manufacturerId);
              const count = getModelsForSeries(series.id).length;
              return (
                <SeriesCard
                  key={series.id}
                  series={series}
                  mfrName={mfr?.name ?? ""}
                  count={count}
                  delay={280 + i * 55}
                  onPress={() => router.push({ pathname: "/(tabs)/search", params: { seriesId: series.id } })}
                />
              );
            })}
          </ScrollView>
        </View>

        {/* ── Quick Actions ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {actions.map((a, i) => (
              <ActionCard key={a.label} icon={a.icon} label={a.label} delay={420 + i * 65} onPress={a.onPress} />
            ))}
          </View>
        </View>

        {/* ── Recently Viewed ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Recently Viewed</Text>
          {recentlyViewed.length === 0 ? (
            <View style={[styles.emptyRecent, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <EmptyState icon="clock" title="No recent pumps" subtitle="Pumps you view will appear here" />
            </View>
          ) : (
            recentlyViewed.slice(0, 5).map(pump => <PumpCard key={pump.id} pump={pump} />)
          )}
        </View>

        {/* ── Manufacturers ── */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Manufacturers</Text>
          {manufacturers.map(mfr => {
            const seriesCount = getSeriesForManufacturer(mfr.id).length;
            const modelCount  = getSeriesForManufacturer(mfr.id).reduce((acc, s) => acc + getModelsForSeries(s.id).length, 0);
            return (
              <TouchableOpacity
                key={mfr.id}
                style={[styles.mfrCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push({ pathname: "/(tabs)/search", params: { manufacturerId: mfr.id } })}
                activeOpacity={0.75}
              >
                <View style={[styles.mfrIcon, { backgroundColor: colors.primary + "22" }]}>
                  <Feather name="briefcase" size={22} color={colors.primary} />
                </View>
                <View style={styles.mfrInfo}>
                  <Text style={[styles.mfrName, { color: colors.foreground }]}>{mfr.name}</Text>
                  {mfr.country && <Text style={[styles.mfrCountry, { color: colors.mutedForeground }]}>{mfr.country}</Text>}
                  <Text style={[styles.mfrStats, { color: colors.primary }]}>{seriesCount} series · {modelCount} models</Text>
                </View>
                <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
              </TouchableOpacity>
            );
          })}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  brand: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
    letterSpacing: 3,
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  underline: {
    height: 2,
    borderRadius: 1,
    marginTop: 5,
    opacity: 0.7,
  },
  cameraWrap: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  pulseRing: {
    position: "absolute",
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 2,
  },
  identifyBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  content: {
    paddingHorizontal: 16,
    gap: 24,
  },
  statsRow: {
    flexDirection: "row",
    gap: 10,
  },
  statCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    paddingVertical: 14,
    gap: 4,
  },
  statVal: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  statLabel: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  section: { gap: 12 },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  seriesLegend: {
    flexDirection: "row",
    alignItems: "center",
    gap: 5,
  },
  legendDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
  },
  legendText: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    marginRight: 4,
  },
  seriesScroll: { marginHorizontal: -4 },
  seriesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    width: 148,
    marginHorizontal: 4,
    gap: 5,
  },
  seriesIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 2,
  },
  seriesName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  seriesMfr: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  typeBadge: {
    alignSelf: "flex-start",
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  typeBadgeText: {
    fontSize: 9,
    fontFamily: "Inter_700Bold",
    letterSpacing: 0.5,
  },
  seriesCount: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  actionsGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  actionCardWrap: { width: "47%" },
  actionCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "center",
    gap: 10,
  },
  actionIcon: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  actionLabel: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
    textAlign: "center",
  },
  emptyRecent: {
    borderRadius: 12,
    borderWidth: 1,
  },
  mfrCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  mfrIcon: {
    width: 46,
    height: 46,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  mfrInfo: { flex: 1 },
  mfrName: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  mfrCountry: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  mfrStats: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    marginTop: 4,
  },
});
