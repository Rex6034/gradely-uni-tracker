import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, AlertTriangle, Package, Save, X, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";

interface InventoryItem {
  id: string;
  medicine_id: string;
  medicine_name: string;
  brand_name: string;
  category_name: string;
  batch_number: string;
  expiry_date: string;
  purchase_price: number;
  selling_price: number;
  quantity_in_stock: number;
  minimum_stock_level: number;
  supplier_name: string;
}

const InventoryManager = () => {
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [medicines, setMedicines] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isAddMedicineDialogOpen, setIsAddMedicineDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedMedicine, setSelectedMedicine] = useState("");
  const [editingItem, setEditingItem] = useState<InventoryItem | null>(null);
  const [formData, setFormData] = useState({
    batch_number: "",
    expiry_date: "",
    purchase_price: "",
    selling_price: "",
    quantity_in_stock: "",
    minimum_stock_level: "10",
    supplier_name: "",
  });
  const [medicineFormData, setMedicineFormData] = useState({
    name: "",
    generic_name: "",
    dosage: "",
    form: "",
    brand_id: "",
    category_id: "",
    requires_prescription: false,
  });
  const [brands, setBrands] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [filteredInventory, setFilteredInventory] = useState<InventoryItem[]>([]);
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState<string>("all");
  const [selectedBrandFilter, setSelectedBrandFilter] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const { toast } = useToast();

  useEffect(() => {
    fetchInventory();
    fetchMedicines();
    fetchBrands();
    fetchCategories();
  }, []);

  // Filter inventory whenever inventory or filter values change
  useEffect(() => {
    let filtered = inventory;

    // Debug logging
    console.log('Filtering inventory:', {
      totalItems: inventory.length,
      searchTerm,
      selectedCategoryFilter,
      selectedBrandFilter,
      sampleItems: inventory.slice(0, 2).map(item => ({
        name: item.medicine_name,
        brand: item.brand_name,
        category: item.category_name
      }))
    });

    // Filter by search term
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase().trim();
      filtered = filtered.filter(item =>
        item.medicine_name.toLowerCase().includes(searchLower) ||
        item.brand_name.toLowerCase().includes(searchLower) ||
        item.category_name.toLowerCase().includes(searchLower) ||
        item.batch_number.toLowerCase().includes(searchLower)
      );
      console.log('After search filter:', filtered.length, 'items');
    }

    // Filter by category
    if (selectedCategoryFilter !== "all") {
      filtered = filtered.filter(item => 
        item.category_name.toLowerCase() === selectedCategoryFilter.toLowerCase()
      );
      console.log('After category filter:', filtered.length, 'items');
    }

    // Filter by brand
    if (selectedBrandFilter !== "all") {
      filtered = filtered.filter(item => 
        item.brand_name.toLowerCase() === selectedBrandFilter.toLowerCase()
      );
      console.log('After brand filter:', filtered.length, 'items');
    }

    console.log('Final filtered results:', filtered.length, 'items');
    setFilteredInventory(filtered);
  }, [inventory, searchTerm, selectedCategoryFilter, selectedBrandFilter]);

  const fetchInventory = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const { data: pharmacy } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (!pharmacy) return;

      const { data } = await supabase
        .from('pharmacy_inventory')
        .select(`
          *,
          medicines (
            name,
            medicine_brands (name),
            medicine_categories (name)
          )
        `)
        .eq('pharmacy_id', pharmacy.id);

      if (data) {
        const formattedInventory: InventoryItem[] = data.map((item: any) => ({
          id: item.id,
          medicine_id: item.medicine_id,
          medicine_name: item.medicines.name,
          brand_name: item.medicines.medicine_brands?.name || 'Generic',
          category_name: item.medicines.medicine_categories?.name || 'Uncategorized',
          batch_number: item.batch_number,
          expiry_date: item.expiry_date,
          purchase_price: parseFloat(item.purchase_price) || 0,
          selling_price: parseFloat(item.selling_price) || 0,
          quantity_in_stock: item.quantity_in_stock,
          minimum_stock_level: item.minimum_stock_level,
          supplier_name: item.supplier_name || '',
        }));
        setInventory(formattedInventory);
      }
    } catch (error) {
      console.error('Error fetching inventory:', error);
      toast({
        title: "Error",
        description: "Failed to load inventory",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchMedicines = async () => {
    try {
      const { data } = await supabase
        .from('medicines')
        .select(`
          *,
          medicine_brands (name),
          medicine_categories (name)
        `)
        .order('name');

      if (data) setMedicines(data);
    } catch (error) {
      console.error('Error fetching medicines:', error);
    }
  };

  const fetchBrands = async () => {
    try {
      const { data } = await supabase
        .from('medicine_brands')
        .select('*')
        .order('name');

      if (data) setBrands(data);
    } catch (error) {
      console.error('Error fetching brands:', error);
    }
  };

  const fetchCategories = async () => {
    try {
      const { data } = await supabase
        .from('medicine_categories')
        .select('*')
        .order('name');

      if (data) setCategories(data);
    } catch (error) {
      console.error('Error fetching categories:', error);
    }
  };

  const handleAddInventory = async () => {
    console.log('handleAddInventory called');
    console.log('selectedMedicine:', selectedMedicine);
    console.log('formData:', formData);
    
    if (!selectedMedicine || !formData.batch_number || !formData.expiry_date) {
      console.log('Validation failed - missing required fields');
      toast({
        title: "Missing Information",
        description: "Please select a medicine and fill in batch number and expiry date",
        variant: "destructive",
      });
      return;
    }

    if (!formData.selling_price || !formData.quantity_in_stock) {
      console.log('Validation failed - missing selling price or quantity');
      toast({
        title: "Missing Information", 
        description: "Please enter selling price and quantity",
        variant: "destructive",
      });
      return;
    }

    try {
      console.log('Getting user...');
      const { data: { user }, error: userError } = await supabase.auth.getUser();
      if (userError) {
        console.error('User error:', userError);
        throw userError;
      }
      if (!user) {
        console.log('No user found');
        toast({
          title: "Authentication Error",
          description: "Please log in to add inventory",
          variant: "destructive",
        });
        return;
      }

      console.log('Getting pharmacy for user:', user.id);
      const { data: pharmacy, error: pharmacyError } = await supabase
        .from('pharmacies')
        .select('id')
        .eq('user_id', user.id)
        .maybeSingle();

      if (pharmacyError && pharmacyError.code !== 'PGRST116') {
        console.error('Pharmacy error:', pharmacyError);
        throw pharmacyError;
      }
      if (!pharmacy) {
        console.log('No pharmacy found for user');
        toast({
          title: "Setup Required",
          description: "Please complete your pharmacy setup first",
          variant: "destructive",
        });
        return;
      }

      console.log('Pharmacy found:', pharmacy.id);
      console.log('Inserting inventory item...');
      
      const inventoryItem = {
        pharmacy_id: pharmacy.id,
        medicine_id: selectedMedicine,
        batch_number: formData.batch_number,
        expiry_date: formData.expiry_date,
        purchase_price: parseFloat(formData.purchase_price) || 0,
        selling_price: parseFloat(formData.selling_price),
        quantity_in_stock: parseInt(formData.quantity_in_stock),
        minimum_stock_level: parseInt(formData.minimum_stock_level) || 10,
        supplier_name: formData.supplier_name || '',
      };
      
      console.log('Inventory item to insert:', inventoryItem);

      const { data: insertedData, error: insertError } = await supabase
        .from('pharmacy_inventory')
        .insert(inventoryItem)
        .select();

      if (insertError) {
        console.error('Insert error:', insertError);
        throw insertError;
      }

      console.log('Successfully inserted:', insertedData);

      toast({
        title: "Success",
        description: "Inventory item added successfully",
      });

      setIsAddDialogOpen(false);
      setSelectedMedicine("");
      setFormData({
        batch_number: "",
        expiry_date: "",
        purchase_price: "",
        selling_price: "",
        quantity_in_stock: "",
        minimum_stock_level: "10",
        supplier_name: "",
      });
      
      console.log('Refreshing inventory...');
      await fetchInventory();

    } catch (error: any) {
      console.error('Error adding inventory:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add inventory item",
        variant: "destructive",
      });
    }
  };

  const handleEditInventory = (item: InventoryItem) => {
    setEditingItem(item);
    setFormData({
      batch_number: item.batch_number,
      expiry_date: item.expiry_date,
      purchase_price: item.purchase_price.toString(),
      selling_price: item.selling_price.toString(),
      quantity_in_stock: item.quantity_in_stock.toString(),
      minimum_stock_level: item.minimum_stock_level.toString(),
      supplier_name: item.supplier_name,
    });
    setIsEditDialogOpen(true);
  };

  const handleUpdateInventory = async () => {
    if (!editingItem) return;

    try {
      const { error } = await supabase
        .from('pharmacy_inventory')
        .update({
          batch_number: formData.batch_number,
          expiry_date: formData.expiry_date,
          purchase_price: parseFloat(formData.purchase_price) || 0,
          selling_price: parseFloat(formData.selling_price),
          quantity_in_stock: parseInt(formData.quantity_in_stock),
          minimum_stock_level: parseInt(formData.minimum_stock_level) || 10,
          supplier_name: formData.supplier_name || '',
        })
        .eq('id', editingItem.id);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Inventory item updated successfully",
      });

      setIsEditDialogOpen(false);
      setEditingItem(null);
      await fetchInventory();

    } catch (error: any) {
      console.error('Error updating inventory:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to update inventory item",
        variant: "destructive",
      });
    }
  };

  const handleAddMedicine = async () => {
    if (!medicineFormData.name || !medicineFormData.brand_id || !medicineFormData.category_id) {
      toast({
        title: "Missing Information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    try {
      const { data, error } = await supabase
        .from('medicines')
        .insert({
          name: medicineFormData.name,
          generic_name: medicineFormData.generic_name,
          dosage: medicineFormData.dosage,
          form: medicineFormData.form,
          brand_id: medicineFormData.brand_id,
          category_id: medicineFormData.category_id,
          requires_prescription: medicineFormData.requires_prescription,
        })
        .select();

      if (error) throw error;

      toast({
        title: "Success",
        description: "Medicine added successfully",
      });

      setIsAddMedicineDialogOpen(false);
      setMedicineFormData({
        name: "",
        generic_name: "",
        dosage: "",
        form: "",
        brand_id: "",
        category_id: "",
        requires_prescription: false,
      });
      
      await fetchMedicines();

    } catch (error: any) {
      console.error('Error adding medicine:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to add medicine",
        variant: "destructive",
      });
    }
  };

  const isLowStock = (item: InventoryItem) => {
    return item.quantity_in_stock <= item.minimum_stock_level;
  };

  const isExpiringSoon = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    const diffTime = expiry.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays <= 30 && diffDays > 0;
  };

  const isExpired = (expiryDate: string) => {
    const expiry = new Date(expiryDate);
    const today = new Date();
    return expiry < today;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">Inventory Management</h2>
        <div className="flex gap-2">
          <Dialog open={isAddMedicineDialogOpen} onOpenChange={setIsAddMedicineDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Plus className="mr-2 h-4 w-4" />
                Add Medicine
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add New Medicine</DialogTitle>
                <DialogDescription>
                  Add a new medicine to the database
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Medicine Name *</Label>
                  <Input
                    value={medicineFormData.name}
                    onChange={(e) => setMedicineFormData(prev => ({ ...prev, name: e.target.value }))}
                    placeholder="Medicine name"
                  />
                </div>
                
                <div>
                  <Label>Generic Name</Label>
                  <Input
                    value={medicineFormData.generic_name}
                    onChange={(e) => setMedicineFormData(prev => ({ ...prev, generic_name: e.target.value }))}
                    placeholder="Generic name"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Dosage</Label>
                    <Input
                      value={medicineFormData.dosage}
                      onChange={(e) => setMedicineFormData(prev => ({ ...prev, dosage: e.target.value }))}
                      placeholder="e.g., 500mg"
                    />
                  </div>
                  <div>
                    <Label>Form</Label>
                    <Input
                      value={medicineFormData.form}
                      onChange={(e) => setMedicineFormData(prev => ({ ...prev, form: e.target.value }))}
                      placeholder="e.g., Tablet"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Brand *</Label>
                    <Select value={medicineFormData.brand_id} onValueChange={(value) => setMedicineFormData(prev => ({ ...prev, brand_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select brand" />
                      </SelectTrigger>
                      <SelectContent>
                        {brands.map((brand) => (
                          <SelectItem key={brand.id} value={brand.id}>
                            {brand.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Category *</Label>
                    <Select value={medicineFormData.category_id} onValueChange={(value) => setMedicineFormData(prev => ({ ...prev, category_id: value }))}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select category" />
                      </SelectTrigger>
                      <SelectContent>
                        {categories.map((category) => (
                          <SelectItem key={category.id} value={category.id}>
                            {category.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id="requires_prescription"
                    checked={medicineFormData.requires_prescription}
                    onChange={(e) => setMedicineFormData(prev => ({ ...prev, requires_prescription: e.target.checked }))}
                    className="rounded"
                  />
                  <Label htmlFor="requires_prescription">Requires Prescription</Label>
                </div>

                <Button onClick={handleAddMedicine} className="w-full">
                  Add Medicine
                </Button>
              </div>
            </DialogContent>
          </Dialog>

          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Add Inventory
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-md">
              <DialogHeader>
                <DialogTitle>Add Inventory Item</DialogTitle>
                <DialogDescription>
                  Add a new medicine to your pharmacy inventory
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Medicine</Label>
                  <Select value={selectedMedicine} onValueChange={setSelectedMedicine}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a medicine" />
                    </SelectTrigger>
                    <SelectContent>
                      {medicines.map((medicine) => (
                        <SelectItem key={medicine.id} value={medicine.id}>
                          {medicine.name} - {medicine.medicine_brands?.name || 'Generic'}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Batch Number</Label>
                    <Input
                      value={formData.batch_number}
                      onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
                      placeholder="Batch #"
                    />
                  </div>
                  <div>
                    <Label>Expiry Date</Label>
                    <Input
                      type="date"
                      value={formData.expiry_date}
                      onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Purchase Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.purchase_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                  <div>
                    <Label>Selling Price</Label>
                    <Input
                      type="number"
                      step="0.01"
                      value={formData.selling_price}
                      onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                      placeholder="0.00"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label>Quantity</Label>
                    <Input
                      type="number"
                      value={formData.quantity_in_stock}
                      onChange={(e) => setFormData(prev => ({ ...prev, quantity_in_stock: e.target.value }))}
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <Label>Min Stock Level</Label>
                    <Input
                      type="number"
                      value={formData.minimum_stock_level}
                      onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock_level: e.target.value }))}
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <Label>Supplier Name</Label>
                  <Input
                    value={formData.supplier_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                    placeholder="Supplier name"
                  />
                </div>

                <Button onClick={handleAddInventory} className="w-full">
                  Add to Inventory
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      

      {/* Search and Filter Section */}
      <Card>
        <CardHeader>
          <CardTitle>Search & Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Search */}
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search medicines, brands, batches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            {/* Category Filter */}
            <Select value={selectedCategoryFilter} onValueChange={setSelectedCategoryFilter}>
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
            <Select value={selectedBrandFilter} onValueChange={setSelectedBrandFilter}>
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

            {/* Clear Filters Button */}
            <Button 
              variant="outline" 
              onClick={() => {
                setSearchTerm("");
                setSelectedCategoryFilter("all");
                setSelectedBrandFilter("all");
              }}
            >
              Clear Filters
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Edit Inventory Dialog */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Inventory Item</DialogTitle>
            <DialogDescription>
              Update inventory item details
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Batch Number</Label>
                <Input
                  value={formData.batch_number}
                  onChange={(e) => setFormData(prev => ({ ...prev, batch_number: e.target.value }))}
                  placeholder="Batch #"
                />
              </div>
              <div>
                <Label>Expiry Date</Label>
                <Input
                  type="date"
                  value={formData.expiry_date}
                  onChange={(e) => setFormData(prev => ({ ...prev, expiry_date: e.target.value }))}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Purchase Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.purchase_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, purchase_price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <Label>Selling Price</Label>
                <Input
                  type="number"
                  step="0.01"
                  value={formData.selling_price}
                  onChange={(e) => setFormData(prev => ({ ...prev, selling_price: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={formData.quantity_in_stock}
                  onChange={(e) => setFormData(prev => ({ ...prev, quantity_in_stock: e.target.value }))}
                  placeholder="0"
                />
              </div>
              <div>
                <Label>Min Stock Level</Label>
                <Input
                  type="number"
                  value={formData.minimum_stock_level}
                  onChange={(e) => setFormData(prev => ({ ...prev, minimum_stock_level: e.target.value }))}
                  placeholder="10"
                />
              </div>
            </div>

            <div>
              <Label>Supplier Name</Label>
              <Input
                value={formData.supplier_name}
                onChange={(e) => setFormData(prev => ({ ...prev, supplier_name: e.target.value }))}
                placeholder="Supplier name"
              />
            </div>

            <div className="flex gap-2">
              <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="flex-1">
                Cancel
              </Button>
              <Button onClick={handleUpdateInventory} className="flex-1">
                Update Inventory
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <Package className="h-8 w-8 text-blue-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">
                  {searchTerm || selectedCategoryFilter !== "all" || selectedBrandFilter !== "all" ? "Filtered Items" : "Total Items"}
                </p>
                <p className="text-2xl font-bold">{filteredInventory.length}</p>
                {(searchTerm || selectedCategoryFilter !== "all" || selectedBrandFilter !== "all") && (
                  <p className="text-xs text-gray-500">of {inventory.length} total</p>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-orange-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Low Stock</p>
                <p className="text-2xl font-bold text-orange-500">
                  {filteredInventory.filter(isLowStock).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-yellow-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Expiring Soon</p>
                <p className="text-2xl font-bold text-yellow-500">
                  {filteredInventory.filter(item => isExpiringSoon(item.expiry_date)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-4">
            <div className="flex items-center">
              <AlertTriangle className="h-8 w-8 text-red-500 mr-3" />
              <div>
                <p className="text-sm text-gray-600">Expired</p>
                <p className="text-2xl font-bold text-red-500">
                  {filteredInventory.filter(item => isExpired(item.expiry_date)).length}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Inventory Table */}
      <Card>
        <CardHeader>
          <CardTitle>Inventory Items</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">Medicine</th>
                  <th className="text-left p-2">Batch</th>
                  <th className="text-left p-2">Expiry</th>
                  <th className="text-left p-2">Stock</th>
                  <th className="text-left p-2">Price</th>
                  <th className="text-left p-2">Status</th>
                  <th className="text-left p-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="text-center p-8 text-gray-500">
                      {searchTerm || selectedCategoryFilter !== "all" || selectedBrandFilter !== "all" 
                        ? "No items match your filters" 
                        : "No inventory items found"}
                    </td>
                  </tr>
                ) : (
                  filteredInventory.map((item) => (
                  <tr key={item.id} className="border-b hover:bg-gray-50">
                    <td className="p-2">
                      <div>
                        <div className="font-medium">{item.medicine_name}</div>
                        <div className="text-xs text-gray-500">
                          {item.brand_name} • {item.category_name}
                        </div>
                      </div>
                    </td>
                    <td className="p-2">{item.batch_number}</td>
                    <td className="p-2">
                      <div className={`${isExpired(item.expiry_date) ? 'text-red-600' : isExpiringSoon(item.expiry_date) ? 'text-yellow-600' : ''}`}>
                        {new Date(item.expiry_date).toLocaleDateString()}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className={`${isLowStock(item) ? 'text-orange-600 font-medium' : ''}`}>
                        {item.quantity_in_stock}
                      </div>
                      <div className="text-xs text-gray-500">
                        Min: {item.minimum_stock_level}
                      </div>
                    </td>
                    <td className="p-2">
                      <div>Rs. {item.selling_price.toFixed(2)}</div>
                      <div className="text-xs text-gray-500">
                        Cost: Rs. {item.purchase_price.toFixed(2)}
                      </div>
                    </td>
                    <td className="p-2">
                      <div className="space-y-1">
                        {isExpired(item.expiry_date) && (
                          <Badge variant="destructive" className="text-xs">Expired</Badge>
                        )}
                        {!isExpired(item.expiry_date) && isExpiringSoon(item.expiry_date) && (
                          <Badge variant="secondary" className="text-xs">Expiring Soon</Badge>
                        )}
                        {isLowStock(item) && (
                          <Badge variant="outline" className="text-xs border-orange-500 text-orange-600">Low Stock</Badge>
                        )}
                        {!isExpired(item.expiry_date) && !isExpiringSoon(item.expiry_date) && !isLowStock(item) && (
                          <Badge variant="secondary" className="text-xs">Good</Badge>
                        )}
                      </div>
                    </td>
                    <td className="p-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditInventory(item)}
                      >
                        <Edit className="h-3 w-3" />
                      </Button>
                    </td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryManager;