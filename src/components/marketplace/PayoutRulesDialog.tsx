import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription
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
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { CalendarIcon, MousePointerClick, ShoppingCart, TrendingUp } from "lucide-react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { 
  Card,
  CardHeader,
  CardContent 
} from "@/components/ui/card";
import { useToast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import type { AffiliatePartner } from "@/types/affiliate";

const formSchema = z.object({
  trigger_type: z.enum(['click']),
  payout_amount: z.string()
    .min(1)
    .refine((val) => parseFloat(val) > 0, {
      message: "Payout amount must be greater than 0",
    }),
  minimum_threshold: z.string()
    .default("0")
    .refine((val) => parseFloat(val) >= 0, {
      message: "Minimum threshold cannot be negative",
    }),
  terms: z.string().optional(),
  valid_from: z.date(),
  valid_until: z.date().optional(),
});

interface PayoutRulesDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  partner: AffiliatePartner;
}

export const PayoutRulesDialog = ({
  open,
  onOpenChange,
  partner
}: PayoutRulesDialogProps) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);

  // TODO: Will be implemented with Noteslink tables
  const { data: performanceData } = useQuery({
    queryKey: ['affiliate-performance', partner.id],
    queryFn: async () => {
      return [] as any[];
    }
  });

  const { data: currentRule } = useQuery({
    queryKey: ['payout-rule', partner.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('payout_rules')
        .select('*')
        .eq('partner_id', partner.id)
        .eq('is_active', true)
        .maybeSingle();

      if (error) throw error;
      return data;
    },
    enabled: !!partner.id
  });

  const performance = {
    clicks: 0,
    revenue: 0
  };

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      trigger_type: 'click',
      payout_amount: '0',
      minimum_threshold: '0',
      terms: '',
      valid_from: new Date(),
      valid_until: undefined,
    },
  });

  useEffect(() => {
    if (currentRule) {
      form.reset({
        trigger_type: 'click',
        payout_amount: currentRule.payout_amount.toString(),
        minimum_threshold: currentRule.minimum_threshold.toString(),
        terms: currentRule.terms || '',
        valid_from: new Date(currentRule.valid_from),
        valid_until: currentRule.valid_until ? new Date(currentRule.valid_until) : undefined,
      });
    } else {
      form.reset({
        trigger_type: 'click',
        payout_amount: '0',
        minimum_threshold: '0',
        terms: '',
        valid_from: new Date(),
        valid_until: undefined,
      });
    }
  }, [currentRule, form, partner.id]);

  const onSubmit = async (values: z.infer<typeof formSchema>) => {
    try {
      setIsSubmitting(true);
      
      if (currentRule) {
        const { error: deactivateError } = await supabase
          .from('payout_rules')
          .update({ is_active: false })
          .eq('id', currentRule.id);

        if (deactivateError) throw deactivateError;
      }

      const payoutData = {
        partner_id: partner.id,
        trigger_type: values.trigger_type,
        payout_amount: parseFloat(values.payout_amount),
        minimum_threshold: parseFloat(values.minimum_threshold),
        terms: values.terms || null,
        valid_from: values.valid_from.toISOString(),
        valid_until: values.valid_until ? values.valid_until.toISOString() : null,
        is_active: true
      };

      const { error } = await supabase
        .from('payout_rules')
        .insert(payoutData);

      if (error) throw error;

      toast({
        title: "Success",
        description: currentRule 
          ? "Payout rule updated successfully" 
          : "Payout rule added successfully",
      });

      queryClient.invalidateQueries({ queryKey: ['payout-rule', partner.id] });
      onOpenChange(false);
    } catch (error) {
      console.error('Error managing payout rule:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to manage payout rule"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const chartData: any[] = [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange} modal={true}>
      <DialogContent 
        className="max-w-[600px] p-0 h-[90vh] overflow-hidden"
        onPointerDownOutside={(e) => e.preventDefault()}
        onInteractOutside={(e) => e.preventDefault()}
      >
        <DialogHeader className="p-6 pb-4">
          <DialogTitle>Partner Performance & Payouts</DialogTitle>
          <DialogDescription>
            View performance metrics and manage payout rules for {partner.name}
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="h-[calc(90vh-80px)] p-6">
          <div className="grid gap-6 pr-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-4 w-4 text-blue-400" />
                      <span className="text-sm">Total Clicks</span>
                    </div>
                    <p className="text-2xl font-semibold">{performance.clicks}</p>
                  </div>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-yellow-400" />
                      <span className="text-sm">Total Revenue</span>
                    </div>
                    <p className="text-2xl font-semibold">${performance.revenue.toFixed(2)}</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">Revenue Over Time</h3>
              </CardHeader>
              <CardContent>
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date" />
                      <YAxis />
                      <Tooltip />
                      <Area
                        type="monotone"
                        dataKey="amount"
                        stroke="#4f46e5"
                        fill="#4f46e5"
                        fillOpacity={0.2}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {currentRule && (
              <Card>
                <CardHeader>
                  <h3 className="text-lg font-semibold">Current Payout Rule</h3>
                </CardHeader>
                <CardContent>
                  <div className="p-4 bg-secondary rounded-lg">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium">{currentRule.trigger_type} - ${currentRule.payout_amount}</p>
                        <p className="text-sm text-muted-foreground">
                          Valid from: {format(new Date(currentRule.valid_from), 'PPP')}
                          {currentRule.valid_until && ` to ${format(new Date(currentRule.valid_until), 'PPP')}`}
                        </p>
                      </div>
                      {currentRule.terms && (
                        <p className="text-sm text-muted-foreground">{currentRule.terms}</p>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <Card>
              <CardHeader>
                <h3 className="text-lg font-semibold">
                  {currentRule ? 'Update Payout Rule' : 'Add Payout Rule'}
                </h3>
              </CardHeader>
              <CardContent>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="trigger_type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Trigger Type</FormLabel>
                          <Select 
                            onValueChange={field.onChange} 
                            defaultValue={field.value}
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a trigger type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="click">
                                <div className="flex items-center gap-2">
                                  <MousePointerClick className="h-4 w-4" />
                                  <span>Click</span>
                                </div>
                              </SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="payout_amount"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Payout Amount ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="minimum_threshold"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Minimum Threshold ($)</FormLabel>
                          <FormControl>
                            <Input
                              type="number"
                              step="0.01"
                              placeholder="0.00"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="terms"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Terms (Optional)</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter terms..." {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="valid_from"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Valid From</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className="w-auto p-0" align="start">
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="valid_until"
                        render={({ field }) => (
                          <FormItem className="flex flex-col">
                            <FormLabel>Valid Until (Optional)</FormLabel>
                            <Popover>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant="outline"
                                    className="w-full pl-3 text-left font-normal"
                                  >
                                    {field.value ? (
                                      format(field.value, "PPP")
                                    ) : (
                                      <span>Pick a date</span>
                                    )}
                                    <CalendarIcon className="ml-auto h-4 w-4 opacity-50" />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent 
                                className="w-auto p-0" 
                                align="start"
                                side="bottom"
                              >
                                <Calendar
                                  mode="single"
                                  selected={field.value}
                                  onSelect={field.onChange}
                                  disabled={(date) => date < new Date()}
                                  initialFocus
                                />
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <div className="flex justify-end space-x-4 pt-4">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? 
                          (currentRule ? "Updating..." : "Adding...") : 
                          (currentRule ? "Update Rule" : "Add Rule")
                        }
                      </Button>
                    </div>
                  </form>
                </Form>
              </CardContent>
            </Card>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
