import express from "express";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

export const apiRouter = express.Router();

let aiInstance: GoogleGenAI | null = null;

function getGeminiClient(): GoogleGenAI {
  if (!aiInstance) {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      throw new Error("GEMINI_API_KEY is missing. Please add it via the Secrets panel or Environment Variables in your hosting provider.");
    }
    aiInstance = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build',
        },
      },
    });
  }
  return aiInstance;
}

// Helper to retry on 503/429 specifically
async function generateWithRetry(ai: GoogleGenAI, params: any, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    try {
      return await ai.models.generateContent(params);
    } catch (error: any) {
      const status = error?.status || error?.response?.status || 500;
      const isRetryable = status === 503 || status === 429 || error.message?.includes('503') || error.message?.includes('429') || error.message?.includes('high demand');
      if (!isRetryable || i === maxRetries - 1) {
        throw error;
      }
      const delay = 1000 * Math.pow(2, i);
      console.warn(`Gemini API busy (attempt ${i + 1}/${maxRetries}). Retrying in ${delay}ms...`);
      await new Promise(res => setTimeout(res, delay));
    }
  }
}

// Chef Nutri-Kid Master Prompt System Instructions
const ChefNutriKidPrompt = `You are NutriPeds AI (also known as Chef Nutri-Kid), an expert Pediatric Health and Nutritional AI Architect. Your role is to act as a highly knowledgeable, empathetic, and precision-driven nutritional assistant for parents. You specialize in tracking pediatric developmental metrics, evaluating weight-for-age data, and curating highly customized, allergy-safe dietary plans for children.

Your tone is highly enthusiastic, warm, encouraging, empathetic, and professional (a real "kitchen companion" for families), decorated with fun, kid-friendly emojis! You must respond in the user's requested language.

Operational Constraints and Safety Protocols:
- Zero-Tolerance Allergy Protocol: You must strictly cross-reference every suggested dish or ingredient against the child’s logged allergy profile. You will never recommend a recipe containing a known allergen or a common cross-contaminant.
- Mandatory Medical Disclaimer: All health reports and significant dietary interventions must be accompanied by a concise disclaimer stating: "NutriPeds AI provides nutritional guidance based on standard pediatric metrics, but is not a substitute for professional medical advice. Always consult your pediatrician before making significant dietary changes."
- Standardized Data Accuracy: All proactive weight-for-age analysis must be benchmarked against recognized pediatric growth standards (e.g., WHO or CDC growth charts).

Rules for your content generation:
1. Map every group of food to its corresponding Harvard Kid's Plate quadrant:
   - Vegetables & Fruits (Half-plate ratio, loaded with immunity shields and bright vision power 🥬🍎)
   - Whole Grains (Quarter-plate, the steady-energy engine charger 🌾🍞)
   - Healthy Protein (Quarter-plate, the muscle builder 🍗🫘)
   - Healthy Fats & Hydration (Engine smoothers & cold fresh water 💧🥑)
2. Include at least 2-3 interactive "Junior Assistant Chef Tasks" where kids can safely help out in the kitchen (e.g., washing, tearing, cold mixing).
3. Do not suggest deep frying or highly sugary additions. Focus on plant fats/oils (like olive oil, avocado oil, seed oils) over butter.
4. If the ingredient input is empty or says "empty fridge", kindly propose a delicious meal made of common pantry staples.
5. Calculate approximate nutritional information (Calories, Protein, Carbs, Fat, Fiber, Key Vitamins) for a standard kid's portion. Make it professional sounding.
6. When a child profile with allergies is provided, STRICTLY EXCLUDE ALLERGENS.
`;

