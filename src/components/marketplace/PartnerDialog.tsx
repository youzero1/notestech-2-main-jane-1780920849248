import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { PayoutRulesDialog } from "./PayoutRulesDialog";
import type { AffiliatePartner, AffiliateLink } from "@/types/affiliate";
import { Plus, X, Loader2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const formSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  website_url: z.string().url().optional(),
  program_type: z.enum(['loan', 'card', 'shop']),
  logo: z.instanceof(File).optional(),
  is_active: z.boolean().default(true)
});

const partnerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters").max(50, "Name must be less than 50 characters"),
  description: z.string().optional(),
  website_url: z.string().url("Please enter a valid URL").optional().or(z.literal("")),
  program_type: z.enum(['loan', 'card', 'shop']),
  logo: z.instanceof(File).optional(),
  is_active: z.boolean()
});

interface PartnerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner?: AffiliatePartner;
}

export const PartnerDialog = ({
  open,
  onOpenChange,
  partner
}: PartnerDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPayoutRules, setShowPayoutRules] = useState(false);
  const [links, setLinks] = useState<Array<{
    id?: string;
    title: string;
    original_url: string;
    description?: string;
    is_active?: boolean;
  }>>([]);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [linkErrors, setLinkErrors] = useState<Array<{ title?: string; url?: string }>>([]);

  const form = useForm<z.infer<typeof partnerSchema>>({
    resolver: zodResolver(partnerSchema),
    defaultValues: {
      name: "",
      description: "",
      website_url: "",
      program_type: "shop",
      is_active: true
    },
  });

  useEffect(() => {
    if (partner) {
      form.reset({
        name: partner.name,
        description: partner.description || "",
        website_url: partner.website_url || "",
        program_type: partner.program_type,
        is_active: partner.is_active
      });
      setLogoPreview(partner.logo_url || null);
      
      if (partner.links) {
        setLinks(partner.links.map(link => ({
          id: link.id,
          title: link.title,
          original_url: link.original_url,
          description: link.description,
          is_active: link.is_active
        })));
      } else {
        setLinks([]);
      }
    } else {
      form.reset({
        name: "",
        description: "",
        website_url: "",
        program_type: "shop",
        is_active: true
      });
      setLinks([]);
      setLogoPreview(null);
    }
  }, [partner, form]);

  const handleLogoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = () => {
      setLogoPreview(reader.result as string);
    };
    reader.readAsDataURL(file);

    form.setValue('logo', file);
  };

  const validateLinks = () => {
    const errors = links.map(link => ({
      title: !link.title ? "Title is required" : undefined,
      url: !link.original_url ? "URL is required" : 
           !/^https?:\/\/.+/.test(link.original_url) ? "Please enter a valid URL" : undefined
    }));
    setLinkErrors(errors);
    return errors.every(error => !error.title && !error.url);
  };

  const onSubmit = async (values: z.infer<typeof partnerSchema>) => {
    try {
      if (!validateLinks() && links.length > 0) {
        toast({
          variant: "destructive",
          title: "Validation Error",
          description: "Please check affiliate links for errors",
        });
        return;
      }

      setIsSubmitting(true);
      
      let partnerId = partner?.id;
      let logo_url = partner?.logo_url;

      if (values.logo) {
        const fileExt = values.logo.name.split('.').pop();
        const fileName = `${crypto.randomUUID()}.${fileExt}`;
        const { error: uploadError, data } = await supabase.storage
          .from('partner_logos')
          .upload(fileName, values.logo);

        if (uploadError) {
          console.error('Logo upload error:', uploadError);
          throw uploadError;
        }

        const { data: { publicUrl } } = supabase.storage
          .from('partner_logos')
          .getPublicUrl(fileName);
          
        logo_url = publicUrl;
      }
      
      const partnerData = {
        name: values.name,
        program_type: values.program_type,
        description: values.description || null,
        website_url: values.website_url || null,
        logo_url,
        is_active: values.is_active,
        creator_id: user?.id
      };

      // TODO: Update to use correct table when affiliate system is refactored
      if (!partnerId) {
        const { data: newPartner, error: partnerError } = await supabase
          .from('affiliate_programs')
          .insert({
            name: partnerData.name,
            category: partnerData.program_type as any,
            benefits: partnerData.description || '',
            annual_fee: '',
            commission: 0
          })
          .select()
          .single();

        if (partnerError) throw partnerError;
        partnerId = newPartner.id;
      } else {
        const { error: updateError } = await supabase
          .from('affiliate_programs')
          .update({
            name: partnerData.name,
            category: partnerData.program_type as any,
            benefits: partnerData.description || ''
          })
          .eq('id', partnerId);

        if (updateError) throw updateError;
      }

      // TODO: Implement affiliate links when Noteslink tables are created
      if (links.length > 0) {
        console.log('Affiliate links feature pending - will be implemented with Noteslink', links);
      }

      toast({
        title: "Success",
        description: partner ? "Partner updated successfully" : "Partner added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['affiliate-partners'] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving partner:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Failed to save partner",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const addLink = () => {
    setLinks([...links, { title: '', original_url: '' }]);
  };

  const removeLink = (index: number) => {
    setLinks(links.filter((_, i) => i !== index));
  };

  const updateLink = (index: number, field: string, value: string) => {
    const updatedLinks = [...links];
    updatedLinks[index] = { ...updatedLinks[index], [field]: value };
    setLinks(updatedLinks);
  };

  const handleClose = (open: boolean) => {
    if (!open) {
      if (!partner) {
        form.reset({
          name: "",
          description: "",
          website_url: "",
          program_type: "shop",
          is_active: true
        });
        setLinks([]);
        setLogoPreview(null);
      }
      setShowPayoutRules(false);
    }
    onOpenChange(open);
  };

  return (
    <>
      <Dialog open={open} onOpenChange={handleClose}>
        <DialogContent className="max-w-[600px] p-0 h-[90vh] overflow-hidden">
          <DialogHeader className="p-6 pb-0">
            <DialogTitle>
              {partner ? "Edit Partner" : "Add New Partner"}
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[calc(90vh-80px)] px-6 pb-6">
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Partner Name *</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter partner name..." {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Enter partner description..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="website_url"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Website URL</FormLabel>
                      <FormControl>
                        <Input 
                          type="url"
                          placeholder="https://..." 
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="program_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Program Type</FormLabel>
                      <Select 
                        onValueChange={field.onChange} 
                        defaultValue={field.value}
                      >
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select a program type" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="loan">Loan</SelectItem>
                          <SelectItem value="card">Card</SelectItem>
                          <SelectItem value="shop">Shop</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="logo"
                  render={({ field: { value, onChange, ...field } }) => (
                    <FormItem>
                      <FormLabel>Logo</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <Input
                            type="file"
                            accept="image/*"
                            onChange={handleLogoChange}
                            {...field}
                          />
                          {logoPreview && (
                            <div className="relative w-32 h-32">
                              <img
                                src={logoPreview}
                                alt="Logo preview"
                                className="w-full h-full object-contain"
                              />
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-medium">Affiliate Links</h3>
                    <Button type="button" variant="outline" onClick={addLink} className="gap-2">
                      <Plus className="h-4 w-4" />
                      Add Link
                    </Button>
                  </div>

                  {links.map((link, index) => (
                    <div key={index} className="space-y-4 p-4 bg-secondary/50 rounded-lg relative">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        className="absolute right-2 top-2"
                        onClick={() => removeLink(index)}
                        disabled={isSubmitting}
                      >
                        <X className="h-4 w-4" />
                      </Button>

                      <div className="space-y-4">
                        <FormItem>
                          <FormLabel>Title *</FormLabel>
                          <FormControl>
                            <Input
                              value={link.title}
                              onChange={(e) => updateLink(index, 'title', e.target.value)}
                              placeholder="Enter link title..."
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          {linkErrors[index]?.title && (
                            <p className="text-sm font-medium text-destructive">{linkErrors[index].title}</p>
                          )}
                        </FormItem>

                        <FormItem>
                          <FormLabel>URL *</FormLabel>
                          <FormControl>
                            <Input
                              type="url"
                              value={link.original_url}
                              onChange={(e) => updateLink(index, 'original_url', e.target.value)}
                              placeholder="https://..."
                              disabled={isSubmitting}
                            />
                          </FormControl>
                          {linkErrors[index]?.url && (
                            <p className="text-sm font-medium text-destructive">{linkErrors[index].url}</p>
                          )}
                        </FormItem>

                        <FormItem>
                          <FormLabel>Description (Optional)</FormLabel>
                          <FormControl>
                            <Input
                              value={link.description || ''}
                              onChange={(e) => updateLink(index, 'description', e.target.value)}
                              placeholder="Enter link description..."
                              disabled={isSubmitting}
                            />
                          </FormControl>
                        </FormItem>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => partner && setShowPayoutRules(true)}
                    disabled={!partner || isSubmitting}
                  >
                    Manage Payout Rules
                  </Button>
                  <div className="space-x-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => onOpenChange(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        partner ? "Update" : "Add"
                      )}
                    </Button>
                  </div>
                </div>
              </form>
            </Form>
          </ScrollArea>
        </DialogContent>
      </Dialog>

      {partner && showPayoutRules && (
        <PayoutRulesDialog
          open={showPayoutRules}
          onOpenChange={setShowPayoutRules}
          partner={partner}
        />
      )}
    </>
  );
};
