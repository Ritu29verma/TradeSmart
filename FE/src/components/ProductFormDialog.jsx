// components/ProductFormDialog.jsx
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Select, SelectTrigger, SelectContent, SelectItem, SelectValue } from "@/components/ui/select";

export default function ProductFormDialog({
  open,
  onOpenChange,
  initialData = {},
  onSubmit,
  loading,
}) {
  const [form, setForm] = useState({
    name: "",
    categoryId: "",
    categoryName: "",
    shortDescription: "",
    description: "",
    price: "",
    originalPrice: "",
    minOrderQuantity: "",
    stockQuantity: "",
    ...initialData,
  });

    const { data: categories } = useQuery({
    queryKey: ["/api/categories"],
  });

  useEffect(() => {
    setForm({
      name: initialData.name || "",
      categoryId: initialData.categoryId || "",
      categoryName: initialData.categoryName || "",
      shortDescription: initialData.shortDescription || "",
      description: initialData.description || "",
      price: initialData.price || "",
      originalPrice: initialData.originalPrice || "",
      minOrderQuantity: initialData.minOrderQuantity || "",
      stockQuantity: initialData.stockQuantity || "",
    });
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSubmit(form);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>{initialData.id ? "Update Product" : "Add Product"}</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name + Category */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="name">Product Name</Label>
              <Input
                id="name"
                name="name"
                value={form.name}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="categoryId">Category</Label>
              <Select
                value={form.categoryId}
                onValueChange={(value) => {
                  const selected = categories.find((c) => c.id === value);
                  setForm((prev) => ({
                    ...prev,
                    categoryId: value,
                    categoryName: selected ? selected.name : "",
                  }));
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories?.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Short Description */}
          <div>
            <Label htmlFor="shortDescription">Short Description</Label>
            <Input
              id="shortDescription"
              name="shortDescription"
              value={form.shortDescription}
              onChange={handleChange}
              placeholder="Brief product description"
            />
          </div>

          {/* Full Description */}
          <div>
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              name="description"
              value={form.description}
              onChange={handleChange}
              rows={3}
              required
            />
          </div>

          {/* Price + Original Price */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="price">Price ($)</Label>
              <Input
                id="price"
                name="price"
                type="number"
                step="0.01"
                value={form.price}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="originalPrice">Original Price (optional)</Label>
              <Input
                id="originalPrice"
                name="originalPrice"
                type="number"
                step="0.01"
                value={form.originalPrice}
                onChange={handleChange}
              />
            </div>
          </div>

          {/* Min Order + Stock */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="minOrderQuantity">Min Order Quantity</Label>
              <Input
                id="minOrderQuantity"
                name="minOrderQuantity"
                type="number"
                value={form.minOrderQuantity}
                onChange={handleChange}
                required
              />
            </div>
            <div>
              <Label htmlFor="stockQuantity">Stock Quantity</Label>
              <Input
                id="stockQuantity"
                name="stockQuantity"
                type="number"
                value={form.stockQuantity}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          {/* Buttons */}
          <div className="flex gap-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
