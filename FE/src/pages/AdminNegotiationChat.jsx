import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { MessageSquare } from "lucide-react";
import { negotiationAPI } from "@/lib/api";
import { Badge } from "@/components/ui/badge";

export default function AdminNegotiationChat() {
  const { id } = useParams(); // negotiationId from URL
  const [, navigate] = useLocation();
  const [negotiation, setNegotiation] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!id) return;
    setLoading(true);

    negotiationAPI.getNegotiationById(id).then((res) => {
        setNegotiation(res.data);
      })
      .catch((err) => {
        console.error("Failed to fetch negotiation:", err);
      })
      .finally(() => setLoading(false));
  }, [id]);

//   console.log(negotiation)

  if (loading) {
    return <div className="p-6">Loading negotiation chat...</div>;
  }

  if (!negotiation) {
    return <div className="p-6 text-red-600">Negotiation not found.</div>;
  }

  return (
    <div className="max-w-4xl mx-auto p-6 space-y-6">
      {/* Header */}
      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle className="text-lg">
                Negotiation #{negotiation.id}
              </CardTitle>
              <p className="text-sm text-gray-600">
                Product ID: {negotiation.productId}
              </p>
            </div>
            <Badge variant={negotiation.isActive ? "default" : "secondary"}>
              {negotiation.isActive ? "Active" : "Closed"}
            </Badge>
          </div>
        </CardHeader>
      </Card>

      {/* Messages */}
      <Card>
        <CardContent className="p-4 h-[500px] overflow-y-auto space-y-3">
         {negotiation.messages?.length === 0 ? (
  <div className="text-center py-8">
    <MessageSquare className="w-12 h-12 text-gray-400 mx-auto mb-4" />
    <p className="text-gray-600">No messages yet.</p>
  </div>
) : (
  negotiation.messages.map((msg, i) => {
    const sender = msg.sender ? msg.sender.toUpperCase() : "UNKNOWN";

    return (
      <div
        key={i}
        className={`p-3 rounded-lg max-w-md ${
          msg.senderRole === "buyer"
            ? "bg-blue-100 text-blue-900 self-start"
            : msg.senderRole === "vendor"
            ? "bg-green-100 text-green-900 self-start"
            : "bg-gray-100 text-gray-900 self-end"
        }`}
      >
        <p className="text-sm font-medium">{sender}</p>

        {msg.message && <p>{msg.message}</p>}

        {msg.offer && (
          <p className="text-xs text-gray-700">💰 Offer: ${msg.offer}</p>
        )}

        {msg.timestamp && (
          <p className="text-xs text-gray-500 mt-1">
            {new Date(msg.timestamp).toLocaleString()}
          </p>
        )}
      </div>
    );
  })
)}

        </CardContent>
      </Card>
    </div>
  );
}
