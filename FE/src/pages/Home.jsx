import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  MessageSquare, 
  BarChart3, 
  Shield, 
  Search,
  Star,
  ArrowRight,
  CheckCircle
} from "lucide-react";

export default function Home() {
  const stats = [
    { label: "Active Vendors", value: "2,500+" },
    { label: "Products", value: "50K+" },
    { label: "Transactions", value: "$2.5M+" },
    { label: "Avg. Savings", value: "15%" },
  ];

  const features = [
    {
      icon: Brain,
      title: "AI Price Negotiation",
      description: "Intelligent chatbot handles price negotiations, analyzing market data and user patterns to find optimal deals for both parties.",
      color: "blue",
    },
    {
      icon: TrendingUp,
      title: "Dynamic Pricing",
      description: "Real-time price adjustments based on demand, inventory levels, seasonality, and competitor analysis using machine learning.",
      color: "green",
    },
    {
      icon: MessageSquare,
      title: "Smart RFQ System",
      description: "Streamlined Request for Quote process with automated vendor matching and intelligent quote comparison.",
      color: "amber",
    },
  ];

  const products = [
    {
      id: 1,
      name: "CNC Precision Machine",
      price: 15500,
      originalPrice: 18000,
      image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=300&fit=crop",
      category: "Industrial Equipment",
      vendor: "TechCorp Solutions",
      rating: 4.8,
      trending: true,
    },
    {
      id: 2,
      name: "Industrial IoT Sensors",
      price: 285,
      image: "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=300&fit=crop",
      category: "Electronics",
      vendor: "ElectroMax Inc.",
      rating: 4.9,
      aiOptimized: true,
    },
    {
      id: 3,
      name: "Safety Equipment Bundle",
      price: 125,
      originalPrice: 153,
      image: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=400&h=300&fit=crop",
      category: "Safety & Security",
      vendor: "SafeGuard Co.",
      rating: 4.7,
    },
    {
      id: 4,
      name: "Smart Building Control",
      price: 8950,
      image: "https://images.unsplash.com/photo-1560472354-b33ff0c44a43?w=400&h=300&fit=crop",
      category: "Automation",
      vendor: "AutoTech Systems",
      rating: 4.6,
      trending: true,
    },
  ];

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="relative bg-white overflow-hidden">
        <div className="hero-pattern absolute inset-0"></div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24">
          <div className="text-center">
            <h1 className="text-4xl md:text-6xl font-bold text-gray-900 mb-6 animate-fade-in">
              AI-Powered B2B
              <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                {" "}Marketplace
              </span>
            </h1>
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto animate-slide-up">
              Transform your B2B transactions with intelligent price negotiation, dynamic pricing algorithms, and seamless vendor management.
            </p>
            
            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12 animate-slide-up">
              <Button size="lg" asChild className="text-lg px-8 py-3">
                <Link href="/register">Start Selling</Link>
              </Button>
              <Button variant="outline" size="lg" asChild className="text-lg px-8 py-3">
                <Link href="/marketplace">Browse Products</Link>
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8 max-w-4xl mx-auto">
              {stats.map((stat, index) => (
                <div key={index} className="text-center">
                  <div className="text-3xl font-bold text-gray-900">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Intelligent B2B Commerce</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Powered by AI to optimize every aspect of your business transactions
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="hover:shadow-lg transition-all duration-300 border-gray-100">
                <CardContent className="p-8">
                  <div className={`w-12 h-12 bg-${feature.color}-100 rounded-lg flex items-center justify-center mb-6`}>
                    <feature.icon className={`w-6 h-6 text-${feature.color}-600`} />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-4">{feature.title}</h3>
                  <p className="text-gray-600 mb-6">{feature.description}</p>
                  
                  {feature.title === "AI Price Negotiation" && (
                    <div className="ai-glow bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-8 h-8 bg-blue-500 rounded-full flex items-center justify-center animate-float">
                          <span className="text-white text-xs font-bold">AI</span>
                        </div>
                        <div className="flex-1">
                          <div className="text-sm text-gray-700">"Based on current market trends, I can offer $850 for bulk orders..."</div>
                        </div>
                      </div>
                    </div>
                  )}
                  
                  {feature.title === "Dynamic Pricing" && (
                    <div className="bg-green-50 rounded-lg p-4">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-sm text-gray-600">Price Optimization</span>
                        <span className="text-sm font-semibold text-green-600">+12% Revenue</span>
                      </div>
                      <Progress value={78} className="h-2" />
                    </div>
                  )}
                  
                  {feature.title === "Smart RFQ System" && (
                    <div className="bg-amber-50 rounded-lg p-4">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-gray-600">Active RFQs</span>
                        <span className="font-semibold text-amber-600">24</span>
                      </div>
                      <div className="flex items-center justify-between text-sm mt-2">
                        <span className="text-gray-600">Avg Response Time</span>
                        <span className="font-semibold text-amber-600">2.3h</span>
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Products Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
              <p className="text-gray-600 mt-2">Discover quality B2B products from verified vendors</p>
            </div>
            <Button asChild>
              <Link href="/marketplace">View All Products</Link>
            </Button>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {products.map((product) => (
              <Card key={product.id} className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
                <div className="aspect-w-16 aspect-h-12 bg-gray-200 overflow-hidden">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="secondary" className="text-xs">
                      {product.category}
                    </Badge>
                    {product.trending && (
                      <Badge className="text-xs bg-blue-100 text-blue-800">Trending</Badge>
                    )}
                    {product.aiOptimized && (
                      <Badge className="text-xs bg-green-100 text-green-800">AI Optimized</Badge>
                    )}
                  </div>
                  
                  <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2">{product.name}</h3>
                  
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-2">
                      <span className="text-lg font-bold text-gray-900">${product.price.toLocaleString()}</span>
                      {product.originalPrice && (
                        <span className="text-sm text-gray-500 line-through">
                          ${product.originalPrice.toLocaleString()}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center space-x-1">
                      <Star className="w-4 h-4 text-yellow-400 fill-current" />
                      <span className="text-sm text-gray-600">{product.rating}</span>
                    </div>
                  </div>
                  
                  <div className="text-sm text-gray-600 mb-3">{product.vendor}</div>
                  
                  <div className="flex space-x-2">
                    <Button size="sm" className="flex-1">
                      Get Quote
                    </Button>
                    <Button variant="outline" size="sm">
                      <MessageSquare className="w-4 h-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* AI Negotiation Demo */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">AI-Powered Price Negotiation</h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Let our AI negotiate the best deals for you, analyzing market data and vendor patterns in real-time
            </p>
          </div>

          <div className="max-w-4xl mx-auto">
            <Card className="overflow-hidden">
              <div className="gradient-bg px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-white bg-opacity-20 rounded-full flex items-center justify-center">
                      <span className="text-white font-bold">AI</span>
                    </div>
                    <div>
                      <h3 className="text-white font-semibold">Negotiation Assistant</h3>
                      <p className="text-blue-100 text-sm">Analyzing CNC Precision Machine pricing...</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse"></div>
                    <span className="text-white text-sm">Online</span>
                  </div>
                </div>
              </div>

              <CardContent className="p-6 space-y-4 max-h-96 overflow-y-auto">
                {/* Sample conversation messages */}
                <div className="flex justify-end">
                  <div className="max-w-xs bg-blue-600 text-white rounded-lg px-4 py-2">
                    <p className="text-sm">I'm interested in the CNC Precision Machine. Can we negotiate the price from $15,500?</p>
                    <span className="text-xs text-blue-200 mt-1 block">2:34 PM</span>
                  </div>
                </div>

                <div className="flex justify-start">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 gradient-bg rounded-full flex items-center justify-center flex-shrink-0">
                      <span className="text-white text-xs font-bold">AI</span>
                    </div>
                    <div className="max-w-xs bg-gray-100 rounded-lg px-4 py-2">
                      <p className="text-sm text-gray-800">I've analyzed current market prices and TechCorp's pricing history. Based on similar CNC machines and bulk order patterns, I can negotiate down to <strong>$13,800</strong> for you.</p>
                      <div className="mt-3 flex space-x-2">
                        <Button size="sm" className="text-xs">Accept Deal</Button>
                        <Button variant="outline" size="sm" className="text-xs">Counter-offer</Button>
                      </div>
                      <span className="text-xs text-gray-500 mt-1 block">2:35 PM</span>
                    </div>
                  </div>
                </div>

                <div className="flex justify-center">
                  <div className="bg-green-100 border border-green-300 rounded-lg px-4 py-2 max-w-xs">
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="w-5 h-5 text-green-600" />
                      <span className="text-sm text-green-800 font-medium">Deal Accepted!</span>
                    </div>
                    <p className="text-xs text-green-700 mt-1">Final Price: $14,000 • Saved: $1,500</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">Ready to Transform Your B2B Commerce?</h2>
          <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
            Join thousands of businesses already using TradeSmart to optimize their buying and selling processes
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-3">
              <Link href="/register">
                Get Started Free <ArrowRight className="ml-2 w-5 h-5" />
              </Link>
            </Button>
            <Button variant="outline" size="lg" asChild className="text-lg px-8 py-3">
              <Link href="/ai-tools">Explore AI Tools</Link>
            </Button>
          </div>
        </div>
      </section>
    </div>
  );
}
