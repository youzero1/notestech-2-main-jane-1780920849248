
// Common API routes configuration

// Supabase Edge Function URLs
export const API_ROUTES = {
  createPaymentIntent: '/api/create-payment-intent',
  uploadProductImage: '/api/upload-product-image',
  // Add other API routes as needed
};

// If we need to modify the route based on environment
export const getApiRoute = (route: string): string => {
  return route;
};