// API endpoint for Recipe generation
apiRouter.post("/recipe", async (req, res) => {
  try {
    const { ingredients, language = "English", diet = "Any / No Restriction", childProfile, childAge, childAllergies } = req.body;
    if (!ingredients || typeof ingredients !== "string") {
      res.status(400).json({ error: "Ingredients must be provided as a string." });
      return;
    }

    const ai = getGeminiClient();

    let profileContext = "";
    if (childProfile) {
      const ageDisplay = childProfile.ageDisplay || `${childProfile.age} years`;
      profileContext = `The active child profile is for ${childProfile.name}, Age: ${ageDisplay}, Weight: ${childProfile.weight}kg. Their dietary category is: ${childProfile.foodCategories}. Known Allergies: ${childProfile.allergies && childProfile.allergies.length > 0 ? childProfile.allergies.join(", ") : "None documented"}.
      You MUST calculate weight-for-age percentile based on standard WHO/CDC charts, determine the current nutritional trajectory, and map this to specific macronutrient goals.
      STRICTLY EXCLUDE LOGGED ALLERGENS. Make quantities EXACTLY appropriate for a child aged ${ageDisplay}.`;
    } else if (childAge) {
      profileContext = `Child age: ${childAge}. ${childAllergies ? 'Allergies: ' + childAllergies + '. STRICTLY EXCLUDE these.' : ''} Make all quantities appropriate for this specific age.`;
    }

    // Language instruction
    const langInstruction = language === 'Gujarati'
      ? 'IMPORTANT: Respond entirely in Gujarati language (ગુજરાતી). Keep recipe names fun and kid-friendly in Gujarati.'
      : `Please generate the response in ${language}.`;

    const response = await generateWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: `Great chef! Let's cook using these ingredients: "${ingredients}". The dietary preference is "${diet}". ${profileContext} Transform them into a healthy, gorgeous, kid-approved masterpiece matching this diet. ${langInstruction} Ensure the response format fits the requested Harvard Kid's Plate structure perfectly. IMPORTANT: For every ingredient used, specify the EXACT quantity needed (e.g., "1 cup broccoli florets", "2 medium carrots", "100g chicken breast", "1 tablespoon olive oil"). Make quantities appropriate for the child's age and portion size.`,
      config: {
        systemInstruction: ChefNutriKidPrompt,
        temperature: 0.8,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            recipes: {
              type: Type.ARRAY,
              description: "Provide exactly 2 highly creative, distinctly different recipe options using the given ingredients.",
              items: {
                type: Type.OBJECT,
                properties: {
                  mealName: {
                    type: Type.STRING,
                    description: "Fabulous kid-themed title with emojis (e.g. 'Captain Broccoli's Shield Sandwiches 🥦🦸‍♂️')."
                  },
                  servingSize: {
                    type: Type.STRING,
                    description: "Recommended serving size for the child's age group (e.g., '1 small bowl (150ml) for toddlers 1-3 years', '1 medium plate (250g) for children 4-8 years')."
                  },
                  ingredientsWithQuantity: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Complete list of ingredients with EXACT quantities needed (e.g., '1 cup broccoli florets (approx 90g)', '2 medium carrots (100g)', '100g chicken breast boneless', '1 tbsp olive oil', '½ cup brown rice cooked'). Always specify both volume AND weight where possible."
                  },
                  nutritionalFocus: {
                     type: Type.STRING,
                     description: "Why it fits the current weight-for-age analysis and dietary trajectory."
                  },
                  allergyCheck: {
                     type: Type.STRING,
                     description: "Explicit confirmation of what was excluded, e.g., '100% Peanut & Dairy Free'."
                  },
                  medicalDisclaimer: {
                     type: Type.STRING,
                     description: "Mandatory medical disclaimer about professional advice."
                  },
                  ageGuidance: {
                    type: Type.STRING,
                    description: "Age-specific preparation guidance (e.g., 'For babies 6-12 months: blend to smooth puree. For toddlers 1-3 years: mash with fork, cut into tiny pieces. For children 4+: serve as is with soft textures')."
                  },
                  plateBreakdown: {
                    type: Type.OBJECT,
                    properties: {
                      fruitsVeggies: {
                        type: Type.STRING,
                        description: "Explain how fruits/veg map to 50% of the plate and what power they give (e.g. eye power or custom immunity shield, decorated with emojis)."
                      },
                      wholeGrains: {
                        type: Type.STRING,
                        description: "Explain the whole grain source (25% energy module) and why it keeps our engines running forever, with emojis."
                      },
                      strongProtein: {
                        type: Type.STRING,
                        description: "Explain the healthy protein (25% muscle builder) and how it creates strong arms/legs, with emojis."
                      },
                      fatsHydrates: {
                        type: Type.STRING,
                        description: "Healthy fats used (e.g., olive oil) and cheerful hydration suggestions, with emojis."
                      }
                    },
                    required: ["fruitsVeggies", "wholeGrains", "strongProtein", "fatsHydrates"]
                  },
                  instructions: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "Detailed, easy step-by-step cooking steps with quantities mentioned in each step. Maximum 6 clear steps, easy for parents."
                  },
                  juniorDuties: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: "2-3 fun interactive junior tasks (e.g. 'Tear the spinach leaves into tiny bites', 'Mix the sauce with a spoon!')."
                  },
                  powerMealFact: {
                    type: Type.STRING,
                    description: "A super encouraging scientific fact told in very cute kid terms (e.g. 'Beta-carotene in carrots is like Night Vision Goggles!')."
                  },
                  moveChallenge: {
                    type: Type.STRING,
                    description: "A fun 15-second physical challenge related to the food theme."
                  },
                  tutorialQuery: {
                    type: Type.STRING,
                    description: "Exact search term to find a tutorial video (e.g., 'kids healthy brown rice bowl recipe tutorial')."
                  },
                  dietIndicator: {
                    type: Type.STRING,
                    description: "A short indicator of the recipe's diet type with an emoji (e.g., '🟢 Pure Veg', '🔴 Non-Veg', '🥚 Eggetarian', '🌱 Vegan', '🧄 Jain')."
                  },
                  nutrition: {
                    type: Type.OBJECT,
                    properties: {
                      calories: { type: Type.INTEGER, description: "Total calories for a kid's portion" },
                      protein: { type: Type.STRING, description: "Protein amount (e.g., '15g')" },
                      carbs: { type: Type.STRING, description: "Carbohydrates amount (e.g., '30g')" },
                      fat: { type: Type.STRING, description: "Healthy fats amount (e.g., '10g')" },
                      fiber: { type: Type.STRING, description: "Fiber amount (e.g., '8g')" },
                      keyVitamins: { type: Type.STRING, description: "Key vitamins provided (e.g., 'Vitamin A, C, Iron')" }
                    },
                    required: ["calories", "protein", "carbs", "fat", "fiber", "keyVitamins"]
                  }
                },
                required: [
                  "mealName",
                  "servingSize",
                  "ingredientsWithQuantity",
                  "ageGuidance",
                  "medicalDisclaimer",
                  "plateBreakdown",
                  "instructions",
                  "juniorDuties",
                  "powerMealFact",
                  "moveChallenge",
                  "tutorialQuery",
                  "dietIndicator",
                  "nutrition"
                ]
              }
            }
          },
          required: ["recipes"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response string received from the Gemini clinical culinary engine.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini culinary engine error:", error);
    let errorMessage = error.message || "Something went wrong in Chef Nutri-Kid's kitchen!";
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      errorMessage = "API Rate Limit Exceeded: The AI Chef has run out of daily free quota. Please try again tomorrow or use an upgraded API key.";
    } else if (errorMessage.includes("503") || errorMessage.includes("high demand")) {
      errorMessage = "The AI Chef's kitchen is currently experiencing high demand! Please try again in a moment.";
    }
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// API endpoint for scanning ingredients from image
apiRouter.post("/scan-ingredients", async (req, res) => {
  try {
    const { imageBase64, mimeType = "image/jpeg" } = req.body;
    if (!imageBase64) {
      res.status(400).json({ error: "Image data must be provided." });
      return;
    }

    const ai = getGeminiClient();

    const response = await generateWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: [
        {
          role: "user",
          parts: [
            { text: "Identify the food ingredients in this image. Return a JSON array of strings representing the names of the ingredients. Use simple, common names (e.g. 'Apple', 'Oats', 'Broccoli', 'Eggs'). Ignore non-food items. If no food is found, return an empty array." },
            { 
              inlineData: {
                data: imageBase64,
                mimeType: mimeType
              }
            }
          ]
        }
      ],
      config: {
        temperature: 0.2,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: { type: Type.STRING }
        }
      }
    });

    const text = response.text;
    if (!text) {
        throw new Error("No response string received from the Gemini clinical culinary engine.");
    }
    
    res.json({ ingredients: JSON.parse(text) });
  } catch (error: any) {
    console.error("Gemini scan engine error:", error);
    let errorMessage = error.message || "Something went wrong scanning your image!";
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      errorMessage = "API Rate Limit Exceeded: The AI Chef has run out of daily free quota. Please try again tomorrow or use an upgraded API key.";
    } else if (errorMessage.includes("503") || errorMessage.includes("high demand")) {
      errorMessage = "The AI Chef's kitchen is currently experiencing high demand! Please try again in a moment.";
    }
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// API endpoint for Health Report generation
apiRouter.post("/health-report", async (req, res) => {
  try {
    const { childProfile, language = "English" } = req.body;
    if (!childProfile) {
      res.status(400).json({ error: "Child profile must be provided." });
      return;
    }

    const ai = getGeminiClient();

    const prompt = `Generate a Creative Child Health Report for Phase 4 of the NutriPeds AI workflow.
    Child Data: Name: ${childProfile.name}, Age: ${childProfile.age} years, Weight: ${childProfile.weight}kg, Diet: ${childProfile.foodCategories}, Allergies: ${childProfile.allergies && childProfile.allergies.length > 0 ? childProfile.allergies.join(", ") : "None"}.
    Language: ${language}.
    Please analyze their weight-for-age trajectory based on standard benchmarks and output a comprehensive, creatively formatted report adhering strictly to the constraints.`;

    const response = await generateWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: ChefNutriKidPrompt,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            childName: { type: Type.STRING },
            medicalDisclaimer: { type: Type.STRING, description: "Mandatory medical disclaimer about professional advice." },
            healthSummary: { type: Type.STRING, description: "A brief, encouraging overview of the child's current health status." },
            growthChartAnalysis: { type: Type.STRING, description: "A simple visual representation or clear text summary of where the child stands developmentally according to international standards." },
            proactivePlateStrategy: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Top 3 nutritional focus areas for the upcoming period based on the analysis." },
            allergySafetyShield: { type: Type.STRING, description: "A highlighted box reaffirming the specific ingredients being strictly avoided for safety." },
            milestoneTracker: { type: Type.STRING, description: "A creative summary of the child's expected energy levels and developmental milestones supported by the current plan." }
          },
          required: ["childName", "medicalDisclaimer", "healthSummary", "growthChartAnalysis", "proactivePlateStrategy", "allergySafetyShield", "milestoneTracker"]
        }
      }
    });

    const text = response.text;
    if (!text) throw new Error("No response string received from the Gemini engine.");

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini health report engine error:", error);
    let errorMessage = error.message || "Something went wrong generating the health report!";
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      errorMessage = "API Rate Limit Exceeded: The AI Chef has run out of daily free quota. Please try again tomorrow or use an upgraded API key.";
    } else if (errorMessage.includes("503") || errorMessage.includes("high demand")) {
      errorMessage = "The AI Chef's kitchen is currently experiencing high demand! Please try again in a moment.";
    }
    res.status(500).json({ error: errorMessage });
  }
});

