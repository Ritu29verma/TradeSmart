import { useState } from "react";
import { Link } from "wouter";
import { useMutation } from "@tanstack/react-query";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { 
  Heart, 
  MessageSquare, 
  Star, 
  Edit, 
  Trash2,
  Eye,
  TrendingUp
} from "lucide-react";
import { productAPI, queryClient } from "@/lib/api";
import { authManager } from "@/lib/auth";

export default function ProductCard({ product, showVendorActions = false }) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const user = authManager.getUser();

  // Delete product mutation
  const deleteProductMutation = useMutation({
    mutationFn: productAPI.deleteProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/vendor-stats"] });
      setIsDeleteDialogOpen(false);
      toast({
        title: "Product deleted",
        description: "Your product has been successfully removed.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error deleting product",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  const handleDelete = () => {
    deleteProductMutation.mutate(product.id);
  };

  const getCategoryColor = (category) => {
    const colors = {
      "Industrial Equipment": "blue",
      "Electronics": "green",
      "Safety & Security": "amber",
      "Automation": "purple",
    };
    return colors[category] || "gray";
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString();
  };

  const calculateDiscount = (original, current) => {
    if (!original) return 0;
    return Math.round(((original - current) / original) * 100);
  };

  return (
    <Card className="group hover:shadow-lg transition-all duration-300 overflow-hidden">
      {/* Product Image */}
      <Link href={`/product/${product.id}`}>
        <div className="aspect-w-16 aspect-h-12 bg-gray-200 overflow-hidden">
          <img 
            src={product.images?.[0] || "https://images.unsplash.com/photo-1518640467707-6811f4a6ab73?w=400&h=300&fit=crop"} 
            alt={product.name}
            className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
          />
        </div>
      </Link>
      
      <CardContent className="p-4">
        {/* Header with Category and Actions */}
        <div className="flex items-center justify-between mb-2">
          <Badge variant="secondary" className={`text-xs bg-${getCategoryColor(product.category?.name)}-100 text-${getCategoryColor(product.category?.name)}-800`}>
            {product.category?.name || "Uncategorized"}
          </Badge>
          
          <div className="flex items-center space-x-1">
            {showVendorActions && user?.id === product.vendorId ? (
              <div className="flex space-x-1">
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="w-3 h-3" />
                </Button>
                <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
                  <DialogTrigger asChild>
                    <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-red-600 hover:text-red-700">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Delete Product</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <p className="text-gray-600">
                        Are you sure you want to delete "{product.name}"? This action cannot be undone.
                      </p>
                      <div className="flex space-x-2">
                        <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                          Cancel
                        </Button>
                        <Button 
                          variant="destructive" 
                          onClick={handleDelete}
                          disabled={deleteProductMutation.isPending}
                        >
                          {deleteProductMutation.isPending ? "Deleting..." : "Delete"}
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            ) : (
              <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                <Heart className="w-3 h-3" />
              </Button>
            )}
          </div>
        </div>
        
        {/* Product Name */}
        <Link href={`/product/${product.id}`}>
          <h3 className="font-semibold text-gray-900 mb-2 line-clamp-2 hover:text-blue-600 transition-colors">
            {product.name}
          </h3>
        </Link>
        
        {/* Short Description */}
        {product.shortDescription && (
          <p className="text-sm text-gray-600 mb-3 line-clamp-2">
            {product.shortDescription}
          </p>
        )}
        
        {/* Price Section */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-2">
            <span className="text-lg font-bold text-gray-900">
              ${formatPrice(product.price)}
            </span>
            {product.originalPrice && (
              <>
                <span className="text-sm text-gray-500 line-through">
                  ${formatPrice(product.originalPrice)}
                </span>
                <Badge variant="secondary" className="text-green-600 text-xs">
                  -{calculateDiscount(product.originalPrice, product.price)}%
                </Badge>
              </>
            )}
          </div>
          
          {/* Rating */}
          <div className="flex items-center space-x-1">
            <Star className="w-4 h-4 text-yellow-400 fill-current" />
            <span className="text-sm text-gray-600">{parseFloat(product.rating || 0).toFixed(1)}</span>
          </div>
        </div>
        
        {/* Vendor and Location */}
        {!showVendorActions && (
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>{product.vendor?.companyName || "Vendor"}</span>
            <span>{product.location || "Location"}</span>
          </div>
        )}

        {/* Product Stats for Vendor */}
        {showVendorActions && (
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-1">
                <Eye className="w-3 h-3" />
                <span>{product.views || 0}</span>
              </div>
              <div className="flex items-center space-x-1">
                <TrendingUp className="w-3 h-3" />
                <span>{product.stockQuantity || 0} in stock</span>
              </div>
            </div>
            <Badge variant={product.isActive ? "default" : "secondary"}>
              {product.isActive ? "Active" : "Inactive"}
            </Badge>
          </div>
        )}
        
        {/* Action Buttons */}
        <div className="flex space-x-2">
          {showVendorActions ? (
            <>
              <Button size="sm" variant="outline" className="flex-1">
                <Edit className="w-3 h-3 mr-2" />
                Edit
              </Button>
              <Button size="sm" className="flex-1">
                View Details
              </Button>
            </>
          ) : (
            <>
              <Button size="sm" className="flex-1">
                Get Quote
              </Button>
              <Button variant="outline" size="sm">
                <MessageSquare className="w-4 h-4" />
              </Button>
            </>
          )}
        </div>
        
        {/* Special Badges */}
        {product.isAiOptimized && (
          <div className="mt-2">
            <Badge className="text-xs bg-gradient-to-r from-blue-500 to-purple-600 text-white">
              AI Optimized
            </Badge>
          </div>
        )}
        
        {product.isTrending && (
          <div className="mt-2">
            <Badge className="text-xs bg-orange-100 text-orange-800">
              Trending
            </Badge>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
