import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

// ── Measure & Identify data ─────────────────────────────────────────
type IdentifyStep = "family" | "bearingOD" | "bearingNarrow" | "bushingMount" | "result";
type PumpFamily = "bearing" | "bushing";
type BearingOD = "40" | "58" | "59" | "other";
type BushingMount = "2b" | "2c" | "4c" | "4d";

interface MeasureState {
  family: PumpFamily | null;
  bearingOD: BearingOD | null;
  addAPump: boolean | null;       // narrows 120 vs 131 when OD=40
  bushingMount: BushingMount | null;
}

interface SeriesMatch {
  series: string[];
  rangeType: "bearing" | "bushing";
  note: string;
  gpmParts: { role: string; gpmNo: string }[];
}

const BEARING_MATCHES: Record<BearingOD, SeriesMatch> = {
  "40": {
    series: ["120", "131"],
    rangeType: "bearing",
    note: "Series 120 and 131 share the same 40 mm shaft ball bearing (KX-131-40). The key distinguishing feature is the shaft end cover: Series 131 has a rear through-drive / add-a-pump provision; Series 120 does not.",
    gpmParts: [
      { role: "Shaft Ball Bearing",      gpmNo: "KX-131-40"   },
      { role: "Needle Rollers",          gpmNo: "KY-131"      },
      { role: "Body Seal Kit — Ser. 120",gpmNo: "LUB-120-239" },
      { role: "Body Seal Kit — Ser. 131",gpmNo: "LUB-131-242" },
      { role: "Gear Set (120)",          gpmNo: "ADD-131-??"  },
      { role: "Housing (120)",           gpmNo: "CRD-120-??"  },
      { role: "Housing (131)",           gpmNo: "CRA-131-??"  },
    ],
  },
  "58": {
    series: ["151"],
    rangeType: "bearing",
    note: "Series 151 — SAE C 4-bolt mount. Identified by the 58 mm OD shaft end ball bearing.",
    gpmParts: [
      { role: "Shaft Ball Bearing", gpmNo: "KX-151-58"  },
      { role: "Needle Rollers",     gpmNo: "KS-151"     },
      { role: "Gear Set",           gpmNo: "ATD-151-??" },
      { role: "Housing",            gpmNo: "CMA-151-??" },
      { role: "Body Seal Kit",      gpmNo: "LUB-151-244"},
    ],
  },
  "59": {
    series: ["176"],
    rangeType: "bearing",
    note: "Series 176 — SAE D 4-bolt mount (largest bearing range). Identified by the 59 mm OD shaft end ball bearing.",
    gpmParts: [
      { role: "Shaft Ball Bearing", gpmNo: "KX-176-59"  },
      { role: "Needle Rollers",     gpmNo: "KR-176"     },
      { role: "Gear Set",           gpmNo: "AAL-176-??" },
      { role: "Housing",            gpmNo: "CSA-176-??" },
      { role: "Body Seal Kit",      gpmNo: "LUB-176-252"},
    ],
  },
  "other": {
    series: ["125"],
    rangeType: "bearing",
    note: "Series 125 bearing range — confirm shaft bearing OD against catalogue p.55 for definitive identification. Typically SAE C 4-bolt mount.",
    gpmParts: [
      { role: "Shaft Ball Bearing", gpmNo: "KX-125-8"   },
      { role: "Needle Rollers",     gpmNo: "KS-151"     },
      { role: "Gear Set",           gpmNo: "AKA-125-??" },
      { role: "Housing",            gpmNo: "CMA-125-??" },
      { role: "Body Seal Kit",      gpmNo: "LUB-151-244"},
    ],
  },
};

