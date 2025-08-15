// import OpenAI from "openai";
import { GoogleGenerativeAI } from "@google/generative-ai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const gemini = new GoogleGenerativeAI({ 
  apiKey: process.env.GEMINI_API_KEY ,
});
if (!process.env.GEMINI_API_KEY) {
  throw new Error("GEMINI_API_KEY is not set");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

function extractJsonFromText(text) {
  if (!text || typeof text !== "string") return null;
  let s = text.trim();

  // 1) If there's a triple-backtick fenced block (```json ... ``` or ``` ... ```), prefer its inner content.
  const fenced = s.match(/```(?:json)?\n?([\s\S]*?)```/i);
  if (fenced && fenced[1]) {
    const candidate = fenced[1].trim();
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // fall through and try other extraction strategies on candidate
      s = candidate;
    }
  }

  // 2) Remove any leading/trailing single backticks or markdown markers and try again.
  s = s.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

  // 3) Find the first balanced JSON object-like substring using a non-greedy match.
  const firstJson = s.match(/\{[\s\S]*?\}/);
  if (firstJson) {
    try {
      return JSON.parse(firstJson[0]);
    } catch (e) {
      // continue to next strategy
    }
  }

  // 4) Fall back: take substring from first '{' to last '}' and try parsing
  const firstOpen = s.indexOf("{");
  const lastClose = s.lastIndexOf("}");
  if (firstOpen !== -1 && lastClose !== -1 && lastClose > firstOpen) {
    const candidate = s.slice(firstOpen, lastClose + 1);
    try {
      return JSON.parse(candidate);
    } catch (e) {
      // nothing more to try
    }
  }

  return null;
}

export class AIService {
async generatePriceRecommendation(product, marketData = {}) {
  if (!product || !product.name || typeof product.price === "undefined") {
    throw new Error("Invalid product input for price recommendation");
  }

   if (process.env.NODE_ENV === "development") {
    console.log("[AIService] product payload:", {
      id: product.id,
      name: product.name,
      price: product.price,
      vendorId: product.vendorId,
    });
  }

  const buildPrompt = () => {
    return `Analyze the following product and market data to provide optimal pricing recommendations:

Product: ${product.name}
Current Price: $${product.price}
Category: ${product.categoryId || "unknown"}
Stock Quantity: ${product.stockQuantity}
Views: ${product.views}
Rating: ${product.rating}

Market Data:
- Similar products average price: ${marketData.avgPrice ?? "unknown"}
- Market demand trend: ${marketData.demandTrend ?? "stable"}
- Competitor prices: ${JSON.stringify(marketData.competitors || [])}

Please provide pricing recommendations in JSON only with the following structure:
{
  "recommendedPrice": number,
  "priceChange": number,
  "priceChangePercent": number,
  "reasoning": string,
  "confidence": number,
  "marketAnalysis": string
}

Ensure the output is valid JSON and nothing else.`;
  };

  const prompt = buildPrompt();

  // retry helper (exponential backoff), but bail on hard quota errors
  const withRetries = async (fn, attempts = 3, baseDelay = 500) => {
     let lastErr;
   for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (e) {
      lastErr = e;
      const isQuota = (e?.message || "").toLowerCase().includes("quota") || e?.status === 429;
          if (isQuota && (e?.message || "").toLowerCase().includes("free_tier")) {
            // bail on free-tier quota exhaustion
            throw e;
          }

      // Only retry on transient 429s or network-ish failures
      const isRateLimit = e?.status === 429;
      if (!isRateLimit && i === attempts - 1) {
        throw e;
      }

      // jittered exponential backoff
      const jitter = Math.random() * 100;
      const delay = Math.pow(2, i) * baseDelay + jitter;
      console.warn(`[Retry] attempt ${i + 1} failed: ${e.message}. retrying in ${Math.round(delay)}ms`);
      await sleep(delay);
    }
  }
  throw lastErr;
  };

  try {
     const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const rawResponse = await withRetries(async () =>{
     const result = await model.generateContent({
          contents: [
            {
              role: "user",
              parts: [{ text: prompt }],
            },
          ],
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 500,
          },
        });
        return result;
      });

          const content = rawResponse?.response?.candidates?.[0]?.content?.parts?.[0]?.text;
      if (!content) {
        throw new Error("Empty response from Gemini");
      }

         if (process.env.NODE_ENV === "development") {
        console.log("[AIService] raw model output:", content);
        console.log("[AIService] token usage (if available):", rawResponse?.response?.usage ?? rawResponse?.usage);
      }
      const parsed = extractJsonFromText(content);
      if (!parsed) {
        console.warn("[PriceRec] failed to parse model output as JSON (after sanitization):", content);
        throw new Error("Model output could not be parsed as valid JSON");
      }

    const normalizeNumber = (val, fallback = null) => {
        if (typeof val === "number") return val;
        if (typeof val === "string") {
          const n = Number(val.replace(/[^0-9.\-]/g, ""));
          if (!isNaN(n)) return n;
        }
        return fallback;
      };

      const recommendedPrice = normalizeNumber(parsed.recommendedPrice);
      const priceChange = normalizeNumber(parsed.priceChange);
      const priceChangePercent = normalizeNumber(parsed.priceChangePercent);
      let confidence = normalizeNumber(parsed.confidence);

       if (confidence === null) {
        confidence = 0.5;
      } else if (confidence < 0) {
        confidence = 0;
      } else if (confidence > 1) {
        confidence = 1;
      }

      // Validate required structured output
      if (recommendedPrice === null) throw new Error("recommendedPrice is missing or invalid");
      if (priceChange === null) throw new Error("priceChange is missing or invalid");
      if (priceChangePercent === null) throw new Error("priceChangePercent is missing or invalid");
      if (typeof parsed.reasoning !== "string") throw new Error("reasoning is missing or invalid");
      if (typeof parsed.marketAnalysis !== "string") throw new Error("marketAnalysis is missing or invalid");

    // for (const f of requiredFields) {
    //   if (parsed[f] === undefined) {
    //     throw new Error(`Missing field in model output: ${f}`);
    //   }
    // }

    // if (typeof parsed.recommendedPrice !== "number") {
    //   throw new Error("recommendedPrice is not a number");
    // }
    // if (typeof parsed.confidence !== "number" || parsed.confidence < 0 || parsed.confidence > 1) {
    //   throw new Error("confidence must be a number between 0 and 1");
    // }

    // Optionally sanity-check price change percent vs price
    // e.g., ensure priceChangePercent matches (recommendedPrice - current)/current logic if you care

    return {
        recommendedPrice,
        priceChange,
        priceChangePercent,
        reasoning: parsed.reasoning,
        confidence,
        marketAnalysis: parsed.marketAnalysis,
      };
  } catch (error) {
    console.error("Error generating price recommendation:", error);
    // Distinguish quota errors
    if (error?.error?.code === "insufficient_quota") {
      throw new Error("Quota exceeded: " + error.message);
    }
    throw new Error(`Failed to generate price recommendation: ${error.message}`);
  }
}

