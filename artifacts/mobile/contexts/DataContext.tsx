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
  partNumber: string;
  description: string;
  imageUrl?: string;
  quantity: number;
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

const SEED_MANUFACTURERS: Manufacturer[] = [
  {
    id: "mfr-gpm",
    name: "GPM",
    website: "www.gearpumpus.com",
    country: "South Africa / USA",
  },
];

const SEED_SERIES: PumpSeries[] = [
  {
    id: "series-215",
    manufacturerId: "mfr-gpm",
    seriesName: "215",
    description: "Bushing range gear pump — 10 to 40 cc/rev, up to 240 BAR",
    type: "Bushing",
  },
  {
    id: "series-230",
    manufacturerId: "mfr-gpm",
    seriesName: "230",
    description: "Bushing range gear pump — 16 to 64.5 cc/rev, up to 240 BAR",
    type: "Bushing",
  },
  {
    id: "series-250",
    manufacturerId: "mfr-gpm",
    seriesName: "250",
    description: "Bushing range gear pump — 20.8 to 104.4 cc/rev, up to 240 BAR",
    type: "Bushing",
  },
  {
    id: "series-265",
    manufacturerId: "mfr-gpm",
    seriesName: "265",
    description: "Bushing range gear pump — 44 to 147 cc/rev, up to 240 BAR",
    type: "Bushing",
  },
];

