import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
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

type Tab = "overview" | "specs" | "components" | "drawings";

export default function PumpDetailScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { getModel, getSeries, getManufacturer, getComponentsForModel, markViewed } = useData();

  const pump = getModel(id ?? "");
  const series = getSeries(pump?.seriesId ?? "");
  const mfr = getManufacturer(series?.manufacturerId ?? "");
  const components = getComponentsForModel(id ?? "");

  const [activeTab, setActiveTab] = useState<Tab>("overview");

  useEffect(() => {
    if (id) markViewed(id);
  }, [id]);

  if (!pump) {
    return (
      <View style={[styles.root, { backgroundColor: colors.background, alignItems: "center", justifyContent: "center" }]}>
        <Text style={[styles.notFound, { color: colors.mutedForeground }]}>Pump not found</Text>
      </View>
    );
  }

  const tabs: { id: Tab; label: string }[] = [
    { id: "overview", label: "Overview" },
    { id: "specs", label: "Specs" },
    { id: "components", label: `Parts (${components.length})` },
    { id: "drawings", label: "Drawings" },
  ];

  const specRows = [
    { label: "Displacement", value: pump.displacement },
    { label: "Pressure Rating", value: pump.pressureRating },
    { label: "Max Speed", value: pump.maxSpeed },
    { label: "Shaft Type", value: pump.shaftType },
    { label: "Shaft Diameter", value: pump.shaftDiameter },
    { label: "Mounting Type", value: pump.mountingType },
    { label: "Port Size", value: pump.portSize },
    { label: "Weight", value: pump.weight ?? "—" },
  ];

  const categories = [...new Set(components.map(c => c.category))];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Custom header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={styles.headerTitle}>
          <Text style={[styles.modelNum, { color: colors.foreground }]} numberOfLines={1}>{pump.modelNumber}</Text>
          <Text style={[styles.mfrSeries, { color: colors.primary }]} numberOfLines={1}>
            {mfr?.name} · Series {series?.seriesName}
          </Text>
        </View>
      </View>

      {/* Tab bar */}
      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabText, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {activeTab === "overview" && (
          <View style={styles.section}>
            {/* Hero card */}
            <View style={[styles.heroCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.heroIcon, { backgroundColor: colors.primary + "1A" }]}>
                <Feather name="settings" size={48} color={colors.primary} />
              </View>
              <Text style={[styles.heroModel, { color: colors.foreground }]}>{pump.modelNumber}</Text>
              <Text style={[styles.heroDesc, { color: colors.mutedForeground }]}>{pump.description}</Text>
            </View>

            {/* Key specs strip */}
            <View style={styles.keySpecsRow}>
              {[
                { label: "Displacement", value: pump.displacement, icon: "activity" },
                { label: "Max Pressure", value: pump.pressureRating.split("/")[0].trim(), icon: "shield" },
                { label: "Max Speed", value: pump.maxSpeed, icon: "zap" },
              ].map((s, i) => (
                <View key={i} style={[styles.keySpecCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Feather name={s.icon as "activity"} size={16} color={colors.primary} />
                  <Text style={[styles.keySpecVal, { color: colors.foreground }]}>{s.value}</Text>
                  <Text style={[styles.keySpecLabel, { color: colors.mutedForeground }]}>{s.label}</Text>
                </View>
              ))}
            </View>

            {/* Quick info */}
            <View style={[styles.infoCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <InfoRow label="Manufacturer" value={mfr?.name ?? "—"} colors={colors} />
              <Divider colors={colors} />
              <InfoRow label="Series" value={series?.seriesName ?? "—"} colors={colors} />
              <Divider colors={colors} />
              <InfoRow label="Shaft Type" value={pump.shaftType} colors={colors} />
              <Divider colors={colors} />
              <InfoRow label="Mounting" value={pump.mountingType} colors={colors} />
            </View>

            {pump.notes && (
              <View style={[styles.notesCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={styles.notesHeader}>
                  <Feather name="info" size={14} color={colors.primary} />
                  <Text style={[styles.notesTitle, { color: colors.foreground }]}>Notes</Text>
                </View>
                <Text style={[styles.notesText, { color: colors.mutedForeground }]}>{pump.notes}</Text>
              </View>
            )}
          </View>
        )}

        {activeTab === "specs" && (
          <View style={styles.section}>
            <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {specRows.map((row, i) => (
                <View key={i}>
                  <View style={styles.specRow}>
                    <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.specValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                  {i < specRows.length - 1 && <Divider colors={colors} />}
                </View>
              ))}
            </View>

            {/* Series context card */}
            <View style={[styles.contextCard, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "33" }]}>
              <Feather name="info" size={16} color={colors.primary} />
              <Text style={[styles.contextText, { color: colors.foreground }]}>
                {series?.description ?? "GPM Bushing Range — designed for high-pressure hydraulic applications up to 240 BAR."}
              </Text>
            </View>
          </View>
        )}

        {activeTab === "components" && (
          <View style={styles.section}>
            {categories.map(cat => (
              <View key={cat} style={{ gap: 8 }}>
                <Text style={[styles.catLabel, { color: colors.mutedForeground }]}>{cat.toUpperCase()}</Text>
                <View style={[styles.specsCard, { backgroundColor: colors.card, borderColor: colors.border, marginBottom: 16 }]}>
                  {components.filter(c => c.category === cat).map((comp, i, arr) => (
                    <View key={comp.id}>
                      <TouchableOpacity
                        style={styles.compRow}
                        onPress={() => router.push(`/component/${comp.id}`)}
                        activeOpacity={0.75}
                      >
                        <View style={styles.compInfo}>
                          <Text style={[styles.compName, { color: colors.foreground }]}>{comp.name}</Text>
                          {/* GPM Unique No. — authoritative part number (primary display) */}
                          <Text style={[styles.compPN, { color: colors.primary }]}>
                            GPM: {getGpmNo(comp)}
                          </Text>
                        </View>
                        <View style={styles.compRight}>
                          <View style={[styles.qtyBadge, { backgroundColor: colors.secondary }]}>
                            <Text style={[styles.qtyText, { color: colors.foreground }]}>×{comp.quantity}</Text>
                          </View>
                          <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
                        </View>
                      </TouchableOpacity>
                      {i < arr.length - 1 && <Divider colors={colors} />}
                    </View>
                  ))}
                </View>
              </View>
            ))}
          </View>
        )}

        {activeTab === "drawings" && (
          <View style={styles.section}>
            <View style={[styles.drawingPlaceholder, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Feather name="file" size={40} color={colors.mutedForeground} />
              <Text style={[styles.drawingTitle, { color: colors.foreground }]}>Technical Drawings</Text>
              <Text style={[styles.drawingSubtitle, { color: colors.mutedForeground }]}>
                Product image, technical drawing, and exploded view diagram will appear here once added via the Admin Panel.
              </Text>
            </View>
            {[
              { label: "Product Photo", icon: "image" },
              { label: "Technical Drawing", icon: "file" },
              { label: "Exploded View Diagram", icon: "layers" },
            ].map((d, i) => (
              <View key={i} style={[styles.drawingItem, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.drawingIcon, { backgroundColor: colors.secondary }]}>
                  <Feather name={d.icon as "image"} size={22} color={colors.mutedForeground} />
                </View>
                <Text style={[styles.drawingLabel, { color: colors.foreground }]}>{d.label}</Text>
                <View style={[styles.notAvail, { backgroundColor: colors.secondary }]}>
                  <Text style={[styles.notAvailText, { color: colors.mutedForeground }]}>Not added</Text>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function InfoRow({ label, value, colors }: { label: string; value: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.specRow}>
      <Text style={[styles.specLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <Text style={[styles.specValue, { color: colors.foreground }]}>{value}</Text>
    </View>
  );
}

function Divider({ colors }: { colors: ReturnType<typeof useColors> }) {
  return <View style={[styles.divider, { backgroundColor: colors.border }]} />;
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
  backBtn: { padding: 4 },
  headerTitle: { flex: 1 },
  modelNum: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  mfrSeries: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  tabBar: {
    borderBottomWidth: StyleSheet.hairlineWidth,
    maxHeight: 48,
  },
  tab: {
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabText: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  body: { flex: 1 },
  section: { gap: 14 },
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
  heroModel: {
    fontSize: 20,
    fontFamily: "Inter_700Bold",
  },
  heroDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  keySpecsRow: {
    flexDirection: "row",
    gap: 10,
  },
  keySpecCard: {
    flex: 1,
    borderRadius: 12,
    borderWidth: 1,
    alignItems: "center",
    padding: 12,
    gap: 4,
  },
  keySpecVal: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
  },
  keySpecLabel: {
    fontSize: 10,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  infoCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  notesCard: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    gap: 8,
  },
  notesHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  notesTitle: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  notesText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  specsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  specRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  specLabel: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    flex: 1,
  },
  specValue: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
    textAlign: "right",
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  contextCard: {
    flexDirection: "row",
    gap: 10,
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    alignItems: "flex-start",
  },
  contextText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  catLabel: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
    letterSpacing: 1,
  },
  compRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    paddingVertical: 12,
    gap: 12,
  },
  compInfo: { flex: 1 },
  compName: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
  compPN: {
    fontSize: 12,
    fontFamily: "Inter_700Bold",
    marginTop: 2,
  },
  compXRef: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
    marginTop: 1,
  },
  compRight: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  qtyBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  qtyText: {
    fontSize: 11,
    fontFamily: "Inter_600SemiBold",
  },
  drawingPlaceholder: {
    borderRadius: 14,
    borderWidth: 1,
    borderStyle: "dashed",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  drawingTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  drawingSubtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
    lineHeight: 20,
  },
  drawingItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  drawingIcon: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  drawingLabel: {
    flex: 1,
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  notAvail: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  notAvailText: {
    fontSize: 11,
    fontFamily: "Inter_400Regular",
  },
  notFound: {
    fontSize: 16,
    fontFamily: "Inter_400Regular",
  },
});