async negotiatePrice(negotiationContext) {
  try {
    const { product, currentOffer, buyerMessage, negotiationHistory } = negotiationContext;

    const prompt = `You are an AI negotiation assistant for a B2B marketplace. Help negotiate the best price for both parties.

Product Details:
- Name: ${product.name}
- Listed Price: $${product.price}
- Current Offer: $${currentOffer}
- Min Order Quantity: ${product.minOrderQuantity}

Buyer's Latest Message: "${buyerMessage}"

Negotiation History: ${JSON.stringify(negotiationHistory)}

Provide a negotiation response in JSON format:
{
  "response": "Professional response to the buyer",
  "counterOffer": number,
  "reasoning": "Why this counter-offer makes sense",
  "acceptanceRecommendation": "suggest" | "accept" | "counter",
  "marketJustification": "Market-based reasoning for the price"
}`;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent({
      contents: [{ role: "user", parts: [{ text: prompt }] }],
      generationConfig: {
        temperature: 0.8,
        maxOutputTokens: 500,
      },
    });

    console.log("Gemini raw response:", result);

    const content = result.response?.candidates?.[0]?.content?.parts?.[0]?.text;
    if (!content) {
      throw new Error("Empty response from Gemini API");
    }

    // Extract JSON from response
    let parsed;
try {
  const jsonStart = content.indexOf("{");
  const jsonEnd = content.lastIndexOf("}");
  const cleanJson = content.slice(jsonStart, jsonEnd + 1);
  parsed = JSON.parse(cleanJson);
} catch (err) {
  console.error("Failed to parse AI JSON:", content);
  parsed = {
    response: "Sorry, AI could not generate a proper negotiation response. Please try again.",
    counterOffer: null,
    reasoning: "",
    acceptanceRecommendation: "counter",
    marketJustification: ""
  };
}
return parsed;

  } catch (error) {
    console.error("Error in price negotiation:", error);
     return {
      response: "Failed to process negotiation. Please try again later.",
      counterOffer: null,
      reasoning: "",
      acceptanceRecommendation: "counter",
      marketJustification: ""
    };
  }
}

async forecastDemand(productData, historicalData = []) {
  try {
    const prompt = `
Analyze the following product and historical data to forecast demand.
Return ONLY valid JSON, no extra text:

Product: ${productData.name}
Category: ${productData.categoryId}
Current Views: ${productData.views}
Current Stock: ${productData.stockQuantity}
Price: $${productData.price}

Historical Data: ${JSON.stringify(historicalData)}

JSON format:
{
  "next30Days": {
    "estimatedDemand": number,
    "confidence": number,
    "trendDirection": "increasing" | "decreasing" | "stable"
  },
  "seasonalFactors": "string",
  "recommendations": [
    "string"
  ],
  "riskFactors": [
    "string"
  ]
}
    `;
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const text = result.response.text();

    // Try parsing JSON
    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const cleanJson = text.slice(jsonStart, jsonEnd + 1);

    return JSON.parse(cleanJson);
  } catch (error) {
    console.error("Error forecasting demand:", error?.message, error?.response?.data || error);

    // Pass the real message and raw Gemini output to caller
    throw {
      message: error?.message || "Unknown error",
      raw: error?.response?.data || null
    };
  }
}

async generateRiskAssessment(userProfile, transactionHistory = []) {
  try {
    const prompt = `
Assess the risk profile for this B2B marketplace user.
Return ONLY valid JSON, no extra text.

User Profile:
- Role: ${userProfile.role}
- Company: ${userProfile.companyName}
- Account Age: ${userProfile.createdAt}
- Verification Status: ${userProfile.isVerified}

Transaction History: ${JSON.stringify(transactionHistory)}

JSON format:
{
  "riskScore": number,
  "riskLevel": "low" | "medium" | "high",
  "riskFactors": ["string"],
  "recommendations": ["string"],
  "creditworthiness": "string",
  "trustScore": number
}
    `;

    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    const result = await model.generateContent(prompt);

    const text = result.response.text();

    if (!text.includes("{")) {
      throw new Error("Gemini returned no JSON. Raw response: " + text);
    }

    const jsonStart = text.indexOf("{");
    const jsonEnd = text.lastIndexOf("}");
    const cleanJson = text.slice(jsonStart, jsonEnd + 1);

    return JSON.parse(cleanJson);

  } catch (error) {
  console.error("Error generating risk assessment:");
  console.error("Message:", error.message);
  console.error("Stack:", error.stack);
  console.error("Full error object:", JSON.stringify(error, null, 2));
  throw new Error("Failed to generate risk assessment");
}
}

}

export const aiService = new AIService();
