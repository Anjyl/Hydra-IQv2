import { Feather } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Alert,
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
import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

type Tab = "manufacturers" | "series" | "models" | "components";

export default function AdminScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const { manufacturers, pumpSeries, pumpModels, components, deleteManufacturer, deletePumpSeries, deletePumpModel, deleteComponent, getSeries, getManufacturer, getModel } = useData();
  const [activeTab, setActiveTab] = useState<Tab>("manufacturers");

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  const tabs: { id: Tab; label: string; count: number }[] = [
    { id: "manufacturers", label: "Mfrs", count: manufacturers.length },
    { id: "series", label: "Series", count: pumpSeries.length },
    { id: "models", label: "Models", count: pumpModels.length },
    { id: "components", label: "Parts", count: components.length },
  ];

  function confirmDelete(label: string, onConfirm: () => void) {
    if (Platform.OS === "web") {
      if (window.confirm(`Delete "${label}"?`)) onConfirm();
    } else {
      Alert.alert("Delete", `Delete "${label}"?`, [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onConfirm },
      ]);
    }
  }

  function renderItem() {
    if (activeTab === "manufacturers") {
      return (
        <FlatList
          data={manufacturers}
          keyExtractor={i => i.id}
          renderItem={({ item }) => (
            <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.itemIcon, { backgroundColor: colors.primary + "1A" }]}>
                <Feather name="briefcase" size={18} color={colors.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text>
                {item.country && <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{item.country}</Text>}
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(item.name, () => deleteManufacturer(item.id))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          )}
          ListEmptyComponent={<EmptyState icon="briefcase" title="No manufacturers" subtitle="Add your first manufacturer" />}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
          scrollEnabled={manufacturers.length > 0}
        />
      );
    }

    if (activeTab === "series") {
      return (
        <FlatList
          data={pumpSeries}
          keyExtractor={i => i.id}
          renderItem={({ item }) => {
            const mfr = getManufacturer(item.manufacturerId);
            return (
              <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.itemIcon, { backgroundColor: colors.primary + "1A" }]}>
                  <Feather name="layers" size={18} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>Series {item.seriesName}</Text>
                  <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>{mfr?.name} · {item.type}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(`Series ${item.seriesName}`, () => deletePumpSeries(item.id))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={<EmptyState icon="layers" title="No series" subtitle="Add a pump series" />}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
          scrollEnabled={pumpSeries.length > 0}
        />
      );
    }

    if (activeTab === "models") {
      return (
        <FlatList
          data={pumpModels}
          keyExtractor={i => i.id}
          renderItem={({ item }) => {
            const series = getSeries(item.seriesId);
            return (
              <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <View style={[styles.itemIcon, { backgroundColor: colors.primary + "1A" }]}>
                  <Feather name="settings" size={18} color={colors.primary} />
                </View>
                <View style={styles.itemInfo}>
                  <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.modelNumber}</Text>
                  <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>Series {series?.seriesName} · {item.displacement}</Text>
                </View>
                <TouchableOpacity
                  onPress={() => confirmDelete(item.modelNumber, () => deletePumpModel(item.id))}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <Feather name="trash-2" size={16} color={colors.destructive} />
                </TouchableOpacity>
              </View>
            );
          }}
          ListEmptyComponent={<EmptyState icon="settings" title="No pump models" subtitle="Add your first pump model" />}
          contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
          scrollEnabled={pumpModels.length > 0}
        />
      );
    }

    return (
      <FlatList
        data={components}
        keyExtractor={i => i.id}
        renderItem={({ item }) => {
          const model = getModel(item.pumpModelId);
          return (
            <View style={[styles.item, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <View style={[styles.itemIcon, { backgroundColor: colors.primary + "1A" }]}>
                <Feather name="tool" size={18} color={colors.primary} />
              </View>
              <View style={styles.itemInfo}>
                <Text style={[styles.itemTitle, { color: colors.foreground }]}>{item.name}</Text>
                <Text style={[styles.itemSub, { color: colors.mutedForeground }]}>GPM: {item.gpmUniqueNo ?? item.partNumber} · {model?.modelNumber}</Text>
              </View>
              <TouchableOpacity
                onPress={() => confirmDelete(item.name, () => deleteComponent(item.id))}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <Feather name="trash-2" size={16} color={colors.destructive} />
              </TouchableOpacity>
            </View>
          );
        }}
        ListEmptyComponent={<EmptyState icon="tool" title="No components" subtitle="Add components for a pump model" />}
        contentContainerStyle={{ paddingBottom: bottomInset + 100 }}
        scrollEnabled={components.length > 0}
      />
    );
  }

  function handleAdd() {
    router.push(`/admin/add?type=${activeTab}`);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16, borderBottomColor: colors.border }]}>
        <View>
          <Text style={[styles.title, { color: colors.foreground }]}>Admin Panel</Text>
          <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>Manage catalog data</Text>
        </View>
        <TouchableOpacity
          style={[styles.addBtn, { backgroundColor: colors.primary }]}
          onPress={handleAdd}
        >
          <Feather name="plus" size={20} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Tabs */}
      <View style={[styles.tabBar, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
        {tabs.map(tab => (
          <TouchableOpacity
            key={tab.id}
            style={[styles.tab, activeTab === tab.id && { borderBottomColor: colors.primary, borderBottomWidth: 2 }]}
            onPress={() => setActiveTab(tab.id)}
          >
            <Text style={[styles.tabLabel, { color: activeTab === tab.id ? colors.primary : colors.mutedForeground }]}>
              {tab.label}
            </Text>
            <View style={[styles.tabBadge, { backgroundColor: activeTab === tab.id ? colors.primary : colors.secondary }]}>
              <Text style={[styles.tabBadgeText, { color: activeTab === tab.id ? "#fff" : colors.mutedForeground }]}>
                {tab.count}
              </Text>
            </View>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.listWrap}>
        {renderItem()}
      </View>
    </View>
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
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  title: {
    fontSize: 22,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
  addBtn: {
    width: 40,
    height: 40,
    borderRadius: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  tabBar: {
    flexDirection: "row",
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    gap: 6,
    borderBottomWidth: 2,
    borderBottomColor: "transparent",
  },
  tabLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
  },
  tabBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    alignItems: "center",
  },
  tabBadgeText: {
    fontSize: 10,
    fontFamily: "Inter_600SemiBold",
  },
  listWrap: {
    flex: 1,
    padding: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    padding: 12,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 8,
  },
  itemIcon: {
    width: 36,
    height: 36,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  itemInfo: { flex: 1 },
  itemTitle: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
  },
  itemSub: {
    fontSize: 12,
    fontFamily: "Inter_400Regular",
    marginTop: 2,
  },
});
