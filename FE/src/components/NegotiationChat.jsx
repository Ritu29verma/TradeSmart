import { useState, useEffect, useRef } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { 
  Send, 
  Brain, 
  User, 
  Building, 
  CheckCircle, 
  DollarSign,
  TrendingUp,
  MessageSquare
} from "lucide-react";
import { negotiationAPI, queryClient } from "@/lib/api";
import { authManager } from "@/lib/auth";
import { socket, joinNegotiationRoom} from "@/lib/socket";

export default function NegotiationChat({ product }) {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
const [message, setMessage] = useState("");
  const [offer, setOffer] = useState("");
  const [selectedOfferId, setSelectedOfferId] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);   
  const user = authManager.getUser();

  // Find existing negotiation for this product
  const { data: negotiations, isLoading } = useQuery({
    queryKey: ["/api/negotiations"],
    enabled: !!user,
  });

  const currentNegotiation = negotiations?.find(
    n => n.productId === product.id && n.isActive
  );

  const negotiationId = currentNegotiation?.id;
const userRole = user?.role; // or manually set 'buyer' / 'vendor'
const userId = user?.id;

// console.log(negotiationId)
useEffect(() => {
  if (!negotiationId) return;

negotiationAPI.getNegotiationById(negotiationId).then(res => {
  // console.log("API response:", res.data);
  setMessages(res.data.messages || []);
});

  console.log(`[SOCKET] Joining negotiation room: ${negotiationId}`);
  socket.emit("joinNegotiationRoom", negotiationId );

  const handleNewMessage = (data) => {
    // console.log("[SOCKET] New message received:", data);
    setMessages(prev => [...prev, data]);
  };

  socket.on("negotiation:message", handleNewMessage);

  return () => {
    socket.off("negotiation:message", handleNewMessage);
  };
}, [negotiationId]);


  // Send message mutation
  const sendMessageMutation = useMutation({
    mutationFn: ({ id, message, offer }) => 
      negotiationAPI.sendMessage(id, { message, offer }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations"] });
      setMessage("");
      setOffer("");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error sending message",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  // AI negotiate mutation
  const aiNegotiateMutation = useMutation({
    mutationFn: ({ id, message }) => 
      negotiationAPI.aiNegotiate(id, message),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations"] });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "AI negotiation error",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  // Accept negotiation mutation
  const acceptNegotiationMutation = useMutation({
    mutationFn: negotiationAPI.acceptNegotiation,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/negotiations"] });
      toast({
        title: "Deal accepted!",
        description: "Your negotiation has been accepted and an order has been created.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error accepting deal",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });


  useEffect(() => {
  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
}, [messages]); // track `messages` state

useEffect(() => {
  if (messagesContainerRef.current) {
    messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
  }
}, [messages]);


const handleSendMessage = (e) => {
  e.preventDefault();

  if (!currentNegotiation?.isActive) {
    toast({
      variant: "destructive",
      title: "No active negotiation",
      description: "Start a negotiation before sending a message."
    });
    return;
  }
  if (!message.trim() && !offer) return;

  const offerValue = offer ? parseFloat(offer) : null;

  // Just call API → backend will emit via socket
  sendMessageMutation.mutate({
    id: currentNegotiation.id,
    message: message || (offerValue ? `I'd like to offer $${offerValue}` : ""),
    offer: offerValue
  });
};

  const handleAiNegotiate = () => {
    if (!message.trim()) return;
    
    aiNegotiateMutation.mutate({
      id: currentNegotiation.id,
      message
    });
    setMessage("");
  };

  const handleAcceptDeal = () => {
    acceptNegotiationMutation.mutate(currentNegotiation.id);
  };

  const formatPrice = (price) => {
    return parseFloat(price).toLocaleString();
  };

  const renderMessage = (msg, index) => {
    const isUser = msg.senderId === user.id;
    const isAI = msg.sender === 'ai';
    const isVendor = msg.sender === 'vendor';
     const isBuyer = msg.sender === 'buyer';

    return (
      <div key={index} className={`flex ${isUser ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`flex items-start space-x-3 max-w-xs ${isUser ? 'flex-row-reverse space-x-reverse' : ''}`}>
          <Avatar className="w-8 h-8 flex-shrink-0">
            <AvatarFallback className={`text-xs ${
              isAI ? 'bg-gradient-to-r from-blue-500 to-purple-600 text-white' :
              isUser ? 'bg-blue-500 text-white' :
              'bg-green-600 text-white'
            }`}>
              {isAI ? 'AI' : isVendor ? 'V' : 'B'}
            </AvatarFallback>
          </Avatar>
          
          <div className={`rounded-lg px-4 py-2 ${
            isUser ? 'bg-blue-600 text-white' :
            isAI ? 'bg-gray-100 border border-blue-200' :
            'bg-green-50 border border-green-200'
          }`}>
            <p className={`text-sm ${isUser ? 'text-white' : 'text-gray-800'}`}>
              {msg.message}
            </p>
            
            {msg.offer && (
              <div className={`mt-2 p-2 rounded ${
                isUser ? 'bg-blue-500 bg-opacity-50' : 'bg-blue-50'
              }`}>
                <div className="flex items-center space-x-2">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-semibold">${formatPrice(msg.offer)}</span>
                </div>
              </div>
            )}
            
            {msg.aiData && (
              <div className="mt-3 space-y-2">
                {msg.aiData.recommendation === 'accept' && (
                  <Button
                    size="sm"
                    onClick={handleAcceptDeal}
                    disabled={acceptNegotiationMutation.isPending}
                    className="w-full text-xs"
                  >
                    <CheckCircle className="w-3 h-3 mr-1" />
                    Accept Deal
                  </Button>
                )}
                
                <div className="text-xs text-gray-600 bg-white bg-opacity-50 rounded p-2">
                  <div className="flex items-center space-x-1 mb-1">
                    <Brain className="w-3 h-3" />
                    <span className="font-medium">AI Insight:</span>
                  </div>
                  <p>{msg.aiData.marketJustification}</p>
                </div>
              </div>
            )}
            
            <span className={`text-xs mt-1 block ${
              isUser ? 'text-blue-200' : 'text-gray-500'
            }`}>
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        </div>
      </div>
    );
  };

  if (isLoading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-4 w-full" />
        <Skeleton className="h-4 w-3/4" />
        <Skeleton className="h-20 w-full" />
      </div>
    );
  }

  if (!currentNegotiation) {
    return (
      <div className="text-center py-8">
        <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No active negotiation found for this product.</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Negotiation Header */}
      <Card>
        <CardHeader className="pb-4">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="text-lg">{product.name}</CardTitle>
              <p className="text-sm text-gray-600">
                Original Price: ${formatPrice(product.price)}
              </p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">
                ${formatPrice(currentNegotiation.currentPrice)}
              </div>
              <p className="text-xs text-gray-600">Current Offer</p>
              <Badge variant={currentNegotiation.isActive ? "default" : "secondary"}>
                {currentNegotiation.isActive ? "Active" : "Closed"}
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card>
        <CardContent className="p-4">
         <div 
  className="h-96 overflow-y-auto space-y-4 mb-4" 
  ref={messagesContainerRef} 
>
  {messages.length === 0 ? (
    <div className="text-center py-8">
      <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
      <p className="text-gray-600">Start the conversation by sending a message.</p>
    </div>
  ) : (
    messages.map((msg, index) => renderMessage(msg, index))
  )}
  {/* <div ref={messagesEndRef} /> */}

</div>

          {/* Input Form */}
          {currentNegotiation.isActive && (
            <form onSubmit={handleSendMessage} className="space-y-3">
              <div className="flex space-x-2">
                <Input
                  placeholder="Type your message..."
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  className="flex-1"
                />
                <Input
                  type="number"
                  step="0.01"
                  placeholder="Offer ($)"
                  value={offer}
                  onChange={(e) => setOffer(e.target.value)}
                  className="w-24"
                />
              </div>
              
              <div className="flex space-x-2">
                <Button 
                  type="submit" 
                  disabled={sendMessageMutation.isPending || (!message.trim() && !offer)}
                  className="flex-1"
                >
                  <Send className="w-4 h-4 mr-2" />
                  {sendMessageMutation.isPending ? "Sending..." : "Send"}
                </Button>
                
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleAiNegotiate}
                  disabled={aiNegotiateMutation.isPending || !message.trim()}
                  className="flex-1"
                >
                  <Brain className="w-4 h-4 mr-2" />
                  {aiNegotiateMutation.isPending ? "AI Working..." : "AI Negotiate"}
                </Button>
              </div>
            </form>
          )}

          {!currentNegotiation.isActive && (
            <div className="text-center py-4 bg-gray-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <p className="text-gray-600">This negotiation has been completed.</p>
              {currentNegotiation.finalPrice && (
                <p className="text-sm text-gray-500">
                  Final agreed price: ${formatPrice(currentNegotiation.finalPrice)}
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center text-sm">
            <TrendingUp className="w-4 h-4 mr-2" />
            Market Insights
          </CardTitle>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-lg font-semibold text-blue-600">
                {((currentNegotiation.initialPrice - currentNegotiation.currentPrice) / currentNegotiation.initialPrice * 100).toFixed(1)}%
              </div>
              <div className="text-xs text-gray-600">Discount</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-green-600">$850-950</div>
              <div className="text-xs text-gray-600">Market Range</div>
            </div>
            <div>
              <div className="text-lg font-semibold text-purple-600">High</div>
              <div className="text-xs text-gray-600">Demand</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
