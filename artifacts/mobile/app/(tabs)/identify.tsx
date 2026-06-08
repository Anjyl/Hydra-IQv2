import { Feather } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

import { useColors } from "@/hooks/useColors";

export default function IdentifyScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const [imageUri, setImageUri] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : 0;

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  async function takePhoto() {
    if (Platform.OS === "web") { pickImage(); return; }
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") return;
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled && result.assets[0]) {
      setImageUri(result.assets[0].uri);
    }
  }

  function simulate() {
    setLoading(true);
    setTimeout(() => setLoading(false), 2000);
  }

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <Text style={[styles.title, { color: colors.foreground }]}>Identify Pump</Text>
        <Text style={[styles.subtitle, { color: colors.mutedForeground }]}>
          Upload or capture a photo to identify a hydraulic pump
        </Text>
      </View>

      <View style={[styles.content, { paddingBottom: bottomInset + 100 }]}>
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
                <Feather name="image" size={36} color={colors.primary} />
              </View>
              <Text style={[styles.uploadTitle, { color: colors.foreground }]}>Upload Pump Image</Text>
              <Text style={[styles.uploadHint, { color: colors.mutedForeground }]}>
                Tap to select from your library
              </Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Action buttons */}
        <View style={styles.actionRow}>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={takePhoto}
            activeOpacity={0.75}
          >
            <Feather name="camera" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Camera</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={pickImage}
            activeOpacity={0.75}
          >
            <Feather name="folder" size={20} color={colors.primary} />
            <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Gallery</Text>
          </TouchableOpacity>
          {imageUri && (
            <TouchableOpacity
              style={[styles.actionBtn, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => setImageUri(null)}
              activeOpacity={0.75}
            >
              <Feather name="trash-2" size={20} color={colors.destructive} />
              <Text style={[styles.actionBtnText, { color: colors.foreground }]}>Clear</Text>
            </TouchableOpacity>
          )}
        </View>

        {/* Analyze button */}
        {imageUri && (
          <TouchableOpacity
            style={[styles.analyzeBtn, { backgroundColor: colors.primary }]}
            onPress={simulate}
            activeOpacity={0.85}
          >
            {loading ? (
              <ActivityIndicator color="#fff" size="small" />
            ) : (
              <>
                <Feather name="cpu" size={18} color="#fff" />
                <Text style={styles.analyzeBtnText}>Analyze Image</Text>
              </>
            )}
          </TouchableOpacity>
        )}

        {/* AI Coming Soon banner */}
        <View style={[styles.comingSoon, { backgroundColor: colors.card, borderColor: colors.primary + "44" }]}>
          <View style={[styles.comingSoonBadge, { backgroundColor: colors.primary + "22" }]}>
            <Feather name="zap" size={14} color={colors.primary} />
            <Text style={[styles.comingSoonBadgeText, { color: colors.primary }]}>COMING SOON</Text>
          </View>
          <Text style={[styles.comingSoonTitle, { color: colors.foreground }]}>
            AI Recognition Engine
          </Text>
          <Text style={[styles.comingSoonDesc, { color: colors.mutedForeground }]}>
            Our computer vision model will automatically identify hydraulic pump models, manufacturers, and specifications from a single photo. Images uploaded here are stored and will be used to train the recognition engine.
          </Text>
          <View style={styles.featureList}>
            {[
              "Manufacturer identification",
              "Series & model matching",
              "Specification extraction",
              "Worn / damaged pump support",
            ].map((f, i) => (
              <View key={i} style={styles.featureRow}>
                <Feather name="check-circle" size={14} color={colors.success} />
                <Text style={[styles.featureText, { color: colors.mutedForeground }]}>{f}</Text>
              </View>
            ))}
          </View>
        </View>

        {/* How it will work */}
        <View style={[styles.howCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.howTitle, { color: colors.foreground }]}>How it will work</Text>
          {[
            { step: "1", text: "Photograph the pump from the side or nameplate" },
            { step: "2", text: "AI analyzes the image and matches against our catalog" },
            { step: "3", text: "View identified model with full specs and components" },
          ].map(s => (
            <View key={s.step} style={styles.howRow}>
              <View style={[styles.stepBadge, { backgroundColor: colors.primary }]}>
                <Text style={styles.stepNum}>{s.step}</Text>
              </View>
              <Text style={[styles.stepText, { color: colors.mutedForeground }]}>{s.text}</Text>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 6,
  },
  title: {
    fontSize: 24,
    fontFamily: "Inter_700Bold",
  },
  subtitle: {
    fontSize: 14,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    gap: 16,
  },
  uploadArea: {
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    height: 200,
    overflow: "hidden",
    alignItems: "center",
    justifyContent: "center",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  uploadPlaceholder: {
    alignItems: "center",
    gap: 12,
  },
  uploadIconWrap: {
    width: 70,
    height: 70,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  uploadTitle: {
    fontSize: 16,
    fontFamily: "Inter_600SemiBold",
  },
  uploadHint: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  actionRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionBtn: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  actionBtnText: {
    fontSize: 14,
    fontFamily: "Inter_500Medium",
  },
  analyzeBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 10,
    paddingVertical: 14,
    borderRadius: 12,
  },
  analyzeBtnText: {
    color: "#fff",
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  comingSoon: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 18,
    gap: 12,
  },
  comingSoonBadge: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    alignSelf: "flex-start",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 20,
  },
  comingSoonBadgeText: {
    fontSize: 11,
    fontFamily: "Inter_700Bold",
    letterSpacing: 1,
  },
  comingSoonTitle: {
    fontSize: 17,
    fontFamily: "Inter_700Bold",
  },
  comingSoonDesc: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
  featureList: { gap: 8 },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  featureText: {
    fontSize: 13,
    fontFamily: "Inter_400Regular",
  },
  howCard: {
    borderRadius: 14,
    borderWidth: 1,
    padding: 16,
    gap: 14,
  },
  howTitle: {
    fontSize: 15,
    fontFamily: "Inter_600SemiBold",
  },
  howRow: {
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 12,
  },
  stepBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  stepNum: {
    color: "#fff",
    fontSize: 12,
    fontFamily: "Inter_700Bold",
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    fontFamily: "Inter_400Regular",
    lineHeight: 20,
  },
});
