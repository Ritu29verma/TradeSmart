import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useToast } from "@/hooks/use-toast";
import {
  ShoppingCart,
  MessageSquare,
  DollarSign,
  Package,
  Search,
  FileText,
  TrendingUp
} from "lucide-react";
import { dashboardAPI, rfqAPI, orderAPI, negotiationAPI, productAPI } from "@/lib/api";
import { authManager } from "@/lib/auth";
import RFQForm from "@/components/RFQForm";
import { formatDistanceToNowStrict } from "date-fns";
import { useParams } from "wouter";
import NegotiationChat from "@/components/NegotiationChat";
import { socket, joinNegotiationRoom } from "@/lib/socket";

export default function BuyerDashboard({
  onStartNegotiation // callback: (quote) => void
}) {
  const user = authManager.getUser();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [selectedRfqId, setSelectedRfqId] = useState(null);
  const [selectedQuoteId, setSelectedQuoteId] = useState(null);
  const [activeProduct, setActiveProduct] = useState(null);
  const [activeNegotiationId, setActiveNegotiationId] = useState(null);
  const { id } = useParams();
  const buyerId = user?.id;

    // Fetch buyer's negotiations
  const { data: negotiations, isLoading: negotiationsLoading, isError: negotiationsError } = useQuery({
    queryKey: ["buyer-negotiations"],
    queryFn: () => negotiationAPI.getNegotiations().then(res => res.data),
    enabled: !!user && user.role === "buyer",
  });

  // Fetch buyer stats
  const { data: stats, isLoading: statsLoading, isError: statsError } = useQuery({
    queryKey: ["buyer-stats"],
    queryFn: () => dashboardAPI.getBuyerStats().then(res => res.data),
    enabled: !!user && user.role === "buyer",
    staleTime: 5 * 60 * 1000, // 5 minutes
  });

  // Fetch buyer's RFQs
  const { data: rfqs = [], isLoading: rfqsLoading, isError: rfqsError } = useQuery({
    queryKey: ["buyer-rfqs"],
    queryFn: () => rfqAPI.getRfqs().then(res => res.data),
    enabled: !!user && user.role === "buyer",
  });

  // Fetch buyer's orders
  const { data: orders, isLoading: ordersLoading, isError: ordersError } = useQuery({
    queryKey: ["buyer-orders"],
    queryFn: () => orderAPI.getOrders().then(res => res.data),
    enabled: !!user && user.role === "buyer",
  });
  // console.log(orders)

  // Fetch quotes for this RFQ
  const quotesKey = ["rfq", selectedRfqId, "quotes"];
  const { data: quotes = [], isLoading: quotesLoading, error: quotesError } = useQuery({
    queryKey: quotesKey,
    queryFn: () => rfqAPI.getQuotes(selectedRfqId).then(res => res.data),
    enabled: !!selectedRfqId,
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Failed to load quotes",
        description: err.message || "Please try again."
      });
    }
  });
  // console.log(quotes);

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

  // Accept quote mutation
  const acceptMutation = useMutation({
    mutationFn: (quoteId) => rfqAPI.acceptQuote(quoteId).then(res => res.data),
    onSuccess: ({ quote, order }) => {
      toast({
        title: "Quote accepted",
        description: "Order created from accepted quote."
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Accept failed",
        description: err.response?.data?.message || err.message
      });
    }, onSettled: () => {
      queryClient.invalidateQueries({ queryKey: quotesKey });
      queryClient.invalidateQueries({ queryKey: ["buyer-rfqs"] });
    }
  });

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
          console.log(`[SOCKET] Buyer joining negotiation room: ${negotiation.id}`);
          socket.emit("joinNegotiationRoom", negotiation.id);
        } else {
          console.log("[SOCKET] No active negotiation found for this product");
        }
      }
    });

    socket.on("deal:accepted", ({ negotiationId }) => {
    console.log("📉 Negotiation closed:", negotiationId);

    // Remove from active negotiations immediately
    queryClient.setQueryData(["buyer-negotiations"], (old = []) =>
      old.filter(n => n.id !== negotiationId)
    );

    toast({
      title: "Negotiation Closed",
      description: "Your deal was accepted and moved out of active negotiations.",
    });
  });

    return () => {
      console.log("🔴 Disconnecting socket");
      socket.off("connect");
      socket.off("deal:accepted");
      socket.disconnect();
    };
  }, [id, product, negotiations]);

  if (quotesLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Incoming Quotes</CardTitle>
        </CardHeader>
        <CardContent>
          <p>Loading quotes...</p>
        </CardContent>
      </Card>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Please log in to access the dashboard.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (user.role !== "buyer") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Access denied. Buyer role required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

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
          <h1 className="text-3xl font-bold text-gray-900">Buyer Dashboard</h1>
          <p className="text-gray-600 mt-2">Manage your purchases and track your procurement activities</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <ShoppingCart className="h-8 w-8 text-blue-600" />
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
                <DollarSign className="h-8 w-8 text-green-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Spent</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">
                      ${parseFloat(stats?.totalSpent || 0).toLocaleString()}
                    </p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <MessageSquare className="h-8 w-8 text-purple-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Active RFQs</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalRfqs || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Link href="/marketplace" className="block">
                <div className="text-center">
                  <Search className="h-8 w-8 text-blue-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">Browse Products</h3>
                  <p className="text-sm text-gray-600">Discover products from verified vendors</p>
                </div>
              </Link>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <div className="text-center">
                <FileText className="h-8 w-8 text-green-600 mx-auto mb-3" />
                <h3 className="font-semibold text-gray-900 mb-2">Create RFQ</h3>
                <p className="text-sm text-gray-600">Request quotes from multiple vendors</p>
              </div>
            </CardContent>
          </Card>

          {/* <Card className="hover:shadow-lg transition-shadow cursor-pointer">
            <CardContent className="p-6">
              <Link href="/ai-tools" className="block">
                <div className="text-center">
                  <TrendingUp className="h-8 w-8 text-purple-600 mx-auto mb-3" />
                  <h3 className="font-semibold text-gray-900 mb-2">AI Tools</h3>
                  <p className="text-sm text-gray-600">Get market insights and price forecasts</p>
                </div>
              </Link>
            </CardContent>
          </Card> */}
        </div>

        {/* Main Content */}
      <Tabs defaultValue="orders" className="space-y-10">
  <TabsList className="flex flex-wrap gap-0 w-full bg-gray-100 p-2 rounded">
    {[
      ["orders", "Orders"],
      ["rfqs", "RFQs"],
      ["incoming-quotes", "Incoming Quotes"],
      ["negotiations", "Negotiations"],
      ["analytics", "Analytics"]
    ].map(([value, label]) => (
      <TabsTrigger
        key={value}
        value={value}
        className="flex-1 min-w-[100px] text-center text-sm break-words mb-2"
      >
        {label}
      </TabsTrigger>
    ))}
  </TabsList>

          <TabsContent value="orders" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">My Orders</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Recent Orders</CardTitle>
              </CardHeader>
              <CardContent>
                {ordersLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : orders?.length === 0 ? (
                  <div className="text-center py-8">
                    <ShoppingCart className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No orders yet</h3>
                    <p className="text-gray-600 mb-4">Start shopping to see your orders here.</p>
                    <Button asChild>
                      <Link href="/marketplace">Browse Products</Link>
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {orders?.map((order) => (
                      <div key={order.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Order #{order.orderNumber}</p>
                          <p className="text-sm text-gray-600">
                            {order.quantity} items • ${parseFloat(order.totalAmount).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(order.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          order.status === "delivered" ? "default" :
                            order.status === "shipped" ? "secondary" :
                              order.status === "processing" ? "outline" : "destructive"
                        }>
                          {order.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rfqs" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Request for Quotes</h2>
            </div>

            <RFQForm />

            <Card>
              <CardHeader>
                <CardTitle>My RFQs</CardTitle>
              </CardHeader>
              <CardContent>
                {rfqsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : rfqs?.length === 0 ? (
                  <div className="text-center py-8">
                    <FileText className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No RFQs created yet. Create your first RFQ above.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {rfqs?.map((rfq) => (
                      <div key={rfq.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">{rfq.title}</p>
                          <p className="text-sm text-gray-600">
                            Quantity: {rfq.quantity} • Target: ${parseFloat(rfq.targetPrice || 0).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            {new Date(rfq.createdAt).toLocaleDateString()}
                          </p>
                        </div>
                        <Badge variant={
                          rfq.status === "closed" ? "default" :
                            rfq.status === "quoted" ? "secondary" : "outline"
                        }>
                          {rfq.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="incoming-quotes" className="space-y-6">
            <div className="flex flex-col md:flex-row gap-6 mb-4">
              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Select RFQ</CardTitle>
                  </CardHeader>
                  <CardContent>
                    {rfqsLoading ? (
                      <p>Loading your RFQs...</p>
                    ) : rfqs.length === 0 ? (
                      <p className="text-gray-600">You have no RFQs yet.</p>
                    ) : (
                      <div className="space-y-2">
                        {rfqs.map((rfq) => (
                          <div
                            key={rfq.id}
                            className={`p-3 rounded-lg border cursor-pointer flex justify-between items-center ${selectedRfqId === rfq.id
                              ? "border-blue-500 bg-blue-50/10"
                              : "border-transparent hover:bg-slate-100/5"
                              }`}
                            onClick={() => setSelectedRfqId(rfq.id)}
                          >
                            <div>
                              <p className="font-medium text-black">{rfq.title}</p>
                              <p className="text-sm text-slate-400">
                                Qty: {rfq.quantity} • Target: ${parseFloat(rfq.targetPrice || 0).toLocaleString()}
                              </p>
                            </div>
                            <Badge variant="outline">{rfq.status}</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="flex-1">
                <Card>
                  <CardHeader>
                    <CardTitle>Incoming Quotes</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {quotesLoading && <p>Loading quotes...</p>}
                    {!quotesLoading && !selectedRfqId && (
                      <p className="text-gray-600">Select an RFQ to view its quotes.</p>
                    )}

                    {!quotesLoading && selectedRfqId && quotes.length === 0 && (
                      <div className="text-center py-6">
                        <p className="text-gray-600">No quotes submitted yet for this RFQ.</p>
                      </div>
                    )}

                    {quotes?.map((quote) => (
                      <div
                        key={quote.id}
                        className="bg-slate-800 rounded-lg p-4 flex flex-col md:flex-row justify-between items-start gap-4"
                      >
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h3 className="text-lg font-semibold text-white">Quote from Vendor</h3>
                            {quote.isAccepted && (
                              <Badge className="bg-green-600">Accepted</Badge>
                            )}
                          </div>
                          <p className="text-sm text-slate-300 mb-1">
                            Price: <span className="font-medium">${quote.price}</span> ×{" "}
                            <span className="font-medium">{quote.quantity}</span> ={" "}
                            <span className="font-medium">
                              ${(parseFloat(quote.price) * parseInt(quote.quantity)).toFixed(2)}
                            </span>
                          </p>
                          <p className="text-sm text-slate-300 mb-1">
                            Delivery time: {quote.deliveryTime || "N/A"}
                          </p>
                          {quote.validUntil ? (
                            <p className="text-sm text-slate-300 mb-1">
                              Valid until: {new Date(quote.validUntil).toLocaleString()} (
                              {formatDistanceToNowStrict(new Date(quote.validUntil), {
                                addSuffix: true
                              })}
                              )
                            </p>
                          ) : (
                            <p className="text-sm text-slate-300 mb-1">Valid until: N/A</p>
                          )}

                          {quote.notes && (
                            <p className="text-sm text-slate-300 mb-1">Notes: {quote.notes}</p>
                          )}
                          <p className="text-xs text-slate-400">
                            Submitted: {new Date(quote.createdAt).toLocaleString()}
                          </p>
                        </div>

                        <div className="flex flex-col gap-2">
                          {!quote.isAccepted ? (
                            <>
                              <Button
                                onClick={() => {
                                  setSelectedQuoteId(quote.id);
                                  acceptMutation.mutate(quote.id);
                                }}
                                disabled={acceptMutation.isLoading}
                              >
                                {acceptMutation.isLoading && selectedQuoteId === quote.id
                                  ? "Accepting..."
                                  : "Accept Quote"}
                              </Button>
                              <Button
                                variant="outline"
                                onClick={() => onStartNegotiation?.(quote)}
                              >
                                Start Negotiation
                              </Button>
                            </>
                          ) : (
                            <div className="text-sm text-green-400">
                              This quote has been accepted.
                            </div>
                          )}
                        </div>
                      </div>
                    ))}

                    <Separator />

                    <div className="text-xs text-slate-400">
                      You can accept one quote to turn it into an order, or start a negotiation if you
                      want to counter the terms.
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="negotiations" className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold text-gray-900">Price Negotiations</h2>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Active Negotiations</CardTitle>
              </CardHeader>
              <CardContent>
                {negotiationsLoading ? (
                  <div className="space-y-4">
                    {Array.from({ length: 3 }).map((_, i) => (
                      <Skeleton key={i} className="h-16 w-full" />
                    ))}
                  </div>
                ) : negotiations?.length === 0 ? (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">No active negotiations. Start negotiating on product pages.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {negotiations?.map((negotiation) => (
                      <div key={negotiation.id} className="flex items-center justify-between p-4 border rounded-lg">
                        <div>
                          <p className="font-medium text-gray-900">Product Negotiation</p>
                          <p className="text-sm text-gray-600">
                            Current offer: ${parseFloat(negotiation.currentPrice).toLocaleString()}
                          </p>
                          <p className="text-xs text-gray-500">
                            Updated: {new Date(negotiation.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        {/* <Badge variant={negotiation.isActive ? "default" : "secondary"}>
                          {negotiation.isActive ? "Active" : "Closed"}
                        </Badge> */}
                        <div>
                          {(() => {
                            const product = products?.find(p => p.id === negotiation.productId);
                            if (!product) return null;

                            return (
                              <Button onClick={() => window.location.href = `/buyer-dashboard/${product.id}`}>
                                Start
                              </Button>
                            );
                          })()}
                        </div>

                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analytics">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Spending Trend</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <TrendingUp className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Spending analytics will be available once you have orders.</p>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Procurement Insights</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-8">
                    <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600">Procurement insights will appear here based on your buying patterns.</p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
