-- Add discount fields to products table
ALTER TABLE products 
ADD COLUMN IF NOT EXISTS discount_percentage INTEGER DEFAULT 0 NOT NULL,
ADD COLUMN IF NOT EXISTS discount_active BOOLEAN DEFAULT FALSE NOT NULL,
ADD COLUMN IF NOT EXISTS discount_start_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS discount_end_date TIMESTAMP;

-- Create index for faster discount queries
CREATE INDEX IF NOT EXISTS idx_products_discount_active ON products(discount_active) WHERE discount_active = TRUE;