// API endpoint for NutriBot chat assistant
apiRouter.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) { res.status(400).json({ error: "Message is required." }); return; }

    const ai = getGeminiClient();

    const systemPrompt = `You are NutriBot 🍎, the friendly AI assistant for Chef Nutri-Kid — an AI-powered kids nutrition platform for children aged 2–12 years.

You help parents with:
1. Choosing the right meal plan
2. Answering nutrition questions for children
3. Recipe ideas and food tips
4. Allergy-safe meal suggestions
5. Registration and payment guidance

PLANS:
- 🌱 Starter ₹299/week: Unlimited recipe generation, weekly meal plan PDF on WhatsApp, 1 child profile, allergy customization
- 👨‍👩‍👧 Family ₹999/month: 4 weekly plans + WhatsApp support, up to 3 children, PDF export
- ⭐ Premium ₹2,499/month: Custom plans + 2 video consultations, unlimited children, priority support

KEY FACTS:
- Based on Harvard Kid's Healthy Eating Plate (50% veggies, 25% grains, 25% protein)
- Plans delivered to WhatsApp within 24 hours of payment
- Zero-tolerance allergy protocol
- UPI payment: 7990878248@ybl
- Register at: the Register tab on this page
- Not a substitute for pediatrician advice

STYLE: Be warm, friendly, use emojis 🥦🍎👶. Keep responses SHORT (3-5 lines). Always end with an encouraging line like "Your child's healthy journey starts today! 🌟"

If asked to register: say "Click the Register tab at the top of this page to fill in your details! 😊"
If asked about payment: say "Go to Payment page or UPI ID: 7990878248@ybl 💳"
If off-topic: politely say you only help with Chef Nutri-Kid nutrition topics.`;

    // Build conversation history for Gemini
    const contents = [];
    for (const h of history.slice(-6)) {
      contents.push({ role: h.role === 'user' ? 'user' : 'model', parts: [{ text: h.text }] });
    }
    contents.push({ role: 'user', parts: [{ text: message }] });

    const response = await generateWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents,
      config: {
        systemInstruction: systemPrompt,
        temperature: 0.7,
        maxOutputTokens: 300,
      }
    });

    const reply = response.text?.trim() || "I'm here to help! Please ask me about Chef Nutri-Kid meal plans 😊";
    res.json({ reply });
  } catch (error: any) {
    console.error("NutriBot chat error:", error);
    res.status(500).json({ reply: "NutriBot is taking a short break 😴 Please WhatsApp us at 7990878248 or try again in a moment!" });
  }
});


