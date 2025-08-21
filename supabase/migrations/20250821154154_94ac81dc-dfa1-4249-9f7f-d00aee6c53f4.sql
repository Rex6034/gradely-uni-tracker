-- Create pharmacy record for existing user who signed up before the trigger was updated
INSERT INTO public.pharmacies (
  user_id,
  pharmacy_name,
  license_number,
  address,
  city,
  state,
  zip_code
) 
SELECT 
  '5bdd73ab-3c68-418d-960f-8de9c6b0f101'::uuid,
  'bbcewh bdehjb',
  'bwhebdwehfbwhb',
  'kjwebffhwbfihwb',
  'kjbwhebfewhibqkjbewrhjfb',
  'bwkejfbwjkb',
  '5661'
WHERE NOT EXISTS (
  SELECT 1 FROM public.pharmacies WHERE user_id = '5bdd73ab-3c68-418d-960f-8de9c6b0f101'::uuid
);