import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Brain, 
  TrendingUp, 
  DollarSign, 
  BarChart3,
  Shield,
  Zap,
  Target,
  AlertTriangle,
  CheckCircle,
  TrendingDown
} from "lucide-react";
import { aiAPI, productAPI } from "@/lib/api";
import { authManager } from "@/lib/auth";
import PricingChart from "@/components/PricingChart";

export default function AITools() {
  const { toast } = useToast();
  const [selectedProduct, setSelectedProduct] = useState("");
  const [selectedUser, setSelectedUser] = useState("");

  const user = authManager.getUser();

  // Fetch user's products (for vendors)
  const { data: products } = useQuery({
    queryKey: ["/api/products", { vendorId: user?.id }],
    enabled: !!user && user.role === "vendor",
  });

  // Price recommendation mutation
  const priceRecommendationMutation = useMutation({
    mutationFn: aiAPI.getPriceRecommendation,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error getting price recommendation",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  // Demand forecast mutation
  const demandForecastMutation = useMutation({
    mutationFn: aiAPI.getDemandForecast,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error generating demand forecast",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  // Risk assessment mutation
  const riskAssessmentMutation = useMutation({
    mutationFn: aiAPI.getRiskAssessment,
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error generating risk assessment",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  const handlePriceRecommendation = () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "No product selected",
        description: "Please select a product to analyze.",
      });
      return;
    }
    priceRecommendationMutation.mutate(selectedProduct);
  };

  const handleDemandForecast = () => {
    if (!selectedProduct) {
      toast({
        variant: "destructive",
        title: "No product selected",
        description: "Please select a product to forecast.",
      });
      return;
    }
    demandForecastMutation.mutate(selectedProduct);
  };

  const handleRiskAssessment = () => {
    if (!selectedUser) {
      toast({
        variant: "destructive",
        title: "No user selected",
        description: "Please specify a user ID for risk assessment.",
      });
      return;
    }
    riskAssessmentMutation.mutate(selectedUser);
  };

  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Please login to access AI tools.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">AI-Powered Business Intelligence</h1>
          <p className="text-gray-600 mt-2">
            Leverage advanced AI tools to optimize your B2B operations and make data-driven decisions
          </p>
        </div>

        {/* AI Tools Overview */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card className="border-blue-200 bg-gradient-to-br from-blue-50 to-blue-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-blue-500 rounded-lg flex items-center justify-center">
                  <DollarSign className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Smart Pricing</h3>
                  <p className="text-sm text-gray-600">AI-optimized pricing strategies</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Accuracy:</span>
                <Badge className="bg-blue-600">94.2%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-green-200 bg-gradient-to-br from-green-50 to-green-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-green-500 rounded-lg flex items-center justify-center">
                  <BarChart3 className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Demand Forecasting</h3>
                  <p className="text-sm text-gray-600">Predict future demand with AI</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Accuracy:</span>
                <Badge className="bg-green-600">91.7%</Badge>
              </div>
            </CardContent>
          </Card>

          <Card className="border-purple-200 bg-gradient-to-br from-purple-50 to-purple-100">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
                  <Shield className="w-6 h-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold text-gray-900">Risk Assessment</h3>
                  <p className="text-sm text-gray-600">AI-powered risk profiling</p>
                </div>
              </div>
              <div className="mt-4 flex items-center justify-between">
                <span className="text-sm text-gray-600">Precision:</span>
                <Badge className="bg-purple-600">96.3%</Badge>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="pricing" className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pricing">Smart Pricing</TabsTrigger>
            <TabsTrigger value="forecasting">Demand Forecasting</TabsTrigger>
            <TabsTrigger value="risk">Risk Assessment</TabsTrigger>
          </TabsList>

          <TabsContent value="pricing" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Price Recommendation Tool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Brain className="w-5 h-5 mr-2 text-blue-600" />
                    Price Recommendation Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.role === "vendor" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Product
                        </label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a product to analyze" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name} - ${parseFloat(product.price).toLocaleString()}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={handlePriceRecommendation}
                        disabled={priceRecommendationMutation.isPending || !selectedProduct}
                        className="w-full"
                      >
                        {priceRecommendationMutation.isPending ? (
                          <>
                            <Zap className="w-4 h-4 mr-2 animate-spin" />
                            Analyzing...
                          </>
                        ) : (
                          <>
                            <Target className="w-4 h-4 mr-2" />
                            Get Price Recommendation
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Price recommendations are available for vendors only.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Price Recommendation Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Recommendation Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {priceRecommendationMutation.isPending ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-8 w-1/2" />
                    </div>
                  ) : priceRecommendationMutation.data ? (
                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 bg-green-50 rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Recommended Price</p>
                          <p className="text-2xl font-bold text-green-600">
                            ${parseFloat(priceRecommendationMutation.data.recommendedPrice).toLocaleString()}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-600">Change</p>
                          <p className={`font-semibold ${
                            priceRecommendationMutation.data.priceChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                          }`}>
                            {priceRecommendationMutation.data.priceChangePercent > 0 ? '+' : ''}
                            {priceRecommendationMutation.data.priceChangePercent.toFixed(1)}%
                          </p>
                        </div>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">AI Analysis</h4>
                        <p className="text-sm text-gray-700">{priceRecommendationMutation.data.reasoning}</p>
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <span className="text-sm text-gray-700">
                          Confidence: {Math.round(priceRecommendationMutation.data.confidence * 100)}%
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Select a product and click "Get Price Recommendation" to see AI analysis.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Demand Forecasting Tool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <BarChart3 className="w-5 h-5 mr-2 text-green-600" />
                    Demand Forecasting Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.role === "vendor" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Select Product
                        </label>
                        <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                          <SelectTrigger>
                            <SelectValue placeholder="Choose a product to forecast" />
                          </SelectTrigger>
                          <SelectContent>
                            {products?.map((product) => (
                              <SelectItem key={product.id} value={product.id}>
                                {product.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <Button 
                        onClick={handleDemandForecast}
                        disabled={demandForecastMutation.isPending || !selectedProduct}
                        className="w-full"
                      >
                        {demandForecastMutation.isPending ? (
                          <>
                            <Zap className="w-4 h-4 mr-2 animate-spin" />
                            Forecasting...
                          </>
                        ) : (
                          <>
                            <BarChart3 className="w-4 h-4 mr-2" />
                            Generate Demand Forecast
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Demand forecasting is available for vendors only.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Forecasting Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Forecast Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {demandForecastMutation.isPending ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : demandForecastMutation.data ? (
                    <div className="space-y-4">
                      <div className="p-4 bg-blue-50 rounded-lg">
                        <h4 className="font-medium text-gray-900 mb-2">Next 30 Days Forecast</h4>
                        <div className="flex items-center justify-between">
                          <span className="text-2xl font-bold text-blue-600">
                            {demandForecastMutation.data.next30Days.estimatedDemand} units
                          </span>
                          <Badge variant={
                            demandForecastMutation.data.next30Days.trendDirection === "increasing" ? "default" :
                            demandForecastMutation.data.next30Days.trendDirection === "decreasing" ? "destructive" : "secondary"
                          }>
                            {demandForecastMutation.data.next30Days.trendDirection === "increasing" && <TrendingUp className="w-3 h-3 mr-1" />}
                            {demandForecastMutation.data.next30Days.trendDirection === "decreasing" && <TrendingDown className="w-3 h-3 mr-1" />}
                            {demandForecastMutation.data.next30Days.trendDirection}
                          </Badge>
                        </div>
                        <Progress 
                          value={demandForecastMutation.data.next30Days.confidence * 100} 
                          className="mt-2"
                        />
                        <p className="text-xs text-gray-600 mt-1">
                          Confidence: {Math.round(demandForecastMutation.data.next30Days.confidence * 100)}%
                        </p>
                      </div>
                      
                      <div className="space-y-2">
                        <h4 className="font-medium text-gray-900">Recommendations</h4>
                        <ul className="space-y-1">
                          {demandForecastMutation.data.recommendations.map((rec, index) => (
                            <li key={index} className="flex items-start space-x-2">
                              <CheckCircle className="w-4 h-4 text-green-600 mt-0.5 flex-shrink-0" />
                              <span className="text-sm text-gray-700">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Select a product and click "Generate Demand Forecast" to see predictions.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="risk" className="space-y-6">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Risk Assessment Tool */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Shield className="w-5 h-5 mr-2 text-purple-600" />
                    Risk Assessment Engine
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {user.role === "admin" || user.role === "vendor" ? (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          User ID for Assessment
                        </label>
                        <input
                          type="text"
                          value={selectedUser}
                          onChange={(e) => setSelectedUser(e.target.value)}
                          placeholder="Enter user ID"
                          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                        />
                      </div>
                      
                      <Button 
                        onClick={handleRiskAssessment}
                        disabled={riskAssessmentMutation.isPending || !selectedUser}
                        className="w-full"
                      >
                        {riskAssessmentMutation.isPending ? (
                          <>
                            <Zap className="w-4 h-4 mr-2 animate-spin" />
                            Assessing...
                          </>
                        ) : (
                          <>
                            <Shield className="w-4 h-4 mr-2" />
                            Generate Risk Assessment
                          </>
                        )}
                      </Button>
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Risk assessment is available for admins and vendors only.</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Risk Assessment Results */}
              <Card>
                <CardHeader>
                  <CardTitle>Assessment Results</CardTitle>
                </CardHeader>
                <CardContent>
                  {riskAssessmentMutation.isPending ? (
                    <div className="space-y-4">
                      <Skeleton className="h-4 w-full" />
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-20 w-full" />
                    </div>
                  ) : riskAssessmentMutation.data ? (
                    <div className="space-y-4">
                      <div className={`p-4 rounded-lg ${
                        riskAssessmentMutation.data.riskLevel === "low" ? "bg-green-50" :
                        riskAssessmentMutation.data.riskLevel === "medium" ? "bg-yellow-50" : "bg-red-50"
                      }`}>
                        <div className="flex items-center justify-between mb-2">
                          <h4 className="font-medium text-gray-900">Risk Level</h4>
                          <Badge variant={
                            riskAssessmentMutation.data.riskLevel === "low" ? "default" :
                            riskAssessmentMutation.data.riskLevel === "medium" ? "outline" : "destructive"
                          }>
                            {riskAssessmentMutation.data.riskLevel.toUpperCase()}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {riskAssessmentMutation.data.riskScore}/100
                            </p>
                            <p className="text-sm text-gray-600">Risk Score</p>
                          </div>
                          <div>
                            <p className="text-2xl font-bold text-gray-900">
                              {riskAssessmentMutation.data.trustScore}/100
                            </p>
                            <p className="text-sm text-gray-600">Trust Score</p>
                          </div>
                        </div>
                      </div>
                      
                      {riskAssessmentMutation.data.riskFactors.length > 0 && (
                        <div className="space-y-2">
                          <h4 className="font-medium text-gray-900">Risk Factors</h4>
                          <ul className="space-y-1">
                            {riskAssessmentMutation.data.riskFactors.map((factor, index) => (
                              <li key={index} className="flex items-start space-x-2">
                                <AlertTriangle className="w-4 h-4 text-amber-600 mt-0.5 flex-shrink-0" />
                                <span className="text-sm text-gray-700">{factor}</span>
                              </li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">Enter a user ID and click "Generate Risk Assessment" to see analysis.</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
