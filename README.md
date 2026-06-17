# 🍎 Chef Nutri-Kid — NutriPeds AI Platform

An AI-powered edutainment platform that helps parents build balanced, child-friendly meals using available home ingredients — while teaching kids about nutrition through gamified, playful experiences.

## 🚀 Tech Stack

- **Frontend:** React 19 + Vite + Tailwind CSS v4
- **AI:** Google Gemini API (`gemini-3.1-flash-lite`)
- **Backend:** Express.js serverless via Netlify Functions
- **Deployment:** Netlify

---

## 📦 Project Structure

```
chef-nutri-kid/
├── src/
│   ├── App.tsx              # Main app with freemium gate
│   ├── freemium.ts          # 🔒 Freemium gate logic (localStorage)
│   ├── api.ts               # Gemini AI API routes
│   ├── types.ts             # TypeScript types + ingredient DB
│   ├── utils.ts             # PDF export utility
│   └── components/
│       ├── IngredientSelector.tsx
│       ├── HarvardPlate.tsx
│       ├── WeeklyPlanner.tsx
│       └── ProfileManager.tsx
├── public/
│   ├── plans.html           # 💰 Pricing & plans landing page
│   ├── payment.html         # 💳 UPI payment page (QR + activation)
│   └── upi-qr.png           # UPI QR code image
├── netlify/
│   └── functions/api.ts     # Netlify serverless function wrapper
├── netlify.toml
├── vite.config.ts
└── package.json
```

---

## 🔒 Freemium Gate

Free users get **1 recipe generation only**. Premium features are locked:

| Feature | Free | Paid |
|---|---|---|
| Recipe generation | 1 time | Unlimited |
| Child profiles | 🔒 | ✅ |
| Weekly planner | 🔒 | ✅ |
| Health reports | 🔒 | ✅ |
| Recipe box (save) | 🔒 | ✅ |

### Setting Activation Codes

Edit `src/freemium.ts` and update the `VALID_CODES` array:

```ts
const VALID_CODES = [
  'YOUR-CODE-1',
  'YOUR-CODE-2',
  // Add one unique code per customer
];
```

Give each paying customer a unique code via WhatsApp after payment confirmation.

---

## 💳 Payment Flow

1. User hits a locked feature → Paywall modal appears
2. User visits `/payment.html` → Scans UPI QR or copies UPI ID
3. User sends payment screenshot on WhatsApp
4. You send them an activation code
5. User enters code in the app → Premium unlocked instantly

**UPI ID:** `7990878248@ybl`

---

## 🛠️ Local Development

```bash
npm install
cp .env.example .env
# Add your GEMINI_API_KEY to .env
npm run dev
```

## 🌐 Deploy to Netlify

1. Push to GitHub
2. Connect repo on netlify.com
3. Add `GEMINI_API_KEY` in Netlify → Site Settings → Environment Variables
4. Deploy!

---

## 📋 Business Plans

| Plan | Price | Features |
|------|-------|----------|
| 🌱 Starter | ₹299/week | Unlimited recipes + weekly plan PDF on WhatsApp |
| 👨‍👩‍👧 Family | ₹999/month | All features, up to 3 children |
| ⭐ Premium | ₹2,499/month | All features + 2 video consultations |

© 2026 Chef Nutri-Kid · Hand-prepared with Clinical Culinary Love
