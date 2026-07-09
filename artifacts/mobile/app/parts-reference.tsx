import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useMemo, useState } from "react";
import {
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getGpmNo, useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

const SERIES_FILTERS = [
  { id: "all",  label: "All" },
  { id: "120",  label: "120" },
  { id: "125",  label: "125" },
  { id: "131",  label: "131" },
  { id: "151",  label: "151" },
  { id: "176",  label: "176" },
  { id: "215",  label: "215" },
  { id: "230",  label: "230" },
  { id: "250",  label: "250" },
  { id: "265",  label: "265" },
];

export default function PartsReferenceScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { searchComponents, components, pumpSeries, getModel } = useData();

  const [query, setQuery] = useState("");
  const [seriesFilter, setSeriesFilter] = useState("all");

  const results = useMemo(() => {
    const base = query.trim().length >= 1
      ? searchComponents(query)
      : components;

    if (seriesFilter === "all") return base;

    return base.filter(c => {
      const model = getModel(c.pumpModelId);
      if (!model) return false;
      const series = pumpSeries.find(s => s.id === model.seriesId);
      return series?.seriesName?.toString() === seriesFilter;
    });
  }, [query, seriesFilter, searchComponents, components, getModel, pumpSeries]);

  const renderItem = useCallback(({ item }: { item: typeof results[0] }) => {
    const gpmNo = getGpmNo(item);
    const model = getModel(item.pumpModelId);
    const series = pumpSeries.find(s => s.id === model?.seriesId);
    const hasXRef = item.factoryNo || item.partNo || item.reference;
    return (
      <TouchableOpacity
        style={[styles.row, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={() => router.push(`/component/${item.id}` as any)}
        activeOpacity={0.75}
      >
        {/* GPM Unique No. — PRIMARY */}
        <View style={styles.rowMain}>
          <View style={styles.rowTop}>
            <View style={[styles.gpmBadge, { backgroundColor: colors.primary + "1A" }]}>
              <Text style={[styles.gpmBadgeText, { color: colors.primary }]}>{gpmNo}</Text>
            </View>
            {item.quantity > 1 && (
              <View style={[styles.qtyBadge, { backgroundColor: colors.secondary }]}>
                <Text style={[styles.qtyText, { color: colors.mutedForeground }]}>×{item.quantity}</Text>
              </View>
            )}
          </View>
          <Text style={[styles.compName, { color: colors.foreground }]}>{item.name}</Text>
          <Text style={[styles.compCat, { color: colors.mutedForeground }]}>
            {item.category}
            {series ? `  ·  Series ${series.seriesName}` : ""}
            {model ? `  ·  ${model.modelNumber}` : ""}
          </Text>
          {/* Secondary cross-refs */}
          {hasXRef && (
            <View style={styles.xrefRow}>
              {item.factoryNo && (
                <Text style={[styles.xrefText, { color: colors.mutedForeground }]}>
                  <Text style={[styles.xrefLabel, { color: colors.mutedForeground }]}>Factory: </Text>
                  {item.factoryNo}
                </Text>
              )}
              {item.partNo && (
                <Text style={[styles.xrefText, { color: colors.mutedForeground }]}>
                  <Text style={[styles.xrefLabel, { color: colors.mutedForeground }]}>Part No: </Text>
                  {item.partNo}
                </Text>
              )}
              {item.reference && (
                <Text style={[styles.xrefText, { color: colors.mutedForeground }]}>
                  <Text style={[styles.xrefLabel, { color: colors.mutedForeground }]}>Ref: </Text>
                  {item.reference}
                </Text>
              )}
            </View>
          )}
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }, [colors, getModel, pumpSeries, router]);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Parts Quick Reference</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            Keyed by GPM Unique No.  ·  {results.length.toLocaleString()} parts
          </Text>
        </View>
      </View>

      {/* GPM authority note */}
      <View style={[styles.authorityBanner, { backgroundColor: colors.primary + "11", borderBottomColor: colors.primary + "33" }]}>
        <Feather name="info" size={13} color={colors.primary} />
        <Text style={[styles.authorityText, { color: colors.primary }]}>
          GPM Unique No. is the authoritative part number. Factory No. / Part No. are secondary cross-references only.
        </Text>
      </View>

      {/* Search bar */}
      <View style={[styles.searchWrap, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Feather name="search" size={16} color={colors.mutedForeground} />
        <TextInput
          style={[styles.searchInput, { color: colors.foreground }]}
          placeholder="Search by GPM Unique No., name, factory no…"
          placeholderTextColor={colors.mutedForeground}
          value={query}
          onChangeText={setQuery}
          autoCapitalize="none"
          autoCorrect={false}
          returnKeyType="search"
        />
        {query.length > 0 && (
          <TouchableOpacity onPress={() => setQuery("")} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="x" size={16} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Series filter chips */}
      <FlatList
        data={SERIES_FILTERS}
        keyExtractor={f => f.id}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.filterRow}
        renderItem={({ item: f }) => (
          <TouchableOpacity
            style={[styles.filterChip, {
              backgroundColor: seriesFilter === f.id ? colors.primary : colors.card,
              borderColor: seriesFilter === f.id ? colors.primary : colors.border,
            }]}
            onPress={() => setSeriesFilter(f.id)}
            activeOpacity={0.75}
          >
            <Text style={[styles.filterChipText, { color: seriesFilter === f.id ? "#fff" : colors.foreground }]}>
              {f.id === "all" ? "All Series" : `Series ${f.label}`}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* Parts list */}
      <FlatList
        data={results}
        keyExtractor={c => c.id}
        renderItem={renderItem}
        contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
        ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <Feather name="package" size={36} color={colors.mutedForeground} />
            <Text style={[styles.emptyTitle, { color: colors.foreground }]}>No parts found</Text>
            <Text style={[styles.emptyDesc, { color: colors.mutedForeground }]}>
              Try searching by GPM Unique No. (e.g. "KY-131"), component name, or description.
            </Text>
          </View>
        }
        showsVerticalScrollIndicator={false}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingBottom: 12,
    gap: 12, borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  authorityBanner: {
    flexDirection: "row", alignItems: "flex-start", gap: 8,
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1,
  },
  authorityText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },
  searchWrap: {
    flexDirection: "row", alignItems: "center", gap: 10,
    marginHorizontal: 16, marginTop: 12, marginBottom: 6,
    paddingHorizontal: 12, paddingVertical: 11,
    borderRadius: 12, borderWidth: 1,
  },
  searchInput: { flex: 1, fontSize: 14, fontFamily: "Inter_400Regular" },
  filterRow: { paddingHorizontal: 16, paddingBottom: 10, gap: 8 },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 7,
    borderRadius: 20, borderWidth: 1,
  },
  filterChipText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  listContent: { paddingHorizontal: 16, paddingTop: 4 },
  row: {
    flexDirection: "row", alignItems: "center",
    padding: 14, borderRadius: 12, borderWidth: 1, gap: 12,
  },
  rowMain: { flex: 1, gap: 4 },
  rowTop: { flexDirection: "row", alignItems: "center", gap: 8, flexWrap: "wrap" },
  gpmBadge: {
    paddingHorizontal: 10, paddingVertical: 4,
    borderRadius: 8, alignSelf: "flex-start",
  },
  gpmBadgeText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  qtyBadge: {
    paddingHorizontal: 8, paddingVertical: 3, borderRadius: 6,
  },
  qtyText: { fontSize: 11, fontFamily: "Inter_600SemiBold" },
  compName: { fontSize: 13, fontFamily: "Inter_500Medium" },
  compCat: { fontSize: 11, fontFamily: "Inter_400Regular" },
  xrefRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 2 },
  xrefLabel: { fontFamily: "Inter_500Medium" },
  xrefText: { fontSize: 11, fontFamily: "Inter_400Regular" },
  emptyWrap: { alignItems: "center", paddingTop: 64, paddingHorizontal: 32, gap: 12 },
  emptyTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  emptyDesc: { fontSize: 13, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 20 },
});
