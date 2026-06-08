import { Feather } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useState } from "react";
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useData } from "@/contexts/DataContext";
import { useColors } from "@/hooks/useColors";

export default function AddScreen() {
  const colors = useColors();
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const { type } = useLocalSearchParams<{ type?: string }>();
  const { addManufacturer, addPumpSeries, addPumpModel, addComponent, manufacturers, pumpSeries, pumpModels } = useData();

  const [mfrName, setMfrName] = useState("");
  const [mfrCountry, setMfrCountry] = useState("");
  const [mfrWebsite, setMfrWebsite] = useState("");

  const [seriesName, setSeriesName] = useState("");
  const [seriesMfrId, setSeriesMfrId] = useState(manufacturers[0]?.id ?? "");
  const [seriesDesc, setSeriesDesc] = useState("");

  const [modelNumber, setModelNumber] = useState("");
  const [modelSeriesId, setModelSeriesId] = useState(pumpSeries[0]?.id ?? "");
  const [modelDesc, setModelDesc] = useState("");
  const [modelDisp, setModelDisp] = useState("");
  const [modelPressure, setModelPressure] = useState("");
  const [modelShaft, setModelShaft] = useState("");
  const [modelMounting, setModelMounting] = useState("");
  const [modelPort, setModelPort] = useState("");
  const [modelSpeed, setModelSpeed] = useState("");

  const [compModelId, setCompModelId] = useState(pumpModels[0]?.id ?? "");
  const [compName, setCompName] = useState("");
  const [compPN, setCompPN] = useState("");
  const [compDesc, setCompDesc] = useState("");
  const [compQty, setCompQty] = useState("1");
  const [compCat, setCompCat] = useState("");

  function handleSave() {
    if (type === "manufacturers") {
      if (!mfrName.trim()) return;
      addManufacturer({ name: mfrName.trim(), country: mfrCountry.trim(), website: mfrWebsite.trim() });
    } else if (type === "series") {
      if (!seriesName.trim()) return;
      addPumpSeries({ seriesName: seriesName.trim(), manufacturerId: seriesMfrId, description: seriesDesc.trim(), type: "Bushing" });
    } else if (type === "models") {
      if (!modelNumber.trim()) return;
      addPumpModel({
        seriesId: modelSeriesId, modelNumber: modelNumber.trim(), description: modelDesc.trim(),
        shaftType: modelShaft.trim(), shaftDiameter: "SAE", mountingType: modelMounting.trim(),
        portSize: modelPort.trim(), displacement: modelDisp.trim(), pressureRating: modelPressure.trim(),
        maxSpeed: modelSpeed.trim(),
      });
    } else if (type === "components") {
      if (!compName.trim()) return;
      addComponent({ pumpModelId: compModelId, name: compName.trim(), partNumber: compPN.trim(), description: compDesc.trim(), quantity: parseInt(compQty) || 1, category: compCat.trim() });
    }
    router.back();
  }

  const title = type === "manufacturers" ? "Add Manufacturer"
    : type === "series" ? "Add Series"
    : type === "models" ? "Add Pump Model"
    : "Add Component";

  return (
    <KeyboardAvoidingView style={[styles.root, { backgroundColor: colors.background }]} behavior={Platform.OS === "ios" ? "padding" : "height"}>
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="x" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <Text style={[styles.title, { color: colors.foreground }]}>{title}</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={[styles.saveBtn, { color: colors.primary }]}>Save</Text>
        </TouchableOpacity>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, gap: 12 }} showsVerticalScrollIndicator={false}>
        {type === "manufacturers" && (
          <>
            <Field label="Name *" value={mfrName} onChange={setMfrName} placeholder="e.g. GPM" colors={colors} />
            <Field label="Country" value={mfrCountry} onChange={setMfrCountry} placeholder="e.g. South Africa" colors={colors} />
            <Field label="Website" value={mfrWebsite} onChange={setMfrWebsite} placeholder="www.example.com" colors={colors} />
          </>
        )}
        {type === "series" && (
          <>
            <Field label="Series Name *" value={seriesName} onChange={setSeriesName} placeholder="e.g. 215" colors={colors} />
            <PickerField label="Manufacturer *" value={seriesMfrId} onChange={setSeriesMfrId} options={manufacturers.map(m => ({ label: m.name, value: m.id }))} colors={colors} />
            <Field label="Description" value={seriesDesc} onChange={setSeriesDesc} placeholder="Brief description" colors={colors} multiline />
          </>
        )}
        {type === "models" && (
          <>
            <Field label="Model Number *" value={modelNumber} onChange={setModelNumber} placeholder="e.g. GP-215-10" colors={colors} />
            <PickerField label="Series *" value={modelSeriesId} onChange={setModelSeriesId} options={pumpSeries.map(s => ({ label: `Series ${s.seriesName}`, value: s.id }))} colors={colors} />
            <Field label="Description" value={modelDesc} onChange={setModelDesc} placeholder="Brief description" colors={colors} multiline />
            <Field label="Displacement" value={modelDisp} onChange={setModelDisp} placeholder="e.g. 20 cc/rev" colors={colors} />
            <Field label="Pressure Rating" value={modelPressure} onChange={setModelPressure} placeholder="e.g. 240 BAR / 3500 PSI" colors={colors} />
            <Field label="Max Speed" value={modelSpeed} onChange={setModelSpeed} placeholder="e.g. 3000 RPM" colors={colors} />
            <Field label="Shaft Type" value={modelShaft} onChange={setModelShaft} placeholder="e.g. Spline / SAE B" colors={colors} />
            <Field label="Mounting Type" value={modelMounting} onChange={setModelMounting} placeholder="e.g. SAE 2-bolt B" colors={colors} />
            <Field label="Port Size" value={modelPort} onChange={setModelPort} placeholder="e.g. SAE Ported" colors={colors} />
          </>
        )}
        {type === "components" && (
          <>
            <Field label="Name *" value={compName} onChange={setCompName} placeholder="e.g. Bushing K2" colors={colors} />
            <Field label="Part Number *" value={compPN} onChange={setCompPN} placeholder="e.g. KBUSH-215" colors={colors} />
            <Field label="Category" value={compCat} onChange={setCompCat} placeholder="e.g. Bearings / Bushes" colors={colors} />
            <PickerField label="Pump Model *" value={compModelId} onChange={setCompModelId} options={pumpModels.map(m => ({ label: m.modelNumber, value: m.id }))} colors={colors} />
            <Field label="Description" value={compDesc} onChange={setCompDesc} placeholder="Component description" colors={colors} multiline />
            <Field label="Quantity Required" value={compQty} onChange={setCompQty} placeholder="1" colors={colors} keyboardType="numeric" />
          </>
        )}
        <View style={{ height: insets.bottom + 40 }} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

