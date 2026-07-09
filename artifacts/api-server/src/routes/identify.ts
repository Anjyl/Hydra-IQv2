import { GoogleGenerativeAI } from "@google/generative-ai";
import { Router, type IRouter } from "express";

const router: IRouter = Router();

const SYSTEM_PROMPT = `You are an expert hydraulic pump identification assistant specialising in GPM (Gear Pump Manufacturer) pumps from the GPM Complete Catalogue.

When given a photo of a hydraulic pump, analyse visible physical features and return a JSON object with this exact shape:

{
  "identified": true | false,
  "confidence": "high" | "medium" | "low",
  "series": ["131"] | ["120", "131"] | [],   // GPM series numbers that match
  "rangeType": "bearing" | "bushing" | "unknown",
  "mountingPattern": "SAE B 2-bolt" | "SAE B 4-bolt" | "SAE C 4-bolt" | "SAE D 4-bolt" | "unknown",
  "summary": "one sentence description of what you see",
  "observations": ["list", "of", "key", "visible", "features"],
  "gpmParts": [
    { "role": "Shaft Ball Bearing", "gpmNo": "KX-131-40" },
    ...
  ],
  "caveat": "any uncertainty or why the image was unclear (empty string if confident)"
}

GPM series identification guide:
- BEARING RANGE (has visible ball/roller bearing at shaft end):
  - Series 120: SAE B 2-bolt, 40 mm shaft bearing OD, no add-a-pump rear port
  - Series 125: SAE C 4-bolt, larger frame, different bearing
  - Series 131: SAE B 2/4-bolt, 40 mm shaft bearing OD, has add-a-pump rear through-drive provision
  - Series 151: SAE C 4-bolt, 58 mm shaft bearing OD
  - Series 176: SAE D 4-bolt, 59 mm shaft bearing OD, largest bearing range
- BUSHING RANGE (bronze bushings, no shaft ball bearing):
  - Series 215: SAE B 2-bolt, smallest
  - Series 230: SAE B/C 2-bolt, medium
  - Series 250: SAE C 4-bolt, large
  - Series 265: SAE D 4-bolt, largest

GPM Unique No. reference (use these exact codes in gpmParts):
- KX-131-40: shaft ball bearing, Series 120 & 131
- KX-151-58: shaft ball bearing, Series 151
- KX-176-59: shaft ball bearing, Series 176
- KY-131: needle rollers, Series 120 & 131
- KS-151: needle rollers, Series 151 & 125
- KR-176: needle rollers, Series 176
- LUB-120-239: body seal kit, Series 120
- LUB-131-242: body seal kit, Series 131
- LUB-151-244: body seal kit, Series 151
- LUB-176-252: body seal kit, Series 176
- ADD-131-??: gear set, Series 120 & 131 (replace ?? with dash code)
- ATD-151-??: gear set, Series 151
- AAL-176-??: gear set, Series 176
- CRD-120-??: housing, Series 120
- CRA-131-??: housing, Series 131
- CMA-151-??: housing, Series 151
- CSA-176-??: housing, Series 176

If the image is not of a hydraulic pump or is too unclear to analyse, set "identified": false and explain in "caveat".
Only include gpmParts entries you are reasonably confident about.
Return ONLY the raw JSON object — no markdown, no code fences, no extra text.`;

router.post("/api/identify", async (req, res) => {
  const { imageBase64, mimeType } = req.body as {
    imageBase64?: string;
    mimeType?: string;
  };

  if (!imageBase64 || !mimeType) {
    res.status(400).json({ error: "imageBase64 and mimeType are required" });
    return;
  }

  const apiKey = process.env.GOOGLE_API_KEY;
  if (!apiKey) {
    res.status(500).json({ error: "GOOGLE_API_KEY not configured" });
    return;
  }

  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

    const result = await model.generateContent([
      { text: SYSTEM_PROMPT },
      {
        inlineData: {
          mimeType: mimeType as string,
          data: imageBase64,
        },
      },
      { text: "Identify this hydraulic pump. Return only the JSON object." },
    ]);

    const raw = result.response.text().trim();

    // Strip any accidental markdown fences
    const cleaned = raw.replace(/^```[a-z]*\n?/i, "").replace(/```$/i, "").trim();

    let parsed: unknown;
    try {
      parsed = JSON.parse(cleaned);
    } catch {
      req.log.warn({ raw }, "Gemini returned non-JSON response");
      res.status(422).json({ error: "Model returned unparseable response", raw });
      return;
    }

    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Gemini identify error");
    res.status(500).json({ error: "AI identification failed" });
  }
});

export default router;
