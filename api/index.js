import express from "express";
import serverless from "serverless-http";
import { GoogleGenAI } from "@google/genai";

const app = express();
app.use(express.json({ limit: "50mb" }));

// CORS
app.use((req, res, next) => {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  if (req.method === "OPTIONS") { res.status(200).end(); return; }
  next();
});

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured. Please add it in Vercel Environment Variables.");
  return new GoogleGenAI({ apiKey: key });
}

// Non-streaming helper for small payloads
async function generate(ai, prompt, temp = 0.8) {
  for (let i = 0; i < 3; i++) {
    try {
      const r = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: prompt,
        config: { temperature: temp }
      });
      let t = (r.text || "").trim()
        .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
      const s = t.indexOf("{"); const e = t.lastIndexOf("}");
      if (s !== -1 && e !== -1) t = t.substring(s, e + 1);
      return JSON.parse(t);
    } catch (err) {
      if (i === 2) throw err;
      await new Promise(r => setTimeout(r, 1000 * (i + 1)));
    }
  }
}

// ── HEALTH CHECK ──
app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Chef Nutri-Kid API running! 🍎" });
});

// ── RECIPE — STREAMING via SSE ──
app.post("/api/recipe", async (req, res) => {
  // Set SSE headers for streaming
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const sendEvent = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`);
  };

  try {
    const {
      ingredients, language = "English",
      diet = "Any / No Restriction",
      childProfile, childAge, childAllergies
    } = req.body;

    if (!ingredients) {
      sendEvent({ error: "Ingredients required." });
      res.end(); return;
    }

    const ai = getAI();

    let profileCtx = "";
    if (childProfile) {
      const age = childProfile.ageDisplay || `${childProfile.age} years`;
      profileCtx = `Child: ${childProfile.name}, Age: ${age}, Weight: ${childProfile.weight}kg, Diet: ${childProfile.foodCategories}, Allergies: ${(childProfile.allergies || []).join(", ") || "None"}. STRICTLY EXCLUDE allergens. Make portions for age ${age}.`;
    } else if (childAge) {
      profileCtx = `Child age: ${childAge}. ${childAllergies ? "Allergies: " + childAllergies + ". STRICTLY EXCLUDE." : ""} Make all portions age-appropriate.`;
    }

    const langNote = language === "Gujarati"
      ? "Respond entirely in Gujarati language (ગુજરાતી)."
      : language === "Hindi"
      ? "Respond entirely in Hindi."
      : `Respond in ${language}.`;

    const prompt = `Using ingredients: "${ingredients}". Diet: "${diet}". ${profileCtx}
Create 2 distinct healthy kid-approved recipes. ${langNote}
For EVERY ingredient include EXACT quantity (e.g. "1 cup broccoli", "100g chicken", "2 tbsp olive oil").
Return ONLY valid JSON (no markdown, no code blocks, just raw JSON):
{"recipes":[{"mealName":"Fun Recipe Name 🍎","dietIndicator":"${diet}","plateBreakdown":{"fruitsVeggies":"50% - with exact amounts","wholeGrains":"25% - with exact amounts","strongProtein":"25% - with exact amounts","fatsHydrates":"healthy fats used"},"instructions":["Step 1 with exact quantities","Step 2","Step 3"],"juniorDuties":["Fun task for child 1","Fun task for child 2"],"powerMealFact":"Fun nutrition fact with emoji","moveChallenge":"Fun physical activity","tutorialQuery":"youtube search query for recipe","nutritionalFocus":"Key nutrition benefit","allergyCheck":"Safety note","nutrition":{"calories":250,"protein":"12g","carbs":"30g","fat":"8g","fiber":"5g","keyVitamins":"Vitamin A, C, Iron"}}]}`;

    // Stream using generateContentStream
    let fullText = "";
    const stream = await ai.models.generateContentStream({
      model: "gemini-2.0-flash-lite",
      contents: prompt,
      config: { temperature: 0.8 }
    });

    for await (const chunk of stream) {
      const chunkText = chunk.text || "";
      fullText += chunkText;
      // Send progress to frontend
      sendEvent({ chunk: chunkText, done: false });
    }

    // Parse complete JSON and send final result
    let cleaned = fullText.trim()
      .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const s = cleaned.indexOf("{"); const e = cleaned.lastIndexOf("}");
    if (s !== -1 && e !== -1) cleaned = cleaned.substring(s, e + 1);

    const data = JSON.parse(cleaned);
    sendEvent({ result: data, done: true });

  } catch (err) {
    console.error("Recipe stream error:", err.message);
    sendEvent({ error: err.message || "Recipe generation failed.", done: true });
  }

  res.end();
});

// ── HEALTH REPORT ──
app.post("/api/health-report", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const { childProfile, language = "English" } = req.body;
    if (!childProfile) { send({ error: "Profile required.", done: true }); res.end(); return; }

    const ai = getAI();
    const age = childProfile.ageDisplay || `${childProfile.age} years`;
    const langNote = language === "Gujarati" ? "Respond entirely in Gujarati." : `Respond in ${language}.`;

    const prompt = `Generate a pediatric health report for: Name: ${childProfile.name}, Age: ${age}, Weight: ${childProfile.weight}kg, Diet: ${childProfile.foodCategories}, Allergies: ${(childProfile.allergies || []).join(", ") || "None"}. ${langNote}
Return ONLY valid JSON: {"reportTitle":"Health Report","ageGroup":"group","weightStatus":"status","bmiNote":"note","dailyCalories":1200,"dailyProtein":"25g","dailyCalcium":"500mg","dailyIron":"10mg","keyRecommendations":["r1","r2","r3"],"foodsToEat":["f1","f2","f3","f4","f5"],"foodsToLimit":["l1","l2","l3"],"sampleDayPlan":{"breakfast":"with qty","morningSnack":"snack","lunch":"with qty","eveningSnack":"snack","dinner":"with qty"},"growthTip":"tip","disclaimer":"Consult pediatrician."}`;

    let full = "";
    const stream = await ai.models.generateContentStream({ model: "gemini-2.0-flash-lite", contents: prompt, config: { temperature: 0.7 } });
    for await (const chunk of stream) { full += chunk.text || ""; send({ chunk: chunk.text || "", done: false }); }

    let c = full.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const s = c.indexOf("{"); const e = c.lastIndexOf("}");
    if (s !== -1 && e !== -1) c = c.substring(s, e + 1);
    send({ result: JSON.parse(c), done: true });
  } catch (err) {
    send({ error: err.message, done: true });
  }
  res.end();
});

// ── WEEKLY PLAN ──
app.post("/api/weekly-plan", async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.flushHeaders();

  const send = (data) => res.write(`data: ${JSON.stringify(data)}\n\n`);

  try {
    const { ageGroup, language = "English", diet = "Any / No Restriction", childProfile } = req.body;
    const ai = getAI();
    const ctx = childProfile
      ? `Child: ${childProfile.name}, Age: ${childProfile.ageDisplay || childProfile.age + " yrs"}, Diet: ${childProfile.foodCategories}, Allergies: ${(childProfile.allergies || []).join(", ") || "None"}. STRICTLY EXCLUDE allergens.`
      : `Age: ${ageGroup}. Diet: ${diet}.`;
    const lang = language === "Gujarati" ? "Respond in Gujarati." : `Respond in ${language}.`;

    const prompt = `7-day healthy meal plan for a child. ${ctx} ${lang} Include exact quantities. Harvard Kids Plate.
Return ONLY JSON: {"meals":[{"day":"Monday","breakfast":"with qty","morningSnack":"snack","lunch":"with qty","eveningSnack":"snack","dinner":"with qty","powerFact":"fact"}],"groceryList":["item1"],"weeklyTip":"tip"}`;

    let full = "";
    const stream = await ai.models.generateContentStream({ model: "gemini-2.0-flash-lite", contents: prompt, config: { temperature: 0.8 } });
    for await (const chunk of stream) { full += chunk.text || ""; send({ chunk: chunk.text || "", done: false }); }

    let c = full.trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const s = c.indexOf("{"); const e = c.lastIndexOf("}");
    if (s !== -1 && e !== -1) c = c.substring(s, e + 1);
    send({ result: JSON.parse(c), done: true });
  } catch (err) {
    send({ error: err.message, done: true });
  }
  res.end();
});

// ── SCAN INGREDIENTS ──
app.post("/api/scan-ingredients", async (req, res) => {
  try {
    const { imageBase64 } = req.body;
    if (!imageBase64) { res.status(400).json({ ingredients: [] }); return; }
    const ai = getAI();
    const r = await ai.models.generateContent({
      model: "gemini-2.0-flash-lite",
      contents: [{ parts: [
        { text: 'List all food ingredients visible. Return ONLY JSON: {"ingredients":["item1","item2"]}' },
        { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
      ]}]
    });
    let t = (r.text || "").trim().replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
    const s = t.indexOf("{"); const e = t.lastIndexOf("}");
    if (s !== -1 && e !== -1) t = t.substring(s, e + 1);
    res.status(200).json(JSON.parse(t));
  } catch (err) {
    res.status(500).json({ ingredients: [] });
  }
});

// ── CHAT ──
app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) { res.status(400).json({ reply: "Please send a message!" }); return; }
    const ai = getAI();
    const sys = `You are NutriBot 🍎 for Chef Nutri-Kid. Plans: Starter ₹299/week (1 child), Family ₹999/month (3 children), Premium ₹2499/month (unlimited). No video calls — PDF plans and charts only. YouTube recipes in all plans. UPI: 7990878248@ybl. Be warm, use emojis, keep short.`;
    const contents = history.slice(-6).map(h => ({ role: h.role === "user" ? "user" : "model", parts: [{ text: h.text }] }));
    contents.push({ role: "user", parts: [{ text: message }] });
    const r = await ai.models.generateContent({ model: "gemini-2.0-flash-lite", contents, config: { systemInstruction: sys, temperature: 0.7, maxOutputTokens: 300 } });
    res.status(200).json({ reply: (r.text || "").trim() || "Please try again! 😊" });
  } catch (err) {
    res.status(500).json({ reply: "NutriBot is resting 😴 WhatsApp: 7990878248" });
  }
});

export const handler = serverless(app);
export default handler;
