-- Update the handle_new_user function to create pharmacy/supplier records
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = 'public', 'pg_temp'
AS $$
BEGIN
  -- Insert into profiles first
  INSERT INTO public.profiles (user_id, email, first_name, last_name, phone, user_type)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'last_name', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'phone', ''),
    COALESCE(NEW.raw_user_meta_data ->> 'user_type', '')
  );

  -- If user_type is pharmacy, create pharmacy record
  IF COALESCE(NEW.raw_user_meta_data ->> 'user_type', '') = 'pharmacy' THEN
    INSERT INTO public.pharmacies (
      user_id,
      pharmacy_name,
      license_number,
      address,
      city,
      state,
      zip_code
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Unnamed Pharmacy'),
      COALESCE(NEW.raw_user_meta_data ->> 'license_number', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'address', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'city', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'state', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'zip_code', '')
    );
  END IF;

  -- If user_type is supplier, create supplier record
  IF COALESCE(NEW.raw_user_meta_data ->> 'user_type', '') = 'supplier' THEN
    INSERT INTO public.suppliers (
      user_id,
      company_name,
      license_number,
      address,
      city,
      state,
      zip_code
    ) VALUES (
      NEW.id,
      COALESCE(NEW.raw_user_meta_data ->> 'company_name', 'Unnamed Supplier'),
      COALESCE(NEW.raw_user_meta_data ->> 'license_number', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'address', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'city', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'state', ''),
      COALESCE(NEW.raw_user_meta_data ->> 'zip_code', '')
    );
  END IF;

  RETURN NEW;
END;
$$;