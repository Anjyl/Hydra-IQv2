import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function PdfImportScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const [selected, setSelected] = useState<string | null>(null);

  const extractionTargets = [
    { icon: "hash", label: "Model Numbers", desc: "Extract pump model numbers from catalog tables" },
    { icon: "image", label: "Images", desc: "Extract pump photos, drawings, and diagrams" },
    { icon: "list", label: "Specifications", desc: "Extract technical specs from data tables" },
    { icon: "tool", label: "Part Numbers", desc: "Extract component part numbers from parts lists" },
    { icon: "bar-chart-2", label: "Displacements", desc: "Extract displacement values and series data" },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>PDF Import</Text>
        <View style={{ width: 22 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 16, paddingBottom: insets.bottom + 40 }} showsVerticalScrollIndicator={false}>
        {/* Upload area */}
        <TouchableOpacity style={[styles.uploadArea, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]} activeOpacity={0.8}>
          <View style={[styles.uploadIcon, { backgroundColor: colors.primary + "1A" }]}>
            <Feather name="upload" size={32} color={colors.primary} />
          </View>
          <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Upload Manufacturer Catalog</Text>
          <Text style={[styles.uploadSub, { color: colors.mutedForeground }]}>PDF files from hydraulic manufacturers</Text>
          <View style={[styles.uploadBtn, { backgroundColor: colors.primary }]}>
            <Text style={styles.uploadBtnText}>Select PDF</Text>
          </View>
        </TouchableOpacity>

        {/* Coming soon badge */}
        <View style={[styles.banner, { backgroundColor: colors.primary + "1A", borderColor: colors.primary + "33" }]}>
          <View style={styles.bannerRow}>
            <Feather name="zap" size={16} color={colors.primary} />
            <Text style={[styles.bannerTitle, { color: colors.foreground }]}>AI-Powered Extraction — Coming Soon</Text>
          </View>
          <Text style={[styles.bannerDesc, { color: colors.mutedForeground }]}>
            Our PDF parsing engine will automatically extract pump data from manufacturer catalogs. Select the data types you want to extract below.
          </Text>
        </View>

        {/* Extraction targets */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Extract from catalog:</Text>
        <View style={[styles.targetsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {extractionTargets.map((t, i) => (
            <View key={i}>
              <TouchableOpacity
                style={styles.targetRow}
                onPress={() => setSelected(selected === t.label ? null : t.label)}
                activeOpacity={0.75}
              >
                <View style={[styles.targetIcon, { backgroundColor: colors.primary + "1A" }]}>
                  <Feather name={t.icon as "hash"} size={16} color={colors.primary} />
                </View>
                <View style={styles.targetInfo}>
                  <Text style={[styles.targetLabel, { color: colors.foreground }]}>{t.label}</Text>
                  <Text style={[styles.targetDesc, { color: colors.mutedForeground }]}>{t.desc}</Text>
                </View>
                <View style={[styles.checkbox, { borderColor: selected === t.label ? colors.primary : colors.border, backgroundColor: selected === t.label ? colors.primary : "transparent" }]}>
                  {selected === t.label && <Feather name="check" size={12} color="#fff" />}
                </View>
              </TouchableOpacity>
              {i < extractionTargets.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
            </View>
          ))}
        </View>

        {/* Supported manufacturers */}
        <Text style={[styles.sectionTitle, { color: colors.foreground }]}>Supported manufacturers:</Text>
        <View style={styles.mfrChips}>
          {["GPM", "Parker", "Bosch Rexroth", "Eaton", "Danfoss", "Casappa", "Bondioli & Pavesi"].map((m, i) => (
            <View key={i} style={[styles.mfrChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.mfrChipText, { color: colors.foreground }]}>{m}</Text>
            </View>
          ))}
        </View>

        {/* Start import button */}
        <TouchableOpacity style={[styles.importBtn, { backgroundColor: colors.secondary, borderColor: colors.border }]} activeOpacity={0.8}>
          <Feather name="download" size={18} color={colors.mutedForeground} />
          <Text style={[styles.importBtnText, { color: colors.mutedForeground }]}>Start Import (Coming Soon)</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 18,
    fontFamily: "Inter_700Bold",
  },
  uploadArea: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    alignItems: "center",
    padding: 32,
    gap: 12,
  },
  uploadIcon: {
    width: 72,
    height: 72,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 17,
    fontFamily: "Inter_600SemiBold",
    textAlign: "center",
  },
  uploadSub: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    textAlign: "center",
  },
  uploadBtn: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 4,
  },
  uploadBtnText: {
    color: "#fff",
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  banner: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 10,
  },
  bannerRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  bannerTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    flex: 1,
  },
  bannerDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  sectionTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  targetsCard: {
    borderRadius: 12,
    borderWidth: 1,
    overflow: "hidden",
  },
  targetRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    gap: 12,
  },
  targetIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  targetInfo: { flex: 1 },
  targetLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  targetDesc: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  checkbox: {
    width: 22,
    height: 22,
    borderRadius: 6,
    borderWidth: 1.5,
    alignItems: "center",
    justifyContent: "center",
  },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  mfrChips: { flexDirection: "row", flexWrap: "wrap", gap: 8 },
  mfrChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
  },
  mfrChipText: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
  },
  importBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
  },
  importBtnText: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
});