const BUSHING_MATCHES: Record<BushingMount, SeriesMatch> = {
  "2b": {
    series: ["215"],
    rangeType: "bushing",
    note: "Series 215 — SAE B 2-bolt. Smallest bushing range, bronze bushings replace shaft ball bearings.",
    gpmParts: [
      { role: "Gear Set",      gpmNo: "A-215-??"   },
      { role: "Housing",       gpmNo: "CRK-215-??" },
      { role: "Body Seal Kit", gpmNo: "LUB-215-??" },
    ],
  },
  "2c": {
    series: ["230"],
    rangeType: "bushing",
    note: "Series 230 — SAE B/C 2-bolt. Mid-range bushing pump.",
    gpmParts: [
      { role: "Gear Set",      gpmNo: "A-230-??"   },
      { role: "Housing",       gpmNo: "CRK-230-??" },
      { role: "Body Seal Kit", gpmNo: "LUB-230-??" },
    ],
  },
  "4c": {
    series: ["250"],
    rangeType: "bushing",
    note: "Series 250 — SAE C 4-bolt. Large bushing range, up to 160 bar.",
    gpmParts: [
      { role: "Gear Set",      gpmNo: "A-250-??"   },
      { role: "Housing",       gpmNo: "CRK-250-??" },
      { role: "Body Seal Kit", gpmNo: "LUB-250-??" },
    ],
  },
  "4d": {
    series: ["265"],
    rangeType: "bushing",
    note: "Series 265 — SAE D 4-bolt. Largest bushing range pump.",
    gpmParts: [
      { role: "Gear Set",      gpmNo: "A-265-??"   },
      { role: "Housing",       gpmNo: "CRK-265-??" },
      { role: "Body Seal Kit", gpmNo: "LUB-265-??" },
    ],
  },
};

type IdentifyMode = "camera" | "measure";

