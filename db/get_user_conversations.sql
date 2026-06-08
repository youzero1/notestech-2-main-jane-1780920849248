
-- Create function to get user conversations without triggering RLS recursion
CREATE OR REPLACE FUNCTION public.get_user_conversations(user_id UUID)
RETURNS TABLE (
  id UUID, 
  created_at TIMESTAMPTZ, 
  updated_at TIMESTAMPTZ, 
  last_message TEXT
) 
LANGUAGE plpgsql 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    c.id,
    c.created_at,
    c.updated_at,
    c.last_message
  FROM 
    conversations c
  JOIN 
    conversation_participants cp ON c.id = cp.conversation_id
  WHERE 
    cp.profile_id = user_id
  ORDER BY 
    c.updated_at DESC;
END;
$$;

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.get_user_conversations TO authenticated;
