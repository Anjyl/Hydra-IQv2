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

// ── Types ──────────────────────────────────────────────────────────
type ProductType = "GP" | "GM" | "GF" | "GA" | "GZ";
type PumpFamily = "bearing" | "bushing";
type ShaftConfig = "7/8K" | "1K" | "1.25K" | "9T" | "13T";
type PortEnd = "STD" | "4P" | "BI" | "AAP";

interface BuilderState {
  productType: ProductType | null;
  family: PumpFamily | null;
  series: string | null;
  dashCode: string | null;
  shaft: ShaftConfig | null;
  portEnd: PortEnd | null;
}

// ── Catalogue data ─────────────────────────────────────────────────
const PRODUCT_TYPES: { code: ProductType; label: string; desc: string }[] = [
  { code: "GP", label: "Gear Pump",          desc: "Fixed-displacement hydraulic gear pump" },
  { code: "GM", label: "Gear Motor",         desc: "Fixed-displacement hydraulic gear motor" },
  { code: "GF", label: "Flow Divider",       desc: "Dual-section flow divider" },
  { code: "GA", label: "Add-A-Pump",         desc: "Rear-mounted add-on pump" },
  { code: "GZ", label: "Pump/Motor Combo",   desc: "Combined pump and motor unit" },
];

const SERIES_DATA: Record<string, {
  family: PumpFamily;
  mount: string;
  bearingOD: string;
  maxPressure: string;
  dashCodes: string[];
  gpmParts: { role: string; gpmNo: string }[];
}> = {
  "120": {
    family: "bearing",
    mount: "SAE B 2-bolt",
    bearingOD: "40 mm",
    maxPressure: "200 bar",
    dashCodes: ["-05","-07","-10","-12","-15","-18","-20"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "ADD-131-??" },
      { role: "Housing",        gpmNo: "CRD-120-??" },
      { role: "Ball Bearing",   gpmNo: "KX-131-40"  },
      { role: "Needle Rollers", gpmNo: "KY-131"     },
      { role: "Body Seal Kit",  gpmNo: "LUB-120-239"},
    ],
  },
  "125": {
    family: "bearing",
    mount: "SAE C 4-bolt",
    bearingOD: "See catalogue p.55",
    maxPressure: "240 bar",
    dashCodes: ["-08","-10","-12","-15","-18","-20","-25","-30","-35","-40"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "AKA-125-??" },
      { role: "Housing",        gpmNo: "CMA-125-??" },
      { role: "Ball Bearing",   gpmNo: "KX-125-8"   },
      { role: "Needle Rollers", gpmNo: "KS-151"     },
      { role: "Body Seal Kit",  gpmNo: "LUB-151-244"},
    ],
  },
  "131": {
    family: "bearing",
    mount: "SAE B 2/4-bolt",
    bearingOD: "40 mm",
    maxPressure: "240 bar",
    dashCodes: ["-05","-07","-10","-12","-15","-18","-20","-25","-30"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "ADD-131-??" },
      { role: "Housing",        gpmNo: "CRA-131-??" },
      { role: "Ball Bearing",   gpmNo: "KX-131-40"  },
      { role: "Needle Rollers", gpmNo: "KY-131"     },
      { role: "Body Seal Kit",  gpmNo: "LUB-131-242"},
    ],
  },
  "151": {
    family: "bearing",
    mount: "SAE C 4-bolt",
    bearingOD: "58 mm",
    maxPressure: "250 bar",
    dashCodes: ["-10","-12","-15","-18","-20","-25","-30","-35","-40","-50"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "ATD-151-??" },
      { role: "Housing",        gpmNo: "CMA-151-??" },
      { role: "Ball Bearing",   gpmNo: "KX-151-58"  },
      { role: "Needle Rollers", gpmNo: "KS-151"     },
      { role: "Body Seal Kit",  gpmNo: "LUB-151-244"},
    ],
  },
  "176": {
    family: "bearing",
    mount: "SAE D 4-bolt",
    bearingOD: "59 mm",
    maxPressure: "250 bar",
    dashCodes: ["-15","-20","-25","-30","-35","-40","-50","-60","-70","-80"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "AAL-176-??" },
      { role: "Housing",        gpmNo: "CSA-176-??" },
      { role: "Ball Bearing",   gpmNo: "KX-176-59"  },
      { role: "Needle Rollers", gpmNo: "KR-176"     },
      { role: "Body Seal Kit",  gpmNo: "LUB-176-252"},
    ],
  },
  "215": {
    family: "bushing",
    mount: "SAE B 2-bolt",
    bearingOD: "Bronze bushing",
    maxPressure: "140 bar",
    dashCodes: ["-03","-05","-07","-10","-12","-14","-16","-18","-20"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "A-215-??" },
      { role: "Housing",        gpmNo: "CRK-215-??"},
      { role: "Body Seal Kit",  gpmNo: "LUB-215-??"},
    ],
  },
  "230": {
    family: "bushing",
    mount: "SAE B/C",
    bearingOD: "Bronze bushing",
    maxPressure: "160 bar",
    dashCodes: ["-05","-07","-10","-12","-15","-18","-20","-25","-30"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "A-230-??" },
      { role: "Housing",        gpmNo: "CRK-230-??"},
      { role: "Body Seal Kit",  gpmNo: "LUB-230-??"},
    ],
  },
  "250": {
    family: "bushing",
    mount: "SAE C 4-bolt",
    bearingOD: "Bronze bushing",
    maxPressure: "160 bar",
    dashCodes: ["-08","-10","-12","-15","-18","-20","-25","-30","-35","-40","-50"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "A-250-??" },
      { role: "Housing",        gpmNo: "CRK-250-??"},
      { role: "Body Seal Kit",  gpmNo: "LUB-250-??"},
    ],
  },
  "265": {
    family: "bushing",
    mount: "SAE D 4-bolt",
    bearingOD: "Bronze bushing",
    maxPressure: "160 bar",
    dashCodes: ["-12","-15","-18","-20","-25","-30","-35","-40","-50","-60","-70"],
    gpmParts: [
      { role: "Gear Set",       gpmNo: "A-265-??" },
      { role: "Housing",        gpmNo: "CRK-265-??"},
      { role: "Body Seal Kit",  gpmNo: "LUB-265-??"},
    ],
  },
};

