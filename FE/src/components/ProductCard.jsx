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
  TrendingUp,
  CheckCircle
} from "lucide-react";
import { productAPI, queryClient, orderAPI } from "@/lib/api";
import { authManager } from "@/lib/auth";
import ProductFormDialog from "./ProductFormDialog";
import { useLocation } from "wouter";

export default function ProductCard({ product}) {
  const { toast } = useToast();
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const user = authManager.getUser();
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
   const [, navigate] = useLocation();

const createOrderMutation = useMutation({
  mutationFn: (orderData) => orderAPI.createOrder(orderData).then((res) => res.data),
  onSuccess: (data) => {
    console.log("✅ Order created:", data);
    queryClient.invalidateQueries(["orders"]);

    // ✅ Show toast
    toast({
      title: "Order Created 🎉",
      description: "Your order has been placed successfully.",
    });

    // ✅ Redirect
    navigate("/buyer-dashboard");
  },
  onError: (err) => {
    console.error("❌ Error creating order:", err);

    toast({
      title: "Order Failed ❌",
      description: err.response?.data?.message || "Something went wrong. Please try again.",
      variant: "destructive",
    });
  },
});

const handleAcceptDeal = () => {
  createOrderMutation.mutate({
    buyerId: user?.id,
    vendorId: product.vendorId,
    productId: product.id,
    quantity: 1,
    unitPrice: product.price,
    totalAmount: product.price * 1,
  });
};

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

  const updateProductMutation = useMutation({
    mutationFn: ({ id, updates }) => productAPI.updateProduct(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/vendor-stats"] });
      setIsEditDialogOpen(false);
      toast({ title: "Product updated", description: "Your product has been updated." });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating product",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

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

  //   const currentNegotiation = negotiations?.find(
  //   n => n.productId === product.id && n.isActive
  // );

  //   const acceptNegotiationMutation = useMutation({
  //     mutationFn: negotiationAPI.acceptNegotiation,
  //     onSuccess: () => {
  //       queryClient.invalidateQueries({ queryKey: ["/api/negotiations"] });
  //       toast({
  //         title: "Deal accepted!",
  //         description: "Your negotiation has been accepted and an order has been created.",
  //       });
  //     },
  //     onError: (error) => {
  //       toast({
  //         variant: "destructive",
  //         title: "Error accepting deal",
  //         description: error.response?.data?.message || "An error occurred",
  //       });
  //     },
  //   });


//   console.log("user", user);
// console.log("product.vendorId", product.vendorId);

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
            {product.categoryName || "Uncategorized"}
            
          </Badge>
          
          <div className="flex items-center space-x-1">
            { user?.id === product.vendorId ? (
              <div className="flex space-x-1">
                {/* <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  <Edit className="w-3 h-3" />
                </Button> */}
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
        {!user?.id === product.vendorId && (
          <div className="flex items-center justify-between text-sm text-gray-600 mb-3">
            <span>{product.vendor?.companyName || "Vendor"}</span>
            <span>{product.location || "Location"}</span>
          </div>
        )}

        {/* Product Stats for Vendor */}
        {user?.id === product.vendorId && (
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
          {user?.id === product.vendorId || user?.role == "admin" ? (
            <>
            {/* Edit Product Dialog */}
            <ProductFormDialog
              open={isEditDialogOpen}
              onOpenChange={setIsEditDialogOpen}
              initialData={product}
              onSubmit={(updates) => updateProductMutation.mutate({ id: product.id, updates })}
              loading={updateProductMutation.isPending}
            />
            <Button size="sm" variant="outline" className="flex-1" onClick={() => setIsEditDialogOpen(true)}>
              <Edit className="w-3 h-3 mr-2" />
              Edit
            </Button>
            <Button size="sm" className="flex-1">
              <Link href={`/product/${product.id}`}>
               View Details
              </Link>
             
            </Button>
          </>
          ) : (
            <>
               <Button
                    size="sm"
                    onClick={handleAcceptDeal}
                    // disabled={acceptNegotiationMutation.isPending}
                    className="w-full text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Accept Deal
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
