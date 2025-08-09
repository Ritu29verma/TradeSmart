import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import {
  Users,
  Package,
  ShoppingCart,
  DollarSign,
  Plus,
  Shield,
  TrendingUp,
  Settings,
  UserCheck,
  AlertTriangle
} from "lucide-react";
import { dashboardAPI, categoryAPI, queryClient, userAPI, productAPI } from "@/lib/api";
import { authManager } from "@/lib/auth";

export default function AdminPanel() {
  const { toast } = useToast();
  const [selectedUser, setSelectedUser] = useState(null);
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [categoryForm, setCategoryForm] = useState({
    name: "",
    description: "",
    parentId: ""
  });

  const user = authManager.getUser();

  const { data: users, isLoading: isUsersLoading, isError: isUsersError, error: usersError } = useQuery({
    queryKey: ['users'],
    queryFn: () => userAPI.getUsers({ roles: ['vendor', 'buyer'] }).then(res => res.data),
  });

  const { data: products, isLoading: isProductsLoading, error: productsError } = useQuery({
    queryKey: ["products"],
    queryFn: () => productAPI.getProducts().then((res) => res.data)
  });
  console.log(products);

  const openAddCategoryModal = () => {
    setSelectedCategory(null);
    setCategoryForm({ name: "", description: "", parentId: "" });
    setIsCategoryModalOpen(true);
  };

  const openEditCategoryModal = (category) => {
    setSelectedCategory(category);
    setCategoryForm({
      name: category.name,
      description: category.description || "",
      parentId: category.parentId || "",
    });
    setIsCategoryModalOpen(true);
  };

  // Fetch admin stats
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ["/api/dashboard/admin-stats"],
    enabled: !!user && user.role === "admin",
  });

  // Fetch categories
  const { data: categories, isLoading: categoriesLoading, refetch: refetchCategories } = useQuery({
    queryKey: ["/api/categories"],
    queryFn: () => categoryAPI.getCategories().then(res => res.data),
  });


  // Create category mutation
 const createCategoryMutation = useMutation({
    mutationFn: categoryAPI.createCategory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryModalOpen(false);
      setSelectedCategory(null);
      setCategoryForm({ name: "", description: "", parentId: "" });
      toast({
        title: "Category created",
        description: "New category has been successfully added.",
      });
      refetchCategories();
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error creating category",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  // Update mutation
  const updateCategoryMutation = useMutation({
    mutationFn: (data) => categoryAPI.updateCategory(selectedCategory.id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/categories"] });
      setIsCategoryModalOpen(false);
      setSelectedCategory(null);
      setCategoryForm({ name: "", description: "", parentId: "" });
      toast({
        title: "Category updated",
        description: "Category has been successfully updated.",
      });
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Error updating category",
        description: error.response?.data?.message || "An error occurred",
      });
    },
  });

  const handleCategorySubmit = (e) => {
    e.preventDefault();
    if (selectedCategory) {
      updateCategoryMutation.mutate(categoryForm);
    } else {
      createCategoryMutation.mutate(categoryForm);
    }
  };

  if (user?.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-600">Access denied. Admin role required.</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900">Admin Panel</h1>
          <p className="text-gray-600 mt-2">Manage your marketplace and monitor platform performance</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Users className="h-8 w-8 text-blue-600" />
                <div className="ml-4">
                  <p className="text-sm font-medium text-gray-600">Total Users</p>
                  {statsLoading ? (
                    <Skeleton className="h-8 w-16" />
                  ) : (
                    <p className="text-2xl font-bold text-gray-900">{stats?.totalUsers - 1 || 0}</p>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-6">
              <div className="flex items-center">
                <Package className="h-8 w-8 text-green-600" />
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
                <ShoppingCart className="h-8 w-8 text-purple-600" />
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
                <DollarSign className="h-8 w-8 text-amber-600" />
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
        </div>

        {/* Main Content */}
        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="users">Users</TabsTrigger>
            <TabsTrigger value="products">Products</TabsTrigger>
            <TabsTrigger value="categories">Categories</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <TrendingUp className="w-5 h-5 mr-2" />
                    Platform Growth
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">User Growth</span>
                      <Badge variant="outline" className="text-green-600">+12%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Product Listings</span>
                      <Badge variant="outline" className="text-blue-600">+8%</Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm text-gray-600">Transaction Volume</span>
                      <Badge variant="outline" className="text-purple-600">+15%</Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <AlertTriangle className="w-5 h-5 mr-2" />
                    Recent Alerts
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="text-center py-8">
                      <Shield className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-600">No critical alerts at this time.</p>
                      <p className="text-sm text-gray-500 mt-2">System is running smoothly.</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <UserCheck className="w-6 h-6" />
                    <span>Verify Users</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Package className="w-6 h-6" />
                    <span>Review Products</span>
                  </Button>
                  <Button variant="outline" className="h-auto p-4 flex flex-col items-center space-y-2">
                    <Settings className="w-6 h-6" />
                    <span>Platform Settings</span>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="users">
            <Card>
              <CardHeader>
                <CardTitle>User Management</CardTitle>
              </CardHeader>
              <CardContent>
                {isUsersLoading && <p>Loading users...</p>}
                {isUsersError && <p className="text-red-500">Error: {usersError.message}</p>}

                {!isUsersLoading && !isUsersError && users?.length === 0 && (
                  <p className="text-gray-500">No users found</p>
                )}

                {!isUsersLoading && !isUsersError && users?.length > 0 && (
                  <ul className="divide-y divide-gray-200">
                    {users.map(user => (
                      <li key={user.id} className="py-2">
                        <div
                          className="flex items-center space-x-3 cursor-pointer hover:bg-gray-50 p-2 rounded"
                          onClick={() => setSelectedUser(user)}
                        >
                          <Users className="w-5 h-5 text-gray-400" />
                          <div>
                            <p className="font-medium">{user.firstName} {user.lastName}</p>
                            <p className="text-sm text-gray-500">{user.email} - {user.role}</p>
                          </div>
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </CardContent>
            </Card>

            {/* User Details Modal */}
            {selectedUser && (
              <div className="fixed inset-0 bg-transparent bg-opacity-10 backdrop-blur-sm flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-6 w-96 shadow-lg">
                  <h2 className="text-xl font-semibold mb-4">User Details</h2>
                  <p><strong>First Name:</strong> {selectedUser.firstName}</p>
                  <p><strong>Last Name:</strong> {selectedUser.lastName}</p>
                  <p><strong>UserId:</strong> {selectedUser.id}</p>
                  <p><strong>UserName:</strong> {selectedUser.username}</p>
                  <p><strong>Email:</strong> {selectedUser.email}</p>
                  <p><strong>Role:</strong> {selectedUser.role}</p>
                  <p><strong>company:</strong> {selectedUser.companyName}</p>
                  <p><strong>Phone:</strong> {selectedUser.phone || 'N/A'}</p>
                  <p><strong>Address:</strong> {selectedUser.address || 'N/A'}</p>
                  <p>
                    <strong>Account Created :</strong>{" "}
                    {selectedUser.createdAt
                      ? new Date(selectedUser.createdAt).toLocaleString()
                      : "N/A"}
                  </p>

                  <p><strong>Verified:</strong> {selectedUser.isVerified ? 'Yes' : 'No'}</p>

                  <button
                    className="mt-4 bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
                    onClick={() => setSelectedUser(null)}
                  >
                    Close
                  </button>
                </div>
              </div>
            )}

          </TabsContent>

           <TabsContent value="products">
      <Card>
        <CardHeader>
          <CardTitle>Product Management</CardTitle>
        </CardHeader>
        <CardContent>
          {isProductsLoading ? (
            <p className="text-gray-500 text-center py-4">Loading products...</p>
          ) : productsError ? (
            <p className="text-red-500 text-center py-4">Error fetching products</p>
          ) : products?.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No products found</p>
          ) : (
            <>
              <div className="divide-y divide-gray-200">
                {products.map((product) => (
                  <div
                    key={product.id}
                    className="flex items-center justify-between p-4 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setSelectedProduct(product)}
                  >
                    <div>
                      <p className="font-medium text-gray-900">{product.name}</p>
                      <p className="text-sm text-gray-500">{product.categoryName || "No category"}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-700">{product.status || "Pending"}</p>
                      <p className="text-xs text-gray-400">
                        {new Date(product.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>

              {selectedProduct && (
                <div className="mt-6 p-4 border rounded-md bg-white shadow">
                  <h3 className="text-xl font-semibold mb-2">{selectedProduct.name}</h3>
                  <p><strong>Category:</strong> {selectedProduct.categoryName || "No category"}</p>
                  <p><strong>Description:</strong> {selectedProduct.description || "No description"}</p>
                  <p><strong>Price:</strong> ${selectedProduct.price}</p>
                  <p><strong>Original Price:</strong> ${selectedProduct.originalPrice}</p>
                  <p><strong>Stock Quantity:</strong> {selectedProduct.stockQuantity}</p>
                  <p><strong>Min Order Quantity:</strong> {selectedProduct.minOrderQuantity}</p>
                  <p><strong>Rating:</strong> {selectedProduct.rating} ({selectedProduct.reviewCount} reviews)</p>
                  <p><strong>Views:</strong> {selectedProduct.views}</p>
                  <p><strong>Short Description:</strong> {selectedProduct.shortDescription}</p>
                  {/* Render images if any */}
                  {selectedProduct.images?.length > 0 ? (
                    <div className="mt-4 flex space-x-2 overflow-x-auto">
                      {selectedProduct.images.map((imgUrl, idx) => (
                        <img
                          key={idx}
                          src={imgUrl}
                          alt={`Image ${idx + 1}`}
                          className="h-24 w-auto rounded-md"
                        />
                      ))}
                    </div>
                  ) : (
                    <p className="mt-4 text-gray-500">No images available.</p>
                  )}
                  {/* You can add more fields like specifications if needed */}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </TabsContent>

          <TabsContent value="categories" className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-semibold text-gray-900">Category Management</h2>
        <Button onClick={openAddCategoryModal}>
          <Plus className="w-4 h-4 mr-2" />
          Add Category
        </Button>

        <Dialog open={isCategoryModalOpen} onOpenChange={setIsCategoryModalOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>{selectedCategory ? "Edit Category" : "Add New Category"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleCategorySubmit} className="space-y-4">
              <div>
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={categoryForm.name}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, name: e.target.value }))}
                  required
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Input
                  id="description"
                  value={categoryForm.description}
                  onChange={(e) => setCategoryForm(prev => ({ ...prev, description: e.target.value }))}
                />
              </div>
              <div className="flex gap-4">
                <Button type="button" variant="outline" onClick={() => setIsCategoryModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={createCategoryMutation.isLoading || updateCategoryMutation.isLoading}
                >
                  {createCategoryMutation.isLoading || updateCategoryMutation.isLoading
                    ? selectedCategory ? "Updating..." : "Creating..."
                    : selectedCategory ? "Update Category" : "Create Category"}
                </Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent>
          {categoriesLoading ? (
            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full" />
              ))}
            </div>
          ) : categories?.length === 0 ? (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">No categories yet. Create your first category above.</p>
            </div>
          ) : (
            <div className="space-y-4">
              {categories?.map((category) => (
                <div key={category.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900">{category.name}</p>
                    {category.description && (
                      <p className="text-sm text-gray-600">{category.description}</p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditCategoryModal(category)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={async () => {
                        try {
                          await categoryAPI.deleteCategory(category.id);
                          refetchCategories();
                        } catch (err) {
                          console.error(err);
                          toast({
                            variant: "destructive",
                            title: "Error deleting category",
                            description: err.response?.data?.message || "An error occurred",
                          });
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </TabsContent>

          <TabsContent value="settings">
            <Card>
              <CardHeader>
                <CardTitle>Platform Settings</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <Settings className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Platform Configuration</h3>
                  <p className="text-gray-600">Platform settings and configuration options will be available here.</p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
