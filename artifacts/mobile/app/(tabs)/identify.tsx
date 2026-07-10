import { Feather } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system";
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

// ── Types ────────────────────────────────────────────────────────────
interface GpmPart { role: string; gpmNo: string }

interface IdentifyResult {
  identified: boolean;
  confidence: "high" | "medium" | "low";
  series: string[];
  rangeType: "bearing" | "bushing" | "unknown";
  mountingPattern: string;
  summary: string;
  observations: string[];
  gpmParts: GpmPart[];
  caveat: string;
}

// ── Measure & Identify data ──────────────────────────────────────────
type IdentifyStep = "family" | "bearingOD" | "bearingNarrow" | "bushingMount" | "result";
type PumpFamily = "bearing" | "bushing";
type BearingOD = "40" | "58" | "59" | "other";
type BushingMount = "2b" | "2c" | "4c" | "4d";

interface MeasureState {
  family: PumpFamily | null;
  bearingOD: BearingOD | null;
  addAPump: boolean | null;
  bushingMount: BushingMount | null;
}

interface SeriesMatch {
  series: string[];
  rangeType: "bearing" | "bushing";
  note: string;
  gpmParts: GpmPart[];
}

const BEARING_MATCHES: Record<BearingOD, SeriesMatch> = {
  "40": {
    series: ["120", "131"],
    rangeType: "bearing",
    note: "Series 120 and 131 share the same 40 mm shaft ball bearing (KX-131-40). The key distinguishing feature is the shaft end cover: Series 131 has a rear through-drive / add-a-pump provision; Series 120 does not.",
    gpmParts: [
      { role: "Shaft Ball Bearing",       gpmNo: "KX-131-40"   },
      { role: "Needle Rollers",           gpmNo: "KY-131"      },
      { role: "Body Seal Kit — Ser. 120", gpmNo: "LUB-120-239" },
      { role: "Body Seal Kit — Ser. 131", gpmNo: "LUB-131-242" },
      { role: "Gear Set (120 / 131)",     gpmNo: "ADD-131-??"  },
      { role: "Housing (120)",            gpmNo: "CRD-120-??"  },
      { role: "Housing (131)",            gpmNo: "CRA-131-??"  },
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
    series: ["215"], rangeType: "bushing",
    note: "Series 215 — SAE B 2-bolt. Smallest bushing range.",
    gpmParts: [
      { role: "Gear Set", gpmNo: "A-215-??" }, { role: "Housing", gpmNo: "CRK-215-??" }, { role: "Body Seal Kit", gpmNo: "LUB-215-??" },
    ],
  },
  "2c": {
    series: ["230"], rangeType: "bushing",
    note: "Series 230 — SAE B/C 2-bolt. Mid-range bushing pump.",
    gpmParts: [
      { role: "Gear Set", gpmNo: "A-230-??" }, { role: "Housing", gpmNo: "CRK-230-??" }, { role: "Body Seal Kit", gpmNo: "LUB-230-??" },
    ],
  },
  "4c": {
    series: ["250"], rangeType: "bushing",
    note: "Series 250 — SAE C 4-bolt. Large bushing range, up to 160 bar.",
    gpmParts: [
      { role: "Gear Set", gpmNo: "A-250-??" }, { role: "Housing", gpmNo: "CRK-250-??" }, { role: "Body Seal Kit", gpmNo: "LUB-250-??" },
    ],
  },
  "4d": {
    series: ["265"], rangeType: "bushing",
    note: "Series 265 — SAE D 4-bolt. Largest bushing range.",
    gpmParts: [
      { role: "Gear Set", gpmNo: "A-265-??" }, { role: "Housing", gpmNo: "CRK-265-??" }, { role: "Body Seal Kit", gpmNo: "LUB-265-??" },
    ],
  },
};

type IdentifyMode = "camera" | "measure";

const CONFIDENCE_COLOR: Record<string, string> = {
  high: "#22c55e",
  medium: "#f59e0b",
  low: "#ef4444",
};

// ── Helpers ──────────────────────────────────────────────────────────
async function toBase64(uri: string): Promise<{ base64: string; mimeType: string }> {
  if (Platform.OS === "web") {
    const response = await fetch(uri);
    const blob = await response.blob();
    const mimeType = blob.type || "image/jpeg";
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const dataUrl = reader.result as string;
        const base64 = dataUrl.split(",")[1];
        resolve({ base64, mimeType });
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }
  const base64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
  const ext = uri.split(".").pop()?.toLowerCase() ?? "jpg";
  const mimeMap: Record<string, string> = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
  return { base64, mimeType: mimeMap[ext] ?? "image/jpeg" };
}

function getApiBase(): string {
  if (Platform.OS === "web") return "";
  const domain = process.env.EXPO_PUBLIC_DOMAIN ?? "";
  return domain ? `https://${domain}` : "";
}

// ── Main screen ──────────────────────────────────────────────────────
export default function IdentifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const [mode, setMode] = useState<IdentifyMode>("camera");

  // Camera state
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [aiResult, setAiResult] = useState<IdentifyResult | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  // Measure state
  const [step, setStep] = useState<IdentifyStep>("family");
  const [ms, setMs] = useState<MeasureState>({ family: null, bearingOD: null, addAPump: null, bushingMount: null });
  const [measureResult, setMeasureResult] = useState<SeriesMatch | null>(null);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  // ── Camera helpers ────────────────────────────────────────────────
  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setAiResult(null);
      setAiError(null);
    }
  }

  async function takePhoto() {
    if (Platform.OS === "web") { pickImage(); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const res = await ImagePicker.launchCameraAsync({ allowsEditing: true, quality: 0.8 });
    if (!res.canceled && res.assets[0]) {
      setImageUri(res.assets[0].uri);
      setAiResult(null);
      setAiError(null);
    }
  }

  async function analyzeImage() {
    if (!imageUri) return;
    setAnalyzing(true);
    setAiResult(null);
    setAiError(null);
    try {
      const { base64, mimeType } = await toBase64(imageUri);
      const apiBase = getApiBase();
      const response = await fetch(`${apiBase}/api/identify`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ imageBase64: base64, mimeType }),
      });
      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        throw new Error((body as { error?: string }).error ?? `Server error ${response.status}`);
      }
      const data = await response.json() as IdentifyResult;
      setAiResult(data);
    } catch (err) {
      setAiError(err instanceof Error ? err.message : "Unknown error");
    } finally {
      setAnalyzing(false);
    }
  }

  function clearCamera() {
    setImageUri(null);
    setAiResult(null);
    setAiError(null);
  }

  // ── Measure helpers ───────────────────────────────────────────────
  function resetMeasure() {
    setStep("family"); setMs({ family: null, bearingOD: null, addAPump: null, bushingMount: null }); setMeasureResult(null);
  }
  function selectFamily(f: PumpFamily) {
    setMs(p => ({ ...p, family: f }));
    setStep(f === "bearing" ? "bearingOD" : "bushingMount");
  }
  function selectBearingOD(od: BearingOD) {
    setMs(p => ({ ...p, bearingOD: od }));
    if (od === "40") { setStep("bearingNarrow"); }
    else { setMeasureResult(BEARING_MATCHES[od]); setStep("result"); }
  }
  function selectAddAPump(val: boolean) {
    setMs(p => ({ ...p, addAPump: val }));
    const base = BEARING_MATCHES["40"];
    setMeasureResult({ ...base, series: val ? ["131"] : ["120"],
      note: val
        ? "Series 131 — SAE B 2/4-bolt, add-a-pump rear drive. Confirmed by through-drive provision on shaft end cover."
        : "Series 120 — SAE B 2-bolt. No rear through-drive / add-a-pump port.",
    });
    setStep("result");
  }
  function selectBushingMount(m: BushingMount) {
    setMs(p => ({ ...p, bushingMount: m }));
    setMeasureResult(BUSHING_MATCHES[m]);
    setStep("result");
  }

  const accentBearing = "#f59e0b";
  const accentBushing = colors.primary;

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Identify Pump</Text>
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

      <ScrollView style={styles.body} contentContainerStyle={[styles.bodyContent, { paddingBottom: bottomInset + 100 }]} showsVerticalScrollIndicator={false}>

        {/* ═══ CAMERA MODE ══════════════════════════════════════════ */}
        {mode === "camera" && (
          <>
            <Text style={[styles.modeSubtitle, { color: colors.mutedForeground }]}>
              Photograph the pump — Gemini AI will identify the GPM series and key spare part numbers.
            </Text>

            {/* Upload area */}
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
                    <Feather name="camera" size={36} color={colors.primary} />
                  </View>
                  <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Photograph the Pump</Text>
                  <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>Tap to select from your library</Text>
                </View>
              )}
            </TouchableOpacity>

            {/* Buttons */}
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
                <TouchableOpacity style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={clearCamera} activeOpacity={0.75}>
                  <Feather name="trash-2" size={20} color={colors.destructive} />
                  <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Clear</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Analyse button */}
            {imageUri && !aiResult && (
              <TouchableOpacity
                style={[styles.analyzeBtn, { backgroundColor: colors.primary, opacity: analyzing ? 0.75 : 1 }]}
                onPress={analyzeImage}
                disabled={analyzing}
                activeOpacity={0.85}
              >
                {analyzing ? (
                  <>
                    <ActivityIndicator color="#fff" size="small" />
                    <Text style={styles.analyzeBtnText}>Analysing…</Text>
                  </>
                ) : (
                  <>
                    <Feather name="cpu" size={18} color="#fff" />
                    <Text style={styles.analyzeBtnText}>Identify with AI</Text>
                  </>
                )}
              </TouchableOpacity>
            )}

            {/* Error */}
            {aiError && (
              <View style={[styles.errorCard, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}>
                <Feather name="alert-circle" size={16} color={colors.destructive} />
                <Text style={[styles.errorText, { color: colors.destructive }]}>{aiError}</Text>
              </View>
            )}

            {/* ── AI Result ──────────────────────────────────────── */}
            {aiResult && (
              <View style={styles.resultSection}>
                {/* Status banner */}
                {aiResult.identified ? (
                  <View style={[styles.resultBanner, { backgroundColor: colors.success + "15", borderColor: colors.success + "40" }]}>
                    <Feather name="check-circle" size={22} color={colors.success} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultBannerTitle, { color: colors.foreground }]}>
                        Series {aiResult.series.join(" / ")} — GPM {aiResult.rangeType === "bearing" ? "Bearing" : aiResult.rangeType === "bushing" ? "Bushing" : ""} Range
                      </Text>
                      <Text style={[styles.resultBannerSub, { color: colors.mutedForeground }]}>{aiResult.summary}</Text>
                    </View>
                    <View style={[styles.confidenceBadge, { backgroundColor: CONFIDENCE_COLOR[aiResult.confidence] + "22" }]}>
                      <Text style={[styles.confidenceText, { color: CONFIDENCE_COLOR[aiResult.confidence] }]}>
                        {aiResult.confidence.toUpperCase()}
                      </Text>
                    </View>
                  </View>
                ) : (
                  <View style={[styles.resultBanner, { backgroundColor: colors.destructive + "15", borderColor: colors.destructive + "40" }]}>
                    <Feather name="alert-circle" size={22} color={colors.destructive} />
                    <View style={{ flex: 1 }}>
                      <Text style={[styles.resultBannerTitle, { color: colors.foreground }]}>Could not identify pump</Text>
                      <Text style={[styles.resultBannerSub, { color: colors.mutedForeground }]}>{aiResult.caveat || "Try a clearer photo from the side or shaft end."}</Text>
                    </View>
                  </View>
                )}

                {aiResult.identified && (
                  <>
                    {/* GPM Unique Nos */}
                    {aiResult.gpmParts.length > 0 && (
                      <View style={[styles.partsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.partsCardTitle, { color: colors.mutedForeground }]}>KEY SPARE PARTS — GPM UNIQUE NOS.</Text>
                        <View style={[styles.authorityNote, { backgroundColor: colors.primary + "11" }]}>
                          <Feather name="info" size={12} color={colors.primary} />
                          <Text style={[styles.authorityNoteText, { color: colors.primary }]}>
                            GPM Unique No. is the authoritative part number. "??" = substitute gear width/dash code.
                          </Text>
                        </View>
                        {aiResult.gpmParts.map((p, i, arr) => (
                          <View key={p.role}>
                            <View style={styles.partRow}>
                              <Text style={[styles.partRole, { color: colors.mutedForeground }]}>{p.role}</Text>
                              <Text style={[styles.partGpmNo, { color: colors.primary }]}>{p.gpmNo}</Text>
                            </View>
                            {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Observations */}
                    {aiResult.observations.length > 0 && (
                      <View style={[styles.obsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Text style={[styles.partsCardTitle, { color: colors.mutedForeground }]}>VISUAL OBSERVATIONS</Text>
                        {aiResult.observations.map((obs, i) => (
                          <View key={i} style={styles.obsRow}>
                            <Feather name="eye" size={13} color={colors.mutedForeground} />
                            <Text style={[styles.obsText, { color: colors.foreground }]}>{obs}</Text>
                          </View>
                        ))}
                      </View>
                    )}

                    {/* Mounting */}
                    {aiResult.mountingPattern && aiResult.mountingPattern !== "unknown" && (
                      <View style={[styles.specChip, { backgroundColor: colors.card, borderColor: colors.border }]}>
                        <Feather name="grid" size={14} color={colors.mutedForeground} />
                        <Text style={[styles.specChipText, { color: colors.foreground }]}>
                          Mounting: <Text style={{ fontFamily: "Inter_600SemiBold" }}>{aiResult.mountingPattern}</Text>
                        </Text>
                      </View>
                    )}

                    {/* Caveat */}
                    {aiResult.caveat ? (
                      <View style={[styles.caveatCard, { backgroundColor: "#f59e0b11", borderColor: "#f59e0b33" }]}>
                        <Feather name="alert-triangle" size={14} color="#f59e0b" />
                        <Text style={[styles.caveatText, { color: colors.mutedForeground }]}>{aiResult.caveat}</Text>
                      </View>
                    ) : null}

                    {/* CTAs */}
                    <TouchableOpacity
                      style={[styles.ctaBtn, { backgroundColor: colors.primary }]}
                      onPress={() => router.push("/pump-builder" as any)}
                      activeOpacity={0.85}
                    >
                      <Feather name="tool" size={16} color="#fff" />
                      <Text style={styles.ctaBtnText}>Open Pump Builder for Series {aiResult.series[0]}</Text>
                    </TouchableOpacity>
                  </>
                )}

                <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={clearCamera} activeOpacity={0.75}>
                  <Feather name="refresh-cw" size={15} color={colors.mutedForeground} />
                  <Text style={[styles.resetBtnText, { color: colors.mutedForeground }]}>Try another photo</Text>
                </TouchableOpacity>
              </View>
            )}

            {/* Tips (shown when no image / no result yet) */}
            {!imageUri && (
              <>
                <View style={[styles.tipsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.tipsTitle, { color: colors.foreground }]}>Photo tips</Text>
                  {[
                    "Shoot the shaft end — the bearing / mounting flange is the key identifier",
                    "Include the name plate if visible",
                    "Good lighting, in focus; avoid heavy grease obscuring the flange",
                    "Side profile also helpful for housing shape",
                  ].map((t, i) => (
                    <View key={i} style={styles.tipRow}>
                      <Feather name="check-circle" size={13} color={colors.success} />
                      <Text style={[styles.tipText, { color: colors.mutedForeground }]}>{t}</Text>
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.switchTip, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => setMode("measure")} activeOpacity={0.8}>
                  <Feather name="activity" size={18} color={colors.primary} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.switchTipTitle, { color: colors.foreground }]}>Have a calliper handy?</Text>
                    <Text style={[styles.switchTipDesc, { color: colors.mutedForeground }]}>
                      Use Measure mode to identify by shaft bearing OD or bolt pattern — works offline instantly.
                    </Text>
                  </View>
                  <Feather name="arrow-right" size={16} color={colors.primary} />
                </TouchableOpacity>
              </>
            )}
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
                  { val: "bushing" as PumpFamily, label: "No — Bronze Bushing only", sub: "Bushing Range: Series 215 / 230 / 250 / 265",         icon: "layers", accent: accentBushing },
                ] as { val: PumpFamily; label: string; sub: string; icon: string; accent: string }[]).map(opt => (
                  <TouchableOpacity key={opt.val} style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectFamily(opt.val)} activeOpacity={0.75}>
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
                    Measure the outer diameter of the shaft-end ball bearing with callipers.
                  </Text>
                </View>
                {([
                  { val: "40"    as BearingOD, label: "40 mm OD",           sub: "→ Series 120 or 131" },
                  { val: "58"    as BearingOD, label: "58 mm OD",           sub: "→ Series 151"        },
                  { val: "59"    as BearingOD, label: "59 mm OD",           sub: "→ Series 176"        },
                  { val: "other" as BearingOD, label: "Other / Unknown",    sub: "→ Likely Series 125 — confirm with catalogue p.55" },
                ] as { val: BearingOD; label: string; sub: string }[]).map(opt => (
                  <TouchableOpacity key={opt.val} style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectBearingOD(opt.val)} activeOpacity={0.75}>
                    <View style={[styles.mmBadge, { backgroundColor: accentBearing + "20" }]}>
                      <Text style={[styles.mmBadgeText, { color: accentBearing }]}>{opt.val === "other" ? "?" : opt.val}</Text>
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
                    Does the shaft end cover have a rear through-drive / add-a-pump port for tandem mounting?
                  </Text>
                </View>
                {([
                  { val: true,  label: "Yes — rear through-drive present", sub: "→ Series 131 (SAE B 2/4-bolt)" },
                  { val: false, label: "No — no rear drive provision",      sub: "→ Series 120 (SAE B 2-bolt)"  },
                ] as { val: boolean; label: string; sub: string }[]).map(opt => (
                  <TouchableOpacity key={String(opt.val)} style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectAddAPump(opt.val)} activeOpacity={0.75}>
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
                    Count the bolts on the shaft end cover flange and identify the SAE flange size.
                  </Text>
                </View>
                {([
                  { val: "2b" as BushingMount, label: "2-bolt SAE B",  sub: "→ Series 215" },
                  { val: "2c" as BushingMount, label: "2-bolt SAE B/C",sub: "→ Series 230" },
                  { val: "4c" as BushingMount, label: "4-bolt SAE C",  sub: "→ Series 250" },
                  { val: "4d" as BushingMount, label: "4-bolt SAE D",  sub: "→ Series 265" },
                ] as { val: BushingMount; label: string; sub: string }[]).map(opt => (
                  <TouchableOpacity key={opt.val} style={[styles.optCard, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => selectBushingMount(opt.val)} activeOpacity={0.75}>
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

            {step === "result" && measureResult && (
              <View style={styles.measureSection}>
                <View style={[styles.resultBanner, { backgroundColor: colors.success + "15", borderColor: colors.success + "40" }]}>
                  <Feather name="check-circle" size={22} color={colors.success} />
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.resultBannerTitle, { color: colors.foreground }]}>
                      Series {measureResult.series.join(" / ")} — GPM {measureResult.rangeType === "bearing" ? "Bearing" : "Bushing"} Range
                    </Text>
                    <Text style={[styles.resultBannerSub, { color: colors.mutedForeground }]}>{measureResult.note}</Text>
                  </View>
                </View>

                <View style={[styles.partsCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <Text style={[styles.partsCardTitle, { color: colors.mutedForeground }]}>KEY SPARE PARTS — GPM UNIQUE NOS.</Text>
                  <View style={[styles.authorityNote, { backgroundColor: colors.primary + "11" }]}>
                    <Feather name="info" size={12} color={colors.primary} />
                    <Text style={[styles.authorityNoteText, { color: colors.primary }]}>
                      GPM Unique No. is the authoritative part number. "??" = substitute gear width/dash code.
                    </Text>
                  </View>
                  {measureResult.gpmParts.map((p, i, arr) => (
                    <View key={p.role}>
                      <View style={styles.partRow}>
                        <Text style={[styles.partRole, { color: colors.mutedForeground }]}>{p.role}</Text>
                        <Text style={[styles.partGpmNo, { color: colors.primary }]}>{p.gpmNo}</Text>
                      </View>
                      {i < arr.length - 1 && <View style={[styles.divider, { backgroundColor: colors.border }]} />}
                    </View>
                  ))}
                </View>

                <TouchableOpacity style={[styles.ctaBtn, { backgroundColor: colors.primary }]} onPress={() => router.push("/pump-builder" as any)} activeOpacity={0.85}>
                  <Feather name="tool" size={16} color="#fff" />
                  <Text style={styles.ctaBtnText}>Open Pump Builder for Series {measureResult.series[0]}</Text>
                </TouchableOpacity>

                <TouchableOpacity style={[styles.refCta, { backgroundColor: colors.card, borderColor: colors.border }]} onPress={() => router.push("/parts-reference" as any)} activeOpacity={0.85}>
                  <Feather name="list" size={16} color={colors.primary} />
                  <Text style={[styles.refCtaText, { color: colors.foreground }]}>Browse Parts Quick Reference</Text>
                  <Feather name="arrow-right" size={14} color={colors.primary} />
                </TouchableOpacity>

                <TouchableOpacity style={[styles.resetBtn, { borderColor: colors.border }]} onPress={resetMeasure} activeOpacity={0.75}>
                  <Feather name="refresh-cw" size={15} color={colors.mutedForeground} />
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
  modeToggle: { flexDirection: "row", borderRadius: 10, borderWidth: 1, padding: 3, alignSelf: "flex-start" },
  modeBtn: { flexDirection: "row", alignItems: "center", gap: 6, paddingHorizontal: 14, paddingVertical: 8 },
  modeBtnText: { fontSize: 13, fontFamily: "Inter_600SemiBold" },
  body: { flex: 1 },
  bodyContent: { paddingHorizontal: 16, gap: 14 },
  modeSubtitle: { fontSize: 14, fontFamily: "Inter_400Regular", lineHeight: 20 },

  uploadArea: { borderRadius: 16, borderWidth: 2, borderStyle: "dashed", height: 200, overflow: "hidden", alignItems: "center", justifyContent: "center" },
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

  errorCard: { flexDirection: "row", alignItems: "center", gap: 10, padding: 14, borderRadius: 12, borderWidth: 1 },
  errorText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular" },

  resultSection: { gap: 12 },
  resultBanner: { flexDirection: "row", alignItems: "flex-start", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  resultBannerTitle: { fontSize: 15, fontFamily: "Inter_700Bold" },
  resultBannerSub: { fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17, marginTop: 4 },
  confidenceBadge: { paddingHorizontal: 8, paddingVertical: 4, borderRadius: 8, alignSelf: "flex-start" },
  confidenceText: { fontSize: 10, fontFamily: "Inter_700Bold", letterSpacing: 0.5 },

  partsCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden" },
  partsCardTitle: { fontSize: 10, fontFamily: "Inter_600SemiBold", letterSpacing: 1, paddingHorizontal: 14, paddingVertical: 10 },
  authorityNote: { flexDirection: "row", gap: 8, alignItems: "flex-start", marginHorizontal: 14, marginBottom: 6, padding: 10, borderRadius: 8 },
  authorityNoteText: { flex: 1, fontSize: 11, fontFamily: "Inter_400Regular", lineHeight: 15 },
  partRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", paddingHorizontal: 14, paddingVertical: 11, gap: 12 },
  partRole: { fontSize: 13, fontFamily: "Inter_400Regular", flex: 1 },
  partGpmNo: { fontSize: 13, fontFamily: "Inter_700Bold", letterSpacing: 0.3 },
  divider: { height: StyleSheet.hairlineWidth, marginHorizontal: 14 },

  obsCard: { borderRadius: 12, borderWidth: 1, overflow: "hidden", padding: 14, gap: 10 },
  obsRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  obsText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  specChip: { flexDirection: "row", alignItems: "center", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  specChipText: { fontSize: 13, fontFamily: "Inter_400Regular" },

  caveatCard: { flexDirection: "row", alignItems: "flex-start", gap: 8, padding: 12, borderRadius: 10, borderWidth: 1 },
  caveatText: { flex: 1, fontSize: 12, fontFamily: "Inter_400Regular", lineHeight: 17 },

  ctaBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, paddingVertical: 14, borderRadius: 12 },
  ctaBtnText: { color: "#fff", fontSize: 14, fontFamily: "Inter_600SemiBold" },
  refCta: { flexDirection: "row", alignItems: "center", gap: 10, paddingVertical: 14, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1 },
  refCtaText: { flex: 1, fontSize: 14, fontFamily: "Inter_500Medium" },
  resetBtn: { flexDirection: "row", alignItems: "center", justifyContent: "center", gap: 8, padding: 14, borderRadius: 12, borderWidth: 1 },
  resetBtnText: { fontSize: 14, fontFamily: "Inter_500Medium" },

  tipsCard: { borderRadius: 14, borderWidth: 1, padding: 16, gap: 12 },
  tipsTitle: { fontSize: 15, fontFamily: "Inter_600SemiBold" },
  tipRow: { flexDirection: "row", alignItems: "flex-start", gap: 8 },
  tipText: { flex: 1, fontSize: 13, fontFamily: "Inter_400Regular", lineHeight: 18 },

  switchTip: { flexDirection: "row", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, borderWidth: 1 },
  switchTipTitle: { fontSize: 14, fontFamily: "Inter_600SemiBold" },
  switchTipDesc: { fontSize: 12, fontFamily: "Inter_400Regular", marginTop: 2, lineHeight: 17 },

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
});