// ── Main screen ──────────────────────────────────────────────────────
export default function IdentifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  // Camera mode
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  // Mode toggle
  const [mode, setMode] = useState<IdentifyMode>("camera");

  // Measure mode
  const [step, setStep] = useState<IdentifyStep>("family");
  const [ms, setMs] = useState<MeasureState>({ family: null, bearingOD: null, addAPump: null, bushingMount: null });
  const [result, setResult] = useState<SeriesMatch | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  // ── Camera helpers ──
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  }
  async function takePhoto() {
    if (Platform.OS === "web") { pickImage(); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!res.canceled && res.assets[0]) setImageUri(res.assets[0].uri);
  }
  function simulate() { setLoading(true); setTimeout(() => setLoading(false), 2000); }

  // ── Measure helpers ──
  function resetMeasure() {
    setStep("family");
    setMs({ family: null, bearingOD: null, addAPump: null, bushingMount: null });
    setResult(null);
  }

  function selectFamily(f: PumpFamily) {
    setMs(prev => ({ ...prev, family: f }));
    setStep(f === "bearing" ? "bearingOD" : "bushingMount");
  }

  function selectBearingOD(od: BearingOD) {
    setMs(prev => ({ ...prev, bearingOD: od }));
    if (od === "40") {
      setStep("bearingNarrow");
    } else {
      const m = BEARING_MATCHES[od];
      setResult(m);
      setStep("result");
    }
  }

  function selectAddAPump(val: boolean) {
    setMs(prev => ({ ...prev, addAPump: val }));
    const base = BEARING_MATCHES["40"];
    const narrowed: SeriesMatch = {
      ...base,
      series: val ? ["131"] : ["120"],
      note: val
        ? "Series 131 — SAE B 2/4-bolt, add-a-pump rear drive. Confirmed by through-drive provision on shaft end cover."
        : "Series 120 — SAE B 2-bolt. No rear through-drive/add-a-pump port.",
    };
    setResult(narrowed);
    setStep("result");
  }

  function selectBushingMount(m: BushingMount) {
    setMs(prev => ({ ...prev, bushingMount: m }));
    setResult(BUSHING_MATCHES[m]);
    setStep("result");
  }

  const isBearing = ms.family === "bearing";
  const accentBearing = "#f59e0b";
  const accentBushing = colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Identify Pump</Text>

        {/* Mode toggle */}
        <View style={[styles.modeToggle, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {(["camera", "measure"] as IdentifyMode[]).map(m => (
            <TouchableOpacity
              key={m}
              style={[styles.modeBtn, mode === m && { backgroundColor: colors.primary, borderRadius: 8 }]}
              onPress={() => setMode(m)}
              activeOpacity={0.8}
            >
              <Feather name={m === "camera" ? "camera" : "activity"} size={14} color={mode === m ? "#fff" : colors.mutedForeground} />
              <Text style={[styles.modeBtnText, { color: mode === m ? "#fff" : colors.mutedForeground }]}>
                {m === "camera" ? "Camera" : "Measure"}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <ScrollView style={styles.scrollBody} contentContainerStyle={[styles.scrollContent, { paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>

        {/* ═══ CAMERA MODE ═══════════════════════════════════════════ */}
        {mode === "camera" && (
          <>
            <Text style={[styles.modeSubtitle, { color: colors.mutedForeground }]}>
              Upload or capture a photo to identify a hydraulic pump
            </Text>

            <TouchableOpacity
              style={[styles.uploadArea, { backgroundColor: colors.card, borderColor: imageUri ? colors.primary : colors.border }]}
              onPress={pickImage}
              activeOpacity={0.8}
            >
              {imageUri ? (
                <Image source={{ uri: imageUri }} style={styles.previewImage} resizeMode="cover" />
              ) : (
                <View style={styles.uploadPlaceholder}>
                  <View style={[styles.uploadIconWrap, { backgroundColor: colors.primary + "1A" }]}>
                    <Feather name="image" size={36} color={colors.primary} />
                  </View>
                  <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Upload Pump Image</Text>
                  <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>Tap to select from your library</Text>
                </View>
              )}
            </TouchableOpacity>

            <View style={styles.actionRow}>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={takePhoto} activeOpacity={0.75}>
                <Feather name="camera" size={20} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Camera</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={pickImage} activeOpacity={0.75}>
                <Feather name="folder" size={20} color={colors.primary} />
                <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Gallery</Text>
              </TouchableOpacity>
              {imageUri && (
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setImageUri(null)} activeOpacity={0.75}>
                  <Feather name="trash-2" size={20} color={colors.destructive} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {imageUri && (
              <TouchableOpacity style={[styles.analyzeBtn, { backgroundColor: colors.primary }]} onPress={simulate} activeOpacity={0.85}>
                {loading ? <ActivityIndicator color="#fff" size="small" /> : (
                  <><Feather name="cpu" size={18} color="#fff" /><Text style={styles.analyzeBtnText}>Analyze Image</Text></>
                )}
              </TouchableOpacity>
            )}

            <View style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
              <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary + "22" }]}>
                <Feather name="zap" size={14} color={colors.primary} />
                <Text style={[styles.comingSoonBadgeText, { color: colors.primary }]}>COMING SOON</Text>
              </View>
              <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>AI Recognition Engine</Text>
              <Text style={[styles.comingSoonDesc, { color: colors.mutedForeground }]}>
                Computer vision model will automatically identify hydraulic pump models, manufacturers, and specifications from a single photo.
              </Text>
              {["Manufacturer identification", "Series & model matching", "Specification extraction", "Worn / damaged pump support"].map((f, i) => (
                <View key={i} style={styles.featureRow}>
                  <Feather name="check-circle" size={14} color={colors.success} />
                  <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
                </View>
              ))}
            </View>

            {/* Tip: switch to Measure */}
            <TouchableOpacity style={[styles.switchTip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setMode("measure")} activeOpacity={0.8}>
              <Feather name="activity" size={18} color={colors.primary} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.switchTipTitle, { color: colors.foreground }]}>Have a calliper handy?</Text>
                <Text style={[styles.switchTipDesc, { color: colors.mutedForeground }]}>
                  Use Measure mode to identify the series by shaft bearing OD or mounting pattern — works right now, no AI needed.
                </Text>
              </View>
              <Feather name="arrow-right" size={18} color={colors.primary} />
            </TouchableOpacity>
          </>
        )}

        {/* ═══ MEASURE MODE ══════════════════════════════════════════ */}
        {mode === "measure" && (
          <>
            {step !== "result" && (
              <Text style={[styles.modeSubtitle, { color: colors.mutedForeground }]}>
                Answer a few questions about the pump's physical features to identify its GPM series.
              </Text>
            )}

            {/* STEP — Pump family */}
            {step === "family" && (
              <View style={styles.measureSection}>
                <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.qHeader}>
                    <View style={[styles.stepDot, { backgroundColor: colors.primary }]}><Text style={styles.stepDotNum}>1</Text></View>
                    <Text style={[styles.qTitle, { color: colors.foreground }]}>Bearing or bushing?</Text>
                  </View>
                  <Text style={[styles.qDesc, { color: colors.mutedForeground }]}>
                    Remove the shaft end cover or inspect the shaft entry. Is there a visible ball or roller bearing at the shaft?
                  </Text>
                </View>

                {([
                  { val: "bearing" as PumpFamily, label: "Yes — Ball/Roller Bearing", sub: "Bearing Range: Series 120 / 125 / 131 / 151 / 176", icon: "disc", accent: accentBearing },
                  { val: "bushing" as PumpFamily, label: "No — Bronze Bushing only", sub: "Bushing Range: Series 215 / 230 / 250 / 265", icon: "layers", accent: accentBushing },
                ] as { val: PumpFamily; label: string; sub: string; icon: string; accent: string }[]).map(opt => (
                  <TouchableOpacity
                    key={opt.val}
                    style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => selectFamily(opt.val)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optIcon, { backgroundColor: opt.accent + "20" }]}>
                      <Feather name={opt.icon as "disc"} size={24} color={opt.accent} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                      <Text style={[styles.optSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* STEP — Bearing OD */}
            {step === "bearingOD" && (
              <View style={styles.measureSection}>
                <TouchableOpacity style={styles.backRow} onPress={() => setStep("family")} activeOpacity={0.7}>
                  <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Back</Text>
                </TouchableOpacity>

                <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.qHeader}>
                    <View style={[styles.stepDot, { backgroundColor: accentBearing }]}><Text style={styles.stepDotNum}>2</Text></View>
                    <Text style={[styles.qTitle, { color: colors.foreground }]}>Shaft end ball bearing OD</Text>
                  </View>
                  <Text style={[styles.qDesc, { color: colors.mutedForeground }]}>
                    Measure the outer diameter of the shaft-end ball bearing (callipers or ring gauge). This is the bearing visible when the shaft end cover is removed.
                  </Text>
                </View>

                {([
                  { val: "40" as BearingOD, label: "40 mm OD", sub: "→ Series 120 or 131", accent: accentBearing },
                  { val: "58" as BearingOD, label: "58 mm OD", sub: "→ Series 151",         accent: accentBearing },
                  { val: "59" as BearingOD, label: "59 mm OD", sub: "→ Series 176",         accent: accentBearing },
                  { val: "other" as BearingOD, label: "Other / Unknown", sub: "→ Likely Series 125 — confirm with catalogue p.55", accent: colors.mutedForeground },
                ] as { val: BearingOD; label: string; sub: string; accent: string }[]).map(opt => (
                  <TouchableOpacity
                    key={opt.val}
                    style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => selectBearingOD(opt.val)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.mmBadge, { backgroundColor: opt.accent + "20" }]}>
                      <Text style={[styles.mmBadgeText, { color: opt.accent }]}>{opt.val === "other" ? "?" : opt.val}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                      <Text style={[styles.optSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* STEP — Narrow 120 vs 131 */}
            {step === "bearingNarrow" && (
              <View style={styles.measureSection}>
                <TouchableOpacity style={styles.backRow} onPress={() => setStep("bearingOD")} activeOpacity={0.7}>
                  <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Back</Text>
                </TouchableOpacity>

                <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.qHeader}>
                    <View style={[styles.stepDot, { backgroundColor: accentBearing }]}><Text style={styles.stepDotNum}>3</Text></View>
                    <Text style={[styles.qTitle, { color: colors.foreground }]}>Add-a-pump rear drive?</Text>
                  </View>
                  <Text style={[styles.qDesc, { color: colors.mutedForeground }]}>
                    Inspect the shaft end cover. Does it have a rear through-drive / add-a-pump port that allows a second pump to be tandem-mounted at the rear?
                  </Text>
                </View>

                {([
                  { val: true,  label: "Yes — rear through-drive present", sub: "→ Series 131 (SAE B 2/4-bolt, add-a-pump)" },
                  { val: false, label: "No — no rear drive provision",      sub: "→ Series 120 (SAE B 2-bolt, standard)"    },
                ] as { val: boolean; label: string; sub: string }[]).map(opt => (
                  <TouchableOpacity
                    key={String(opt.val)}
                    style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => selectAddAPump(opt.val)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optIcon, { backgroundColor: accentBearing + "20" }]}>
                      <Feather name={opt.val ? "link" : "minus-circle"} size={22} color={accentBearing} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                      <Text style={[styles.optSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* STEP — Bushing mount */}
            {step === "bushingMount" && (
              <View style={styles.measureSection}>
                <TouchableOpacity style={styles.backRow} onPress={() => setStep("family")} activeOpacity={0.7}>
                  <Feather name="arrow-left" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.backRowText, { color: colors.mutedForeground }]}>Back</Text>
                </TouchableOpacity>

                <View style={[styles.qCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.qHeader}>
                    <View style={[styles.stepDot, { backgroundColor: accentBushing }]}><Text style={styles.stepDotNum}>2</Text></View>
                    <Text style={[styles.qTitle, { color: colors.foreground }]}>Shaft end cover bolt pattern</Text>
                  </View>
                  <Text style={[styles.qDesc, { color: colors.mutedForeground }]}>
                    Count the bolts on the shaft end cover flange and identify the SAE flange size (check the cover OD against an SAE flange gauge if available).
                  </Text>
                </View>

                {([
                  { val: "2b" as BushingMount, label: "2-bolt SAE B",       sub: "→ Series 215 — smallest bushing range" },
                  { val: "2c" as BushingMount, label: "2-bolt SAE B/C",     sub: "→ Series 230 — mid-range bushing"     },
                  { val: "4c" as BushingMount, label: "4-bolt SAE C",       sub: "→ Series 250 — large bushing range"   },
                  { val: "4d" as BushingMount, label: "4-bolt SAE D",       sub: "→ Series 265 — largest bushing range" },
                ] as { val: BushingMount; label: string; sub: string }[]).map(opt => (
                  <TouchableOpacity
                    key={opt.val}
                    style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                    onPress={() => selectBushingMount(opt.val)}
                    activeOpacity={0.75}
                  >
                    <View style={[styles.optIcon, { backgroundColor: accentBushing + "20" }]}>
                      <Feather name="grid" size={22} color={accentBushing} />
                    </View>
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.optLabel, { color: colors.foreground }]}>{opt.label}</Text>
                      <Text style={[styles.optSub, { color: colors.mutedForeground }]}>{opt.sub}</Text>
                    </View>
                    <Feather name="chevron-right" size={18} color={colors.mutedForeground} />
                  </TouchableOpacity>
                ))}
              </View>
            )}

            {/* RESULT ─────────────────────────────────────────────── */}
            {step === "result" && result && (
              <View style={styles.measureSection}>
                {/* Match header */}
                <View style={[styles.resultHeader, { backgroundColor: colors.success + "15", borderColor: colors.success + "40" }]}>
                  <Feather name="check-circle" size={24} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultTitle, { color: colors.foreground }]}>
                      Series {result.series.join(" / ")} — GPM {result.rangeType === "bearing" ? "Bearing" : "Bushing"} Range
                    </Text>
                    <Text style={[styles.resultNote, { color: colors.mutedForeground }]}>{result.note}</Text>
                  </View>
                </View>

                {/* GPM Unique Nos — authoritative parts */}
                <View style={[styles.partsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <View style={styles.partsCardHeader}>
                    <Text style={[styles.partsCardTitle, { color: colors.mutedForeground }]}>KEY SPARE PARTS — GPM UNIQUE NOS.</Text>
                  </View>
                  <View style={[styles.authorityNote, { backgroundColor: colors.primary + "11" }]}>
                    <Feather name="info" size={12} color={colors.primary} />
                    <Text style={[styles.authorityNoteText, { color: colors.primary }]}>
                      GPM Unique No. is the authoritative part number. "??" = substitute gear width/dash code.
                    </Text>
                  </View>
                  {result.gpmParts.map((p, i, arr) => (
                    <View key={p.role}>
                      <View style={styles.partRow}>
                        <Text style={[styles.partRole, { color: colors.mutedForeground }]}>{p.role}</Text>
                        <Text style={[styles.partGpmNo, { color: colors.primary }]}>{p.gpmNo}</Text>
                      </View>
                      {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    </View>
                  ))}
                </View>

                {/* Pump Builder CTA */}
                <TouchableOpacity
                  style={[styles.builderCta, { backgroundColor: colors.primary }]}
                  onPress={() => router.push("/pump-builder" as any)}
                  activeOpacity={0.85}
                >
                  <Feather name="tool" size={18} color="#fff" />
                  <Text style={styles.builderCtaText}>Open Pump Builder for Series {result.series[0]}</Text>
                </TouchableOpacity>

                {/* Parts Reference CTA */}
                <TouchableOpacity
                  style={[styles.refCta, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push("/parts-reference" as any)}
                  activeOpacity={0.85}
                >
                  <Feather name="list" size={18} color={colors.primary} />
                  <Text style={[styles.refCtaText, { color: colors.foreground }]}>Browse Parts Quick Reference</Text>
                  <Feather name="arrow-right" size={16} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={resetMeasure} activeOpacity={0.75}>
                  <Feather name="refresh-cw" size={16} color={colors.mutedForeground} />
                  <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Start over</Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingBottom: 16, gap: 14 },
  title: { fontSize: 24, fontFamily: "Inter_700Bold" },
  modeToggle: {
    flexDirection: "row",
    borderRadius: 10, borderWidth: 1, padding: 3, alignSelf: "flex-start",
  },
  modeBtn: {
    flexDirection: "row", alignItems: "center", gap: 6,
    paddingHorizontal: 14, paddingVertical: 8,
  },
  modeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  scrollBody: { flex: 1 },
  scrollContent: { paddingHorizontal: 16, gap: 14 },
  modeSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  // Camera
  uploadArea: {
    borderRadius: 16, borderWidth: 2, borderStyle: "dashed",
    height: 200, overflow: "hidden", alignItems: "center", justifyContent: "center",
  },
  previewImage: { width: "100%", height: "100%" },
  uploadPlaceholder: { alignItems: "center", gap: 12 },
  uploadIconWrap: { width: 70, height: 70, borderRadius: 16, alignItems: "center", justifyContent: "center" },
  uploadTitle: { fontSize: 16, fontFamily: "Inter_600SemiBold" },
  uploadHint: { fontSize: 13, fontFamily: "Inter_400Regular" },
  actionRow: { flexDirection: "row", gap: 10 },
  actionBtn: { flex: 1, flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 12, borderRadius: 10, borderWidth: 1 },
  actionBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
  analyzeBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12 },
  analyzeBtnText: { color: "#fff", fontSize: 15, fontFamily: "Inter_600SemiBold" },
  comingSoon: { borderRadius: 16, borderWidth: 1, padding: 18, gap: 10 },
  comingSoonBadge: { flexDirection: "row", alignItems: "center", gap: 6, alignSelf: "flex-start", paddingHorizontal: 10, paddingVertical: 4, borderRadius: 20 },
  comingSoonBadgeText: { fontSize: 11, fontFamily: "Inter_700Bold", letterSpacing: 1 },
  comingSoonTitle: { fontSize: 17, fontFamily: "Inter_700Bold" },
  comingSoonDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 20 },
  featureRow: { flexDirection: "row", alignItems: "center", gap: 8 },
  featureText: { fontSize: 13, fontFamily: "Inter_400Regular" },
  switchTip: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  switchTipTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  switchTipDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },

  // Measure
  measureSection: { gap: 12 },
  backRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  backRowText: { fontSize: 13, fontFamily: "Inter_500Medium" },
  qCard: { borderRadius: 12, borderWidth: 1, padding: 14, gap: 10 },
  qHeader: { flexDirection: "row", alignItems: "center", gap: 10 },
  stepDot: { width: 26, height: 26, borderRadius: 13, alignItems: "center", justifyContent: "center" },
  stepDotNum: { color: "#fff", fontSize: 13, fontFamily: "Inter_700Bold" },
  qTitle: { fontSize: 15, fontFamily: "Inter_700Bold", flex: 1 },
  qDesc: { fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 19 },
  optCard: { flexDirection: "row", alignItems: "center", gap: 14, padding: 14, borderRadius: 12, borderWidth: 1 },
  optIcon: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mmBadge: { width: 46, height: 46, borderRadius: 12, alignItems: "center", justifyContent: "center" },
  mmBadgeText: { fontSize: 15, fontFamily: "Inter_700Bold" },
  optLabel: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  optSub: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2 },

  // Result
  resultHeader: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  resultTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  resultNote: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 4 },
  partsCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  partsCardHeader: { paddingHorizontal: 14, paddingVertical: 10 },
  partsCardTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1 },
  authorityNote: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginHorizontal: 14, marginBottom: 6, padding: 10, borderRadius: 8 },
  authorityNoteText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  partRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 12 },
  partRole: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  partGpmNo: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },
  builderCta: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 10, paddingVertical: 14, borderRadius: 12 },
  builderCtaText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refCta: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  refCtaText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },
});
