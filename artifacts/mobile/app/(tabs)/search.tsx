import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
import { SearchFilters, useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

export default function SearchScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const params = useLocalSearchParams<{ q?: string; seriesId?: string; manufacturerId?: string }>();
  const { manufacturers, pumpSeries, searchPumps } = useData();

  const [query, setQuery] = useState(params.q ?? "");
  const [filters, setFilters] = useState<SearchFilters>({
    manufacturerId: params.manufacturerId,
    seriesId: params.seriesId,
  });
  const [showFilters, setShowFilters] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const results = useMemo(() => searchPumps(query, filters), [query, filters, searchPumps]);

  const activeFilterCount = Object.values(filters).filter(Boolean).length;

  function clearFilters() {
    setFilters({});
  }

  function toggleMfr(id: string) {
    setFilters(f => ({ ...f, manufacturerId: f.manufacturerId === id ? undefined : id }));
  }

  function toggleSeries(id: string) {
    setFilters(f => ({ ...f, seriesId: f.seriesId === id ? undefined : id }));
  }

  const filteredSeries = filters.manufacturerId
    ? pumpSeries.filter(s => s.manufacturerId === filters.manufacturerId)
    : pumpSeries;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 12, backgroundColor: colors.background, borderBottomColor: colors.border }]}>
        <SearchBar value={query} onChangeText={setQuery} autoFocus={false} />
        <TouchableOpacity
          style={[styles.filterBtn, { backgroundColor: activeFilterCount > 0 ? colors.primary : colors.card, borderColor: colors.border }]}
          onPress={() => setShowFilters(v => !v)}
        >
          <Feather name="sliders" size={18} color={activeFilterCount > 0 ? "#fff" : colors.foreground} />
          {activeFilterCount > 0 && (
            <View style={[styles.filterBadge, { backgroundColor: "#fff" }]}>
              <Text style={[styles.filterBadgeText, { color: colors.primary }]}>{activeFilterCount}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {/* Filters panel */}
      {showFilters && (
        <View style={[styles.filtersPanel, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>MANUFACTURER</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {manufacturers.map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.chip, { backgroundColor: filters.manufacturerId === m.id ? colors.primary : colors.secondary, borderColor: filters.manufacturerId === m.id ? colors.primary : colors.border }]}
                  onPress={() => toggleMfr(m.id)}
                >
                  <Text style={[styles.chipText, { color: filters.manufacturerId === m.id ? "#fff" : colors.foreground }]}>{m.name}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          <View style={styles.filterSection}>
            <Text style={[styles.filterLabel, { color: colors.mutedForeground }]}>SERIES</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false}>
              {filteredSeries.map(s => (
                <TouchableOpacity
                  key={s.id}
                  style={[styles.chip, { backgroundColor: filters.seriesId === s.id ? colors.primary : colors.secondary, borderColor: filters.seriesId === s.id ? colors.primary : colors.border }]}
                  onPress={() => toggleSeries(s.id)}
                >
                  <Text style={[styles.chipText, { color: filters.seriesId === s.id ? "#fff" : colors.foreground }]}>Series {s.seriesName}</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
          {activeFilterCount > 0 && (
            <TouchableOpacity onPress={clearFilters} style={styles.clearFilters}>
              <Text style={[styles.clearFiltersText, { color: colors.primary }]}>Clear all filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Result count */}
      <View style={[styles.resultCount, { borderBottomColor: colors.border }]}>
        <Text style={[styles.resultText, { color: colors.mutedForeground }]}>
          {results.length} result{results.length !== 1 ? "s" : ""}
          {(query || activeFilterCount > 0) ? "" : " · all models"}
        </Text>
      </View>

      <FlatList
        data={results}
        keyExtractor={item => item.id}
        renderItem={({ item }) => <PumpCard pump={item} />}
        contentContainerStyle={{ padding: 16, paddingBottom: bottomInset + 100 }}
        scrollEnabled={!!results.length}
        ListEmptyComponent={
          <EmptyState icon="search" title="No pumps found" subtitle="Try a different search term or clear your filters" />
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingBottom: 12,
    gap: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  filterBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadge: {
    position: "absolute",
    top: -4,
    right: -4,
    width: 16,
    height: 16,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  filterBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_700Bold",
  },
  filtersPanel: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    gap: 12,
  },
  filterSection: { gap: 8 },
  filterLabel: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    marginRight: 8,
  },
  chipText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  clearFilters: {
    alignSelf: "flex-start",
  },
  clearFiltersText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  resultCount: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  resultText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
  },
});
