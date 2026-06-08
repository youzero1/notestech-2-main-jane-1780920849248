import { useState } from "react";
import { Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  ShoppingBag, 
  Search, 
  CreditCard, 
  Wallet, 
  Store, 
  Plus,
  ChevronDown,
  ArrowUpDown,
  ExternalLink,
  LineChart,
  MoreVertical,
  Edit,
  Trash
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PartnerDialog } from "@/components/marketplace/PartnerDialog";
import { PayoutRulesDialog } from "@/components/marketplace/PayoutRulesDialog";
import { useAffiliateTracking } from "@/hooks/useAffiliateTracking";
import { useAuth } from "@/hooks/useAuth";
import type { AffiliatePartner } from "@/types/affiliate";
import { Loader2 } from "lucide-react";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";

const Marketplace = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const { trackEvent } = useAffiliateTracking();
  const [filter, setFilter] = useState<'all' | 'loan' | 'card' | 'shop'>('all');
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedPartner, setSelectedPartner] = useState<AffiliatePartner | undefined>();
  const [showPayoutRules, setShowPayoutRules] = useState(false);
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState<string | null>(null);
  const [loadingVisit, setLoadingVisit] = useState<string | null>(null);

  const { data: isAdmin } = useQuery({
    queryKey: ['user-role', user?.id],
    queryFn: async () => {
      if (!user) return false;
      const { data, error } = await supabase.rpc('has_role', {
        user_id: user.id,
        role: 'admin'
      });
      if (error) {
        console.error('Error checking admin role:', error);
        return false;
      }
      return data;
    },
    enabled: !!user
  });

  // TODO: Old affiliate system - will be replaced with Noteslink
  const { data: partners, isLoading } = useQuery({
    queryKey: ['affiliate-partners'],
    queryFn: async () => {
      return [];
    }
  });

  // TODO: Old affiliate system - will be replaced with Noteslink
  const { data: affiliateLinks } = useQuery({
    queryKey: ['affiliate-links'],
    queryFn: async () => {
      return [];
    }
  });

  // TODO: Old affiliate system - will be replaced with Noteslink
  const { data: performanceData } = useQuery({
    queryKey: ['affiliate-performance-all'],
    queryFn: async () => {
      return [];
    },
    enabled: !!isAdmin
  });

  const getPartnerPerformance = (partnerId: string) => {
    return {
      clicks: 0,
      sales: 0,
      revenue: 0
    };
  };

  const filteredPartners = partners?.filter(partner => {
    const matchesSearch = partner.name.toLowerCase().includes(search.toLowerCase()) ||
                         partner.description?.toLowerCase().includes(search.toLowerCase());
    const matchesFilter = filter === 'all' || partner.program_type === filter;
    return matchesSearch && matchesFilter;
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'loan':
        return <Wallet className="h-5 w-5" />;
      case 'card':
        return <CreditCard className="h-5 w-5" />;
      case 'shop':
        return <Store className="h-5 w-5" />;
      default:
        return <ShoppingBag className="h-5 w-5" />;
    }
  };

  const handleAddPartner = () => {
    if (!isAdmin) {
      toast({
        variant: "destructive",
        title: "Access Denied",
        description: "Only administrators can add new partners."
      });
      return;
    }
    setSelectedPartner(undefined);
    setDialogOpen(true);
  };

  const handleEditPartner = (partner: AffiliatePartner) => {
    setOpenDropdownId(null);
    setTimeout(() => {
      setSelectedPartner(partner);
      setDialogOpen(true);
    }, 0);
  };

  const handleManagePayouts = (partner: AffiliatePartner) => {
    setSelectedPartner(partner);
    setShowPayoutRules(true);
  };

  const handleLinkClick = async (linkId: string, url: string) => {
    try {
      setLoadingVisit(linkId);
      await trackEvent(linkId, 'click');
      window.open(url, '_blank');
    } catch (error) {
      console.error('Error tracking click:', error);
    } finally {
      setLoadingVisit(null);
    }
  };

  const handleDeletePartner = async (partnerId: string) => {
    try {
      // TODO: Old affiliate system - will be replaced with Noteslink
      toast({
        variant: "destructive",
        title: "Feature Disabled",
        description: "Old affiliate system being replaced with Noteslink"
      });
      setIsDeleting(null);
      return;

      toast({
        title: "Partner Deleted",
        description: "The partner has been successfully deleted."
      });

      queryClient.invalidateQueries({ queryKey: ['affiliate-partners'] });
    } catch (error) {
      console.error('Error deleting partner:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete partner"
      });
    } finally {
      setIsDeleting(null);
    }
  };

  return (
    <DashboardLayout headerTitle="Money">
      <div className="min-h-screen bg-[#161618]">
        <header className="border-b border-primary/20">
          <div className="px-4 py-4">
            <div className="flex flex-col sm:flex-row gap-4 items-center justify-between w-full">
              <div className="relative flex-1">
                <Input
                  type="search"
                  placeholder="Search programs..."
                  className="w-full pl-10 bg-secondary"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              </div>
              <div className="flex items-center gap-2 shrink-0">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="gap-2">
                      <ArrowUpDown className="h-4 w-4" />
                      {filter === 'all' ? 'All Programs' : `${filter.charAt(0).toUpperCase() + filter.slice(1)}s`}
                      <ChevronDown className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent>
                    <DropdownMenuItem onClick={() => setFilter('all')}>All Programs</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('loan')}>Loans</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('card')}>Cards</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setFilter('shop')}>Shop</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
                {isAdmin && (
                  <Button 
                    className="gap-2" 
                    onClick={() => {
                      setSelectedPartner(undefined);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4" />
                    Add Partner
                  </Button>
                )}
              </div>
            </div>
          </div>
        </header>

        <main className="px-4 py-8">
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((n) => (
                <Card key={n} className="bg-secondary border-primary/20">
                  <CardHeader>
                    <div className="animate-pulse space-y-4">
                      <div className="h-8 bg-muted rounded" />
                      <div className="h-32 bg-muted rounded" />
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </div>
                  </CardHeader>
                </Card>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPartners?.map((partner) => {
                const partnerLinks = affiliateLinks?.filter(link => link.partner_id === partner.id) || [];
                
                return (
                  <Card key={partner.id} className="bg-secondary border-primary/20">
                    <CardHeader>
                      <div className="flex items-center justify-between mb-4">
                        <div className="flex items-center gap-2">
                          {getTypeIcon(partner.program_type)}
                          <Badge>{partner.program_type}</Badge>
                        </div>
                        {isAdmin && (
                          <DropdownMenu
                            open={openDropdownId === partner.id}
                            onOpenChange={(open) => {
                              setOpenDropdownId(open ? partner.id : null);
                            }}
                          >
                            <DropdownMenuTrigger asChild>
                              <Button 
                                variant="ghost" 
                                size="icon"
                                disabled={isDeleting === partner.id}
                              >
                                {isDeleting === partner.id ? (
                                  <Loader2 className="h-4 w-4 animate-spin" />
                                ) : (
                                  <MoreVertical className="h-4 w-4" />
                                )}
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem 
                                onClick={() => handleEditPartner(partner)}
                                disabled={isDeleting === partner.id}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Partner
                              </DropdownMenuItem>
                              <DropdownMenuItem 
                                onClick={() => handleDeletePartner(partner.id)}
                                className="text-destructive"
                                disabled={isDeleting === partner.id}
                              >
                                <Trash className="mr-2 h-4 w-4" />
                                Delete Partner
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        )}
                      </div>
                      {partner.logo_url ? (
                        <img
                          src={partner.logo_url}
                          alt={partner.name}
                          className="w-full h-32 object-contain"
                        />
                      ) : (
                        <div className="w-full h-32 bg-primary/5 rounded-lg flex items-center justify-center">
                          <Store className="h-16 w-16 text-primary/20" />
                        </div>
                      )}
                    </CardHeader>
                    <CardContent>
                      <CardTitle className="text-xl mb-2">{partner.name}</CardTitle>
                      <p className="text-muted-foreground text-sm line-clamp-2 mb-4">
                        {partner.description || "No description available"}
                      </p>
                      
                      {isAdmin && (
                        <Button
                          variant="outline"
                          onClick={() => handleManagePayouts(partner)}
                          className="w-full gap-2"
                        >
                          <LineChart className="h-4 w-4" />
                          View Performance & Payouts
                        </Button>
                      )}

                      {partnerLinks.length > 0 && (
                        <div className="space-y-2 mt-4">
                          <h4 className="text-sm font-medium">Available Offers:</h4>
                          {partnerLinks.map((link) => (
                            <div key={link.id} className="flex items-center justify-between p-2 bg-background/50 rounded-lg">
                              <div>
                                <p className="font-medium">{link.title}</p>
                                {link.description && (
                                  <p className="text-xs text-muted-foreground">{link.description}</p>
                                )}
                              </div>
                              <Button 
                                size="sm" 
                                variant="outline" 
                                className="gap-2"
                                onClick={() => handleLinkClick(link.id, link.original_url)}
                                disabled={loadingVisit === link.id}
                              >
                                {loadingVisit === link.id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Tracking...
                                  </>
                                ) : (
                                  <>
                                    <ExternalLink className="h-4 w-4" />
                                    Visit
                                  </>
                                )}
                              </Button>
                            </div>
                          ))}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </main>

        {isAdmin && (
          <>
            <PartnerDialog
              open={dialogOpen}
              onOpenChange={setDialogOpen}
              partner={selectedPartner}
            />
            {selectedPartner && showPayoutRules && (
              <PayoutRulesDialog
                open={showPayoutRules}
                onOpenChange={setShowPayoutRules}
                partner={selectedPartner}
              />
            )}
          </>
        )}
      </div>
    </DashboardLayout>
  );
};

export default Marketplace;