const SEED_MODELS: PumpModel[] = [
  // Series 215
  {
    id: "model-215-05", seriesId: "series-215", modelNumber: "GP-215-05",
    description: "GPM 215 Bushing Pump – 10 cc/rev (0.5\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "10 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "8.0 kg",
    notes: "Gear housing width 0.88\". Displacements 10 cc/rev. US flow: 4.23 GPM @ 1000 RPM.",
  },
  {
    id: "model-215-07", seriesId: "series-215", modelNumber: "GP-215-07",
    description: "GPM 215 Bushing Pump – 15 cc/rev (0.75\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "15 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "8.0 kg",
    notes: "Gear housing width 1.13\". US flow: 6.37 GPM @ 1000 RPM.",
  },
  {
    id: "model-215-10", seriesId: "series-215", modelNumber: "GP-215-10",
    description: "GPM 215 Bushing Pump – 20 cc/rev (1.0\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "20 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "8.0 kg",
    notes: "Gear housing width 1.38\". US flow: 8.51 GPM @ 1000 RPM.",
  },
  {
    id: "model-215-12", seriesId: "series-215", modelNumber: "GP-215-12",
    description: "GPM 215 Bushing Pump – 25 cc/rev (1.25\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "25 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "8.5 kg",
    notes: "Gear housing width 1.63\". US flow: 10.65 GPM @ 1000 RPM.",
  },
  {
    id: "model-215-15", seriesId: "series-215", modelNumber: "GP-215-15",
    description: "GPM 215 Bushing Pump – 30 cc/rev (1.5\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "30 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "9.0 kg",
    notes: "Gear housing width 1.88\". US flow: 12.76 GPM @ 1000 RPM.",
  },
  {
    id: "model-215-17", seriesId: "series-215", modelNumber: "GP-215-17",
    description: "GPM 215 Bushing Pump – 35 cc/rev (1.75\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "35 cc/rev", pressureRating: "200 BAR / 2900 PSI",
    maxSpeed: "3000 RPM", weight: "9.5 kg",
    notes: "Gear housing width 2.13\". US flow: 14.90 GPM @ 1000 RPM.",
  },
  {
    id: "model-215-20", seriesId: "series-215", modelNumber: "GP-215-20",
    description: "GPM 215 Bushing Pump – 40 cc/rev (2.0\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "40 cc/rev", pressureRating: "170 BAR / 2500 PSI",
    maxSpeed: "3000 RPM", weight: "10.0 kg",
    notes: "Gear housing width 2.38\". US flow: 17.04 GPM @ 1000 RPM.",
  },
  // Series 230
  {
    id: "model-230-08", seriesId: "series-230", modelNumber: "GP-230-08",
    description: "GPM 230 Bushing Pump – 16 cc/rev (1.0\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "16 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "16.0 kg",
    notes: "Gear housing width 1.00\". US flow: 4.23 GPM @ 1000 RPM.",
  },
  {
    id: "model-230-12", seriesId: "series-230", modelNumber: "GP-230-12",
    description: "GPM 230 Bushing Pump – 24.1 cc/rev (1.25\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "24.10 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "16.0 kg",
    notes: "Gear housing width 1.25\". US flow: 6.37 GPM @ 1000 RPM.",
  },
  {
    id: "model-230-16", seriesId: "series-230", modelNumber: "GP-230-16",
    description: "GPM 230 Bushing Pump – 32.2 cc/rev (1.5\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "32.20 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "16.0 kg",
    notes: "Gear housing width 1.50\". US flow: 8.51 GPM @ 1000 RPM.",
  },
  {
    id: "model-230-20", seriesId: "series-230", modelNumber: "GP-230-20",
    description: "GPM 230 Bushing Pump – 40.3 cc/rev (1.75\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "40.30 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "16.6 kg",
    notes: "Gear housing width 1.75\". US flow: 10.65 GPM @ 1000 RPM.",
  },
  {
    id: "model-230-24", seriesId: "series-230", modelNumber: "GP-230-24",
    description: "GPM 230 Bushing Pump – 48.3 cc/rev (2.0\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "48.30 cc/rev", pressureRating: "240 BAR / 3200 PSI",
    maxSpeed: "3000 RPM", weight: "17.20 kg",
    notes: "Gear housing width 2.00\". US flow: 12.76 GPM @ 1000 RPM.",
  },
  {
    id: "model-230-28", seriesId: "series-230", modelNumber: "GP-230-28",
    description: "GPM 230 Bushing Pump – 56.4 cc/rev (2.25\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "56.40 cc/rev", pressureRating: "220 BAR / 2900 PSI",
    maxSpeed: "3000 RPM", weight: "17.80 kg",
    notes: "Gear housing width 2.25\". US flow: 14.90 GPM @ 1000 RPM.",
  },
  {
    id: "model-230-32", seriesId: "series-230", modelNumber: "GP-230-32",
    description: "GPM 230 Bushing Pump – 64.5 cc/rev (2.5\" Gear Width)",
    shaftType: "Spline / SAE B / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 2-bolt B",
    portSize: "SAE Ported / 4-Port", displacement: "64.50 cc/rev", pressureRating: "200 BAR / 2500 PSI",
    maxSpeed: "3000 RPM", weight: "18.40 kg",
    notes: "Gear housing width 2.50\". US flow: 17.04 GPM @ 1000 RPM.",
  },
  // Series 250
  {
    id: "model-250-10", seriesId: "series-250", modelNumber: "GP-250-10",
    description: "GPM 250 Bushing Pump – 20.8 cc/rev (1.0\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "20.80 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "22.7 kg",
    notes: "Gear housing width 1.00\". US flow: 5.50 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-16", seriesId: "series-250", modelNumber: "GP-250-16",
    description: "GPM 250 Bushing Pump – 31.2 cc/rev (1.25\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "31.20 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "22.7 kg",
    notes: "Gear housing width 1.25\". US flow: 8.24 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-20", seriesId: "series-250", modelNumber: "GP-250-20",
    description: "GPM 250 Bushing Pump – 41.7 cc/rev (1.5\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "41.70 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "22.7 kg",
    notes: "Gear housing width 1.50\". US flow: 11.02 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-25", seriesId: "series-250", modelNumber: "GP-250-25",
    description: "GPM 250 Bushing Pump – 52.1 cc/rev (1.75\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "52.10 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "23.4 kg",
    notes: "Gear housing width 1.75\". US flow: 13.76 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-30", seriesId: "series-250", modelNumber: "GP-250-30",
    description: "GPM 250 Bushing Pump – 62.6 cc/rev (2.0\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "62.60 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "3000 RPM", weight: "24.1 kg",
    notes: "Gear housing width 2.00\". US flow: 16.54 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-35", seriesId: "series-250", modelNumber: "GP-250-35",
    description: "GPM 250 Bushing Pump – 73 cc/rev (2.25\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "73.00 cc/rev", pressureRating: "220 BAR / 3250 PSI",
    maxSpeed: "3000 RPM", weight: "24.8 kg",
    notes: "Gear housing width 2.25\". US flow: 19.29 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-40", seriesId: "series-250", modelNumber: "GP-250-40",
    description: "GPM 250 Bushing Pump – 83.5 cc/rev (2.5\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "83.50 cc/rev", pressureRating: "200 BAR / 3000 PSI",
    maxSpeed: "3000 RPM", weight: "25.5 kg",
    notes: "Gear housing width 2.50\". US flow: 22.06 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-45", seriesId: "series-250", modelNumber: "GP-250-45",
    description: "GPM 250 Bushing Pump – 94 cc/rev (2.75\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "94.00 cc/rev", pressureRating: "190 BAR / 2750 PSI",
    maxSpeed: "3000 RPM", weight: "26.2 kg",
    notes: "Gear housing width 2.75\". US flow: 24.84 GPM @ 1000 RPM.",
  },
  {
    id: "model-250-51", seriesId: "series-250", modelNumber: "GP-250-51",
    description: "GPM 250 Bushing Pump – 104.4 cc/rev (3.0\" Gear Width)",
    shaftType: "Spline / SAE C / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt C",
    portSize: "SAE Ported / 4-Port", displacement: "104.40 cc/rev", pressureRating: "170 BAR / 2500 PSI",
    maxSpeed: "3000 RPM", weight: "26.9 kg",
    notes: "Gear housing width 3.00\". US flow: 27.58 GPM @ 1000 RPM.",
  },
  // Series 265
  {
    id: "model-265-44", seriesId: "series-265", modelNumber: "GP-265-44",
    description: "GPM 265 Bushing Pump – 44 cc/rev (1.25\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "44.00 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "2400 RPM", weight: "22.7 kg",
    notes: "Gear housing width 1.25\". US flow: 11.62 GPM @ 1000 RPM.",
  },
  {
    id: "model-265-59", seriesId: "series-265", modelNumber: "GP-265-59",
    description: "GPM 265 Bushing Pump – 59 cc/rev (1.5\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "59.00 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "2400 RPM", weight: "22.7 kg",
    notes: "Gear housing width 1.50\". US flow: 15.57 GPM @ 1000 RPM.",
  },
  {
    id: "model-265-73", seriesId: "series-265", modelNumber: "GP-265-73",
    description: "GPM 265 Bushing Pump – 73.5 cc/rev (1.75\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "73.50 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "2400 RPM", weight: "23.4 kg",
    notes: "Gear housing width 1.75\". US flow: 19.42 GPM @ 1000 RPM.",
  },
  {
    id: "model-265-88", seriesId: "series-265", modelNumber: "GP-265-88",
    description: "GPM 265 Bushing Pump – 88 cc/rev (2.0\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "88.00 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "2400 RPM", weight: "24.1 kg",
    notes: "Gear housing width 2.00\". US flow: 23.25 GPM @ 1000 RPM.",
  },
  {
    id: "model-265-102", seriesId: "series-265", modelNumber: "GP-265-102",
    description: "GPM 265 Bushing Pump – 102 cc/rev (2.25\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "102.00 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "2400 RPM", weight: "24.8 kg",
    notes: "Gear housing width 2.25\". US flow: 26.95 GPM @ 1000 RPM.",
  },
  {
    id: "model-265-118", seriesId: "series-265", modelNumber: "GP-265-118",
    description: "GPM 265 Bushing Pump – 118 cc/rev (2.5\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "118.00 cc/rev", pressureRating: "240 BAR / 3500 PSI",
    maxSpeed: "2400 RPM", weight: "25.5 kg",
    notes: "Gear housing width 2.50\". US flow: 31.19 GPM @ 1000 RPM.",
  },
  {
    id: "model-265-133", seriesId: "series-265", modelNumber: "GP-265-133",
    description: "GPM 265 Bushing Pump – 132.6 cc/rev (2.75\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "132.60 cc/rev", pressureRating: "220 BAR / 3250 PSI",
    maxSpeed: "2400 RPM", weight: "26.2 kg",
    notes: "Gear housing width 2.75\". US flow: 35.03 GPM @ 1000 RPM.",
  },
  {
    id: "model-265-147", seriesId: "series-265", modelNumber: "GP-265-147",
    description: "GPM 265 Bushing Pump – 147 cc/rev (3.0\" Gear Width)",
    shaftType: "Spline / SAE D / Key", shaftDiameter: "Various (SAE)", mountingType: "SAE 4-bolt D",
    portSize: "SAE Ported / 4-Port", displacement: "147.00 cc/rev", pressureRating: "200 BAR / 3000 PSI",
    maxSpeed: "2400 RPM", weight: "26.9 kg",
    notes: "Gear housing width 3.00\". US flow: 38.84 GPM @ 1000 RPM.",
  },
];

