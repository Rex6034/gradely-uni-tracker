-- Create medicine categories table
CREATE TABLE public.medicine_categories (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicine brands table
CREATE TABLE public.medicine_brands (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  manufacturer TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create medicines table
CREATE TABLE public.medicines (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  generic_name TEXT,
  brand_id UUID REFERENCES public.medicine_brands(id),
  category_id UUID REFERENCES public.medicine_categories(id),
  dosage TEXT,
  form TEXT, -- tablet, capsule, syrup, injection, etc.
  description TEXT,
  barcode TEXT UNIQUE,
  requires_prescription BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create pharmacy inventory table
CREATE TABLE public.pharmacy_inventory (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  medicine_id UUID REFERENCES public.medicines(id),
  batch_number TEXT,
  expiry_date DATE,
  purchase_price DECIMAL(10,2),
  selling_price DECIMAL(10,2),
  quantity_in_stock INTEGER DEFAULT 0,
  minimum_stock_level INTEGER DEFAULT 10,
  supplier_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(pharmacy_id, medicine_id, batch_number)
);

-- Create sales transactions table
CREATE TABLE public.sales_transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  pharmacy_id UUID REFERENCES public.pharmacies(id) ON DELETE CASCADE,
  transaction_number TEXT UNIQUE NOT NULL,
  customer_name TEXT,
  customer_phone TEXT,
  total_amount DECIMAL(10,2) NOT NULL,
  tax_amount DECIMAL(10,2) DEFAULT 0,
  discount_amount DECIMAL(10,2) DEFAULT 0,
  payment_method TEXT DEFAULT 'cash', -- cash, card, upi, etc.
  transaction_date TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Create sale items table
CREATE TABLE public.sale_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  transaction_id UUID REFERENCES public.sales_transactions(id) ON DELETE CASCADE,
  inventory_id UUID REFERENCES public.pharmacy_inventory(id),
  medicine_name TEXT NOT NULL,
  quantity INTEGER NOT NULL,
  unit_price DECIMAL(10,2) NOT NULL,
  total_price DECIMAL(10,2) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.medicine_categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicine_brands ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.medicines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.pharmacy_inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sales_transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sale_items ENABLE ROW LEVEL SECURITY;

-- Create policies for medicine categories (public read, authenticated write)
CREATE POLICY "Anyone can view medicine categories" 
ON public.medicine_categories 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage categories" 
ON public.medicine_categories 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policies for medicine brands (public read, authenticated write)
CREATE POLICY "Anyone can view medicine brands" 
ON public.medicine_brands 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage brands" 
ON public.medicine_brands 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policies for medicines (public read, authenticated write)
CREATE POLICY "Anyone can view medicines" 
ON public.medicines 
FOR SELECT 
USING (true);

CREATE POLICY "Authenticated users can manage medicines" 
ON public.medicines 
FOR ALL 
TO authenticated 
USING (true) 
WITH CHECK (true);

-- Create policies for pharmacy inventory (pharmacy-specific access)
CREATE POLICY "Pharmacies can view their own inventory" 
ON public.pharmacy_inventory 
FOR SELECT 
USING (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Pharmacies can manage their own inventory" 
ON public.pharmacy_inventory 
FOR ALL 
USING (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies WHERE user_id = auth.uid()
  )
) 
WITH CHECK (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies WHERE user_id = auth.uid()
  )
);

-- Create policies for sales transactions (pharmacy-specific access)
CREATE POLICY "Pharmacies can view their own transactions" 
ON public.sales_transactions 
FOR SELECT 
USING (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies WHERE user_id = auth.uid()
  )
);

CREATE POLICY "Pharmacies can create their own transactions" 
ON public.sales_transactions 
FOR INSERT 
WITH CHECK (
  pharmacy_id IN (
    SELECT id FROM public.pharmacies WHERE user_id = auth.uid()
  )
);

-- Create policies for sale items (accessible through transaction relationship)
CREATE POLICY "Users can view sale items for their transactions" 
ON public.sale_items 
FOR SELECT 
USING (
  transaction_id IN (
    SELECT id FROM public.sales_transactions 
    WHERE pharmacy_id IN (
      SELECT id FROM public.pharmacies WHERE user_id = auth.uid()
    )
  )
);

CREATE POLICY "Users can create sale items for their transactions" 
ON public.sale_items 
FOR INSERT 
WITH CHECK (
  transaction_id IN (
    SELECT id FROM public.sales_transactions 
    WHERE pharmacy_id IN (
      SELECT id FROM public.pharmacies WHERE user_id = auth.uid()
    )
  )
);

-- Add triggers for updated_at timestamps
CREATE TRIGGER update_medicine_categories_updated_at
BEFORE UPDATE ON public.medicine_categories
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicine_brands_updated_at
BEFORE UPDATE ON public.medicine_brands
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_medicines_updated_at
BEFORE UPDATE ON public.medicines
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_pharmacy_inventory_updated_at
BEFORE UPDATE ON public.pharmacy_inventory
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Create function to generate transaction numbers
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT AS $$
BEGIN
  RETURN 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM NOW())::text, 10, '0');
END;
$$ LANGUAGE plpgsql;

-- Insert some sample data
INSERT INTO public.medicine_categories (name, description) VALUES
('Painkillers', 'Medications for pain relief'),
('Antibiotics', 'Antimicrobial medications'),
('Vitamins', 'Vitamin supplements'),
('Cold & Flu', 'Medications for cold and flu symptoms'),
('Digestive Health', 'Medications for digestive issues'),
('Heart & Blood Pressure', 'Cardiovascular medications'),
('Diabetes', 'Diabetes management medications'),
('Skin Care', 'Topical medications and skin treatments');

INSERT INTO public.medicine_brands (name, manufacturer) VALUES
('Paracetamol', 'Various Manufacturers'),
('Ibuprofen', 'Various Manufacturers'),
('Amoxicillin', 'Various Manufacturers'),
('Crocin', 'GSK'),
('Dolo', 'Micro Labs'),
('Azithromycin', 'Various Manufacturers'),
('Vitamin D3', 'Various Manufacturers'),
('Cetzine', 'Dr. Reddys'),
('Pantop', 'Aristo Pharmaceuticals'),
('Metformin', 'Various Manufacturers');