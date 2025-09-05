-- Add description field to investments table
ALTER TABLE public.investments 
ADD COLUMN description text;