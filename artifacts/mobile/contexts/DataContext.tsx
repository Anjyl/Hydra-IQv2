import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
} from "react";

export interface Manufacturer {
  id: string;
  name: string;
  website?: string;
  country?: string;
}

export interface PumpSeries {
  id: string;
  manufacturerId: string;
  seriesName: string;
  description?: string;
  type: "Bushing" | "Bearing" | "PTO Gear" | "PTO Piston" | "Other";
}

export interface PumpModel {
  id: string;
  seriesId: string;
  modelNumber: string;
  description: string;
  imageUrl?: string;
  drawingUrl?: string;
  explodedViewUrl?: string;
  shaftType: string;
  shaftDiameter: string;
  mountingType: string;
  portSize: string;
  displacement: string;
  pressureRating: string;
  maxSpeed: string;
  weight?: string;
  notes?: string;
  viewedAt?: number;
}

export interface Component {
  id: string;
  pumpModelId: string;
  category: string;
  name: string;
  /** PRIMARY authoritative identifier — GPM Unique No. (e.g. "KY-131", "LUB-120-239").
   *  All search, display, and BOM must key off this first.
   *  Where blank or marked "SPECIAL" in the source, preserve exactly — do not substitute. */
  partNumber: string;          // stores the GPM Unique No.; kept as partNumber for storage compat
  gpmUniqueNo?: string;        // explicit override when GPM no. differs from stored partNumber
  /** Factory / OEM cross-reference — secondary, never used as primary key */
  factoryNo?: string;
  /** Supplier/third-party part number — secondary cross-reference only */
  partNo?: string;
  /** Catalogue source reference note */
  reference?: string;
  description: string;
  imageUrl?: string;
  quantity: number;
}

/** Always use this to get the authoritative GPM Unique No. for display, search, and BOM.
 *  Falls back to partNumber (which IS the GPM unique no. for all seeded data). */
export function getGpmNo(c: Pick<Component, "gpmUniqueNo" | "partNumber">): string {
  return c.gpmUniqueNo ?? c.partNumber;
}

interface DataContextType {
  manufacturers: Manufacturer[];
  pumpSeries: PumpSeries[];
  pumpModels: PumpModel[];
  components: Component[];
  recentlyViewed: PumpModel[];
  addManufacturer: (m: Omit<Manufacturer, "id">) => void;
  updateManufacturer: (m: Manufacturer) => void;
  deleteManufacturer: (id: string) => void;
  addPumpSeries: (s: Omit<PumpSeries, "id">) => void;
  updatePumpSeries: (s: PumpSeries) => void;
  deletePumpSeries: (id: string) => void;
  addPumpModel: (p: Omit<PumpModel, "id">) => void;
  updatePumpModel: (p: PumpModel) => void;
  deletePumpModel: (id: string) => void;
  addComponent: (c: Omit<Component, "id">) => void;
  updateComponent: (c: Component) => void;
  deleteComponent: (id: string) => void;
  markViewed: (pumpId: string) => void;
  getSeriesForManufacturer: (manufacturerId: string) => PumpSeries[];
  getModelsForSeries: (seriesId: string) => PumpModel[];
  getComponentsForModel: (modelId: string) => Component[];
  getModel: (id: string) => PumpModel | undefined;
  getSeries: (id: string) => PumpSeries | undefined;
  getManufacturer: (id: string) => Manufacturer | undefined;
  getComponent: (id: string) => Component | undefined;
  searchPumps: (query: string, filters: SearchFilters) => PumpModel[];
  /** Search components by GPM Unique No. (primary), name, or description.
   *  Factory No. / Part No. / Reference are also searched as cross-refs,
   *  but results always surface the gpmUniqueNo as the definitive identifier. */
  searchComponents: (query: string) => Component[];
}

export interface SearchFilters {
  manufacturerId?: string;
  seriesId?: string;
  shaftType?: string;
  displacement?: string;
  portSize?: string;
}

function genId() {
  return Date.now().toString() + Math.random().toString(36).substr(2, 9);
}

// ─── MANUFACTURERS ────────────────────────────────────────────────────────────

const SEED_MANUFACTURERS: Manufacturer[] = [
  {
    id: "mfr-gpm",
    name: "GPM",
    website: "www.gearpumpus.com",
    country: "South Africa / USA",
  },
];

// ─── SERIES ───────────────────────────────────────────────────────────────────

const SEED_SERIES: PumpSeries[] = [
  // ── BUSHING RANGE ──
  { id: "series-215", manufacturerId: "mfr-gpm", seriesName: "215", type: "Bushing", description: "Bushing range — 10 to 40 cc/rev, up to 240 BAR, 3000 RPM. SAE B 2-bolt mount." },
  { id: "series-230", manufacturerId: "mfr-gpm", seriesName: "230", type: "Bushing", description: "Bushing range — 16 to 64.5 cc/rev, up to 240 BAR, 3000 RPM. SAE B 2-bolt mount." },
  { id: "series-250", manufacturerId: "mfr-gpm", seriesName: "250", type: "Bushing", description: "Bushing range — 20.8 to 104.4 cc/rev, up to 240 BAR, 3000 RPM. SAE C 4-bolt mount." },
  { id: "series-265", manufacturerId: "mfr-gpm", seriesName: "265", type: "Bushing", description: "Bushing range — 44 to 147 cc/rev, up to 240 BAR, 2400 RPM. SAE D 4-bolt mount." },
  // ── BEARING RANGE ──
  { id: "series-120", manufacturerId: "mfr-gpm", seriesName: "120", type: "Bearing", description: "Bearing range — 16 to 64.5 cc/rev, up to 205 BAR, 2400 RPM. Needle roller bearings. SAE B 2-bolt mount." },
  { id: "series-125", manufacturerId: "mfr-gpm", seriesName: "125", type: "Bearing", description: "Bearing range — 20.8 to 104.4 cc/rev, up to 170 BAR, 2400 RPM. Needle roller bearings. SAE C/D mount." },
  { id: "series-131", manufacturerId: "mfr-gpm", seriesName: "131", type: "Bearing", description: "Bearing range — 16 to 83.5 cc/rev, up to 205 BAR, 2400 RPM. Needle roller bearings. SAE B/C mount. Add-a-pump capable." },
  { id: "series-151", manufacturerId: "mfr-gpm", seriesName: "151", type: "Bearing", description: "Bearing range — 20.8 to 104.4 cc/rev, up to 205 BAR, 2400 RPM. Needle roller bearings. SAE C/D mount." },
  { id: "series-176", manufacturerId: "mfr-gpm", seriesName: "176", type: "Bearing", description: "Bearing range — 50.3 to 200 cc/rev, up to 205 BAR, 2400 RPM. Needle roller bearings. Large SAE mount." },
];

// ─── BUSHING RANGE MODELS ─────────────────────────────────────────────────────

