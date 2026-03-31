-- Create prescriptions table
CREATE TABLE IF NOT EXISTS prescriptions (
    id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(id),
    product_id INTEGER NOT NULL REFERENCES products(id),
    user_id INTEGER REFERENCES users(id),
    image_url TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    rejection_reason TEXT,
    reviewed_by INTEGER,
    reviewed_at TIMESTAMP,
    created_at TIMESTAMP DEFAULT NOW()
);

-- Add prescription_id to order_items table (for linking items to prescriptions)
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS prescription_required BOOLEAN DEFAULT false NOT NULL;
ALTER TABLE order_items ADD COLUMN IF NOT EXISTS prescription_id INTEGER REFERENCES prescriptions(id);

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_prescriptions_order_id ON prescriptions(order_id);
CREATE INDEX IF NOT EXISTS idx_prescriptions_status ON prescriptions(status);
