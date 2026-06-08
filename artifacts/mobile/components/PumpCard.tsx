import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { PumpModel, useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

interface Props {
  pump: PumpModel;
  compact?: boolean;
}

export function PumpCard({ pump, compact = false }: Props) {
  const colors = useColors();
  const router = useRouter();
  const { getSeries, getManufacturer } = useData();

  const series = getSeries(pump.seriesId);
  const mfr = getManufacturer(series?.manufacturerId ?? "");

  function handlePress() {
    router.push(`/pump/${pump.id}`);
  }

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.compact, { backgroundColor: colors.card, borderColor: colors.border }]}
        onPress={handlePress}
        activeOpacity={0.75}
      >
        <View style={[styles.compactIcon, { backgroundColor: colors.primary + "22" }]}>
          <Feather name="settings" size={18} color={colors.primary} />
        </View>
        <View style={styles.compactInfo}>
          <Text style={[styles.compactModel, { color: colors.foreground }]} numberOfLines={1}>
            {pump.modelNumber}
          </Text>
          <Text style={[styles.compactDisp, { color: colors.mutedForeground }]} numberOfLines={1}>
            {pump.displacement}
          </Text>
        </View>
        <Feather name="chevron-right" size={16} color={colors.mutedForeground} />
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={handlePress}
      activeOpacity={0.75}
    >
      <View style={styles.cardHeader}>
        <View style={[styles.iconBox, { backgroundColor: colors.primary + "1A" }]}>
          <Feather name="settings" size={22} color={colors.primary} />
        </View>
        <View style={styles.headerInfo}>
          <Text style={[styles.modelNum, { color: colors.foreground }]} numberOfLines={1}>
            {pump.modelNumber}
          </Text>
          <Text style={[styles.mfrText, { color: colors.primary }]} numberOfLines={1}>
            {mfr?.name ?? ""} · Series {series?.seriesName ?? ""}
          </Text>
        </View>
        <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
      </View>

      <Text style={[styles.desc, { color: colors.mutedForeground }]} numberOfLines={2}>
        {pump.description}
      </Text>

      <View style={styles.specs}>
        <SpecPill icon="activity" label={pump.displacement} colors={colors} />
        <SpecPill icon="shield" label={pump.pressureRating.split("/")[0].trim()} colors={colors} />
        <SpecPill icon="zap" label={pump.maxSpeed} colors={colors} />
      </View>
    </TouchableOpacity>
  );
}

function SpecPill({ icon, label, colors }: { icon: string; label: string; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={[styles.pill, { backgroundColor: colors.secondary }]}>
      <Feather name={icon as "activity"} size={10} color={colors.mutedForeground} />
      <Text style={[styles.pillText, { color: colors.secondaryForeground }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 12,
    borderWidth: 1,
    padding: 14,
    marginBottom: 10,
    gap: 10,
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  iconBox: {
    width: 44,
    height: 44,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  headerInfo: {
    flex: 1,
  },
  modelNum: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  mfrText: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  desc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 18,
  },
  specs: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 6,
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  pillText: {
    fontSize: 11,
    fontFamily: "Inter_500Medium",
  },
  compact: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  compactIcon: {
    width: 34,
    height: 34,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  compactInfo: {
    flex: 1,
  },
  compactModel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  compactDisp: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
