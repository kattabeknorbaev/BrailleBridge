-- Limit feedback length so the public insert-only form cannot be used to
-- store arbitrarily large payloads. NOT VALID: existing rows are not checked.
ALTER TABLE public.feedback
  ADD CONSTRAINT feedback_text_length CHECK (char_length(feedback) BETWEEN 1 AND 2000) NOT VALID,
  ADD CONSTRAINT feedback_name_length CHECK (name IS NULL OR char_length(name) <= 80) NOT VALID;
