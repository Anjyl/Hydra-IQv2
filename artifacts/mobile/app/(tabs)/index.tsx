import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  FlatList,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { EmptyState } from "@/components/EmptyState";
import { PumpCard } from "@/components/PumpCard";
import { SearchBar } from "@/components/SearchBar";
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

export default function DashboardScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { manufacturers, pumpSeries, pumpModels, recentlyViewed, getSeriesForManufacturer, getModelsForSeries } = useData();
  const [query, setQuery] = useState("");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const stats = [
    { label: "Manufacturers", value: manufacturers.length, icon: "briefcase" },
    { label: "Series", value: pumpSeries.length, icon: "layers" },
    { label: "Models", value: pumpModels.length, icon: "settings" },
  ];

  function handleSearch() {
    if (query.trim()) router.push({ pathname: "/(tabs)/search", params: { q: query } });
  }

  return (
    <ScrollView
      style={[styles.root, { backgroundColor: colors.background }]}
      contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <View>
          <Text style={[styles.brand, { color: colors.primary }]}>HYDRA IQ</Text>
          <Text style={[styles.tagline, { color: colors.mutedForeground }]}>Hydraulic Pump Database</Text>
        </View>
        <TouchableOpacity
          style={[styles.identifyBtn, { backgroundColor: colors.primary }]}
          onPress={() => router.push("/(tabs)/identify")}
        >
          <Feather name="camera" size={18} color="#fff" />
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Search bar */}
        <TouchableOpacity activeOpacity={0.9} onPress={() => router.push("/(tabs)/search")}>
          <View pointerEvents="none">
            <SearchBar value={query} onChangeText={setQuery} placeholder="Search by model, displacement, series…" />
          </View>
        </TouchableOpacity>

        {/* Stats row */}
        <View style={styles.statsRow}>
          {stats.map((s, i) => (
            <View key={i} style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name={s.icon as "briefcase"} size={18} color={colors.primary} />
              <Text style={[styles.statVal, { color: colors.foreground }]}>{s.value}</Text>
              <Text style={[styles.statLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
            </View>
          ))}
        </View>

        {/* Quick access - series */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Series</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.seriesScroll}>
            {pumpSeries.map(series => {
              const mfr = manufacturers.find(m => m.id === series.manufacturerId);
              const count = getModelsForSeries(series.id).length;
              return (
                <TouchableOpacity
                  key={series.id}
                  style={[styles.seriesCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push({ pathname: "/(tabs)/search", params: { seriesId: series.id } })}
                  activeOpacity={0.75}
                >
                  <View style={[styles.seriesIcon, { backgroundColor: colors.primary + "22" }]}>
                    <Feather name="layers" size={20} color={colors.primary} />
                  </View>
                  <Text style={[styles.seriesName, { color: colors.foreground }]}>Series {series.seriesName}</Text>
                  <Text style={[styles.seriesMfr, { color: colors.mutedForeground }]}>{mfr?.name}</Text>
                  <Text style={[styles.seriesCount, { color: colors.primary }]}>{count} models</Text>
                </TouchableOpacity>
              );
            })}
          </ScrollView>
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Quick Actions</Text>
          <View style={styles.actionsGrid}>
            {[
              { icon: "search", label: "Search Pumps", onPress: () => router.push("/(tabs)/search") },
              { icon: "camera", label: "Identify Pump", onPress: () => router.push("/(tabs)/identify") },
              { icon: "file-text", label: "PDF Import", onPress: () => router.push("/pdf-import") },
              { icon: "settings", label: "Admin Panel", onPress: () => router.push("/(tabs)/admin") },
            ].map((action, i) => (
              <TouchableOpacity
                key={i}
                style={[styles.actionCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={action.onPress}
                activeOpacity={0.75}
              >
                <View style={[styles.actionIcon, { backgroundColor: colors.primary + "1A" }]}>
                  <Feather name={action.icon as "search"} size={20} color={colors.primary} />
                </View>
                <Text style={[styles.actionLabel, { color: colors.foreground }]}>{action.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Recently viewed */}
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

        {/* Manufacturer cards */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Manufacturers</Text>
          {manufacturers.map(mfr => {
            const seriesCount = getSeriesForManufacturer(mfr.id).length;
            const modelCount = getSeriesForManufacturer(mfr.id).reduce((acc, s) => acc + getModelsForSeries(s.id).length, 0);
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
    letterSpacing: 2,
  },
  tagline: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
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
  sectionTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  seriesScroll: { marginHorizontal: -4 },
  seriesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    width: 140,
    marginHorizontal: 4,
    gap: 6,
  },
  seriesIcon: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 4,
  },
  seriesName: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  seriesMfr: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
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
  actionCard: {
    width: "47%",
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