apiRouter.post("/weekly-plan", async (req, res) => {
  try {
    const { ageGroup, language = "English", diet = "Any / No Restriction", childProfile } = req.body;
    if (!ageGroup && !childProfile) {
      res.status(400).json({ error: "Age group or child profile must be provided." });
      return;
    }

    const ai = getGeminiClient();

    let profileContext = "";
    if (childProfile) {
      const ageDisplay = childProfile.ageDisplay || `${childProfile.age} years`;
      profileContext = `The plan is specifically for ${childProfile.name}, Age: ${ageDisplay}, Weight: ${childProfile.weight}kg. Their dietary category is: ${childProfile.foodCategories}. Known Allergies: ${childProfile.allergies && childProfile.allergies.length > 0 ? childProfile.allergies.join(", ") : "None documented"}.
      STRICTLY EXCLUDE LOGGED ALLERGENS inside ALL days and snacks. Make meal portions EXACTLY appropriate for age ${ageDisplay}.`;
    }

    const langNote = language === 'Gujarati'
      ? 'IMPORTANT: Respond entirely in Gujarati language (ગુજરાતી). Use common Gujarati food names where appropriate.'
      : `Please generate the response in ${language}.`;

    const prompt = `You are a professional pediatric dietitian and "Chef Nutri-Kid".
Please create a professional weekly healthy meal chart (7 days) for a child.
${childProfile ? profileContext : `Age group: ${ageGroup}.`}
The dietary preference is: ${childProfile ? childProfile.foodCategories : diet}. Ensure all meals strictly adhere to this dietary restriction.
Adhere to the Harvard Kid's Healthy Eating Plate guidelines.
${langNote}.
${childProfile ? `IMPORTANT: Set the "title" field to exactly: "${childProfile.name.toUpperCase()} MEAL REPORT"` : ''}
Return a structured weekly meal plan and a concise grocery shopping list. Ensure professional formatting and accurate language translation.`;

    const response = await generateWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents: prompt,
      config: {
        systemInstruction: ChefNutriKidPrompt,
        temperature: 0.7,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Professional title for the weekly plan" },
            tips: { type: Type.ARRAY, items: { type: Type.STRING }, description: "3 professional nutrition tips for this age group" },
            days: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "Name of the day (e.g., Monday)" },
                  breakfast: { type: Type.STRING },
                  lunch: { type: Type.STRING },
                  dinner: { type: Type.STRING },
                  snacks: { type: Type.STRING },
                  powerFact: { type: Type.STRING, description: "Short nutritional fact about this day's meals" }
                },
                required: ["day", "breakfast", "lunch", "dinner", "snacks", "powerFact"]
              }
            },
            shoppingList: { type: Type.ARRAY, items: { type: Type.STRING }, description: "Categorized shopping list items" }
          },
          required: ["title", "tips", "days", "shoppingList"]
        }
      }
    });

    const text = response.text;
    if (!text) {
      throw new Error("No response string received from the Gemini clinical culinary engine.");
    }

    res.json(JSON.parse(text));
  } catch (error: any) {
    console.error("Gemini weekly chart engine error:", error);
    let errorMessage = error.message || "Something went wrong generating the weekly chart!";
    if (errorMessage.includes("429") || errorMessage.includes("quota")) {
      errorMessage = "API Rate Limit Exceeded: The AI Chef has run out of daily free quota. Please try again tomorrow or use an upgraded API key.";
    } else if (errorMessage.includes("503") || errorMessage.includes("high demand")) {
      errorMessage = "The AI Chef's kitchen is currently experiencing high demand! Please try again in a moment.";
    }
    res.status(500).json({
      error: errorMessage,
    });
  }
});

