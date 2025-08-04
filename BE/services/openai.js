import OpenAI from "openai";

// the newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ 
  apiKey: process.env.OPENAI_API_KEY ,
});
if (!process.env.OPENAI_API_KEY) {
  throw new Error("OPENAI_API_KEY is not set");
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
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
      if (e?.error?.code === "insufficient_quota") {
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
    const rawResponse = await withRetries(() =>
      openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content:
              "You are an expert pricing analyst for B2B marketplaces. Provide data-driven pricing recommendations based on market conditions, demand, and competitive analysis.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      })
    );

    const content = rawResponse?.choices?.[0]?.message?.content;
    if (!content) {
      throw new Error("Empty response from model");
    }

    // Try to extract JSON object from possibly noisy output
    let parsed;
    try {
      const match = content.match(/\{[\s\S]*\}$/); // greedy to end
      const jsonText = match ? match[0] : content;
      parsed = JSON.parse(jsonText);
    } catch (e) {
      console.warn("[PriceRec] failed to parse model output as JSON:", content);
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

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a professional B2B negotiation assistant. Be helpful, fair, and aim for win-win outcomes. Use market data and business logic in your negotiations."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.8
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error in price negotiation:', error);
      throw new Error('Failed to process negotiation');
    }
  }

  async forecastDemand(productData, historicalData = []) {
    try {
      const prompt = `Analyze the following product and historical data to forecast demand:

Product: ${productData.name}
Category: ${productData.categoryId}
Current Views: ${productData.views}
Current Stock: ${productData.stockQuantity}
Price: $${productData.price}

Historical Data: ${JSON.stringify(historicalData)}

Provide demand forecast in JSON format:
{
  "next30Days": {
    "estimatedDemand": number,
    "confidence": number,
    "trendDirection": "increasing" | "decreasing" | "stable"
  },
  "seasonalFactors": "string describing seasonal impacts",
  "recommendations": [
    "actionable recommendations for inventory and pricing"
  ],
  "riskFactors": [
    "potential risks that could affect demand"
  ]
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a demand forecasting expert specializing in B2B markets. Provide accurate, data-driven forecasts with actionable insights."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.6
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error forecasting demand:', error);
      throw new Error('Failed to generate demand forecast');
    }
  }

  async generateRiskAssessment(userProfile, transactionHistory = []) {
    try {
      const prompt = `Assess the risk profile for this B2B marketplace user:

User Profile:
- Role: ${userProfile.role}
- Company: ${userProfile.companyName}
- Account Age: ${userProfile.createdAt}
- Verification Status: ${userProfile.isVerified}

Transaction History: ${JSON.stringify(transactionHistory)}

Provide risk assessment in JSON format:
{
  "riskScore": number (0-100, where 0 is lowest risk),
  "riskLevel": "low" | "medium" | "high",
  "riskFactors": [
    "specific risk factors identified"
  ],
  "recommendations": [
    "recommended actions to mitigate risks"
  ],
  "creditworthiness": "assessment of financial reliability",
  "trustScore": number (0-100)
}`;

      const response = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: "You are a risk assessment expert for B2B transactions. Evaluate users fairly and provide actionable risk mitigation strategies."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        response_format: { type: "json_object" },
        temperature: 0.5
      });

      return JSON.parse(response.choices[0].message.content);
    } catch (error) {
      console.error('Error generating risk assessment:', error);
      throw new Error('Failed to generate risk assessment');
    }
  }
}

export const aiService = new AIService();
