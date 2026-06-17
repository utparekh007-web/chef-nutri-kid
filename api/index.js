import { GoogleGenAI } from "@google/genai";

// Tell Vercel to run this as an Edge Function (no timeout!)
export const config = {
  runtime: 'edge',
};

function getAI() {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new Error("GEMINI_API_KEY not configured.");
  return new GoogleGenAI({ apiKey: key });
}

function cors(headers = {}) {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
    ...headers,
  };
}

async function parseBody(req) {
  try { return await req.json(); } catch { return {}; }
}

async function gemini(ai, prompt, temp = 0.7, maxTokens = 2000) {
  const r = await ai.models.generateContent({
    model: "gemini-2.0-flash-lite",
    contents: prompt,
    config: { temperature: temp, maxOutputTokens: maxTokens }
  });
  let t = (r.text || "").trim()
    .replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
  const s = t.indexOf("{"); const e = t.lastIndexOf("}");
  if (s !== -1 && e !== -1) t = t.substring(s, e + 1);
  return JSON.parse(t);
}

export default async function handler(req) {
  const url = new URL(req.url);
  const path = url.pathname;

  // OPTIONS
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: cors() });
  }

  // Health check
  if (req.method === "GET") {
    return new Response(JSON.stringify({ status: "ok", message: "Chef Nutri-Kid API 🍎" }), { headers: cors() });
  }

  try {
    const ai = getAI();
    const body = await parseBody(req);

    // ── RECIPE ──
    if (path.endsWith("/recipe")) {
      const { ingredients, language = "English", diet = "Any / No Restriction", childProfile, childAge, childAllergies } = body;
      if (!ingredients) return new Response(JSON.stringify({ error: "Ingredients required." }), { status: 400, headers: cors() });

      let ctx = "";
      if (childProfile) {
        const age = childProfile.ageDisplay || `${childProfile.age} yrs`;
        ctx = `Child: ${childProfile.name}, Age: ${age}, Diet: ${childProfile.foodCategories}, Allergies: ${(childProfile.allergies||[]).join(",")||"None"}. EXCLUDE allergens. Portions for ${age}.`;
      } else if (childAge) {
        ctx = `Child age: ${childAge}. ${childAllergies?"Allergies:"+childAllergies+". EXCLUDE.":""} Age-appropriate portions.`;
      }

      const lang = language === "Gujarati" ? "Respond in Gujarati (ગુજરાતી)." : language === "Hindi" ? "Respond in Hindi." : `Respond in ${language}.`;

      const prompt = `Ingredients: "${ingredients}". Diet: "${diet}". ${ctx} ${lang}
Create 2 kid-friendly healthy recipes with EXACT quantities for every ingredient.
Return ONLY compact JSON (no spaces):
{"recipes":[{"mealName":"Name","dietIndicator":"${diet}","plateBreakdown":{"fruitsVeggies":"50%-amounts","wholeGrains":"25%-amounts","strongProtein":"25%-amounts","fatsHydrates":"fats"},"instructions":["Step with qty","Step 2","Step 3"],"juniorDuties":["Kid task 1","Kid task 2"],"powerMealFact":"Fact with emoji","moveChallenge":"Activity","tutorialQuery":"youtube search","nutritionalFocus":"Benefit","allergyCheck":"Safety","nutrition":{"calories":250,"protein":"12g","carbs":"30g","fat":"8g","fiber":"5g","keyVitamins":"Vit A,C"}}]}`;

      const data = await gemini(ai, prompt, 0.7, 2000);
      return new Response(JSON.stringify(data), { headers: cors() });
    }

    // ── HEALTH REPORT ──
    if (path.endsWith("/health-report")) {
      const { childProfile, language = "English" } = body;
      if (!childProfile) return new Response(JSON.stringify({ error: "Profile required." }), { status: 400, headers: cors() });

      const age = childProfile.ageDisplay || `${childProfile.age} yrs`;
      const lang = language === "Gujarati" ? "Respond in Gujarati." : `Respond in ${language}.`;

      const prompt = `Pediatric health report. Name:${childProfile.name}, Age:${age}, Weight:${childProfile.weight}kg, Diet:${childProfile.foodCategories}, Allergies:${(childProfile.allergies||[]).join(",")||"None"}. ${lang}
Return ONLY compact JSON:
{"reportTitle":"Report","ageGroup":"group","weightStatus":"status","bmiNote":"note","dailyCalories":1200,"dailyProtein":"25g","dailyCalcium":"500mg","dailyIron":"10mg","keyRecommendations":["r1","r2","r3"],"foodsToEat":["f1","f2","f3","f4","f5"],"foodsToLimit":["l1","l2","l3"],"sampleDayPlan":{"breakfast":"qty","morningSnack":"snack","lunch":"qty","eveningSnack":"snack","dinner":"qty"},"growthTip":"tip","disclaimer":"Consult pediatrician."}`;

      const data = await gemini(ai, prompt, 0.6, 1500);
      return new Response(JSON.stringify(data), { headers: cors() });
    }

    // ── WEEKLY PLAN ──
    if (path.endsWith("/weekly-plan")) {
      const { ageGroup, language = "English", diet = "Any / No Restriction", childProfile } = body;

      const ctx = childProfile
        ? `Child:${childProfile.name}, Age:${childProfile.ageDisplay||childProfile.age+"yrs"}, Diet:${childProfile.foodCategories}, Allergies:${(childProfile.allergies||[]).join(",")||"None"}. EXCLUDE allergens.`
        : `Age:${ageGroup}. Diet:${diet}.`;
      const lang = language === "Gujarati" ? "Respond in Gujarati." : `Respond in ${language}.`;

      const prompt = `7-day child meal plan. ${ctx} ${lang} Exact quantities. Harvard Kids Plate.
Return ONLY compact JSON:
{"meals":[{"day":"Monday","breakfast":"qty","morningSnack":"snack","lunch":"qty","eveningSnack":"snack","dinner":"qty","powerFact":"fact"}],"groceryList":["item1","item2"],"weeklyTip":"tip"}`;

      const data = await gemini(ai, prompt, 0.7, 2500);
      return new Response(JSON.stringify(data), { headers: cors() });
    }

    // ── SCAN INGREDIENTS ──
    if (path.endsWith("/scan-ingredients")) {
      const { imageBase64 } = body;
      if (!imageBase64) return new Response(JSON.stringify({ ingredients: [] }), { headers: cors() });

      const r = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents: [{ parts: [
          { text: 'List food ingredients visible. Return ONLY JSON: {"ingredients":["item1","item2"]}' },
          { inlineData: { mimeType: "image/jpeg", data: imageBase64 } }
        ]}]
      });
      let t = (r.text||"").trim().replace(/```json\n?/g,"").replace(/```\n?/g,"").trim();
      const s=t.indexOf("{"),e=t.lastIndexOf("}");
      if(s!==-1&&e!==-1)t=t.substring(s,e+1);
      return new Response(t, { headers: cors() });
    }

    // ── CHAT ──
    if (path.endsWith("/chat")) {
      const { message, history = [] } = body;
      if (!message) return new Response(JSON.stringify({ reply: "Please send a message!" }), { headers: cors() });

      const sys = `You are NutriBot 🍎 for Chef Nutri-Kid. Plans: Starter ₹299/week(1 child), Family ₹999/month(3 children), Premium ₹2499/month(unlimited). No video calls—PDF plans only. YouTube recipes in all plans. UPI:7990878248@ybl. Be warm, use emojis, keep responses short.`;
      const contents = history.slice(-4).map(h => ({ role: h.role==="user"?"user":"model", parts:[{text:h.text}] }));
      contents.push({ role:"user", parts:[{text:message}] });

      const r = await ai.models.generateContent({
        model: "gemini-2.0-flash-lite",
        contents,
        config: { systemInstruction: sys, temperature: 0.7, maxOutputTokens: 200 }
      });
      return new Response(JSON.stringify({ reply: (r.text||"").trim()||"Try again! 😊" }), { headers: cors() });
    }

    return new Response(JSON.stringify({ error: "Route not found: " + path }), { status: 404, headers: cors() });

  } catch (err) {
    console.error("API Error:", err.message);
    return new Response(
      JSON.stringify({ error: err.message?.includes("GEMINI_API_KEY") ? "GEMINI_API_KEY not set in Vercel Environment Variables!" : (err.message || "Server error") }),
      { status: 500, headers: cors() }
    );
  }
}
