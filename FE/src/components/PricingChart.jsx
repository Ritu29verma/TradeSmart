import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  TrendingUp, 
  TrendingDown, 
  Minus,
  DollarSign,
  Calendar,
  BarChart3
} from "lucide-react";

export default function PricingChart({ 
  data = [], 
  title = "Price Trend", 
  showRecommendations = false,
  currentPrice = 0,
  recommendations = null 
}) {
  const chartData = useMemo(() => {
    if (!data || data.length === 0) {
      // Generate sample data for demonstration
      const sampleData = [];
      const basePrice = currentPrice || 1000;
      const now = new Date();
      
      for (let i = 30; i >= 0; i--) {
        const date = new Date(now);
        date.setDate(date.getDate() - i);
        const variation = (Math.random() - 0.5) * 0.1; // ±5% variation
        const price = basePrice * (1 + variation);
        
        sampleData.push({
          date: date.toISOString().split('T')[0],
          price: price,
          label: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        });
      }
      return sampleData;
    }
    return data;
  }, [data, currentPrice]);

  const priceStats = useMemo(() => {
    if (chartData.length === 0) return null;
    
    const prices = chartData.map(d => d.price);
    const minPrice = Math.min(...prices);
    const maxPrice = Math.max(...prices);
    const avgPrice = prices.reduce((sum, price) => sum + price, 0) / prices.length;
    
    const firstPrice = prices[0];
    const lastPrice = prices[prices.length - 1];
    const trend = lastPrice > firstPrice ? 'up' : lastPrice < firstPrice ? 'down' : 'stable';
    const trendPercentage = ((lastPrice - firstPrice) / firstPrice) * 100;
    
    return {
      min: minPrice,
      max: maxPrice,
      avg: avgPrice,
      trend,
      trendPercentage: Math.abs(trendPercentage),
      current: lastPrice
    };
  }, [chartData]);

  const maxPrice = chartData.length > 0 ? Math.max(...chartData.map(d => d.price)) : 1000;
  const minPrice = chartData.length > 0 ? Math.min(...chartData.map(d => d.price)) : 0;
  const priceRange = maxPrice - minPrice;

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <BarChart3 className="w-5 h-5 mr-2" />
              {title}
            </CardTitle>
            {priceStats && (
              <Badge variant={
                priceStats.trend === 'up' ? 'default' : 
                priceStats.trend === 'down' ? 'destructive' : 'secondary'
              }>
                {priceStats.trend === 'up' && <TrendingUp className="w-3 h-3 mr-1" />}
                {priceStats.trend === 'down' && <TrendingDown className="w-3 h-3 mr-1" />}
                {priceStats.trend === 'stable' && <Minus className="w-3 h-3 mr-1" />}
                {priceStats.trendPercentage.toFixed(1)}%
              </Badge>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {/* Simple SVG Chart */}
          <div className="relative h-64 w-full">
            <svg className="w-full h-full" viewBox="0 0 400 200">
              {/* Grid lines */}
              <defs>
                <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                  <path d="M 40 0 L 0 0 0 40" fill="none" stroke="#f1f5f9" strokeWidth="1"/>
                </pattern>
              </defs>
              <rect width="100%" height="100%" fill="url(#grid)" />
              
              {/* Price line */}
              {chartData.length > 1 && (
                <path
                  d={chartData.map((point, index) => {
                    const x = (index / (chartData.length - 1)) * 380 + 10;
                    const y = 190 - ((point.price - minPrice) / priceRange) * 180;
                    return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
                  }).join(' ')}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2"
                  className="drop-shadow-sm"
                />
              )}
              
              {/* Data points */}
              {chartData.map((point, index) => {
                const x = (index / Math.max(chartData.length - 1, 1)) * 380 + 10;
                const y = 190 - ((point.price - minPrice) / Math.max(priceRange, 1)) * 180;
                
                return (
                  <circle
                    key={index}
                    cx={x}
                    cy={y}
                    r="4"
                    fill="#3b82f6"
                    className="hover:r-6 transition-all cursor-pointer"
                  >
                    <title>{`${point.label}: $${point.price.toFixed(2)}`}</title>
                  </circle>
                );
              })}
              
              {/* Y-axis labels */}
              <text x="5" y="15" fontSize="12" fill="#64748b" textAnchor="start">
                ${maxPrice.toFixed(0)}
              </text>
              <text x="5" y="105" fontSize="12" fill="#64748b" textAnchor="start">
                ${((maxPrice + minPrice) / 2).toFixed(0)}
              </text>
              <text x="5" y="195" fontSize="12" fill="#64748b" textAnchor="start">
                ${minPrice.toFixed(0)}
              </text>
            </svg>
            
            {/* X-axis labels */}
            <div className="flex justify-between mt-2 px-2 text-xs text-gray-500">
              {chartData.length > 0 && (
                <>
                  <span>{chartData[0]?.label}</span>
                  {chartData.length > 2 && (
                    <span>{chartData[Math.floor(chartData.length / 2)]?.label}</span>
                  )}
                  <span>{chartData[chartData.length - 1]?.label}</span>
                </>
              )}
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Price Statistics */}
      {priceStats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <DollarSign className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Current</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${priceStats.current.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-blue-600" />
                <div>
                  <p className="text-sm text-gray-600">Average</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${priceStats.avg.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingUp className="w-4 h-4 text-red-600" />
                <div>
                  <p className="text-sm text-gray-600">Highest</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${priceStats.max.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-4">
              <div className="flex items-center space-x-2">
                <TrendingDown className="w-4 h-4 text-green-600" />
                <div>
                  <p className="text-sm text-gray-600">Lowest</p>
                  <p className="text-lg font-semibold text-gray-900">
                    ${priceStats.min.toFixed(2)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* AI Recommendations */}
      {showRecommendations && recommendations && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center text-sm">
              <DollarSign className="w-4 h-4 mr-2" />
              AI Price Recommendations
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-green-50 border border-green-200 rounded-lg">
                <div>
                  <p className="font-medium text-gray-900">Recommended Price</p>
                  <p className="text-2xl font-bold text-green-600">
                    ${parseFloat(recommendations.recommendedPrice).toFixed(2)}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-sm text-gray-600">Change</p>
                  <p className={`font-semibold ${
                    recommendations.priceChangePercent > 0 ? 'text-green-600' : 'text-red-600'
                  }`}>
                    {recommendations.priceChangePercent > 0 ? '+' : ''}
                    {recommendations.priceChangePercent.toFixed(1)}%
                  </p>
                </div>
              </div>
              
              <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm font-medium text-blue-900 mb-2">AI Analysis</p>
                <p className="text-sm text-blue-800">{recommendations.reasoning}</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="text-xs text-blue-700">
                    Confidence: {Math.round(recommendations.confidence * 100)}%
                  </span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
