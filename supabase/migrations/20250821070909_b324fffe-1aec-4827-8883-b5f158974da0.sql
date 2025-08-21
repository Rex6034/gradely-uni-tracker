-- Fix the security warning for the generate_transaction_number function
CREATE OR REPLACE FUNCTION generate_transaction_number()
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public', 'pg_temp'
AS $$
BEGIN
  RETURN 'TXN-' || TO_CHAR(NOW(), 'YYYYMMDD') || '-' || LPAD(EXTRACT(epoch FROM NOW())::text, 10, '0');
END;
$$;