const BUSHING_MODELS: PumpModel[] = [
  // Series 215
  { id: "m-215-05", seriesId: "series-215", modelNumber: "GP-215-05", description: "GPM Series 215 Bushing Pump – 10 cc/rev (½\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "10 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "8.0 kg", notes: "Gear housing width 0.88\". US flow: 4.23 GPM @ 1000 RPM." },
  { id: "m-215-07", seriesId: "series-215", modelNumber: "GP-215-07", description: "GPM Series 215 Bushing Pump – 15 cc/rev (¾\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "15 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "8.0 kg", notes: "Gear housing width 1.13\". US flow: 6.37 GPM @ 1000 RPM." },
  { id: "m-215-10", seriesId: "series-215", modelNumber: "GP-215-10", description: "GPM Series 215 Bushing Pump – 20 cc/rev (1\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "20 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "8.0 kg", notes: "Gear housing width 1.38\". US flow: 8.51 GPM @ 1000 RPM." },
  { id: "m-215-12", seriesId: "series-215", modelNumber: "GP-215-12", description: "GPM Series 215 Bushing Pump – 25 cc/rev (1¼\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "25 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "8.5 kg", notes: "Gear housing width 1.63\". US flow: 10.65 GPM @ 1000 RPM." },
  { id: "m-215-15", seriesId: "series-215", modelNumber: "GP-215-15", description: "GPM Series 215 Bushing Pump – 30 cc/rev (1½\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "30 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "9.0 kg", notes: "Gear housing width 1.88\". US flow: 12.76 GPM @ 1000 RPM." },
  { id: "m-215-17", seriesId: "series-215", modelNumber: "GP-215-17", description: "GPM Series 215 Bushing Pump – 35 cc/rev (1¾\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "35 cc/rev", pressureRating: "200 BAR / 2900 PSI", maxSpeed: "3000 RPM", weight: "9.5 kg", notes: "Gear housing width 2.13\". US flow: 14.90 GPM @ 1000 RPM." },
  { id: "m-215-20", seriesId: "series-215", modelNumber: "GP-215-20", description: "GPM Series 215 Bushing Pump – 40 cc/rev (2\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "40 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "3000 RPM", weight: "10.0 kg", notes: "Gear housing width 2.38\". US flow: 17.04 GPM @ 1000 RPM." },
  // Series 230
  { id: "m-230-08", seriesId: "series-230", modelNumber: "GP-230-08", description: "GPM Series 230 Bushing Pump – 16 cc/rev (1\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "16 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "16.0 kg", notes: "Gear housing width 1.00\". US flow: 4.23 GPM @ 1000 RPM." },
  { id: "m-230-12", seriesId: "series-230", modelNumber: "GP-230-12", description: "GPM Series 230 Bushing Pump – 24.1 cc/rev (1¼\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "24.10 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "16.0 kg", notes: "Gear housing width 1.25\". US flow: 6.37 GPM @ 1000 RPM." },
  { id: "m-230-16", seriesId: "series-230", modelNumber: "GP-230-16", description: "GPM Series 230 Bushing Pump – 32.2 cc/rev (1½\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "32.20 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "16.0 kg", notes: "Gear housing width 1.50\". US flow: 8.51 GPM @ 1000 RPM." },
  { id: "m-230-20", seriesId: "series-230", modelNumber: "GP-230-20", description: "GPM Series 230 Bushing Pump – 40.3 cc/rev (1¾\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "40.30 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "16.6 kg", notes: "Gear housing width 1.75\". US flow: 10.65 GPM @ 1000 RPM." },
  { id: "m-230-24", seriesId: "series-230", modelNumber: "GP-230-24", description: "GPM Series 230 Bushing Pump – 48.3 cc/rev (2\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "48.30 cc/rev", pressureRating: "240 BAR / 3200 PSI", maxSpeed: "3000 RPM", weight: "17.20 kg", notes: "Gear housing width 2.00\". US flow: 12.76 GPM @ 1000 RPM." },
  { id: "m-230-28", seriesId: "series-230", modelNumber: "GP-230-28", description: "GPM Series 230 Bushing Pump – 56.4 cc/rev (2¼\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "56.40 cc/rev", pressureRating: "220 BAR / 2900 PSI", maxSpeed: "3000 RPM", weight: "17.80 kg", notes: "Gear housing width 2.25\". US flow: 14.90 GPM @ 1000 RPM." },
  { id: "m-230-32", seriesId: "series-230", modelNumber: "GP-230-32", description: "GPM Series 230 Bushing Pump – 64.5 cc/rev (2½\" gear width)", shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "64.50 cc/rev", pressureRating: "200 BAR / 2500 PSI", maxSpeed: "3000 RPM", weight: "18.40 kg", notes: "Gear housing width 2.50\". US flow: 17.04 GPM @ 1000 RPM." },
  // Series 250
  { id: "m-250-10", seriesId: "series-250", modelNumber: "GP-250-10", description: "GPM Series 250 Bushing Pump – 20.8 cc/rev (1\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "20.80 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "22.7 kg", notes: "Gear housing width 1.00\". US flow: 5.50 GPM @ 1000 RPM." },
  { id: "m-250-16", seriesId: "series-250", modelNumber: "GP-250-16", description: "GPM Series 250 Bushing Pump – 31.2 cc/rev (1¼\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "31.20 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "22.7 kg", notes: "Gear housing width 1.25\". US flow: 8.24 GPM @ 1000 RPM." },
  { id: "m-250-20", seriesId: "series-250", modelNumber: "GP-250-20", description: "GPM Series 250 Bushing Pump – 41.7 cc/rev (1½\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "41.70 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "22.7 kg", notes: "Gear housing width 1.50\". US flow: 11.02 GPM @ 1000 RPM." },
  { id: "m-250-25", seriesId: "series-250", modelNumber: "GP-250-25", description: "GPM Series 250 Bushing Pump – 52.1 cc/rev (1¾\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "52.10 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "23.4 kg", notes: "Gear housing width 1.75\". US flow: 13.76 GPM @ 1000 RPM." },
  { id: "m-250-30", seriesId: "series-250", modelNumber: "GP-250-30", description: "GPM Series 250 Bushing Pump – 62.6 cc/rev (2\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "62.60 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "3000 RPM", weight: "24.1 kg", notes: "Gear housing width 2.00\". US flow: 16.54 GPM @ 1000 RPM." },
  { id: "m-250-35", seriesId: "series-250", modelNumber: "GP-250-35", description: "GPM Series 250 Bushing Pump – 73 cc/rev (2¼\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "73.00 cc/rev", pressureRating: "220 BAR / 3250 PSI", maxSpeed: "3000 RPM", weight: "24.8 kg", notes: "Gear housing width 2.25\". US flow: 19.29 GPM @ 1000 RPM." },
  { id: "m-250-40", seriesId: "series-250", modelNumber: "GP-250-40", description: "GPM Series 250 Bushing Pump – 83.5 cc/rev (2½\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "83.50 cc/rev", pressureRating: "200 BAR / 3000 PSI", maxSpeed: "3000 RPM", weight: "25.5 kg", notes: "Gear housing width 2.50\". US flow: 22.06 GPM @ 1000 RPM." },
  { id: "m-250-45", seriesId: "series-250", modelNumber: "GP-250-45", description: "GPM Series 250 Bushing Pump – 94 cc/rev (2¾\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "94.00 cc/rev", pressureRating: "190 BAR / 2750 PSI", maxSpeed: "3000 RPM", weight: "26.2 kg", notes: "Gear housing width 2.75\". US flow: 24.84 GPM @ 1000 RPM." },
  { id: "m-250-51", seriesId: "series-250", modelNumber: "GP-250-51", description: "GPM Series 250 Bushing Pump – 104.4 cc/rev (3\" gear width)", shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "104.40 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "3000 RPM", weight: "26.9 kg", notes: "Gear housing width 3.00\". US flow: 27.58 GPM @ 1000 RPM." },
  // Series 265
  { id: "m-265-44", seriesId: "series-265", modelNumber: "GP-265-44", description: "GPM Series 265 Bushing Pump – 44 cc/rev (1¼\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "44.00 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "2400 RPM", weight: "22.7 kg", notes: "Gear housing width 1.25\". US flow: 11.62 GPM @ 1000 RPM." },
  { id: "m-265-59", seriesId: "series-265", modelNumber: "GP-265-59", description: "GPM Series 265 Bushing Pump – 59 cc/rev (1½\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "59.00 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "2400 RPM", weight: "22.7 kg", notes: "Gear housing width 1.50\". US flow: 15.57 GPM @ 1000 RPM." },
  { id: "m-265-73", seriesId: "series-265", modelNumber: "GP-265-73", description: "GPM Series 265 Bushing Pump – 73.5 cc/rev (1¾\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "73.50 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "2400 RPM", weight: "23.4 kg", notes: "Gear housing width 1.75\". US flow: 19.42 GPM @ 1000 RPM." },
  { id: "m-265-88", seriesId: "series-265", modelNumber: "GP-265-88", description: "GPM Series 265 Bushing Pump – 88 cc/rev (2\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "88.00 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "2400 RPM", weight: "24.1 kg", notes: "Gear housing width 2.00\". US flow: 23.25 GPM @ 1000 RPM." },
  { id: "m-265-102", seriesId: "series-265", modelNumber: "GP-265-102", description: "GPM Series 265 Bushing Pump – 102 cc/rev (2¼\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "102.00 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "2400 RPM", weight: "24.8 kg", notes: "Gear housing width 2.25\". US flow: 26.95 GPM @ 1000 RPM." },
  { id: "m-265-118", seriesId: "series-265", modelNumber: "GP-265-118", description: "GPM Series 265 Bushing Pump – 118 cc/rev (2½\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "118.00 cc/rev", pressureRating: "240 BAR / 3500 PSI", maxSpeed: "2400 RPM", weight: "25.5 kg", notes: "Gear housing width 2.50\". US flow: 31.19 GPM @ 1000 RPM." },
  { id: "m-265-133", seriesId: "series-265", modelNumber: "GP-265-133", description: "GPM Series 265 Bushing Pump – 132.6 cc/rev (2¾\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "132.60 cc/rev", pressureRating: "220 BAR / 3250 PSI", maxSpeed: "2400 RPM", weight: "26.2 kg", notes: "Gear housing width 2.75\". US flow: 35.03 GPM @ 1000 RPM." },
  { id: "m-265-147", seriesId: "series-265", modelNumber: "GP-265-147", description: "GPM Series 265 Bushing Pump – 147 cc/rev (3\" gear width)", shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port", displacement: "147.00 cc/rev", pressureRating: "200 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "26.9 kg", notes: "Gear housing width 3.00\". US flow: 38.84 GPM @ 1000 RPM." },
];

