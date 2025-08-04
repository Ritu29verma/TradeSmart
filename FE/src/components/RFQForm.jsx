import { useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { useToast } from "@/hooks/use-toast";
import { CalendarIcon, FileText, Send } from "lucide-react";
import { format } from "date-fns";
import { rfqAPI, productAPI, queryClient } from "@/lib/api";
import { authManager } from "@/lib/auth";

export default function RFQForm({ product = null, onSuccess }) {
  const { toast } = useToast();
  const [formData, setFormData] = useState({
    productId: product?.id || "",
    title: product ? `RFQ for ${product.name}` : "",
    description: "",
    quantity: "",
    targetPrice: "",
    deadline: null,
    requirements: {
      delivery: "",
      warranty: "",
      specifications: "",
      paymentTerms: ""
    }
  });

  const user = authManager.getUser();

  // Fetch products for selection (if no specific product)
  const { data: products } = useQuery({
    queryKey: ["/api/products"],
    enabled: !product,
  });

  // Create RFQ mutation
  const createRfqMutation = useMutation({
    mutationFn: rfqAPI.createRfq,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/rfqs"] });
      toast({
        title: "RFQ created successfully",
        description: "Your request for quote has been submitted to vendors.",
      });
      
      // Reset form
      setFormData({
        productId: product?.id || "",
        title: product ? `RFQ for ${product.name}` : "",
        description: "",
        quantity: "",
        targetPrice: "",
        deadline: null,
        requirements: {
          delivery: "",
          warranty: "",
          specifications: "",
          paymentTerms: ""
        }
      });
      
      if (onSuccess) onSuccess();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error creating RFQ",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('requirements.')) {
      const reqField = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        requirements: {
          ...prev.requirements,
          [reqField]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleProductChange = (productId) => {
    
    if (productId === "general") {
    setFormData(prev => ({
      ...prev,
      productId: "",
      title: ""
    }));
    return;
  }

    const selectedProduct = products?.find(p => p.id === productId);
    setFormData(prev => ({
      ...prev,
      productId,
      title: selectedProduct ? `RFQ for ${selectedProduct.name}` : ""
    }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    if (!user || user.role !== 'buyer') {
      toast({
        variant: "destructive",
        title: "Access denied",
        description: "Only buyers can create RFQs.",
      });
      return;
    }

    const rfqData = {
      ...formData,
      quantity: parseInt(formData.quantity),
      targetPrice: formData.targetPrice ? parseFloat(formData.targetPrice) : null
    };

    createRfqMutation.mutate(rfqData);
  };

  if (!user) {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600">Please login to create an RFQ.</p>
        </CardContent>
      </Card>
    );
  }

  if (user.role !== 'buyer') {
    return (
      <Card>
        <CardContent className="p-6">
          <p className="text-center text-gray-600">Only buyers can create RFQs.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center">
          <FileText className="w-5 h-5 mr-2" />
          {product ? "Request Quote" : "Create RFQ"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Product Selection */}
          {!product && (
            <div>
              <Label htmlFor="productId">Product (Optional)</Label>
              <Select value={formData.productId} onValueChange={handleProductChange}>
                <SelectTrigger>
                  <SelectValue placeholder="Select a specific product or leave blank for general RFQ" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="general">General RFQ (No specific product)</SelectItem>
                  {products?.map((product) => (
                    <SelectItem key={product.id} value={product.id}>
                      {product.name} - ${parseFloat(product.price).toLocaleString()}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* Title */}
          <div>
            <Label htmlFor="title">RFQ Title</Label>
            <Input
              id="title"
              name="title"
              value={formData.title}
              onChange={handleInputChange}
              placeholder="Brief title describing what you need"
              required
            />
          </div>

          {/* Description */}
          <div>
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              name="description"
              value={formData.description}
              onChange={handleInputChange}
              placeholder="Detailed description of your requirements"
              rows={4}
              required
            />
          </div>

          {/* Quantity and Target Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="quantity">Quantity</Label>
              <Input
                id="quantity"
                name="quantity"
                type="number"
                min="1"
                value={formData.quantity}
                onChange={handleInputChange}
                placeholder="Required quantity"
                required
              />
            </div>
            <div>
              <Label htmlFor="targetPrice">Target Price per Unit ($)</Label>
              <Input
                id="targetPrice"
                name="targetPrice"
                type="number"
                step="0.01"
                min="0"
                value={formData.targetPrice}
                onChange={handleInputChange}
                placeholder="Optional target price"
              />
            </div>
          </div>

          {/* Deadline */}
          <div>
            <Label>Response Deadline</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {formData.deadline ? format(formData.deadline, "PPP") : "Select deadline"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0">
                <Calendar
                  mode="single"
                  selected={formData.deadline}
                  onSelect={(date) => setFormData(prev => ({ ...prev, deadline: date }))}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* Additional Requirements */}
          <div className="space-y-3">
            <Label className="text-base font-medium">Additional Requirements</Label>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="requirements.delivery">Delivery Timeline</Label>
                <Input
                  id="requirements.delivery"
                  name="requirements.delivery"
                  value={formData.requirements.delivery}
                  onChange={handleInputChange}
                  placeholder="e.g., 2-3 weeks"
                />
              </div>
              <div>
                <Label htmlFor="requirements.warranty">Warranty Requirements</Label>
                <Input
                  id="requirements.warranty"
                  name="requirements.warranty"
                  value={formData.requirements.warranty}
                  onChange={handleInputChange}
                  placeholder="e.g., 2 years"
                />
              </div>
            </div>

            <div>
              <Label htmlFor="requirements.specifications">Technical Specifications</Label>
              <Textarea
                id="requirements.specifications"
                name="requirements.specifications"
                value={formData.requirements.specifications}
                onChange={handleInputChange}
                placeholder="Any specific technical requirements or certifications needed"
                rows={2}
              />
            </div>

            <div>
              <Label htmlFor="requirements.paymentTerms">Payment Terms</Label>
              <Input
                id="requirements.paymentTerms"
                name="requirements.paymentTerms"
                value={formData.requirements.paymentTerms}
                onChange={handleInputChange}
                placeholder="e.g., Net 30, 50% advance"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex space-x-4 pt-4">
            <Button
              type="submit"
              disabled={createRfqMutation.isPending}
              className="flex-1"
            >
              <Send className="w-4 h-4 mr-2" />
              {createRfqMutation.isPending ? "Creating RFQ..." : "Submit RFQ"}
            </Button>
            {onSuccess && (
              <Button type="button" variant="outline" onClick={onSuccess}>
                Cancel
              </Button>
            )}
          </div>
        </form>

        {/* Info Box */}
        <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <p className="text-sm font-medium text-blue-900">How RFQs Work</p>
              <p className="text-sm text-blue-700 mt-1">
                Your RFQ will be sent to relevant vendors who can provide quotes. 
                You'll receive responses directly and can compare offers to make the best choice.
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
