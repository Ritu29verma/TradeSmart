import { useState, useEffect } from "react";
import { useParams } from "wouter";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Plus,
  Package,
  ShoppingCart,
  MessageSquare,
  Star,
  DollarSign,
  TrendingUp,
  Eye,
  Edit,
  Trash2,
  BarChart3
} from "lucide-react";
import { productAPI, dashboardAPI, categoryAPI, queryClient, rfqAPI, negotiationAPI , orderAPI} from "@/lib/api";
import { authManager } from "@/lib/auth";
import ProductCard from "@/components/ProductCard";
import NegotiationChat from "@/components/NegotiationChat";
import { socket, joinNegotiationRoom } from "@/lib/socket";

export default function VendorDashboard() {
  const { toast } = useToast();
  const [isAddProductOpen, setIsAddProductOpen] = useState(false);
  const [productForm, setProductForm] = useState({
    name: "",
    description: "",
    shortDescription: "",
    price: "",
    originalPrice: "",
    categoryId: "",
    minOrderQuantity: "1",
    stockQuantity: "",
    specifications: "",
    images: []
  });
  const [unreadCount, setUnreadCount] = useState(0);
  const [isNegotiationOpen, setIsNegotiationOpen] = useState(false);
  const [activeNegotiationId, setActiveNegotiationId] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const user = authManager.getUser();
  const isVendor = user?.role === "vendor";
  const { id } = useParams();
  const vendorId = user?.id;

  // Fetch vendor stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/dashboard/vendor-stats'],
    queryFn: () => dashboardAPI.getVendorStats().then(res => res.data),
    enabled: !!sessionStorage.getItem('authToken'), // or authManager.isAuthenticated()
  });

  // Negotiations
  const { data: negotiations = [], isLoading: negotiationsLoading } = useQuery({
    queryKey: ['/negotiations'],
    queryFn: () => negotiationAPI.getNegotiations().then(res => res.data),
    enabled: !!user && user.role === "vendor",
  });
  // console.log(negotiations)


  // Fetch vendor's products
  const { data: products, isLoading: productsLoading } = useQuery({
    queryKey: ['/api/products', user?.id],
    queryFn: () =>
      productAPI.getProducts({ vendorId: user?.id })
        .then(res => res.data),
    enabled: !!user?.id,
  });

  // Fetch single product only if ID exists
  const { data: product, isLoading: productLoading } = useQuery({
    queryKey: ["/products", id],
    queryFn: () => productAPI.getProduct(id).then(res => res.data),
    enabled: !!id,
  });

  // Fetch categories
  const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  // Create product mutation
  const createProductMutation = useMutation({
    mutationFn: productAPI.createProduct,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/products"] });
      queryClient.invalidateQueries({ queryKey: ["/api/dashboard/vendor-stats"] });
      setIsAddProductOpen(false);
      setProductForm({
        name: "",
        description: "",
        shortDescription: "",
        price: "",
        originalPrice: "",
        categoryId: "",
        categoryName: "",
        minOrderQuantity: "1",
        stockQuantity: "",
        specifications: "",
        images: []
      });
      toast({
        title: "Product created",
        description: "Your product has been successfully added to the marketplace.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error creating product",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  // Fetch vendor's RFQs
  const { data: rfqs, isLoading: rfqsLoading, error: rfqsError } = useQuery({
    queryKey: ['vendor-rfqs', user?.id],
    queryFn: () => rfqAPI.getRfqs().then(res => res.data)
      .then(all => {
        return all.filter(rfq => {
          return true;
        });
      }),
    enabled: !!user?.id,
  });

  // Fetch vendor's Orders
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useQuery({
    queryKey: ["vendor-orders"],
    queryFn: () => orderAPI.getOrders().then(res => res.data),
    enabled: !!user && user.role === "vendor",
  });

  // console.log(orders)

  //incoming Rfqs
  const { data: incomingRfqs, isLoading, error } = useQuery({
    queryKey: ["incoming-rfqs"],
    queryFn: () => rfqAPI.incomingRfqs().then(res => res.data),
    enabled: !!user && user.role === "vendor",
  });

  const createQuoteMutation = useMutation({
    mutationFn: ({ rfqId, quote }) => rfqAPI.createQuote(rfqId, quote).then((r) => r.data),
    onSuccess: (data) => {
      toast({
        title: "Quote submitted",
        description: "Your quote has been sent to the buyer.",
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Failed to submit quote",
        description: err.response?.data?.message || err.message,
      });
    },
  });

  const handleProductSubmit = (e) => {
    e.preventDefault();

    const productData = {
      ...productForm,
      price: parseFloat(productForm.price),
      originalPrice: productForm.originalPrice ? parseFloat(productForm.originalPrice) : null,
      minOrderQuantity: parseInt(productForm.minOrderQuantity),
      stockQuantity: parseInt(productForm.stockQuantity),
      specifications: productForm.specifications ? JSON.parse(productForm.specifications) : {},
    };

    createProductMutation.mutate(productData);
  };

  if (user?.role !== "vendor") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Access denied. Vendor role required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  useEffect(() => {
    if (product) {
      setActiveProduct(product);
    }
  }, [product]);

 useEffect(() => {
    // 1️⃣ Connect socket when component mounts
    if (!socket.connected) {
      socket.connect();
    }

    // 2️⃣ When socket connects, join room
    socket.on("connect", () => {
      console.log("🟢 Socket connected:", socket.id);

      if (id && product?.id) {
        const negotiation = negotiations?.find(
          n => n.productId === product.id && n.isActive
        );

        if (negotiation) {
          // console.log(`[SOCKET] Vendor joining negotiation room: ${negotiation.id}`);
          socket.emit("joinNegotiationRoom", negotiation.id);
        } else {
          console.log("[SOCKET] No active negotiation found for this product");
        }
      }
    });

     socket.on("negotiation:new", (data) => {
    console.log("📩 New negotiation notification:", data);
    toast({
      title: "New Negotiation",
      description: `${data.buyerName} started a negotiation for ${data.productName}`,
    });
    // Optionally update state to show the negotiation in a list
  });

    // 4️⃣ Cleanup on unmount
    return () => {
      console.log("🔴 Disconnecting socket");
      socket.off("connect");
     socket.off("negotiation:new");
      socket.disconnect();
    };
  }, []);

if (id) {
  if (productLoading) return <p>Loading product...</p>;
  if (!product) return <p>Product not found</p>;

  return (
    <div>
      <NegotiationChat product={product} />
    </div>
  );
}

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Vendor Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your products and track your business performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Products</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalProducts || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Orders</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalOrders || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <DollarSign className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Revenue</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      ${parseFloat(stats?.totalRevenue || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-amber-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active RFQs</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.activeRfqs || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Main Content */}
<Tabs defaultValue="products" className="space-y-10">
  <TabsList className="flex flex-wrap gap-0 w-full bg-gray-100 p-2 rounded">
    {[
      ["products", "Products"],
      ["orders", "Orders"],
      ["rfqs", "RFQs"],
      ["incoming-rfqs", "Your RFQs"],
      ["negotiations", "Negotiations"]
    ].map(([value, label]) => (
      <TabsTrigger
        key={value}
        value={value}
        className="flex-1 min-w-[100px] text-center text-sm sm:text break-words whitespace-nowrap"
      >
        {label}
      </TabsTrigger>
    ))}
  </TabsList>

          <TabsContent value="products" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Products</h2>
              <Dialog open={isAddProductOpen} onOpenChange={setIsAddProductOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Product
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle>Add New Product</DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleProductSubmit} className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="name">Product Name</Label>
                        <Input
                          id="name"
                          value={productForm.name}
                          onChange={(e) => setProductForm(prev => ({ ...prev, name: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="categoryId">Category</Label>
                        <Select
                          value={productForm.categoryId}
                          onValueChange={(value) => {
                            const selectedCategory = categories?.find((cat) => cat.id === value);
                            setProductForm((prev) => ({
                              ...prev,
                              categoryId: value,
                              categoryName: selectedCategory ? selectedCategory.name : "" // ✅ store name too
                            }));
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                          <SelectContent>
                            {categories?.map((category) => (
                              <SelectItem key={category.id} value={category.id}>
                                {category.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    </div>

                    <div>
                      <Label htmlFor="shortDescription">Short Description</Label>
                      <Input
                        id="shortDescription"
                        value={productForm.shortDescription}
                        onChange={(e) => setProductForm(prev => ({ ...prev, shortDescription: e.target.value }))}
                        placeholder="Brief product description"
                      />
                    </div>

                    <div>
                      <Label htmlFor="description">Full Description</Label>
                      <Textarea
                        id="description"
                        value={productForm.description}
                        onChange={(e) => setProductForm(prev => ({ ...prev, description: e.target.value }))}
                        rows={3}
                        required
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="price">Price ($)</Label>
                        <Input
                          id="price"
                          type="number"
                          step="0.01"
                          value={productForm.price}
                          onChange={(e) => setProductForm(prev => ({ ...prev, price: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="originalPrice">Original Price (optional)</Label>
                        <Input
                          id="originalPrice"
                          type="number"
                          step="0.01"
                          value={productForm.originalPrice}
                          onChange={(e) => setProductForm(prev => ({ ...prev, originalPrice: e.target.value }))}
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label htmlFor="minOrderQuantity">Min Order Quantity</Label>
                        <Input
                          id="minOrderQuantity"
                          type="number"
                          value={productForm.minOrderQuantity}
                          onChange={(e) => setProductForm(prev => ({ ...prev, minOrderQuantity: e.target.value }))}
                          required
                        />
                      </div>
                      <div>
                        <Label htmlFor="stockQuantity">Stock Quantity</Label>
                        <Input
                          id="stockQuantity"
                          type="number"
                          value={productForm.stockQuantity}
                          onChange={(e) => setProductForm(prev => ({ ...prev, stockQuantity: e.target.value }))}
                          required
                        />
                      </div>
                    </div>

                    <div className="flex gap-4">
                      <Button type="button" variant="outline" onClick={() => setIsAddProductOpen(false)}>
                        Cancel
                      </Button>
                      <Button type="submit" disabled={createProductMutation.isPending}>
                        {createProductMutation.isPending ? "Creating..." : "Create Product"}
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {productsLoading ? (
                Array.from({ length: 6 }).map((_, i) => (
                  <Card key={i}>
                    <Skeleton className="h-48 w-full" />
                    <CardContent className="p-4">
                      <Skeleton className="h-4 w-full mb-2" />
                      <Skeleton className="h-4 w-3/4 mb-2" />
                      <Skeleton className="h-6 w-1/2" />
                    </CardContent>
                  </Card>
                ))
              ) : products?.length === 0 ? (
                <div className="col-span-full text-center py-12">
                  <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No products yet</h3>
                  <p className="text-gray-600 mb-4">
                    Get started by adding your first product to the marketplace.
                  </p>
                  <Button onClick={() => setIsAddProductOpen(true)}>
                    <Plus className="w-4 h-4 mr-2" />
                    Add Your First Product
                  </Button>
                </div>
              ) : (
                <>
                  {products?.map((p) => (
                    <ProductCard
                      key={p.id}
                      product={p}
                      onOpenNegotiation={() => {
                        setActiveProduct(p);
                        setIsNegotiationOpen(true);
                      }}

                    />
                  ))}

                  {isNegotiationOpen && (
                    <NegotiationChat product={activeProduct} />
                  )}
                </>
              )}

            </div>
          </TabsContent>

          {/* RFQs Tab */}
          <TabsContent value="rfqs">
            <Card>
              <CardHeader>
                <CardTitle>Request for Quotes</CardTitle>
              </CardHeader>
              <CardContent>
                {rfqsLoading ? (
                  <div>Loading RFQs...</div>
                ) : rfqsError ? (
                  <div className="text-red-500">Failed to load RFQs.</div>
                ) : rfqs?.length ? (
                  rfqs.map(rfq => (
                    <div key={rfq.id} className="mb-4 p-4 bg-white rounded shadow">
                      <h4 className="font-medium">{rfq.title}</h4>
                      <p className="text-sm">{rfq.description}</p>
                      <p className="text-xs text-gray-500">Status: {rfq.status}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No RFQs yet. Quote requests from buyers will appear here.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incoming-rfqs">
            <Card>
              <CardHeader>
                <CardTitle>IncomingRFQs</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {isLoading ? (
                    <Skeleton className="h-32 w-full" />
                  ) : error ? (
                    <div className="text-red-500">Failed to load RFQs</div>
                  ) : incomingRfqs?.length ? (
                    incomingRfqs.map((rfq) => (
                      <Card key={rfq.id}>
                        <CardHeader className="flex justify-between items-start">
                          <div>
                            <CardTitle>{rfq.title}</CardTitle>
                            <p className="text-sm text-gray-500 mt-1">
                              Quantity: {rfq.quantity} | Target Price: {rfq.targetPrice} | Deadline:{" "}
                              {rfq.deadline ? new Date(rfq.deadline).toLocaleDateString() : "—"}
                            </p>
                          </div>
                          <QuoteDialog
                            rfq={rfq}
                            onSubmit={(quotePayload) =>
                              createQuoteMutation.mutate({ rfqId: rfq.id, quote: quotePayload })
                            }
                            disabled={createQuoteMutation.isPending}
                          />
                        </CardHeader>
                        <CardContent>
                          <p>{rfq.description}</p>
                        </CardContent>
                      </Card>
                    ))
                  ) : (
                    <div>No incoming RFQs tied to your products.</div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div>Loading orders...</div>
                ) : ordersError ? (
                  <div className="text-red-500">Failed to load orders.</div>
                ) : orders?.length ? (
                  orders.map(o => (
                    <div key={o.id} className="mb-4 p-4 bg-white rounded shadow">
                      <div className="flex justify-between">
                        <div>
                          <p className="font-medium">Order #{o.orderNumber}</p>
                          <p className="text-sm">Quantity: {o.quantity}</p>
                        </div>
                        <div>
                          <p className="text-sm">Status: {o.status}</p>
                          <p className="text-sm">Total: ${o.totalAmount}</p>
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No orders yet. Orders will appear here when customers purchase your products.</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="negotiations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">
                Price Negotiations{" "}
                {unreadCount > 0 && <span className="ml-2 text-red-500">({unreadCount})</span>}
              </h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active Negotiations</CardTitle>
              </CardHeader>
              <CardContent>
                {negotiations.length > 0 ? (
                  negotiations.map((n) => {
                    const lastMessage = n.messages?.[n.messages.length - 1]?.message || "No messages yet";
                    return (
                      <div key={n.id} className="p-3 border-b last:border-none flex justify-between items-center">
                        <div>
                          <p className="font-medium">{lastMessage}</p>
                          <p className="text-sm text-gray-500">
                            Product ID: {n.productId} | Buyer ID: {n.buyerId}
                          </p>
                        </div>

                        <div>
                          {(() => {
                            const product = products?.find(p => p.id === n.productId);
                            if (!product) return null;

                            return (
                              <Button onClick={() => window.location.href = `/vendor-dashboard/${product.id}`}>
                                Start
                              </Button>
                            );
                          })()}
                        </div>

                      </div>
                    );
                  })
                ) : (
                  <p className="text-gray-500">No active negotiations yet.</p>
                )}
              </CardContent>
            </Card>

            {isNegotiationOpen && activeNegotiationId && (
              <Dialog open={isNegotiationOpen} onOpenChange={setIsNegotiationOpen}>
                <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>Negotiation Chat</DialogTitle>
                  </DialogHeader>
                  <NegotiationChat negotiationId={activeNegotiationId} />
                </DialogContent>
              </Dialog>
            )}
          </TabsContent>

          {/* <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Revenue Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Analytics data will be available once you have orders.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Product Performance</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <BarChart3 className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Product performance metrics will appear here.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent> */}
        </Tabs>
      </div>
    </div>
  );
}






export function QuoteDialog({ rfq, onSubmit, disabled }) {
  const [price, setPrice] = useState("");
  const [quantity, setQuantity] = useState(rfq.quantity || "");
  const [deliveryTime, setDeliveryTime] = useState("");
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");

  const isValid = price && quantity;

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!isValid) return;
    const payload = {
      price: price.toString(),
      quantity: parseInt(quantity, 10),
      deliveryTime,
      validUntil: validUntil || undefined, // ISO expected
      notes,
    };
    onSubmit(payload);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm">Submit Quote</Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Quote for "{rfq.title}"</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Price</Label>
            <Input
              type="number"
              step="0.01"
              required
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="e.g., 12.50"
            />
          </div>
          <div>
            <Label>Quantity</Label>
            <Input
              type="number"
              required
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="e.g., 100"
            />
          </div>
          <div>
            <Label>Delivery Time</Label>
            <Input
              value={deliveryTime}
              onChange={(e) => setDeliveryTime(e.target.value)}
              placeholder="e.g., 3 weeks"
            />
          </div>
          <div>
            <Label>Valid Until (optional)</Label>
            <Input
              type="datetime-local"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
            />
          </div>
          <div>
            <Label>Notes</Label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any extra info"
            />
          </div>
          <div className="flex justify-end gap-2">
            <Button type="submit" disabled={!isValid || disabled}>
              {disabled ? "Submitting..." : "Submit Quote"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}