function makeComponents(modelId: string, seriesNum: string): Component[] {
  const s = seriesNum;
  return [
    { id: `${modelId}-c1`, pumpModelId: modelId, category: "Gear Sets", name: "Solid Shaft Gear Set", partNumber: `A-${s}`, description: "Complete solid shaft gear set for pump. Substitute gear width code for full part number.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c2`, pumpModelId: modelId, category: "Gear Sets", name: "Loose Gear Set", partNumber: `BVK-${s}`, description: "Loose gear set — substitute gear width code for full part number.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c3`, pumpModelId: modelId, category: "Gear Housings", name: "Pump Gear Housing", partNumber: `CRK-${s}`, description: "Cast gear housing for pump configuration.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c4`, pumpModelId: modelId, category: "Gear Housings", name: "Motor Gear Housing", partNumber: `CLK-${s}`, description: "Cast gear housing for motor configuration.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c5`, pumpModelId: modelId, category: "Shaft End Covers", name: "Shaft End Cover — 2 Bolt SAE B", partNumber: `DWK-${s}`, description: "2-bolt SAE B shaft end cover.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c6`, pumpModelId: modelId, category: "Port End Covers", name: "Port End Cover — Ported", partNumber: `EUK-${s}`, description: "Ported port end cover.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c7`, pumpModelId: modelId, category: "Port End Covers", name: "Port End Cover — 4-Port", partNumber: `EUK-${s}-4`, description: "4-port end cover configuration.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c8`, pumpModelId: modelId, category: "Bearing Carriers", name: "Bearing Carrier — 1 Outlet", partNumber: `FYK-${s}-1`, description: "1-outlet bearing carrier.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c9`, pumpModelId: modelId, category: "Thrust Plates", name: "Thrust Plate (Pump)", partNumber: `GCI-${s}`, description: "Pump thrust plate.", imageUrl: undefined, quantity: 2 },
    { id: `${modelId}-c10`, pumpModelId: modelId, category: "Thrust Plate Seals", name: "Pump Channel Seal H1", partNumber: `HCI-${s}-CS`, description: "Pump channel seal (H1).", imageUrl: undefined, quantity: 2 },
    { id: `${modelId}-c11`, pumpModelId: modelId, category: "Thrust Plate Seals", name: "Pump Channel Seal Backup H2", partNumber: `HCI-${s}-CSBU`, description: "Pump channel seal backup (H2).", imageUrl: undefined, quantity: 2 },
    { id: `${modelId}-c12`, pumpModelId: modelId, category: "Thrust Plate Seals", name: "Motor Body Seal Backup H3", partNumber: `HM-${s}-MSBU`, description: "Motor body seal backup.", imageUrl: undefined, quantity: 2 },
    { id: `${modelId}-c13`, pumpModelId: modelId, category: "Thrust Plate Seals", name: "Motor End Seal H4", partNumber: `HM-${s}-MES`, description: "Motor end seal (H4).", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c14`, pumpModelId: modelId, category: "Thrust Plate Seals", name: "Motor Side Seal H5", partNumber: `HM-${s}-MSS`, description: "Motor side seal (H5).", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c15`, pumpModelId: modelId, category: "Connecting Shafts", name: "Connecting Shaft (Standard)", partNumber: `IZK-${s}`, description: "Standard connecting shaft for tandem / step-down configurations.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c16`, pumpModelId: modelId, category: "Loose Shafts", name: "Loose Shaft — 1 1/8\" Key", partNumber: `JGD-${s}`, description: "1 1/8\" key loose shaft.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c17`, pumpModelId: modelId, category: "Bearings / Bushes", name: "Bushing K2", partNumber: `KBUSH-${s}`, description: "Bushing set (K2) — bronze bushing type.", imageUrl: undefined, quantity: 4 },
    { id: `${modelId}-c18`, pumpModelId: modelId, category: "Bearings / Bushes", name: "Shaft Ball Bearing K1", partNumber: `KX-${s}-40`, description: "Shaft ball bearing (K1).", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c19`, pumpModelId: modelId, category: "Seals", name: "Body Seals", partNumber: `LUB-${s}-239`, description: "Complete body seal set — O-rings and gaskets.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c20`, pumpModelId: modelId, category: "Seals", name: "Pump Seal Standard", partNumber: `LX-${s}`, description: "Pump shaft seal — standard.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c21`, pumpModelId: modelId, category: "Seals", name: "Pump Seal Telltale", partNumber: `LPA-${s}-TT`, description: "Pump seal — telltale type.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c22`, pumpModelId: modelId, category: "Retainers", name: "Seal Retainer Motor", partNumber: `MFR-${s}`, description: "Motor seal retainer.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c23`, pumpModelId: modelId, category: "Dowels", name: "Dowel — Standard", partNumber: `NDOWEL-${s}`, description: "Standard locating dowel pins.", imageUrl: undefined, quantity: 4 },
    { id: `${modelId}-c24`, pumpModelId: modelId, category: "Spacers", name: "Seal Spacer", partNumber: `QAE-${s}`, description: "Seal spacer.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c25`, pumpModelId: modelId, category: "Spacers", name: "Bearing Spacer", partNumber: `QVB-${s}`, description: "Bearing spacer (conti).", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c26`, pumpModelId: modelId, category: "Keys", name: "Shaft Key 1\" ", partNumber: `RX-16`, description: "1\" shaft key.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c27`, pumpModelId: modelId, category: "Snap Rings / Circlips", name: "Shaft Circlip", partNumber: `SX-${s}-100`, description: "Snap ring / circlip for shaft.", imageUrl: undefined, quantity: 2 },
    { id: `${modelId}-c28`, pumpModelId: modelId, category: "Fasteners", name: "Bolts", partNumber: `VBOLT-1/2\"x?`, description: "Bolts — substitute bolt length for full part number.", imageUrl: undefined, quantity: 8 },
    { id: `${modelId}-c29`, pumpModelId: modelId, category: "Fasteners", name: "Nuts", partNumber: `VNUT-1/2\"`, description: "Nuts.", imageUrl: undefined, quantity: 8 },
    { id: `${modelId}-c30`, pumpModelId: modelId, category: "Small Parts", name: "Plug Drain", partNumber: `WX-131-11`, description: "Drain plug.", imageUrl: undefined, quantity: 1 },
    { id: `${modelId}-c31`, pumpModelId: modelId, category: "Small Parts", name: "Check Valve", partNumber: `WM-131-1391`, description: "Check valve.", imageUrl: undefined, quantity: 1 },
  ];
}

const SEED_COMPONENTS: Component[] = [
  ...SEED_MODELS.filter(m => m.seriesId === "series-215").flatMap(m => makeComponents(m.id, "215")),
  ...SEED_MODELS.filter(m => m.seriesId === "series-230").flatMap(m => makeComponents(m.id, "230")),
  ...SEED_MODELS.filter(m => m.seriesId === "series-250").flatMap(m => makeComponents(m.id, "250")),
  ...SEED_MODELS.filter(m => m.seriesId === "series-265").flatMap(m => makeComponents(m.id, "265")),
];

const STORAGE_KEYS = {
  manufacturers: "@hydraiq:manufacturers",
  pumpSeries: "@hydraiq:pumpSeries",
  pumpModels: "@hydraiq:pumpModels",
  components: "@hydraiq:components",
  seeded: "@hydraiq:seeded",
};

const DataContext = createContext<DataContextType | null>(null);

export function DataProvider({ children }: { children: React.ReactNode }) {
  const [manufacturers, setManufacturers] = useState<Manufacturer[]>([]);
  const [pumpSeries, setPumpSeries] = useState<PumpSeries[]>([]);
  const [pumpModels, setPumpModels] = useState<PumpModel[]>([]);
  const [components, setComponents] = useState<Component[]>([]);
  const [recentlyViewed, setRecentlyViewed] = useState<PumpModel[]>([]);

  useEffect(() => {
    async function load() {
      try {
        const seeded = await AsyncStorage.getItem(STORAGE_KEYS.seeded);
        if (!seeded) {
          await AsyncStorage.setItem(STORAGE_KEYS.manufacturers, JSON.stringify(SEED_MANUFACTURERS));
          await AsyncStorage.setItem(STORAGE_KEYS.pumpSeries, JSON.stringify(SEED_SERIES));
          await AsyncStorage.setItem(STORAGE_KEYS.pumpModels, JSON.stringify(SEED_MODELS));
          await AsyncStorage.setItem(STORAGE_KEYS.components, JSON.stringify(SEED_COMPONENTS));
          await AsyncStorage.setItem(STORAGE_KEYS.seeded, "true");
          setManufacturers(SEED_MANUFACTURERS);
          setPumpSeries(SEED_SERIES);
          setPumpModels(SEED_MODELS);
          setComponents(SEED_COMPONENTS);
        } else {
          const [mRaw, sRaw, pRaw, cRaw] = await Promise.all([
            AsyncStorage.getItem(STORAGE_KEYS.manufacturers),
            AsyncStorage.getItem(STORAGE_KEYS.pumpSeries),
            AsyncStorage.getItem(STORAGE_KEYS.pumpModels),
            AsyncStorage.getItem(STORAGE_KEYS.components),
          ]);
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
    await AsyncStorage.setItem(key, JSON.stringify(data));
  }, []);

  const addManufacturer = useCallback((m: Omit<Manufacturer, "id">) => {
    const n = { ...m, id: genId() };
    setManufacturers(p => { const u = [...p, n]; persist(STORAGE_KEYS.manufacturers, u); return u; });
  }, [persist]);
  const updateManufacturer = useCallback((m: Manufacturer) => {
    setManufacturers(p => { const u = p.map(x => x.id === m.id ? m : x); persist(STORAGE_KEYS.manufacturers, u); return u; });
  }, [persist]);
  const deleteManufacturer = useCallback((id: string) => {
    setManufacturers(p => { const u = p.filter(x => x.id !== id); persist(STORAGE_KEYS.manufacturers, u); return u; });
  }, [persist]);

  const addPumpSeries = useCallback((s: Omit<PumpSeries, "id">) => {
    const n = { ...s, id: genId() };
    setPumpSeries(p => { const u = [...p, n]; persist(STORAGE_KEYS.pumpSeries, u); return u; });
  }, [persist]);
  const updatePumpSeries = useCallback((s: PumpSeries) => {
    setPumpSeries(p => { const u = p.map(x => x.id === s.id ? s : x); persist(STORAGE_KEYS.pumpSeries, u); return u; });
  }, [persist]);
  const deletePumpSeries = useCallback((id: string) => {
    setPumpSeries(p => { const u = p.filter(x => x.id !== id); persist(STORAGE_KEYS.pumpSeries, u); return u; });
  }, [persist]);

  const addPumpModel = useCallback((p: Omit<PumpModel, "id">) => {
    const n = { ...p, id: genId() };
    setPumpModels(prev => { const u = [...prev, n]; persist(STORAGE_KEYS.pumpModels, u); return u; });
  }, [persist]);
  const updatePumpModel = useCallback((p: PumpModel) => {
    setPumpModels(prev => { const u = prev.map(x => x.id === p.id ? p : x); persist(STORAGE_KEYS.pumpModels, u); return u; });
  }, [persist]);
  const deletePumpModel = useCallback((id: string) => {
    setPumpModels(prev => { const u = prev.filter(x => x.id !== id); persist(STORAGE_KEYS.pumpModels, u); return u; });
  }, [persist]);

  const addComponent = useCallback((c: Omit<Component, "id">) => {
    const n = { ...c, id: genId() };
    setComponents(prev => { const u = [...prev, n]; persist(STORAGE_KEYS.components, u); return u; });
  }, [persist]);
  const updateComponent = useCallback((c: Component) => {
    setComponents(prev => { const u = prev.map(x => x.id === c.id ? c : x); persist(STORAGE_KEYS.components, u); return u; });
  }, [persist]);
  const deleteComponent = useCallback((id: string) => {
    setComponents(prev => { const u = prev.filter(x => x.id !== id); persist(STORAGE_KEYS.components, u); return u; });
  }, [persist]);

  const markViewed = useCallback((pumpId: string) => {
    setPumpModels(prev => {
      const u = prev.map(x => x.id === pumpId ? { ...x, viewedAt: Date.now() } : x);
      persist(STORAGE_KEYS.pumpModels, u);
      return u;
    });
  }, [persist]);

  const getSeriesForManufacturer = useCallback((manufacturerId: string) =>
    pumpSeries.filter(s => s.manufacturerId === manufacturerId), [pumpSeries]);
  const getModelsForSeries = useCallback((seriesId: string) =>
    pumpModels.filter(m => m.seriesId === seriesId), [pumpModels]);
  const getComponentsForModel = useCallback((modelId: string) =>
    components.filter(c => c.pumpModelId === modelId), [components]);
  const getModel = useCallback((id: string) => pumpModels.find(m => m.id === id), [pumpModels]);
  const getSeries = useCallback((id: string) => pumpSeries.find(s => s.id === id), [pumpSeries]);
  const getManufacturer = useCallback((id: string) => manufacturers.find(m => m.id === id), [manufacturers]);
  const getComponent = useCallback((id: string) => components.find(c => c.id === id), [components]);

  const searchPumps = useCallback((query: string, filters: SearchFilters): PumpModel[] => {
    const q = query.toLowerCase().trim();
    return pumpModels.filter(model => {
      const series = pumpSeries.find(s => s.id === model.seriesId);
      const mfr = manufacturers.find(m => m.id === series?.manufacturerId);
      if (filters.manufacturerId && series?.manufacturerId !== filters.manufacturerId) return false;
      if (filters.seriesId && model.seriesId !== filters.seriesId) return false;
      if (filters.shaftType && !model.shaftType.toLowerCase().includes(filters.shaftType.toLowerCase())) return false;
      if (filters.displacement && !model.displacement.toLowerCase().includes(filters.displacement.toLowerCase())) return false;
      if (filters.portSize && !model.portSize.toLowerCase().includes(filters.portSize.toLowerCase())) return false;
      if (!q) return true;
      return (
        model.modelNumber.toLowerCase().includes(q) ||
        model.description.toLowerCase().includes(q) ||
        model.displacement.toLowerCase().includes(q) ||
        model.shaftType.toLowerCase().includes(q) ||
        model.portSize.toLowerCase().includes(q) ||
        model.pressureRating.toLowerCase().includes(q) ||
        series?.seriesName.toLowerCase().includes(q) ||
        mfr?.name.toLowerCase().includes(q) ||
        false
      );
    });
  }, [pumpModels, pumpSeries, manufacturers]);

  useEffect(() => {
    const viewed = [...pumpModels]
      .filter(m => m.viewedAt)
      .sort((a, b) => (b.viewedAt ?? 0) - (a.viewedAt ?? 0))
      .slice(0, 10);
    setRecentlyViewed(viewed);
  }, [pumpModels]);

  return (
    <DataContext.Provider value={{
      manufacturers, pumpSeries, pumpModels, components, recentlyViewed,
      addManufacturer, updateManufacturer, deleteManufacturer,
      addPumpSeries, updatePumpSeries, deletePumpSeries,
      addPumpModel, updatePumpModel, deletePumpModel,
      addComponent, updateComponent, deleteComponent,
      markViewed, getSeriesForManufacturer, getModelsForSeries,
      getComponentsForModel, getModel, getSeries, getManufacturer, getComponent, searchPumps,
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
