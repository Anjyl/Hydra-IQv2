import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { getGpmNo, useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

export default function ComponentDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getComponent, getModel, getSeries, getManufacturer } = useData();

  const component = getComponent(id ?? "");
  const model = getModel(component?.pumpModelId ?? "");
  const series = getSeries(model?.seriesId ?? "");
  const mfr = getManufacturer(series?.manufacturerId ?? "");

  if (!component) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={{ color: colors.mutedForeground, fontFamily: "Inter_400Regular" }}>Component not found</Text>
      </View>
    );
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.headerName, { color: colors.foreground }]} numberOfLines={1}>{component.name}</Text>
          <Text style={[styles.headerPN, { color: colors.primary }]} numberOfLines={1}>GPM: {getGpmNo(component)}</Text>
        </View>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40, gap: 16 }} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <View style={[styles.heroIcon, { backgroundColor: colors.primary + "1A" }]}>
            <Feather name="tool" size={44} color={colors.primary} />
          </View>
          <Text style={[styles.heroName, { color: colors.foreground }]}>{component.name}</Text>
          <View style={[styles.categoryBadge, { backgroundColor: colors.primary + "22" }]}>
            <Text style={[styles.categoryText, { color: colors.primary }]}>{component.category}</Text>
          </View>
        </View>

        {/* Details */}
        <View style={[styles.detailCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {/* GPM Unique No. — PRIMARY */}
          <View style={styles.row}>
            <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>GPM Unique No.</Text>
            <Text style={[styles.gpmNoValue, { color: colors.primary }]}>{getGpmNo(component)}</Text>
          </View>
          {/* Secondary cross-refs — only shown when present */}
          {component.factoryNo ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Factory No. (cross-ref)</Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{component.factoryNo}</Text>
              </View>
            </>
          ) : null}
          {component.partNo ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Part No. (cross-ref)</Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{component.partNo}</Text>
              </View>
            </>
          ) : null}
          {component.reference ? (
            <>
              <View style={[styles.divider, { backgroundColor: colors.border }]} />
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>Reference</Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{component.reference}</Text>
              </View>
            </>
          ) : null}
          <View style={[styles.divider, { backgroundColor: colors.border }]} />
          {[
            { label: "Category",          value: component.category },
            { label: "Quantity Required", value: `× ${component.quantity}` },
            { label: "For Model",         value: model?.modelNumber ?? "—" },
            { label: "Series",            value: series ? `Series ${series.seriesName}` : "—" },
            { label: "Manufacturer",      value: mfr?.name ?? "—" },
          ].map((row, i, arr) => (
            <View key={row.label}>
              <View style={styles.row}>
                <Text style={[styles.rowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                <Text style={[styles.rowValue, { color: colors.foreground }]}>{row.value}</Text>
              </View>
              {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Description */}
        <View style={[styles.descCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.descTitle, { color: colors.foreground }]}>Description</Text>
          <Text style={[styles.descText, { color: colors.mutedForeground }]}>{component.description}</Text>
        </View>

        {/* Image placeholder */}
        <View style={[styles.imagePlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Feather name="image" size={32} color={colors.mutedForeground} />
          <Text style={[styles.imagePlaceholderText, { color: colors.mutedForeground }]}>
            Component image can be added via Admin Panel
          </Text>
        </View>

        {/* Back to pump button */}
        {model && (
          <TouchableOpacity
            style={[styles.backToPump, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "33" }]}
            onPress={() => router.push(`/pump/${model.id}`)}
            activeOpacity={0.75}
          >
            <Feather name="settings" size={16} color={colors.primary} />
            <Text style={[styles.backToPumpText, { color: colors.primary }]}>View full pump — {model.modelNumber}</Text>
            <Feather name="chevron-right" size={16} color={colors.primary} />
          </TouchableOpacity>
        )}
      </ScrollView>
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
    gap: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerTitle: { flex: 1 },
  headerName: {
    fontSize: 16,
    fontFamily: "Inter_700Bold",
  },
  headerPN: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  heroCard: {
    borderRadius: 14,
    borderWidth: 1,
    alignItems: "center",
    padding: 24,
    gap: 12,
  },
  heroIcon: {
    width: 80,
    height: 80,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  heroName: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  categoryBadge: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 20,
  },
  categoryText: {
    fontSize: 12,
    fontFamily: "Inter_600SemiBold",
  },
  detailCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  rowValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "right",
  },
  gpmNoValue: {
    fontSize: 13,
    fontFamily: "Inter_700Bold",
    flex: 1,
    textAlign: "right",
    letterSpacing: 0.3,
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  descCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  descTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  descText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  imagePlaceholder: {
    borderRadius: 12,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    justifyContent: "center",
    padding: 32,
    gap: 10,
  },
  imagePlaceholderText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  backToPump: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  backToPumpText: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
});
