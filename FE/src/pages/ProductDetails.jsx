import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Star, 
  Heart, 
  Share2, 
  MessageSquare, 
  TrendingUp,
  Package,
  Truck,
  Shield,
  Info
} from "lucide-react";
import { productAPI, negotiationAPI, queryClient } from "@/lib/api";
import { authManager } from "@/lib/auth";
import NegotiationChat from "@/components/NegotiationChat";
import RFQForm from "@/components/RFQForm";

export default function ProductDetails() {
  const { id } = useParams();
  const { toast } = useToast();
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [isRFQOpen, setIsRFQOpen] = useState(false);
  const [quantity, setQuantity] = useState(1);

  const user = authManager.getUser();

  // Fetch product details
const { data: product, isLoading: productLoading } = useQuery({
  queryKey: ["/api/products", id],
  queryFn: async () => {
    const res = await productAPI.getProduct(id);
    return res.data;
  },
  enabled: !!id,
});

useEffect(() => {
  if (product) {
    console.log("Fetched product:", product);
  }
}, [product]);


  // Start negotiation mutation
  const startNegotiationMutation = useMutation({
    mutationFn: negotiationAPI.createNegotiation,
    onSuccess: () => {
      setIsNegotiationOpen(true);
      toast({
        title: "Negotiation started",
        description: "You can now negotiate the price with the vendor.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error starting negotiation",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  const handleStartNegotiation = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required",
        description: "Please login to start price negotiation.",
      });
      return;
    }

    startNegotiationMutation.mutate({
      productId: product.id,
      quantity,
      initialOffer: parseFloat(product.price) * 0.9, // Start with 10% discount
    });
  };

  const handleGetQuote = () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Login required", 
        description: "Please login to request a quote.",
      });
      return;
    }
    setIsRFQOpen(true);
  };

  if (productLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <Skeleton className="h-96 w-full" />
            <div className="space-y-4">
              <Skeleton className="h-8 w-3/4" />
              <Skeleton className="h-6 w-1/2" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-12 w-32" />
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Product not found.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Product Header */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Product Images */}
          <div className="space-y-4">
            <Card>
              <CardContent className="p-0">
                <img 
                  src={product.images?.[0] || "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=600&h=400&fit=crop"} 
                  alt={product.name}
                  className="w-full h-96 object-cover rounded-lg"
                />
              </CardContent>
            </Card>
            {product.images?.length > 1 && (
              <div className="grid grid-cols-4 gap-2">
                {product.images.slice(1, 5).map((image, index) => (
                  <img 
                    key={index}
                    src={image} 
                    alt={`${product.name} ${index + 2}`}
                    className="w-full h-20 object-cover rounded-md border-2 border-transparent hover:border-blue-500 cursor-pointer transition-colors"
                  />
                ))}
              </div>
            )}
          </div>

          {/* Product Info */}
          <div className="space-y-6">
            <div>
              <Badge className="mb-2">{product.category?.name || "Uncategorized"}</Badge>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">{product.name}</h1>
              <p className="text-gray-600">{product.shortDescription}</p>
            </div>

            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-1">
                <Star className="w-5 h-5 text-yellow-400 fill-current" />
                <span className="font-medium">{parseFloat(product.rating).toFixed(1)}</span>
                <span className="text-gray-600">({product.reviewCount} reviews)</span>
              </div>
              <Separator orientation="vertical" className="h-4" />
              <span className="text-gray-600">{product.views} views</span>
            </div>

            <div className="space-y-2">
              <div className="flex items-center space-x-3">
                <span className="text-3xl font-bold text-gray-900">
                  ${parseFloat(product.price).toLocaleString()}
                </span>
                {product.originalPrice && (
                  <span className="text-xl text-gray-500 line-through">
                    ${parseFloat(product.originalPrice).toLocaleString()}
                  </span>
                )}
              </div>
              {product.originalPrice && (
                <Badge variant="secondary" className="text-green-600">
                  Save {Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)}%
                </Badge>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4 text-sm">
              <div className="flex items-center space-x-2">
                <Package className="w-4 h-4 text-gray-400" />
                <span>Min Order: {product.minOrderQuantity}</span>
              </div>
              <div className="flex items-center space-x-2">
                <Truck className="w-4 h-4 text-gray-400" />
                <span>In Stock: {product.stockQuantity}</span>
              </div>
            </div>

            <Separator />

            {/* Action Buttons */}
            <div className="space-y-4">
              <div className="flex space-x-4">
                <Button 
                  onClick={handleGetQuote} 
                  size="lg" 
                  className="flex-1"
                >
                  Get Quote
                </Button>
                <Button 
                  variant="outline" 
                  onClick={handleStartNegotiation}
                  disabled={startNegotiationMutation.isPending}
                  size="lg"
                  className="flex-1"
                >
                  <MessageSquare className="w-4 h-4 mr-2" />
                  {startNegotiationMutation.isPending ? "Starting..." : "Negotiate Price"}
                </Button>
              </div>
              
              <div className="flex space-x-2">
                <Button variant="outline" size="sm">
                  <Heart className="w-4 h-4 mr-2" />
                  Save
                </Button>
                <Button variant="outline" size="sm">
                  <Share2 className="w-4 h-4 mr-2" />
                  Share
                </Button>
              </div>
            </div>

            {/* Vendor Info */}
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-gray-900">Sold by</p>
                    <p className="text-blue-600 font-semibold">{product.vendor?.companyName || "Vendor"}</p>
                    <div className="flex items-center space-x-2 mt-1">
                      <div className="flex">
                        {[...Array(5)].map((_, i) => (
                          <Star key={i} className="w-3 h-3 text-yellow-400 fill-current" />
                        ))}
                      </div>
                      <span className="text-xs text-gray-600">4.8 vendor rating</span>
                    </div>
                  </div>
                  <div className="text-right">
                    <Shield className="w-6 h-6 text-green-600 mx-auto" />
                    <span className="text-xs text-green-600">Verified</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="description" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="description">Description</TabsTrigger>
            <TabsTrigger value="specifications">Specifications</TabsTrigger>
            <TabsTrigger value="reviews">Reviews</TabsTrigger>
            <TabsTrigger value="shipping">Shipping</TabsTrigger>
          </TabsList>

          <TabsContent value="description">
            <Card>
              <CardHeader>
                <CardTitle>Product Description</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="prose max-w-none">
                  <p className="text-gray-700 leading-relaxed">{product.description}</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specifications">
            <Card>
              <CardHeader>
                <CardTitle>Technical Specifications</CardTitle>
              </CardHeader>
              <CardContent>
                {product.specifications && Object.keys(product.specifications).length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.entries(product.specifications).map(([key, value]) => (
                      <div key={key} className="flex justify-between py-2 border-b border-gray-100">
                        <span className="font-medium text-gray-900">{key}</span>
                        <span className="text-gray-600">{value}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Info className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No technical specifications available.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews">
            <Card>
              <CardHeader>
                <CardTitle>Customer Reviews</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-600">No reviews yet. Be the first to review this product!</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="shipping">
            <Card>
              <CardHeader>
                <CardTitle>Shipping Information</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center space-x-3">
                    <Truck className="w-5 h-5 text-green-600" />
                    <div>
                      <p className="font-medium">Free Shipping</p>
                      <p className="text-sm text-gray-600">On orders over $1,000</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Package className="w-5 h-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Estimated Delivery</p>
                      <p className="text-sm text-gray-600">5-7 business days</p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Shield className="w-5 h-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Return Policy</p>
                      <p className="text-sm text-gray-600">30-day returns accepted</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Dialogs */}
        <Dialog open={isNegotiationOpen} onOpenChange={setIsNegotiationOpen}>
          <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Price Negotiation - {product.name}</DialogTitle>
            </DialogHeader>
            <NegotiationChat product={product} />
          </DialogContent>
        </Dialog>

        <Dialog open={isRFQOpen} onOpenChange={setIsRFQOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Request Quote - {product.name}</DialogTitle>
            </DialogHeader>
            <RFQForm product={product} onSuccess={() => setIsRFQOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