function Field({ label, value, onChange, placeholder, colors, multiline, keyboardType }: { label: string; value: string; onChange: (v: string) => void; placeholder?: string; colors: ReturnType<typeof useColors>; multiline?: boolean; keyboardType?: "numeric" | "default" }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <TextInput
        style={[styles.fieldInput, { color: colors.foreground, backgroundColor: colors.card, borderColor: colors.border }, multiline && { height: 80, textAlignVertical: "top" }]}
        value={value}
        onChangeText={onChange}
        placeholder={placeholder}
        placeholderTextColor={colors.mutedForeground}
        multiline={multiline}
        keyboardType={keyboardType ?? "default"}
      />
    </View>
  );
}

function PickerField({ label, value, onChange, options, colors }: { label: string; value: string; onChange: (v: string) => void; options: { label: string; value: string }[]; colors: ReturnType<typeof useColors> }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={[styles.fieldLabel, { color: colors.mutedForeground }]}>{label}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        {options.map(opt => (
          <TouchableOpacity
            key={opt.value}
            style={[styles.optionChip, { backgroundColor: value === opt.value ? colors.primary : colors.card, borderColor: value === opt.value ? colors.primary : colors.border }]}
            onPress={() => onChange(opt.value)}
          >
            <Text style={[styles.optionText, { color: value === opt.value ? "#fff" : colors.foreground }]}>{opt.label}</Text>
          </TouchableOpacity>
        ))}
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
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  saveBtn: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  fieldWrap: { gap: 6 },
  fieldLabel: {
    fontSize: 12,
    fontFamily: "Inter_500Medium",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  fieldInput: {
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    paddingVertical: 11,
    fontSize: 14,
    fontFamily: "Inter_400Regular",
  },
  optionChip: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    borderRadius: 10,
    borderWidth: 1,
    marginRight: 8,
  },
  optionText: {
    fontSize: 13,
    fontFamily: "Inter_500Medium",
  },
});
