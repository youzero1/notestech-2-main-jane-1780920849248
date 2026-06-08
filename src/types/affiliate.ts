
export type AffiliatePartner = {
  id: string;
  name: string;
  program_type: 'loan' | 'card' | 'shop';
  website_url?: string;
  logo_url?: string;
  description?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
  links?: AffiliateLink[];
};

export type PayoutRule = {
  id: string;
  partner_id: string;
  trigger_type: 'click' | 'sale' | 'lead' | 'subscription';
  payout_amount: number;
  minimum_threshold: number;
  terms?: string;
  is_active: boolean;
  valid_from: string;
  valid_until?: string;
};

export type AffiliateLink = {
  id: string;
  partner_id: string;
  original_url: string;
  shortened_url: string;
  title: string;
  description?: string;
  clicks: number;
  is_active: boolean;
};

export type AffiliatePerformance = {
  id: string;
  partner_id: string;
  link_id: string;
  trigger_type: 'click' | 'sale' | 'lead' | 'subscription';
  amount: number;
  status: string;
  tracking_id?: string;
};
