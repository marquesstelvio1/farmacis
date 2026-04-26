-- Add is_locked column to orders table for payment immutability
ALTER TABLE orders 
ADD COLUMN IF NOT EXISTS is_locked BOOLEAN DEFAULT false NOT NULL;

-- Create index for better performance when querying locked orders
CREATE INDEX IF NOT EXISTS idx_orders_is_locked ON orders(is_locked);