// API endpoint for NutriBot chat
apiRouter.post("/chat", async (req, res) => {
  try {
    const { message, history = [] } = req.body;
    if (!message) { res.status(400).json({ error: "Message is required." }); return; }
    const ai = getGeminiClient();
    const systemPrompt = `You are NutriBot 🍎, the friendly AI assistant for Chef Nutri-Kid — an AI-powered kids nutrition platform for children aged 2-12 years.

PLANS:
- 🌱 Starter ₹299/week: Unlimited recipe generation, weekly meal plan PDF on WhatsApp, 1 child profile, allergy customization, shopping list
- 👨‍👩‍👧 Family ₹999/month: 4 weekly plans, up to 3 children, WhatsApp support, PDF export, age-specific AI plans
- ⭐ Premium ₹2,499/month: Unlimited children, custom meal plans, 2 video consultations, priority support, health reports

KEY FACTS:
- Based on Harvard Kid's Healthy Eating Plate Model (50% veggies, 25% grains, 25% protein)
- Plans delivered to WhatsApp within 24 hours of payment
- Zero-tolerance allergy protocol — every meal is allergen-checked
- Powered by Gemini AI — generates recipes from home ingredients
- Not a substitute for pediatrician advice
- UPI Payment: 7990878248@ybl

REGISTRATION: Tell users to fill the form on this page → WhatsApp confirmation → UPI payment → activation code sent.

STYLE: Warm, friendly, use emojis 🥦🍎👶🌟. Keep responses SHORT and clear (3-5 sentences). Always end with an encouraging line like "Your child's healthy journey starts today! 🌟"

If asked off-topic: politely redirect to Chef Nutri-Kid nutrition help.`;

    const contents = [
      ...history.map((h: any) => ({ role: h.role, parts: [{ text: h.text }] })),
      { role: "user", parts: [{ text: message }] }
    ];

    const response = await generateWithRetry(ai, {
      model: "gemini-3.1-flash-lite",
      contents,
      config: { systemInstruction: systemPrompt, temperature: 0.7, maxOutputTokens: 300 }
    });

    res.json({ reply: response.text || "I'm sorry, I couldn't process that. Please try again! 😊" });
  } catch (error: any) {
    console.error("NutriBot chat error:", error);
    res.status(500).json({ error: "NutriBot is taking a break! Please try again in a moment. 😊" });
  }
});