// ─── BEARING RANGE MODELS ─────────────────────────────────────────────────────

const BEARING_MODELS: PumpModel[] = [
  // Series 120 — 16 to 64.5 cc/rev, 205 BAR, 2400 RPM, 7 sizes
  { id: "m-120-05", seriesId: "series-120", modelNumber: "GP-120-05", description: "GPM Series 120 Bearing Pump – 16 cc/rev (½\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "16 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "10.80 kg", notes: "Needle roller bearings. US flow: 4.23 GPM @ 1000 RPM. Additional section adds 9.5 kg." },
  { id: "m-120-07", seriesId: "series-120", modelNumber: "GP-120-07", description: "GPM Series 120 Bearing Pump – 24.1 cc/rev (¾\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "24.10 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "11.30 kg", notes: "US flow: 6.37 GPM @ 1000 RPM. Additional section adds 9.5 kg." },
  { id: "m-120-10", seriesId: "series-120", modelNumber: "GP-120-10", description: "GPM Series 120 Bearing Pump – 32.2 cc/rev (1\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "32.20 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "11.80 kg", notes: "US flow: 8.51 GPM @ 1000 RPM. Additional section adds 10.4 kg." },
  { id: "m-120-12", seriesId: "series-120", modelNumber: "GP-120-12", description: "GPM Series 120 Bearing Pump – 40.3 cc/rev (1¼\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "40.30 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "12.50 kg", notes: "US flow: 10.65 GPM @ 1000 RPM. Additional section adds 10.9 kg." },
  { id: "m-120-15", seriesId: "series-120", modelNumber: "GP-120-15", description: "GPM Series 120 Bearing Pump – 48.3 cc/rev (1½\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "48.30 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "13.20 kg", notes: "US flow: 12.76 GPM @ 1000 RPM. Additional section adds 11.3 kg." },
  { id: "m-120-17", seriesId: "series-120", modelNumber: "GP-120-17", description: "GPM Series 120 Bearing Pump – 56.4 cc/rev (1¾\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "56.40 cc/rev", pressureRating: "205 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "13.80 kg", notes: "US flow: 14.90 GPM @ 1000 RPM. Additional section adds 11.8 kg." },
  { id: "m-120-20", seriesId: "series-120", modelNumber: "GP-120-20", description: "GPM Series 120 Bearing Pump – 64.5 cc/rev (2\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2-bolt B", portSize: "SAE Ported / 4-Port", displacement: "64.50 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "14.70 kg", notes: "US flow: 17.04 GPM @ 1000 RPM. Additional section adds 12.7 kg." },
  // Series 125 — 20.8 to 104.4 cc/rev, 170 BAR, 2400 RPM, 9 sizes
  { id: "m-125-05", seriesId: "series-125", modelNumber: "GP-125-05", description: "GPM Series 125 Bearing Pump – 20.8 cc/rev (½\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "20.80 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "17.00 kg", notes: "Needle roller bearings. US flow: 5.50 GPM @ 1000 RPM." },
  { id: "m-125-07", seriesId: "series-125", modelNumber: "GP-125-07", description: "GPM Series 125 Bearing Pump – 31.2 cc/rev (¾\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "31.20 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "17.00 kg", notes: "US flow: 8.24 GPM @ 1000 RPM." },
  { id: "m-125-10", seriesId: "series-125", modelNumber: "GP-125-10", description: "GPM Series 125 Bearing Pump – 41.7 cc/rev (1\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "41.70 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "17.00 kg", notes: "US flow: 11.02 GPM @ 1000 RPM." },
  { id: "m-125-12", seriesId: "series-125", modelNumber: "GP-125-12", description: "GPM Series 125 Bearing Pump – 52.1 cc/rev (1¼\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "52.10 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "17.50 kg", notes: "US flow: 13.76 GPM @ 1000 RPM." },
  { id: "m-125-15", seriesId: "series-125", modelNumber: "GP-125-15", description: "GPM Series 125 Bearing Pump – 62.6 cc/rev (1½\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "62.60 cc/rev", pressureRating: "170 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "18.00 kg", notes: "US flow: 16.54 GPM @ 1000 RPM." },
  { id: "m-125-17", seriesId: "series-125", modelNumber: "GP-125-17", description: "GPM Series 125 Bearing Pump – 73 cc/rev (1¾\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "73.00 cc/rev", pressureRating: "153 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "19.00 kg", notes: "US flow: 19.29 GPM @ 1000 RPM." },
  { id: "m-125-20", seriesId: "series-125", modelNumber: "GP-125-20", description: "GPM Series 125 Bearing Pump – 83.5 cc/rev (2\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "83.50 cc/rev", pressureRating: "153 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "19.50 kg", notes: "US flow: 22.06 GPM @ 1000 RPM." },
  { id: "m-125-22", seriesId: "series-125", modelNumber: "GP-125-22", description: "GPM Series 125 Bearing Pump – 94 cc/rev (2¼\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "94.00 cc/rev", pressureRating: "138 BAR / 2000 PSI", maxSpeed: "2400 RPM", weight: "22.00 kg", notes: "US flow: 24.84 GPM @ 1000 RPM." },
  { id: "m-125-25", seriesId: "series-125", modelNumber: "GP-125-25", description: "GPM Series 125 Bearing Pump – 104.4 cc/rev (2½\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port", displacement: "104.40 cc/rev", pressureRating: "138 BAR / 2000 PSI", maxSpeed: "2400 RPM", weight: "22.50 kg", notes: "US flow: 27.58 GPM @ 1000 RPM." },
  // Series 131 — 16 to 83.5 cc/rev, 205 BAR, 2400 RPM, 9 sizes (add-a-pump capable)
  { id: "m-131-05", seriesId: "series-131", modelNumber: "GP-131-05", description: "GPM Series 131 Bearing Pump – 16 cc/rev (½\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "16 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "15.00 kg", notes: "Add-a-pump capable. US flow: 4.23 GPM @ 1000 RPM." },
  { id: "m-131-07", seriesId: "series-131", modelNumber: "GP-131-07", description: "GPM Series 131 Bearing Pump – 24.1 cc/rev (¾\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "24.10 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "15.00 kg", notes: "Add-a-pump capable. US flow: 6.37 GPM @ 1000 RPM." },
  { id: "m-131-10", seriesId: "series-131", modelNumber: "GP-131-10", description: "GPM Series 131 Bearing Pump – 32.2 cc/rev (1\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "32.20 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "15.00 kg", notes: "Add-a-pump capable. US flow: 8.51 GPM @ 1000 RPM." },
  { id: "m-131-12", seriesId: "series-131", modelNumber: "GP-131-12", description: "GPM Series 131 Bearing Pump – 40.3 cc/rev (1¼\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "40.30 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "15.50 kg", notes: "Add-a-pump capable. US flow: 10.65 GPM @ 1000 RPM." },
  { id: "m-131-15", seriesId: "series-131", modelNumber: "GP-131-15", description: "GPM Series 131 Bearing Pump – 48.3 cc/rev (1½\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "48.30 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "16.00 kg", notes: "Add-a-pump capable. US flow: 12.76 GPM @ 1000 RPM." },
  { id: "m-131-17", seriesId: "series-131", modelNumber: "GP-131-17", description: "GPM Series 131 Bearing Pump – 56.4 cc/rev (1¾\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "56.40 cc/rev", pressureRating: "153 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "16.50 kg", notes: "Add-a-pump capable. US flow: 14.90 GPM @ 1000 RPM." },
  { id: "m-131-20", seriesId: "series-131", modelNumber: "GP-131-20", description: "GPM Series 131 Bearing Pump – 64.5 cc/rev (2\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "64.50 cc/rev", pressureRating: "153 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "17.00 kg", notes: "Add-a-pump capable. US flow: 17.04 GPM @ 1000 RPM." },
  { id: "m-131-22", seriesId: "series-131", modelNumber: "GP-131-22", description: "GPM Series 131 Bearing Pump – 73 cc/rev (2¼\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "73.00 cc/rev", pressureRating: "138 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "17.50 kg", notes: "Add-a-pump capable. US flow: 19.18 GPM @ 1000 RPM." },
  { id: "m-131-25", seriesId: "series-131", modelNumber: "GP-131-25", description: "GPM Series 131 Bearing Pump – 83.5 cc/rev (2½\" gear width)", shaftType: "Key / Spline / SAE B", shaftDiameter: "SAE B (1-3/8\")", mountingType: "SAE 2/4-bolt B", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "83.50 cc/rev", pressureRating: "138 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "18.00 kg", notes: "Add-a-pump capable. US flow: 21.14 GPM @ 1000 RPM." },
  // Series 151 — 20.8 to 104.4 cc/rev, 205 BAR, 2400 RPM, 9 sizes
  { id: "m-151-05", seriesId: "series-151", modelNumber: "GP-151-05", description: "GPM Series 151 Bearing Pump – 20.8 cc/rev (½\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "20.80 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "17.00 kg", notes: "Needle roller bearings. Add-a-pump capable. US flow: 5.50 GPM @ 1000 RPM." },
  { id: "m-151-07", seriesId: "series-151", modelNumber: "GP-151-07", description: "GPM Series 151 Bearing Pump – 31.2 cc/rev (¾\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "31.20 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "17.00 kg", notes: "US flow: 8.24 GPM @ 1000 RPM." },
  { id: "m-151-10", seriesId: "series-151", modelNumber: "GP-151-10", description: "GPM Series 151 Bearing Pump – 41.7 cc/rev (1\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "41.70 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "17.00 kg", notes: "US flow: 11.02 GPM @ 1000 RPM." },
  { id: "m-151-12", seriesId: "series-151", modelNumber: "GP-151-12", description: "GPM Series 151 Bearing Pump – 52.1 cc/rev (1¼\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "52.10 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "17.50 kg", notes: "US flow: 13.76 GPM @ 1000 RPM." },
  { id: "m-151-15", seriesId: "series-151", modelNumber: "GP-151-15", description: "GPM Series 151 Bearing Pump – 62.6 cc/rev (1½\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "62.60 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "18.00 kg", notes: "US flow: 16.54 GPM @ 1000 RPM." },
  { id: "m-151-17", seriesId: "series-151", modelNumber: "GP-151-17", description: "GPM Series 151 Bearing Pump – 73 cc/rev (1¾\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "73.00 cc/rev", pressureRating: "153 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "19.00 kg", notes: "US flow: 19.29 GPM @ 1000 RPM." },
  { id: "m-151-20", seriesId: "series-151", modelNumber: "GP-151-20", description: "GPM Series 151 Bearing Pump – 83.5 cc/rev (2\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "83.50 cc/rev", pressureRating: "153 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "19.50 kg", notes: "US flow: 22.06 GPM @ 1000 RPM." },
  { id: "m-151-22", seriesId: "series-151", modelNumber: "GP-151-22", description: "GPM Series 151 Bearing Pump – 94 cc/rev (2¼\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "94.00 cc/rev", pressureRating: "138 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "22.00 kg", notes: "US flow: 24.84 GPM @ 1000 RPM." },
  { id: "m-151-25", seriesId: "series-151", modelNumber: "GP-151-25", description: "GPM Series 151 Bearing Pump – 104.4 cc/rev (2½\" gear width)", shaftType: "Key / Spline / SAE C", shaftDiameter: "SAE C (1-3/4\")", mountingType: "SAE 4-bolt C", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "104.40 cc/rev", pressureRating: "138 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "22.50 kg", notes: "US flow: 27.58 GPM @ 1000 RPM." },
  // Series 176 — 50.3 to 200 cc/rev, 205 BAR, 2400 RPM, 9 sizes
  { id: "m-176-10", seriesId: "series-176", modelNumber: "GP-176-10", description: "GPM Series 176 Bearing Pump – 50.3 cc/rev (1¾\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "50.30 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "33.00 kg", notes: "Needle roller bearings. US flow: 13.29 GPM @ 1000 RPM." },
  { id: "m-176-12", seriesId: "series-176", modelNumber: "GP-176-12", description: "GPM Series 176 Bearing Pump – 67.1 cc/rev (2\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "67.10 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "33.00 kg", notes: "US flow: 17.72 GPM @ 1000 RPM." },
  { id: "m-176-15", seriesId: "series-176", modelNumber: "GP-176-15", description: "GPM Series 176 Bearing Pump – 84 cc/rev (2¼\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "84.00 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "34.00 kg", notes: "US flow: 22.18 GPM @ 1000 RPM." },
  { id: "m-176-17", seriesId: "series-176", modelNumber: "GP-176-17", description: "GPM Series 176 Bearing Pump – 100.6 cc/rev (2½\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "100.60 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "35.00 kg", notes: "US flow: 26.59 GPM @ 1000 RPM." },
  { id: "m-176-20", seriesId: "series-176", modelNumber: "GP-176-20", description: "GPM Series 176 Bearing Pump – 117.5 cc/rev (2¾\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "117.50 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "36.00 kg", notes: "US flow: 31.04 GPM @ 1000 RPM." },
  { id: "m-176-22", seriesId: "series-176", modelNumber: "GP-176-22", description: "GPM Series 176 Bearing Pump – 134.3 cc/rev (3\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "134.30 cc/rev", pressureRating: "205 BAR / 3000 PSI", maxSpeed: "2400 RPM", weight: "37.00 kg", notes: "US flow: 35.22 GPM @ 1000 RPM." },
  { id: "m-176-25", seriesId: "series-176", modelNumber: "GP-176-25", description: "GPM Series 176 Bearing Pump – 151 cc/rev (3¼\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "151.00 cc/rev", pressureRating: "170 BAR / 2500 PSI", maxSpeed: "2400 RPM", weight: "38.00 kg", notes: "US flow: 39.90 GPM @ 1000 RPM." },
  { id: "m-176-27", seriesId: "series-176", modelNumber: "GP-176-27", description: "GPM Series 176 Bearing Pump – 168 cc/rev (3½\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "168.00 cc/rev", pressureRating: "153 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "39.00 kg", notes: "US flow: 44.39 GPM @ 1000 RPM." },
  { id: "m-176-30", seriesId: "series-176", modelNumber: "GP-176-30", description: "GPM Series 176 Bearing Pump – 200 cc/rev (4\" gear width)", shaftType: "Key / Spline / SAE D / CAT Taper", shaftDiameter: "SAE D (2\")", mountingType: "SAE 4-bolt D", portSize: "SAE Ported / 4-Port / Bi-Rotation", displacement: "200.00 cc/rev", pressureRating: "138 BAR / 2250 PSI", maxSpeed: "2400 RPM", weight: "41.00 kg", notes: "US flow: 52.84 GPM @ 1000 RPM." },
];

const SEED_MODELS: PumpModel[] = [...BUSHING_MODELS, ...BEARING_MODELS];

// ─── COMPONENT FACTORIES ──────────────────────────────────────────────────────

function makeBushingComponents(modelId: string, s: string): Component[] {
  return [
    { id: `${modelId}-c1`,  pumpModelId: modelId, category: "Gear Sets",           name: "Solid Shaft Gear Set",        partNumber: `A-${s}-??`,         description: "Complete solid shaft gear set. Substitute gear width code for full part number.", quantity: 1 },
    { id: `${modelId}-c2`,  pumpModelId: modelId, category: "Gear Sets",           name: "Loose Gear Set",              partNumber: `BVK-${s}-??`,        description: "Loose gear set — substitute gear width code.", quantity: 1 },
    { id: `${modelId}-c3`,  pumpModelId: modelId, category: "Gear Housings",       name: "Pump Gear Housing",           partNumber: `CRK-${s}-??`,        description: "Cast pump gear housing — substitute gear width code.", quantity: 1 },
    { id: `${modelId}-c4`,  pumpModelId: modelId, category: "Gear Housings",       name: "Motor Gear Housing",          partNumber: `CLK-${s}-??`,        description: "Cast motor gear housing.", quantity: 1 },
    { id: `${modelId}-c5`,  pumpModelId: modelId, category: "Shaft End Covers",    name: "Shaft End Cover — 2-bolt SAE B", partNumber: `DWK-${s}`,        description: "2-bolt SAE B shaft end cover.", quantity: 1 },
    { id: `${modelId}-c6`,  pumpModelId: modelId, category: "Port End Covers",     name: "Port End Cover — Ported",     partNumber: `EUK-${s}`,           description: "Standard ported end cover.", quantity: 1 },
    { id: `${modelId}-c7`,  pumpModelId: modelId, category: "Port End Covers",     name: "Port End Cover — 4-Port",     partNumber: `EUK-${s}-4`,         description: "4-port end cover configuration.", quantity: 1 },
    { id: `${modelId}-c8`,  pumpModelId: modelId, category: "Bearing Carriers",    name: "Bearing Carrier — 1 Outlet",  partNumber: `FYK-${s}-1`,         description: "1-outlet bearing carrier.", quantity: 1 },
    { id: `${modelId}-c9`,  pumpModelId: modelId, category: "Thrust Plates",       name: "Thrust Plate (Pump)",         partNumber: `GCI-${s}`,           description: "Pump thrust plate (×2 per assembly).", quantity: 2 },
    { id: `${modelId}-c10`, pumpModelId: modelId, category: "Thrust Plate Seals",  name: "Pump Channel Seal (H1)",      partNumber: `HCI-${s}-CS`,        description: "Pump channel seal.", quantity: 2 },
    { id: `${modelId}-c11`, pumpModelId: modelId, category: "Thrust Plate Seals",  name: "Pump Channel Seal Backup (H2)", partNumber: `HCI-${s}-CSBU`,    description: "Pump channel seal backup.", quantity: 2 },
    { id: `${modelId}-c12`, pumpModelId: modelId, category: "Thrust Plate Seals",  name: "Motor Body Seal Backup (H3)", partNumber: `HM-${s}-MSBU`,       description: "Motor body seal backup.", quantity: 2 },
    { id: `${modelId}-c13`, pumpModelId: modelId, category: "Thrust Plate Seals",  name: "Motor End Seal (H4)",         partNumber: `HM-${s}-MES`,        description: "Motor end seal.", quantity: 1 },
    { id: `${modelId}-c14`, pumpModelId: modelId, category: "Thrust Plate Seals",  name: "Motor Side Seal (H5)",        partNumber: `HM-${s}-MSS`,        description: "Motor side seal.", quantity: 1 },
    { id: `${modelId}-c15`, pumpModelId: modelId, category: "Connecting Shafts",   name: "Connecting Shaft (Standard)", partNumber: `IZK-${s}`,           description: "Standard connecting shaft for tandem / step-down builds.", quantity: 1 },
    { id: `${modelId}-c16`, pumpModelId: modelId, category: "Loose Shafts",        name: "Loose Shaft — Key",           partNumber: `JGD-${s}`,           description: "Key-type loose shaft.", quantity: 1 },
    { id: `${modelId}-c17`, pumpModelId: modelId, category: "Bearings / Bushes",   name: "Bushing Set (K2)",            partNumber: `KBUSH-${s}`,         description: "Bronze bushing set (K2) — 4 per assembly.", quantity: 4 },
    { id: `${modelId}-c18`, pumpModelId: modelId, category: "Bearings / Bushes",   name: "Shaft Ball Bearing (K1)",     partNumber: `KX-${s}-40`,         description: "Shaft ball bearing (K1).", quantity: 1 },
    { id: `${modelId}-c19`, pumpModelId: modelId, category: "Seals",               name: "Body Seals",                  partNumber: `LUB-${s}-239`,       description: "Complete body seal set — O-rings and gaskets.", quantity: 1 },
    { id: `${modelId}-c20`, pumpModelId: modelId, category: "Seals",               name: "Pump Seal — Standard",        partNumber: `LX-${s}`,            description: "Standard pump shaft seal.", quantity: 1 },
    { id: `${modelId}-c21`, pumpModelId: modelId, category: "Seals",               name: "Pump Seal — Telltale",        partNumber: `LPA-${s}-TT`,        description: "Telltale-type pump seal.", quantity: 1 },
    { id: `${modelId}-c22`, pumpModelId: modelId, category: "Retainers",           name: "Seal Retainer Motor",         partNumber: `MFR-${s}`,           description: "Motor seal retainer.", quantity: 1 },
    { id: `${modelId}-c23`, pumpModelId: modelId, category: "Dowels",              name: "Dowel — Standard",            partNumber: `NDOWEL-${s}`,        description: "Standard locating dowel pins.", quantity: 4 },
    { id: `${modelId}-c24`, pumpModelId: modelId, category: "Spacers",             name: "Seal Spacer",                 partNumber: `QAE-${s}`,           description: "Seal spacer.", quantity: 1 },
    { id: `${modelId}-c25`, pumpModelId: modelId, category: "Spacers",             name: "Bearing Spacer (Conti)",      partNumber: `QVB-${s}`,           description: "Bearing spacer (conti).", quantity: 1 },
    { id: `${modelId}-c26`, pumpModelId: modelId, category: "Keys",                name: "Shaft Key — 1\"",             partNumber: `RX-16`,              description: "1\" shaft key.", quantity: 1 },
    { id: `${modelId}-c27`, pumpModelId: modelId, category: "Snap Rings",          name: "Shaft Circlip",               partNumber: `SX-${s}-100`,        description: "Snap ring / circlip for shaft.", quantity: 2 },
    { id: `${modelId}-c28`, pumpModelId: modelId, category: "Fasteners",           name: "Bolts",                       partNumber: `VBOLT-1/2\"x?`,      description: "Bolts — substitute bolt length for full part number.", quantity: 8 },
    { id: `${modelId}-c29`, pumpModelId: modelId, category: "Fasteners",           name: "Nuts",                        partNumber: `VNUT-1/2\"`,         description: "Nuts.", quantity: 8 },
    { id: `${modelId}-c30`, pumpModelId: modelId, category: "Small Parts",         name: "Plug Drain",                  partNumber: `WX-131-11`,          description: "Drain plug.", quantity: 1 },
    { id: `${modelId}-c31`, pumpModelId: modelId, category: "Small Parts",         name: "Check Valve",                 partNumber: `WM-131-1391`,        description: "Check valve.", quantity: 1 },
  ];
}

// Part number maps per bearing series (from catalog pages 4–5)
const BEARING_PARTS: Record<string, Record<string, string>> = {
  "120": { gearSet: "ADD-131-??", looseGear: "BV-131-??", pumpHousing: "CRD-120-??", motorHousing: "CRD-120-??", sec: "DFD-120", sec4bolt: "DGD-120", portEnd: "EXD-120", portEnd4: "EXD-120-4P", bearingCarrier: "FVD-120", thrustPlate: "GAA-131", conShaft: "IZA-131", looseShaft: "JAV-131", needleRoller: "KY-131", ballBearing: "KX-131-40", bodySeals: "LUB-120-239", pumpSeal: "LX-131-16", motorSeal: "LX-131-9", vitonSeal: "LX-131V-16", dowel: "NDOWEL-131", presRing: "OLB-131-1", oring: "PBA-131-2", sealSpacer: "QAE-131", bearSpacer: "QVB-131-2", key: "RX-17", snap: "SX-131-100", bolts: "VBOLT-9/16\"x?", nuts: "VNUT-9/16\"" },
  "125": { gearSet: "AKA-125-??", looseGear: "BKA-125-??", pumpHousing: "CMA-151-??", motorHousing: "CMA-151-??", sec: "DUA-125", sec4bolt: "DCB-125", portEnd: "EZA-151", portEnd4: "EZA-151-4", bearingCarrier: "FKB-125", thrustPlate: "GY-151", conShaft: "ITA-125", looseShaft: "JHB-125", needleRoller: "KS-151", ballBearing: "KX-125-8", bodySeals: "LUB-151-244", pumpSeal: "LX-125-13", motorSeal: "LX-125-3", vitonSeal: "LX-125V-13", dowel: "—", presRing: "OAH-125", oring: "PL-125-26", sealSpacer: "QSA-125", bearSpacer: "QOB-125", key: "RX-17", snap: "SX-125-13", bolts: "VBOLT-5/8\"x?", nuts: "VNUT-5/8\"" },
  "131": { gearSet: "ADD-131-??", looseGear: "BV-131-??", pumpHousing: "CRA-131-??", motorHousing: "CMA-151-??", sec: "DFB-131", sec4bolt: "DGB-131", portEnd: "EXA-131", portEnd4: "EXA-131-4", bearingCarrier: "FVA-131", thrustPlate: "GAA-131", conShaft: "IZA-131", looseShaft: "JAV-131", needleRoller: "KY-131", ballBearing: "KX-131-40", bodySeals: "LUB-131-242", pumpSeal: "LX-131-16", motorSeal: "LX-131-9", vitonSeal: "LX-131V-16", dowel: "NDOWEL-131", presRing: "OLB-131-1", oring: "PBA-131-2", sealSpacer: "QAE-131", bearSpacer: "QVB-131-2", key: "RX-17", snap: "SX-131-100", bolts: "VBOLT-5/8\"x?", nuts: "VNUT-5/8\"" },
  "151": { gearSet: "ATD-151-??", looseGear: "BMA-151-??", pumpHousing: "CMA-151-??", motorHousing: "CMA-151-??", sec: "DRB-151", sec4bolt: "DNB-151", portEnd: "EZA-151", portEnd4: "EZA-151-4", bearingCarrier: "FTA-151", thrustPlate: "GY-151", conShaft: "IYA-151", looseShaft: "JAB-151", needleRoller: "KS-151", ballBearing: "KX-151-58", bodySeals: "LUB-151-244", pumpSeal: "LX-151-17", motorSeal: "LX-151-8", vitonSeal: "LX-151V-17", dowel: "NDOWEL-131", presRing: "ONB-151-1", oring: "PBA-131-2", sealSpacer: "QAC-151", bearSpacer: "QVB-151-1", key: "RX-54", snap: "SX-151-125", bolts: "VBOLT-5/8\"x?", nuts: "VNUT-5/8\"" },
  "176": { gearSet: "AAL-176-??", looseGear: "BPA-176-??", pumpHousing: "CSA-176-??", motorHousing: "CSA-176-??", sec: "DVB-176", sec4bolt: "DSB-176", portEnd: "EYA-176", portEnd4: "EPB-176/131", bearingCarrier: "FZA-176", thrustPlate: "GBA-176", conShaft: "IAB-176", looseShaft: "JAL-176", needleRoller: "KR-176", ballBearing: "KX-176-59", bodySeals: "LUB-176-252", pumpSeal: "LX-176-10", motorSeal: "LX-176-1", vitonSeal: "LX-176V-10", dowel: "NDOWEL-176", presRing: "OWB-176-1", oring: "PL-176-164", sealSpacer: "QBV-176", bearSpacer: "QAF-176", key: "RX-45", snap: "SX-176-137", bolts: "VBOLT-5/8\"x?", nuts: "VNUT-5/8\"" },
};

// Map series ID to the parts key (series 120 uses "120", series 125 uses "125", etc.)
const SERIES_TO_PARTS_KEY: Record<string, string> = {
  "series-120": "120",
  "series-125": "125",
  "series-131": "131",
  "series-151": "151",
  "series-176": "176",
};

function makeBearingComponents(model: PumpModel): Component[] {
  const seriesKey = SERIES_TO_PARTS_KEY[model.seriesId] ?? "131";
  const p = BEARING_PARTS[seriesKey];
  const id = model.id;
  return [
    { id: `${id}-c1`,  pumpModelId: id, category: "Gear Sets",           name: "Solid Shaft Gear Set",            partNumber: p.gearSet,       description: "Solid shaft gear set — substitute gear width code for full part number.", quantity: 1 },
    { id: `${id}-c2`,  pumpModelId: id, category: "Gear Sets",           name: "Loose Gear Set",                  partNumber: p.looseGear,     description: "Loose gear set — substitute gear width code.", quantity: 1 },
    { id: `${id}-c3`,  pumpModelId: id, category: "Gear Housings",       name: "Pump Gear Housing",               partNumber: p.pumpHousing,   description: "Cast pump gear housing.", quantity: 1 },
    { id: `${id}-c4`,  pumpModelId: id, category: "Gear Housings",       name: "Motor Gear Housing",              partNumber: p.motorHousing,  description: "Cast motor gear housing.", quantity: 1 },
    { id: `${id}-c5`,  pumpModelId: id, category: "Shaft End Covers",    name: "Shaft End Cover (Standard)",      partNumber: p.sec,           description: "Standard shaft end cover.", quantity: 1 },
    { id: `${id}-c6`,  pumpModelId: id, category: "Shaft End Covers",    name: "Shaft End Cover (4-Bolt)",        partNumber: p.sec4bolt,      description: "4-bolt shaft end cover variant.", quantity: 1 },
    { id: `${id}-c7`,  pumpModelId: id, category: "Port End Covers",     name: "Port End Cover (Standard)",       partNumber: p.portEnd,       description: "Standard port end cover.", quantity: 1 },
    { id: `${id}-c8`,  pumpModelId: id, category: "Port End Covers",     name: "Port End Cover (4-Port)",         partNumber: p.portEnd4,      description: "4-port end cover configuration.", quantity: 1 },
    { id: `${id}-c9`,  pumpModelId: id, category: "Bearing Carriers",    name: "Bearing Carrier (Standard)",      partNumber: p.bearingCarrier, description: "Standard bearing carrier.", quantity: 1 },
    { id: `${id}-c10`, pumpModelId: id, category: "Thrust Plates",       name: "Thrust Plate (Pump)",             partNumber: p.thrustPlate,   description: "Pump thrust plate (×2 per assembly).", quantity: 2 },
    { id: `${id}-c11`, pumpModelId: id, category: "Connecting Shafts",   name: "Connecting Shaft (Standard)",     partNumber: p.conShaft,      description: "Standard connecting shaft for tandem / add-a-pump builds.", quantity: 1 },
    { id: `${id}-c12`, pumpModelId: id, category: "Loose Shafts",        name: "Loose Shaft (Key)",               partNumber: p.looseShaft,    description: "Key-type loose shaft.", quantity: 1 },
    { id: `${id}-c13`, pumpModelId: id, category: "Bearings / Bushes",   name: "Needle Roller Bearing (K2)",      partNumber: p.needleRoller,  description: "Needle roller bearing K2 — bearing range specific.", quantity: 4 },
    { id: `${id}-c14`, pumpModelId: id, category: "Bearings / Bushes",   name: "Shaft Ball Bearing (K1)",         partNumber: p.ballBearing,   description: "Shaft ball bearing K1.", quantity: 1 },
    { id: `${id}-c15`, pumpModelId: id, category: "Seals",               name: "Body Seals",                      partNumber: p.bodySeals,     description: "Complete body seal set — O-rings and gaskets.", quantity: 1 },
    { id: `${id}-c16`, pumpModelId: id, category: "Seals",               name: "Pump Seal — Standard",            partNumber: p.pumpSeal,      description: "Standard pump shaft seal.", quantity: 1 },
    { id: `${id}-c17`, pumpModelId: id, category: "Seals",               name: "Motor Seal — Standard",           partNumber: p.motorSeal,     description: "Standard motor shaft seal.", quantity: 1 },
    { id: `${id}-c18`, pumpModelId: id, category: "Seals",               name: "Pump Seal — Viton",               partNumber: p.vitonSeal,     description: "Viton pump shaft seal (high-temp / chemical resistant).", quantity: 1 },
    { id: `${id}-c19`, pumpModelId: id, category: "Dowels",              name: "Dowel Pin (Standard)",            partNumber: p.dowel,         description: "Standard locating dowel pin.", quantity: 4 },
    { id: `${id}-c20`, pumpModelId: id, category: "Bronze Pressure Rings", name: "Bronze Pressure Ring",          partNumber: p.presRing,      description: "Bronze pressure ring — bearing range only.", quantity: 2 },
    { id: `${id}-c21`, pumpModelId: id, category: "O-Ring / Pocket Seals", name: "O-Ring / Pocket Seal",         partNumber: p.oring,         description: "O-ring retainer / pocket seal — bearing range specific.", quantity: 1 },
    { id: `${id}-c22`, pumpModelId: id, category: "Spacers",             name: "Seal Spacer",                     partNumber: p.sealSpacer,    description: "Seal spacer.", quantity: 1 },
    { id: `${id}-c23`, pumpModelId: id, category: "Spacers",             name: "Bearing Spacer",                  partNumber: p.bearSpacer,    description: "Bearing spacer.", quantity: 1 },
    { id: `${id}-c24`, pumpModelId: id, category: "Keys",                name: "Shaft Key",                       partNumber: p.key,           description: "Shaft key.", quantity: 1 },
    { id: `${id}-c25`, pumpModelId: id, category: "Snap Rings",          name: "Shaft Snap Ring / Circlip",       partNumber: p.snap,          description: "Snap ring for shaft retention.", quantity: 2 },
    { id: `${id}-c26`, pumpModelId: id, category: "Fasteners",           name: "Bolts",                           partNumber: p.bolts,         description: "Bolts — substitute bolt length.", quantity: 8 },
    { id: `${id}-c27`, pumpModelId: id, category: "Fasteners",           name: "Nuts",                            partNumber: p.nuts,          description: "Nuts.", quantity: 8 },
    { id: `${id}-c28`, pumpModelId: id, category: "Small Parts",         name: "Plug Drain",                      partNumber: "WX-131-11",     description: "Drain plug.", quantity: 1 },
    { id: `${id}-c29`, pumpModelId: id, category: "Small Parts",         name: "Plug Shaft End Cover",            partNumber: "WT-131-1391",   description: "Shaft end cover plug.", quantity: 1 },
    { id: `${id}-c30`, pumpModelId: id, category: "Small Parts",         name: "Check Valve",                     partNumber: "WM-131-1391",   description: "Check valve.", quantity: 1 },
  ];
}

const SEED_COMPONENTS: Component[] = [
  ...BUSHING_MODELS.map(m => makeBushingComponents(m.id, m.seriesId.replace("series-", ""))).flat(),
  ...BEARING_MODELS.map(m => makeBearingComponents(m)).flat(),
];

// ─── STORAGE ──────────────────────────────────────────────────────────────────

const STORAGE_KEYS = {
  manufacturers: "@hydraiq:manufacturers",
  pumpSeries:    "@hydraiq:pumpSeries",
  pumpModels:    "@hydraiq:pumpModels",
  components:    "@hydraiq:components",
  seeded:        "@hydraiq:seeded:v3",   // bump to force re-seed with bearing range
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [pumpSeries,    setPumpSeries]    = useState<PumpSeries[]>([]);
  const [pumpModels,    setPumpModels]    = useState<PumpModel[]>([]);
  const [components,    setComponents]    = useState<Component[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<PumpModel[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const seeded = await AsyncStorage.getItem(STORAGE_KEYS.seeded);
        if (!seeded) {
          await AsyncStorage.multiSet([
            [STORAGE_KEYS.manufacturers, JSON.stringify(SEED_MANUFACTURERS)],
            [STORAGE_KEYS.pumpSeries,    JSON.stringify(SEED_SERIES)],
            [STORAGE_KEYS.pumpModels,    JSON.stringify(SEED_MODELS)],
            [STORAGE_KEYS.components,    JSON.stringify(SEED_COMPONENTS)],
            [STORAGE_KEYS.seeded,        "true"],
          ]);
          setManufacturers(SEED_MANUFACTURERS);
          setPumpSeries(SEED_SERIES);
          setPumpModels(SEED_MODELS);
          setComponents(SEED_COMPONENTS);
        } else {
          const values = await AsyncStorage.multiGet([
            STORAGE_KEYS.manufacturers,
            STORAGE_KEYS.pumpSeries,
            STORAGE_KEYS.pumpModels,
            STORAGE_KEYS.components,
          ]);
          const [mRaw, sRaw, pRaw, cRaw] = values.map(v => v[1]);
          if (mRaw) setManufacturers(JSON.parse(mRaw));
          if (sRaw) setPumpSeries(JSON.parse(sRaw));
          if (pRaw) setPumpModels(JSON.parse(pRaw));
          if (cRaw) setComponents(JSON.parse(cRaw));
        }
      } catch {}
    }
    load();
  }, []);

  const persist = useCallback(async (key: string, data: unknown) => {
    try { await AsyncStorage.setItem(key, JSON.stringify(data)); } catch {}
  }, []);

  const addManufacturer    = useCallback((m: Omit<Manufacturer, "id">) => { const n = { ...m, id: genId() }; setManufacturers(p => { const u = [...p, n]; persist(STORAGE_KEYS.manufacturers, u); return u; }); }, [persist]);
  const updateManufacturer = useCallback((m: Manufacturer)              => { setManufacturers(p => { const u = p.map(x => x.id === m.id ? m : x); persist(STORAGE_KEYS.manufacturers, u); return u; }); }, [persist]);
  const deleteManufacturer = useCallback((id: string)                   => { setManufacturers(p => { const u = p.filter(x => x.id !== id); persist(STORAGE_KEYS.manufacturers, u); return u; }); }, [persist]);

  const addPumpSeries    = useCallback((s: Omit<PumpSeries, "id">) => { const n = { ...s, id: genId() }; setPumpSeries(p => { const u = [...p, n]; persist(STORAGE_KEYS.pumpSeries, u); return u; }); }, [persist]);
  const updatePumpSeries = useCallback((s: PumpSeries)              => { setPumpSeries(p => { const u = p.map(x => x.id === s.id ? s : x); persist(STORAGE_KEYS.pumpSeries, u); return u; }); }, [persist]);
  const deletePumpSeries = useCallback((id: string)                 => { setPumpSeries(p => { const u = p.filter(x => x.id !== id); persist(STORAGE_KEYS.pumpSeries, u); return u; }); }, [persist]);

  const addPumpModel    = useCallback((p: Omit<PumpModel, "id">) => { const n = { ...p, id: genId() }; setPumpModels(prev => { const u = [...prev, n]; persist(STORAGE_KEYS.pumpModels, u); return u; }); }, [persist]);
  const updatePumpModel = useCallback((p: PumpModel)              => { setPumpModels(prev => { const u = prev.map(x => x.id === p.id ? p : x); persist(STORAGE_KEYS.pumpModels, u); return u; }); }, [persist]);
  const deletePumpModel = useCallback((id: string)                => { setPumpModels(prev => { const u = prev.filter(x => x.id !== id); persist(STORAGE_KEYS.pumpModels, u); return u; }); }, [persist]);

  const addComponent    = useCallback((c: Omit<Component, "id">) => { const n = { ...c, id: genId() }; setComponents(prev => { const u = [...prev, n]; persist(STORAGE_KEYS.components, u); return u; }); }, [persist]);
  const updateComponent = useCallback((c: Component)              => { setComponents(prev => { const u = prev.map(x => x.id === c.id ? c : x); persist(STORAGE_KEYS.components, u); return u; }); }, [persist]);
  const deleteComponent = useCallback((id: string)                => { setComponents(prev => { const u = prev.filter(x => x.id !== id); persist(STORAGE_KEYS.components, u); return u; }); }, [persist]);

  const markViewed = useCallback((pumpId: string) => {
    setPumpModels(prev => { const u = prev.map(x => x.id === pumpId ? { ...x, viewedAt: Date.now() } : x); persist(STORAGE_KEYS.pumpModels, u); return u; });
  }, [persist]);

  const getSeriesForManufacturer = useCallback((mId: string) => pumpSeries.filter(s => s.manufacturerId === mId), [pumpSeries]);
  const getModelsForSeries       = useCallback((sId: string) => pumpModels.filter(m => m.seriesId === sId),        [pumpModels]);
  const getComponentsForModel    = useCallback((mId: string) => components.filter(c => c.pumpModelId === mId),     [components]);
  const getModel                 = useCallback((id: string)  => pumpModels.find(m => m.id === id),                 [pumpModels]);
  const getSeries                = useCallback((id: string)  => pumpSeries.find(s => s.id === id),                 [pumpSeries]);
  const getManufacturer          = useCallback((id: string)  => manufacturers.find(m => m.id === id),              [manufacturers]);
  const getComponent             = useCallback((id: string)  => components.find(c => c.id === id),                 [components]);

  const searchComponents = useCallback((query: string): Component[] => {
    const q = query.toLowerCase().trim();
    if (!q) return [];
    return components.filter(c => {
      const gpmNo = getGpmNo(c).toLowerCase();
      return (
        gpmNo.includes(q) ||
        c.name.toLowerCase().includes(q) ||
        c.description.toLowerCase().includes(q) ||
        c.category.toLowerCase().includes(q) ||
        (c.factoryNo ?? "").toLowerCase().includes(q) ||
        (c.partNo ?? "").toLowerCase().includes(q) ||
        (c.reference ?? "").toLowerCase().includes(q)
      );
    });
  }, [components]);

  const searchPumps = useCallback((query: string, filters: SearchFilters): PumpModel[] => {
    const q = query.toLowerCase().trim();
    return pumpModels.filter(model => {
      const series = pumpSeries.find(s => s.id === model.seriesId);
      const mfr    = manufacturers.find(m => m.id === series?.manufacturerId);
      if (filters.manufacturerId && series?.manufacturerId !== filters.manufacturerId) return false;
      if (filters.seriesId       && model.seriesId !== filters.seriesId)              return false;
      if (filters.shaftType      && !model.shaftType.toLowerCase().includes(filters.shaftType.toLowerCase())) return false;
      if (filters.displacement   && !model.displacement.toLowerCase().includes(filters.displacement.toLowerCase())) return false;
      if (filters.portSize       && !model.portSize.toLowerCase().includes(filters.portSize.toLowerCase())) return false;
      if (!q) return true;
      return [model.modelNumber, model.description, model.displacement, model.shaftType, model.portSize, model.pressureRating, series?.seriesName ?? "", mfr?.name ?? ""].some(f => f.toLowerCase().includes(q));
    });
  }, [pumpModels, pumpSeries, manufacturers]);

  useEffect(() => {
    const viewed = [...pumpModels].filter(m => m.viewedAt).sort((a, b) => (b.viewedAt ?? 0) - (a.viewedAt ?? 0)).slice(0, 10);
    setRecentlyViewed(viewed);
  }, [pumpModels]);

  return (
    <DataContext.Provider value={{
      manufacturers, pumpSeries, pumpModels, components, recentlyViewed,
      addManufacturer, updateManufacturer, deleteManufacturer,
      addPumpSeries,   updatePumpSeries,   deletePumpSeries,
      addPumpModel,    updatePumpModel,    deletePumpModel,
      addComponent,    updateComponent,    deleteComponent,
      markViewed, getSeriesForManufacturer, getModelsForSeries,
      getComponentsForModel, getModel, getSeries, getManufacturer, getComponent, searchPumps, searchComponents,
    }}>
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const ctx = useContext(DataContext);
  if (!ctx) throw new Error("useData must be used within DataProvider");
  return ctx;
}
