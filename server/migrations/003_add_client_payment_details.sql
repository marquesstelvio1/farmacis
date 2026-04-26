-- Add client payment details columns to orders table
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS client_iban TEXT,
ADD COLUMN IF NOT EXISTS client_multicaixa_express TEXT,
ADD COLUMN IF NOT EXISTS client_account_name TEXT;
