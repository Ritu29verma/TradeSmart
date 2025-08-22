// tests/app.test.js
import request from "supertest";
import { jest } from "@jest/globals";

// 🟢 Mock BEFORE importing storage/app
await jest.unstable_mockModule("../storage.js", () => ({
  storage: {
    getUserByEmail: jest.fn(async () => null),
    createUser: jest.fn(async (userData) => ({
      id: 1,
      ...userData,
      password: "hashedpassword",
    })),
    getUsersByRoles: jest.fn(async () => []),
    verifyPassword: jest.fn(async (email, password) => ({
      id: 1,
      email,
      password: "hashedpassword",
    })),
    reset: jest.fn(),
  },
}));

await jest.unstable_mockModule("../middleware/auth.js", () => ({
  authenticateToken: (req, res, next) => {
    req.user = { id: 1, role: "buyer" }; // fake user
    next();
  },
  requireRole: () => (req, res, next) => next(),
  optionalAuth: (req, res, next) => next(),
}));

await jest.unstable_mockModule("../services/openai.js", () => ({
  aiService: {
    generatePriceRecommendation: async () => ({
      recommendedPrice: 100,
      priceChange: 5,
      priceChangePercent: 5,
      reasoning: "mock reasoning",
      confidence: 0.9,
      marketAnalysis: "mock analysis",
    }),
    negotiatePrice: async () => ({
      response: "mock negotiation",
      counterOffer: 90,
      reasoning: "mock reasoning",
      acceptanceRecommendation: "counter",
      marketJustification: "mock justification"
    }),
    forecastDemand: async () => ({
      next30Days: { estimatedDemand: 50, confidence: 0.8, trendDirection: "stable" },
      seasonalFactors: "mock seasonality",
      recommendations: ["mock recommendation"],
      riskFactors: ["mock risk"]
    }),
    generateRiskAssessment: async () => ({
      riskScore: 10,
      riskLevel: "low",
      riskFactors: [],
      recommendations: [],
      creditworthiness: "good",
      trustScore: 0.95
    }),
  },
}));

// tests/app.test.js
await jest.unstable_mockModule("../middleware/auth.js", () => ({
  authenticateToken: (req, _res, next) => {
    req.user = { id: 1, email: "test@test.com", role: "buyer" };
    next();
  },
  requireRole: () => (_req, _res, next) => next(),
  optionalAuth: (_req, _res, next) => next()
}));


await jest.unstable_mockModule("bcrypt", () => ({
  default: {
    hash: async () => "hashedpassword",
    compare: async () => true,
  },
}));

await jest.unstable_mockModule("jsonwebtoken", () => ({
  default: {
    sign: () => "mocked-jwt-token",
    verify: () => ({ id: 1 }),
  },
}));


const { default: app } = await import("../app.js");
const { storage } = await import("../storage.js");


describe("Auth routes", () => {
    beforeEach(() => {
    storage.reset?.();
    jest.clearAllMocks();
  });

  it("Post /api/auth/register creates a user", async () => {
    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", password: "123456" });

        console.log("Response body:", res.body);

    expect(res.statusCode).toBe(201);
    expect(res.body).toHaveProperty("token", "mocked-jwt-token");
    expect(res.body.user.email).toBe("test@test.com");
    expect(storage.createUser).toHaveBeenCalled();
  });

   it("POST /api/auth/register fails if user exists", async () => {
    storage.getUserByEmail.mockResolvedValue({ email: "test@test.com" });

    const res = await request(app)
      .post("/api/auth/register")
      .send({ email: "test@test.com", password: "123456" });

    expect(res.statusCode).toBe(400);
    expect(res.body.message).toBe("User already exists");
  });

   // ----------------- LOGIN -----------------
  it("POST /api/auth/login authenticates user", async () => {
    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "test@test.com", password: "123456" });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty("token", "mocked-jwt-token");
    expect(res.body.user.email).toBe("test@test.com");
    expect(storage.verifyPassword).toHaveBeenCalledWith("test@test.com", "123456");
  });

  it("POST /api/auth/login fails with invalid credentials", async () => {
    storage.verifyPassword.mockResolvedValue(null);

    const res = await request(app)
      .post("/api/auth/login")
      .send({ email: "wrong@test.com", password: "123" });

    expect(res.statusCode).toBe(401);
    expect(res.body.message).toBe("Invalid credentials");
  });

   // ----------------- GET USERS -----------------
  it("GET /api/users returns list of users", async () => {
    storage.getUsersByRoles.mockResolvedValue([
      { id: 1, email: "user@test.com", role: "buyer", password: "hashed" }
    ]);

    const res = await request(app)
      .get("/api/users")
      .set("Authorization", "Bearer faketoken"); // bypass authenticateToken mock

    expect(res.statusCode).toBe(200);
    expect(res.body[0]).not.toHaveProperty("password");
    expect(res.body[0].email).toBe("user@test.com");
  });

  it("GET /api/auth/me returns current user", async () => {
  const res = await request(app).get("/api/auth/me");
  expect(res.statusCode).toBe(200);
  expect(res.body.user).toHaveProperty("email", "test@test.com");
  expect(res.body.user.password).toBeUndefined();
});

it("POST /api/categories creates a category", async () => {
  storage.createCategory = jest.fn().mockResolvedValue({
    id: 1,
    name: "Category 1",
    description: "Desc"
  });

  const res = await request(app)
    .post("/api/categories")
    .set("Authorization", "Bearer faketoken") // bypass auth
    .send({ name: "Category 1", description: "Desc" });

  expect(res.statusCode).toBe(201);
  expect(res.body).toHaveProperty("name", "Category 1");
  expect(storage.createCategory).toHaveBeenCalledWith("Category 1", "Desc", undefined);
});


});