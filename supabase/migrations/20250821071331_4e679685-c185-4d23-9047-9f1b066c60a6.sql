-- Insert sample medicines into the medicines table
INSERT INTO public.medicines (name, generic_name, brand_id, category_id, dosage, form, barcode, requires_prescription) 
SELECT 
  medicine_name,
  generic_name,
  brand.id as brand_id,
  category.id as category_id,
  dosage,
  form,
  barcode,
  requires_prescription
FROM (
  VALUES 
    ('Crocin 650mg', 'Paracetamol', 'Crocin', 'Painkillers', '650mg', 'Tablet', 'CRC650001', false),
    ('Dolo 650mg', 'Paracetamol', 'Dolo', 'Painkillers', '650mg', 'Tablet', 'DOL650001', false),
    ('Brufen 400mg', 'Ibuprofen', 'Ibuprofen', 'Painkillers', '400mg', 'Tablet', 'BRU400001', false),
    ('Azee 500mg', 'Azithromycin', 'Azithromycin', 'Antibiotics', '500mg', 'Tablet', 'AZE500001', true),
    ('Amoxil 250mg', 'Amoxicillin', 'Amoxicillin', 'Antibiotics', '250mg', 'Capsule', 'AMX250001', true),
    ('Supradyn Daily', 'Multivitamin', 'Vitamin D3', 'Vitamins', '1 tablet', 'Tablet', 'SUP001001', false),
    ('Cetzine 10mg', 'Cetirizine', 'Cetzine', 'Cold & Flu', '10mg', 'Tablet', 'CET010001', false),
    ('Pantop 40mg', 'Pantoprazole', 'Pantop', 'Digestive Health', '40mg', 'Tablet', 'PAN040001', false),
    ('Glucon-D', 'Glucose', 'Vitamin D3', 'Vitamins', '500g', 'Powder', 'GLC500001', false),
    ('Metformin 500mg', 'Metformin', 'Metformin', 'Diabetes', '500mg', 'Tablet', 'MET500001', true)
) AS sample_data(medicine_name, generic_name, brand_name, category_name, dosage, form, barcode, requires_prescription)
LEFT JOIN public.medicine_brands brand ON brand.name = sample_data.brand_name
LEFT JOIN public.medicine_categories category ON category.name = sample_data.category_name;