const SHAFT_OPTS: { code: ShaftConfig; label: string; desc: string }[] = [
  { code: "7/8K", label: '7/8" Keyed',     desc: "SAE standard keyed shaft" },
  { code: "1K",   label: '1" Keyed',       desc: "SAE C keyed shaft" },
  { code: "1.25K",label: '1-1/4" Keyed',   desc: "SAE D keyed shaft" },
  { code: "9T",   label: "9T Splined",     desc: "SAE 9-tooth splined shaft" },
  { code: "13T",  label: "13T Splined",    desc: "SAE 13-tooth splined shaft" },
];

const PORT_OPTS: { code: PortEnd; label: string; desc: string }[] = [
  { code: "STD", label: "Standard",        desc: "SAE ported end cover, single direction" },
  { code: "4P",  label: "4-Port",          desc: "Bi-rotation ready, 4 port options" },
  { code: "BI",  label: "Bi-rotation",     desc: "Symmetrical port end, either rotation" },
  { code: "AAP", label: "Add-A-Pump",      desc: "Rear through-drive for tandem mounting" },
];

const STEPS = [
  "Product Type",
  "Pump Family",
  "Series",
  "Displacement",
  "Shaft Config",
  "Port End",
  "Summary",
];

// ── Helpers ─────────────────────────────────────────────────────────
function buildCode(s: BuilderState): string {
  const parts: string[] = [];
  if (s.productType) parts.push(s.productType);
  if (s.series)      parts.push(s.series);
  if (s.dashCode)    parts.push(s.dashCode.replace("-", ""));
  if (s.shaft)       parts.push(s.shaft);
  if (s.portEnd && s.portEnd !== "STD") parts.push(s.portEnd);
  return parts.join("-");
}

function resolveGpmNo(tpl: string, dashCode: string | null): string {
  if (!dashCode) return tpl;
  const num = dashCode.replace("-", "").padStart(2, "0");
  return tpl.includes("??") ? tpl.replace("??", num) : tpl;
}

// ── Main screen ──────────────────────────────────────────────────────
export default function PumpBuilderScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [step, setStep] = useState(0);
  const [state, setState] = useState<BuilderState>({
    productType: null, family: null, series: null,
    dashCode: null, shaft: null, portEnd: null,
  });

  function update<K extends keyof BuilderState>(key: K, val: BuilderState[K]) {
    setState(prev => ({ ...prev, [key]: val }));
  }

  function next() { setStep(s => Math.min(s + 1, STEPS.length - 1)); }
  function back() { setStep(s => Math.max(s - 1, 0)); }
  function reset() { setStep(0); setState({ productType: null, family: null, series: null, dashCode: null, shaft: null, portEnd: null }); }

  const seriesInFamily = Object.entries(SERIES_DATA)
    .filter(([, d]) => !state.family || d.family === state.family)
    .map(([code]) => code);

  const currentSeries = state.series ? SERIES_DATA[state.series] : null;
  const generatedCode = buildCode(state);

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 8, borderBottomColor: colors.border }]}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <Feather name="arrow-left" size={22} color={colors.foreground} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerTitle, { color: colors.foreground }]}>Pump Builder</Text>
          <Text style={[styles.headerSub, { color: colors.mutedForeground }]}>
            {STEPS[step]}  ·  Step {step + 1} of {STEPS.length}
          </Text>
        </View>
        {step > 0 && (
          <TouchableOpacity onPress={reset} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <Feather name="refresh-cw" size={18} color={colors.mutedForeground} />
          </TouchableOpacity>
        )}
      </View>

      {/* Progress bar */}
      <View style={[styles.progressTrack, { backgroundColor: colors.border }]}>
        <View style={[styles.progressFill, { backgroundColor: colors.primary, width: `${((step + 1) / STEPS.length) * 100}%` as any }]} />
      </View>

      {/* Code preview strip */}
      {generatedCode.length > 0 && (
        <View style={[styles.codeStrip, { backgroundColor: colors.card, borderBottomColor: colors.border }]}>
          <Feather name="hash" size={14} color={colors.primary} />
          <Text style={[styles.codeText, { color: colors.primary }]}>{generatedCode}</Text>
          <Text style={[styles.codeHint, { color: colors.mutedForeground }]}> (in progress)</Text>
        </View>
      )}

      <ScrollView style={styles.body} contentContainerStyle={{ padding: 16, paddingBottom: insets.bottom + 100 }} showsVerticalScrollIndicator={false}>

        {/* STEP 0 — Product Type */}
        {step === 0 && (
          <View style={styles.stepSection}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>What are you configuring?</Text>
            {PRODUCT_TYPES.map(pt => (
              <TouchableOpacity
                key={pt.code}
                style={[styles.optionCard, { backgroundColor: colors.card, borderColor: state.productType === pt.code ? colors.primary : colors.border }]}
                onPress={() => { update("productType", pt.code); }}
                activeOpacity={0.75}
              >
                <View style={[styles.optionRadio, { borderColor: state.productType === pt.code ? colors.primary : colors.border }]}>
                  {state.productType === pt.code && <View style={[styles.optionRadioFill, { backgroundColor: colors.primary }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>{pt.code} — {pt.label}</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{pt.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 1 — Pump Family */}
        {step === 1 && (
          <View style={styles.stepSection}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Select pump family</Text>
            {([
              { code: "bearing" as PumpFamily, label: "Bearing Range", desc: "Ball/needle roller bearings at shaft end. Series 120, 125, 131, 151, 176. Up to 250 bar.", icon: "disc" },
              { code: "bushing" as PumpFamily, label: "Bushing Range", desc: "Bronze bushings (no shaft ball bearing). Series 215, 230, 250, 265. Up to 160 bar.", icon: "layers" },
            ] as { code: PumpFamily; label: string; desc: string; icon: string }[]).map(f => (
              <TouchableOpacity
                key={f.code}
                style={[styles.optionCard, { backgroundColor: colors.card, borderColor: state.family === f.code ? (f.code === "bearing" ? "#f59e0b" : colors.primary) : colors.border }]}
                onPress={() => { update("family", f.code); update("series", null); update("dashCode", null); }}
                activeOpacity={0.75}
              >
                <View style={[styles.optionIcon, { backgroundColor: (f.code === "bearing" ? "#f59e0b" : colors.primary) + "22" }]}>
                  <Feather name={f.icon as "disc"} size={22} color={f.code === "bearing" ? "#f59e0b" : colors.primary} />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>{f.label}</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{f.desc}</Text>
                </View>
                {state.family === f.code && <Feather name="check-circle" size={20} color={f.code === "bearing" ? "#f59e0b" : colors.primary} />}
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 2 — Series */}
        {step === 2 && (
          <View style={styles.stepSection}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Select series</Text>
            {seriesInFamily.map(code => {
              const d = SERIES_DATA[code];
              const isBearing = d.family === "bearing";
              const accent = isBearing ? "#f59e0b" : colors.primary;
              return (
                <TouchableOpacity
                  key={code}
                  style={[styles.optionCard, { backgroundColor: colors.card, borderColor: state.series === code ? accent : colors.border }]}
                  onPress={() => { update("series", code); update("dashCode", null); }}
                  activeOpacity={0.75}
                >
                  <View style={[styles.seriesBadge, { backgroundColor: accent + "22" }]}>
                    <Text style={[styles.seriesBadgeText, { color: accent }]}>{code}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.optionLabel, { color: colors.foreground }]}>Series {code} — {d.mount}</Text>
                    <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{isBearing ? `Shaft bearing OD: ${d.bearingOD}` : d.bearingOD}  ·  Max {d.maxPressure}</Text>
                  </View>
                  {state.series === code && <Feather name="check-circle" size={18} color={accent} />}
                </TouchableOpacity>
              );
            })}
          </View>
        )}

        {/* STEP 3 — Displacement */}
        {step === 3 && currentSeries && (
          <View style={styles.stepSection}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Select displacement (dash code)</Text>
            <Text style={[styles.stepHint, { color: colors.mutedForeground }]}>
              Dash code corresponds to the gear width code in the GPM Unique No. for this series.
            </Text>
            <View style={styles.dashGrid}>
              {currentSeries.dashCodes.map(dc => (
                <TouchableOpacity
                  key={dc}
                  style={[styles.dashChip, { backgroundColor: state.dashCode === dc ? colors.primary : colors.card, borderColor: state.dashCode === dc ? colors.primary : colors.border }]}
                  onPress={() => update("dashCode", dc)}
                  activeOpacity={0.75}
                >
                  <Text style={[styles.dashChipText, { color: state.dashCode === dc ? "#fff" : colors.foreground }]}>{dc}</Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* STEP 4 — Shaft Config */}
        {step === 4 && (
          <View style={styles.stepSection}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Shaft configuration</Text>
            {SHAFT_OPTS.map(s => (
              <TouchableOpacity
                key={s.code}
                style={[styles.optionCard, { backgroundColor: colors.card, borderColor: state.shaft === s.code ? colors.primary : colors.border }]}
                onPress={() => update("shaft", s.code)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionRadio, { borderColor: state.shaft === s.code ? colors.primary : colors.border }]}>
                  {state.shaft === s.code && <View style={[styles.optionRadioFill, { backgroundColor: colors.primary }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>{s.label}</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{s.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 5 — Port End */}
        {step === 5 && (
          <View style={styles.stepSection}>
            <Text style={[styles.stepTitle, { color: colors.foreground }]}>Port end configuration</Text>
            {PORT_OPTS.map(p => (
              <TouchableOpacity
                key={p.code}
                style={[styles.optionCard, { backgroundColor: colors.card, borderColor: state.portEnd === p.code ? colors.primary : colors.border }]}
                onPress={() => update("portEnd", p.code)}
                activeOpacity={0.75}
              >
                <View style={[styles.optionRadio, { borderColor: state.portEnd === p.code ? colors.primary : colors.border }]}>
                  {state.portEnd === p.code && <View style={[styles.optionRadioFill, { backgroundColor: colors.primary }]} />}
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={[styles.optionLabel, { color: colors.foreground }]}>{p.label}</Text>
                  <Text style={[styles.optionDesc, { color: colors.mutedForeground }]}>{p.desc}</Text>
                </View>
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* STEP 6 — Summary */}
        {step === 6 && (
          <View style={styles.stepSection}>
            {/* Generated code */}
            <View style={[styles.summaryCard, { backgroundColor: colors.card, borderColor: colors.primary + "55" }]}>
              <Text style={[styles.summaryLabel, { color: colors.mutedForeground }]}>GENERATED PUMP CODE</Text>
              <Text style={[styles.summaryCode, { color: colors.primary }]}>{generatedCode || "—"}</Text>
              <Text style={[styles.summaryNote, { color: colors.mutedForeground }]}>
                Reference your GPM catalogue to confirm options and pricing. This code is a configuration guide only.
              </Text>
            </View>

            {/* Config table */}
            <View style={[styles.configTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>CONFIGURATION</Text>
              {[
                { label: "Product Type",     value: state.productType ? `${state.productType} — ${PRODUCT_TYPES.find(p => p.code === state.productType)?.label}` : "—" },
                { label: "Family",           value: state.family === "bearing" ? "Bearing Range" : state.family === "bushing" ? "Bushing Range" : "—" },
                { label: "Series",           value: state.series ? `Series ${state.series} — ${SERIES_DATA[state.series]?.mount}` : "—" },
                { label: "Displacement",     value: state.dashCode ?? "—" },
                { label: "Shaft",            value: state.shaft ? SHAFT_OPTS.find(s => s.code === state.shaft)?.label ?? "—" : "—" },
                { label: "Port End",         value: state.portEnd ? PORT_OPTS.find(p => p.code === state.portEnd)?.label ?? "—" : "—" },
              ].map((row, i, arr) => (
                <View key={row.label}>
                  <View style={styles.configRow}>
                    <Text style={[styles.configRowLabel, { color: colors.mutedForeground }]}>{row.label}</Text>
                    <Text style={[styles.configRowValue, { color: colors.foreground }]}>{row.value}</Text>
                  </View>
                  {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                </View>
              ))}
            </View>

            {/* GPM unique nos for key spares */}
            {currentSeries && (
              <View style={[styles.configTable, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.sectionHeader, { color: colors.mutedForeground }]}>KEY SPARE PARTS — GPM UNIQUE NOS.</Text>
                <View style={[styles.gpmNote, { backgroundColor: colors.primary + "11" }]}>
                  <Feather name="info" size={13} color={colors.primary} />
                  <Text style={[styles.gpmNoteText, { color: colors.primary }]}>
                    "??" = substitute dash code. GPM Unique No. is the authoritative part number for ordering.
                  </Text>
                </View>
                {currentSeries.gpmParts.map((p, i, arr) => (
                  <View key={p.role}>
                    <View style={styles.configRow}>
                      <Text style={[styles.configRowLabel, { color: colors.mutedForeground }]}>{p.role}</Text>
                      <Text style={[styles.gpmNoText, { color: colors.primary }]}>
                        {resolveGpmNo(p.gpmNo, state.dashCode)}
                      </Text>
                    </View>
                    {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                  </View>
                ))}
              </View>
            )}

            <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={reset} activeOpacity={0.75}>
              <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
              <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Start new build</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* Nav buttons */}
      {step < STEPS.length - 1 && (
        <View style={[styles.navBar, { borderTopColor: colors.border, paddingBottom: insets.bottom + 12, backgroundColor: colors.background }]}>
          {step > 0 && (
            <TouchableOpacity style={[styles.navBack, { borderColor: colors.border }]} onPress={back} activeOpacity={0.75}>
              <Feather name="arrow-left" size={18} color={colors.foreground} />
              <Text style={[styles.navBackText, { color: colors.foreground }]}>Back</Text>
            </TouchableOpacity>
          )}
          <TouchableOpacity
            style={[styles.navNext, { backgroundColor: colors.primary, opacity: canProceed(step, state) ? 1 : 0.45, flex: step > 0 ? 1 : undefined }]}
            onPress={next}
            disabled={!canProceed(step, state)}
            activeOpacity={0.85}
          >
            <Text style={styles.navNextText}>{step === STEPS.length - 2 ? "View Summary" : "Next"}</Text>
            <Feather name="arrow-right" size={18} color="#fff" />
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

function canProceed(step: number, s: BuilderState): boolean {
  if (step === 0) return s.productType !== null;
  if (step === 1) return s.family !== null;
  if (step === 2) return s.series !== null;
  if (step === 3) return s.dashCode !== null;
  if (step === 4) return s.shaft !== null;
  if (step === 5) return s.portEnd !== null;
  return true;
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
  headerTitle: { fontSize: 18, fontFamily: "Inter_700Bold" },
  headerSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },
  progressTrack: { height: 3 },
  progressFill: { height: 3 },
  codeStrip: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  codeText: { fontSize: 14, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },
  codeHint: { fontSize: 12, fontFamily: "Inter_400Regular" },
  body: { flex: 1 },
  stepSection: { gap: 12 },
  stepTitle: { fontSize: 17, fontFamily: "Inter_700Bold", marginBottom: 4 },
  stepHint: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19, marginBottom: 4 },
  optionCard: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    padding: 14,
    borderRadius: 12,
    borderWidth: 1.5,
  },
  optionRadio: {
    width: 22, height: 22, borderRadius: 11, borderWidth: 2,
    alignItems: "center", justifyContent: "center",
  },
  optionRadioFill: { width: 10, height: 10, borderRadius: 5 },
  optionIcon: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  optionLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  optionDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },
  seriesBadge: {
    width: 46, height: 46, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
  },
  seriesBadgeText: { fontSize: 16, fontFamily: "Inter_700Bold" },
  dashGrid: { flexDirection: "row", flexWrap: "wrap", gap: 10 },
  dashChip: {
    paddingHorizontal: 16, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1.5,
  },
  dashChipText: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  summaryCard: {
    borderRadius: 14, borderWidth: 1.5,
    padding: 20, gap: 8, alignItems: "center",
  },
  summaryLabel: { fontSize: 11, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  summaryCode: { fontSize: 28, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  summaryNote: { fontSize: 12, fontFamily: "Inter_400Regular", textAlign: "center", lineHeight: 17 },
  configTable: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  sectionHeader: {
    fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1,
    paddingHorizontal: 14, paddingVertical: 10,
  },
  gpmNote: {
    flexDirection: "row", gap: 8, alignItems: "flex-start",
    marginHorizontal: 14, marginBottom: 4, padding: 10, borderRadius: 8,
  },
  gpmNoteText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 16 },
  configRow: {
    flexDirection: "row", justifyContent: "space-between",
    alignItems: "center", paddingHorizontal: 14, paddingVertical: 12,
    gap: 12,
  },
  configRowLabel: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  configRowValue: { fontSize: 13, fontFamily: "Inter_600SemiBold", textAlign: "right", flex: 1.2 },
  gpmNoText: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.5, textAlign: "right" },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  resetBtn: {
    flexDirection: "row", alignItems: "center", justifyContent: "center",
    gap: 8, padding: 14, borderRadius: 12, borderWidth: 1,
  },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  navBar: {
    flexDirection: "row", gap: 12,
    paddingHorizontal: 16, paddingTop: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  navBack: {
    flexDirection: "row", alignItems: "center", gap: 8,
    paddingHorizontal: 16, paddingVertical: 14, borderRadius: 12, borderWidth: 1,
  },
  navBackText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  navNext: {
    flex: 1, flexDirection: "row", alignItems: "center",
    justifyContent: "center", gap: 8,
    paddingVertical: 14, borderRadius: 12,
  },
  navNextText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
});
