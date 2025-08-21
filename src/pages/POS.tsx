import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ShoppingCart, Search, Filter, Plus, Minus, Receipt, CreditCard, Banknote, Smartphone, Package, BarChart3, ArrowLeft } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import InventoryManager from "@/components/InventoryManager";
import SalesReports from "@/components/SalesReports";

interface Medicine {
  id: string;
  name: string;
  generic_name: string;
  dosage: string;
  form: string;
  brand_name: string;
  category_name: string;
  selling_price: number;
  quantity_in_stock: number;
  inventory_id: string;
  requires_prescription: boolean;
}

interface CartItem extends Medicine {
  quantity: number;
  total: number;
}

interface Customer {
  name: string;
  phone: string;
}

const POS = () => {
  const navigate = useNavigate();
  const [medicines, setMedicines] = useState<Medicine[]>([]);
  const [filteredMedicines, setFilteredMedicines] = useState<Medicine[]>([]);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [selectedBrand, setSelectedBrand] = useState<string>("all");
  const [categories, setCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [customer, setCustomer] = useState<Customer>({ name: "", phone: "" });
  const [paymentMethod, setPaymentMethod] = useState<string>("cash");
  const [loading, setLoading] = useState(true);
  const [processingPayment, setProcessingPayment] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const { toast } = useToast();

  // Check authentication first
  useEffect(() => {
    const checkAuth = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('Auth error:', error);
          toast({
            title: "Authentication Error",
            description: "Please log in to access the POS system",
            variant: "destructive",
          });
          navigate("/login/pharmacy");
          return;
        }

        if (!session) {
          toast({
            title: "Authentication Required",
            description: "Please log in to access the POS system",
            variant: "destructive",
          });
          navigate("/login/pharmacy");
          return;
        }

        setIsAuthenticated(true);
        fetchData();
      } catch (error) {
        console.error('Unexpected auth error:', error);
        navigate("/login/pharmacy");
      }
    };

    checkAuth();

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_OUT' || !session) {
        setIsAuthenticated(false);
        navigate("/login/pharmacy");
      } else if (event === 'SIGNED_IN' && session) {
        setIsAuthenticated(true);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const fetchData = async () => {
    try {
      // Get current pharmacy
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!pharmacy) return;

      // Fetch inventory with medicine details
      const { data: inventoryData } = await supabase
        .from('pharmacy_inventory')
        .select(`
          id,
          selling_price,
          quantity_in_stock,
          medicines (
            id,
            name,
            generic_name,
            dosage,
            form,
            requires_prescription,
            medicine_brands (
              name
            ),
            medicine_categories (
              name
            )
          )
        `)
        .eq('pharmacy_id', pharmacy.id)
        .gt('quantity_in_stock', 0);

      if (inventoryData) {
        const formattedMedicines: Medicine[] = inventoryData.map((item: any) => ({
          id: item.medicines.id,
          name: item.medicines.name,
          generic_name: item.medicines.generic_name || '',
          dosage: item.medicines.dosage || '',
          form: item.medicines.form || '',
          brand_name: item.medicines.medicine_brands?.name || 'Generic',
          category_name: item.medicines.medicine_categories?.name || 'Uncategorized',
          selling_price: parseFloat(item.selling_price) || 0,
          quantity_in_stock: item.quantity_in_stock,
          inventory_id: item.id,
          requires_prescription: item.medicines.requires_prescription || false,
        }));
        setMedicines(formattedMedicines);
        setFilteredMedicines(formattedMedicines);
      }

      // Fetch categories
      const { data: categoriesData } = await supabase
        .from('medicine_categories')
        .select('*')
        .order('name');
      
      if (categoriesData) setCategories(categoriesData);

      // Fetch brands
      const { data: brandsData } = await supabase
        .from('medicine_brands')
        .select('*')
        .order('name');
      
      if (brandsData) setBrands(brandsData);

    } catch (error) {
      console.error('Error fetching data:', error);
      toast({
        title: "Error",
        description: "Failed to load medicines data",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  // Filter medicines
  useEffect(() => {
    let filtered = medicines;

    if (searchTerm) {
      filtered = filtered.filter(medicine =>
        medicine.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.generic_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        medicine.brand_name.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    if (selectedCategory !== "all") {
      filtered = filtered.filter(medicine => medicine.category_name === selectedCategory);
    }

    if (selectedBrand !== "all") {
      filtered = filtered.filter(medicine => medicine.brand_name === selectedBrand);
    }

    setFilteredMedicines(filtered);
  }, [searchTerm, selectedCategory, selectedBrand, medicines]);

  const addToCart = (medicine: Medicine) => {
    const existingItem = cart.find(item => item.inventory_id === medicine.inventory_id);
    
    if (existingItem) {
      if (existingItem.quantity >= medicine.quantity_in_stock) {
        toast({
          title: "Insufficient Stock",
          description: `Only ${medicine.quantity_in_stock} units available`,
          variant: "destructive",
        });
        return;
      }
      updateCartQuantity(medicine.inventory_id, existingItem.quantity + 1);
    } else {
      const cartItem: CartItem = {
        ...medicine,
        quantity: 1,
        total: medicine.selling_price,
      };
      setCart(prev => [...prev, cartItem]);
    }
  };

  const updateCartQuantity = (inventoryId: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeFromCart(inventoryId);
      return;
    }

    setCart(prev => prev.map(item => {
      if (item.inventory_id === inventoryId) {
        const maxQuantity = item.quantity_in_stock;
        const quantity = Math.min(newQuantity, maxQuantity);
        return {
          ...item,
          quantity,
          total: quantity * item.selling_price,
        };
      }
      return item;
    }));
  };

  const removeFromCart = (inventoryId: string) => {
    setCart(prev => prev.filter(item => item.inventory_id !== inventoryId));
  };

  const getCartTotal = () => {
    return cart.reduce((total, item) => total + item.total, 0);
  };

  const clearCart = () => {
    setCart([]);
    setCustomer({ name: "", phone: "" });
  };

  const processPayment = async () => {
    if (cart.length === 0) {
      toast({
        title: "Empty Cart",
        description: "Please add items to cart before checkout",
        variant: "destructive",
      });
      return;
    }

    setProcessingPayment(true);
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("User not authenticated");

      const { data: pharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .single();

      if (!pharmacy) throw new Error("Pharmacy not found");

      // Create transaction
      const { data: transaction, error: transactionError } = await supabase
        .from('sales_transactions')
        .insert({
          pharmacy_id: pharmacy.id,
          transaction_number: `TXN-${Date.now()}`,
          customer_name: customer.name || 'Walk-in Customer',
          customer_phone: customer.phone || '',
          total_amount: getCartTotal(),
          payment_method: paymentMethod,
          created_by: user.id,
        })
        .select()
        .single();

      if (transactionError) throw transactionError;

      // Create sale items
      const saleItems = cart.map(item => ({
        transaction_id: transaction.id,
        inventory_id: item.inventory_id,
        medicine_name: item.name,
        quantity: item.quantity,
        unit_price: item.selling_price,
        total_price: item.total,
      }));

      const { error: itemsError } = await supabase
        .from('sale_items')
        .insert(saleItems);

      if (itemsError) throw itemsError;

      // Update inventory quantities
      for (const item of cart) {
        const { error: updateError } = await supabase
          .from('pharmacy_inventory')
          .update({
            quantity_in_stock: item.quantity_in_stock - item.quantity
          })
          .eq('id', item.inventory_id);

        if (updateError) throw updateError;
      }

      toast({
        title: "Payment Successful",
        description: `Transaction ${transaction.transaction_number} completed successfully`,
      });

      // Refresh data and clear cart
      clearCart();
      fetchData();

    } catch (error) {
      console.error('Error processing payment:', error);
      toast({
        title: "Payment Failed",
        description: "Failed to process payment. Please try again.",
        variant: "destructive",
      });
    } finally {
      setProcessingPayment(false);
    }
  };

  if (loading || !isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-primary"></div>
          <p className="mt-4 text-lg">
            {!isAuthenticated ? "Checking authentication..." : "Loading POS System..."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto p-4">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center">
            <Button 
              variant="outline" 
              onClick={() => navigate('/dashboard/pharmacy')}
              className="mr-4"
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Dashboard
            </Button>
            <h1 className="text-3xl font-bold text-gray-900 flex items-center">
              <ShoppingCart className="mr-3 h-8 w-8 text-primary" />
              Pharmacy Management System
            </h1>
          </div>
        </div>

        <Tabs defaultValue="pos" className="space-y-4">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="pos" className="flex items-center">
              <ShoppingCart className="mr-2 h-4 w-4" />
              POS System
            </TabsTrigger>
            <TabsTrigger value="inventory" className="flex items-center">
              <Package className="mr-2 h-4 w-4" />
              Inventory
            </TabsTrigger>
            <TabsTrigger value="reports" className="flex items-center">
              <BarChart3 className="mr-2 h-4 w-4" />
              Sales Reports
            </TabsTrigger>
          </TabsList>

          <TabsContent value="pos" className="space-y-4">
            {renderPOSContent()}
          </TabsContent>

          <TabsContent value="inventory">
            <InventoryManager />
          </TabsContent>

          <TabsContent value="reports">
            <SalesReports />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );

  function renderPOSContent() {
    return (
      <div>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold">Point of Sale</h2>
          <div className="flex space-x-2">
            <Button variant="outline" onClick={clearCart}>
              Clear Cart
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Medicine Selection */}
          <div className="lg:col-span-2">
            <Card>
              <CardHeader>
                <CardTitle>Medicine Inventory</CardTitle>
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Search */}
                  <div className="flex-1 relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search medicines..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                  
                  {/* Category Filter */}
                  <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Categories" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Categories</SelectItem>
                      {categories.map(category => (
                        <SelectItem key={category.id} value={category.name}>
                          {category.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  {/* Brand Filter */}
                  <Select value={selectedBrand} onValueChange={setSelectedBrand}>
                    <SelectTrigger className="w-48">
                      <SelectValue placeholder="All Brands" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Brands</SelectItem>
                      {brands.map(brand => (
                        <SelectItem key={brand.id} value={brand.name}>
                          {brand.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-96">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {filteredMedicines.map((medicine) => (
                      <Card key={medicine.inventory_id} className="hover:shadow-md transition-shadow">
                        <CardContent className="p-4">
                          <div className="flex justify-between items-start mb-2">
                            <div className="flex-1">
                              <h3 className="font-semibold text-sm">{medicine.name}</h3>
                              {medicine.generic_name && (
                                <p className="text-xs text-gray-500">{medicine.generic_name}</p>
                              )}
                              <div className="flex flex-wrap gap-1 mt-2">
                                <Badge variant="outline" className="text-xs">
                                  {medicine.brand_name}
                                </Badge>
                                <Badge variant="secondary" className="text-xs">
                                  {medicine.category_name}
                                </Badge>
                                {medicine.requires_prescription && (
                                  <Badge variant="destructive" className="text-xs">
                                    Prescription
                                  </Badge>
                                )}
                              </div>
                            </div>
                            <div className="text-right ml-2">
                              <div className="font-bold text-lg text-primary">
                                ₹{medicine.selling_price}
                              </div>
                              <div className="text-xs text-gray-500">
                                Stock: {medicine.quantity_in_stock}
                              </div>
                            </div>
                          </div>
                          <div className="flex justify-between items-center mt-3">
                            <div className="text-xs text-gray-600">
                              {medicine.dosage} • {medicine.form}
                            </div>
                            <Button
                              size="sm"
                              onClick={() => addToCart(medicine)}
                              disabled={medicine.quantity_in_stock === 0}
                            >
                              <Plus className="h-3 w-3 mr-1" />
                              Add
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </div>

          {/* Cart and Checkout */}
          <div className="lg:col-span-1">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <ShoppingCart className="mr-2 h-5 w-5" />
                  Cart ({cart.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-64 mb-4">
                  {cart.length === 0 ? (
                    <div className="text-center text-gray-500 py-8">
                      Cart is empty
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {cart.map((item) => (
                        <div key={item.inventory_id} className="flex items-center justify-between p-2 border rounded">
                          <div className="flex-1">
                            <div className="font-medium text-sm">{item.name}</div>
                            <div className="text-xs text-gray-500">₹{item.selling_price} each</div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.inventory_id, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm">{item.quantity}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => updateCartQuantity(item.inventory_id, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          <div className="ml-2 font-medium text-sm">
                            ₹{item.total.toFixed(2)}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>

                <Separator className="my-4" />

                {/* Customer Info */}
                <div className="space-y-3 mb-4">
                  <Input
                    placeholder="Customer Name (Optional)"
                    value={customer.name}
                    onChange={(e) => setCustomer(prev => ({ ...prev, name: e.target.value }))}
                  />
                  <Input
                    placeholder="Customer Phone (Optional)"
                    value={customer.phone}
                    onChange={(e) => setCustomer(prev => ({ ...prev, phone: e.target.value }))}
                  />
                </div>

                {/* Payment Method */}
                <div className="mb-4">
                  <Label>Payment Method</Label>
                  <Select value={paymentMethod} onValueChange={setPaymentMethod}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="cash">
                        <div className="flex items-center">
                          <Banknote className="mr-2 h-4 w-4" />
                          Cash
                        </div>
                      </SelectItem>
                      <SelectItem value="card">
                        <div className="flex items-center">
                          <CreditCard className="mr-2 h-4 w-4" />
                          Card
                        </div>
                      </SelectItem>
                      <SelectItem value="upi">
                        <div className="flex items-center">
                          <Smartphone className="mr-2 h-4 w-4" />
                          UPI
                        </div>
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Total */}
                <div className="mb-4">
                  <div className="flex justify-between items-center text-lg font-bold">
                    <span>Total:</span>
                    <span>₹{getCartTotal().toFixed(2)}</span>
                  </div>
                </div>

                {/* Checkout Button */}
                <Button
                  className="w-full"
                  size="lg"
                  onClick={processPayment}
                  disabled={cart.length === 0 || processingPayment}
                >
                  {processingPayment ? (
                    <div className="flex items-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : (
                    <>
                      <Receipt className="mr-2 h-4 w-4" />
                      Complete Sale
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }
};

export default POS;