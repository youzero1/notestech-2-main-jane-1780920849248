
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { ChevronLeft, ChevronLeftCircle, ChevronLeftCircleIcon, ChevronRight, Search, Loader2, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from "recharts";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import RichTextEditor from "@/components/courses/RichTextEditor";
import { Database } from "@/integrations/supabase/types";
import { toast } from "@/components/ui/use-toast";
import { EditorContent } from "@tiptap/react";
import { useEditor } from "@tiptap/react";
import { Form } from "@/components/ui/form";
import {
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { useNavigate } from "react-router-dom";

interface TrackingData {
  month: string;
  revenue: number;
  click: number;
  category: string;
}

// Update the form schema to include new loan fields
const formSchema = z.object({
  name: z.string().min(1, "Bank/Provider name is required"),
  benefits: z.string().min(1, "Benefits are required"),
  commission: z.string()
    .min(1, "Commission is required")
    .refine((val) => !isNaN(Number(val)), "Commission must be a number")
    .refine((val) => Number(val) > 0, "Commission must be greater than 0"),
  category: z.enum(["loan", "card", "shop"], {
    required_error: "Category is required",
  }),
  programLink: z.string().url("Please enter a valid URL"),
  annualFee: z.string().optional(),
  // New loan-specific fields
  loanType: z.enum(["personal_loan", "home_loan", "auto_loan"]).optional(),
  tagType: z.array(z.string()).optional(),
  estimatedApr: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Number(val));
    }, "APR must be a number"),
  perMonth: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Number(val));
    }, "Monthly payment must be a number"),
  totalMonths: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Number(val));
    }, "Total months must be a number"),
  interestAndFees: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Number(val));
    }, "Interest & fees must be a number"),
  
  logo: z.string().optional(),
  loanTags: z.array(z.string()).default([]),
  loanDetails: z.string().optional(),
  loanOrigination: z.string().optional(),
  totalAmount: z.string()
    .optional()
    .refine((val) => {
      if (!val) return true;
      return !isNaN(Number(val));
    }, "Total amount/price must be a number")
    .refine((val) => {
      if (!val) return true;
      return Number(val) > 0;
    }, "Total amount/price must be greater than 0"),
  productImage: z.string().optional(),
  cardDetails: z.string().optional(),
  introPurchaseApr: z.string().optional(),
  regularPurchaseApr: z.string().optional(),
  introBalanceTransferApr: z.string().optional(),
  regularBalanceTransferApr: z.string().optional(),
  cashAdvanceApr: z.string().optional(),
}).refine((data) => {
  // Only validate totalAmount when category is Loans
  if (data.category === "loan") {
    return data.totalAmount !== undefined && data.totalAmount !== '';
  }
  return true;
}, {
  message: "Total amount is required for loans",
  path: ["totalAmount"],
});

type FormData = z.infer<typeof formSchema>;

type AffiliateProgram = Database['public']['Tables']['affiliate_programs']['Insert'];

interface LocationState {
  openCreateModal?: boolean;
  preSelectCategory?: 'loan' | 'card' | 'shop';
}

const AffiliateManagement = () => {
  const location = useLocation();
  const locationState = location.state as LocationState;
  
  const [activeTab, setActiveTab] = useState(locationState?.preSelectCategory === "card" ? "Credit Cards" : "Loans");
  const [searchQuery, setSearchQuery] = useState("");
  const tabs = ["Loans", "Credit Cards","Shop Bazaar"];
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;
  const [affiliateData, setAffiliateData] = useState<Record<string, AffiliateProgram[]>>({});
  const [trackingData, setTrackingData] = useState<Record<string, TrackingData[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(!!locationState?.openCreateModal);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      benefits: '',
      commission: '',
      category: locationState?.preSelectCategory || undefined,
      annualFee: '',
      totalAmount: '',
      cardDetails: '',
      introPurchaseApr: '',
      regularPurchaseApr: '',
      introBalanceTransferApr: '',
      regularBalanceTransferApr: '',
      cashAdvanceApr: '',
      programLink: '',
      loanType: undefined,
      tagType: [],
      estimatedApr: '',
      perMonth: '',
      totalMonths: '',
      interestAndFees: '',
      logo: '',
      loanTags: [],
      loanDetails: '',
      loanOrigination: '',
    }
  });

  // Reset location state after it's used
  useEffect(() => {
    if (locationState?.openCreateModal) {
      // Clear the state to prevent modal reopening on page refresh
      window.history.replaceState({}, document.title);
    }
  }, [locationState]);

  const selectedCategory = form.watch("category");

  const navigate = useNavigate();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      const categoryMap: Record<string, string> = {
        "Loans": "loan",
        "Credit Cards": "card",
        "Shop Bazaar": "shop"
      };
      
      const category = categoryMap[activeTab].toLowerCase();

      // First fetch the affiliate programs
      const { data: programsData, error: programsError } = await supabase
        .from('affiliate_programs')
        .select('*')
        .eq('category', category as NonNullable<"loan" | "card" | "shop">);

      if (programsError) throw programsError;

      // For each program, fetch and calculate the click rate
      const programsWithClickRates = await Promise.all(
        (programsData || []).map(async (program) => {
          // Get total clicks for this program
          const { count: totalClicks, error: totalClicksError } = await supabase
            .from('affiliated_mlm')
            .select('*', { count: 'exact' })
            .eq('program_id', program.id);

          // Get successful clicks (where applied is true)
          const { count: successfulClicks, error: successClicksError } = await supabase
            .from('affiliated_mlm')
            .select('*', { count: 'exact' })
            .eq('program_id', program.id)
            .eq('applied', true);

          if (totalClicksError || successClicksError) {
            console.error('Error fetching clicks:', totalClicksError || successClicksError);
            return {
              ...program,
              click_rate: '0',
              total_clicks: 0,
              successful_clicks: 0
            };
          }

          // Calculate success rate - if no clicks, return 0
          const clickRate = totalClicks === 0 
            ? 0 
            : ((successfulClicks || 0) / totalClicks) * 100;

          return {
            ...program,
            click_rate: clickRate.toFixed(1), // Format to 1 decimal places
            total_clicks: totalClicks || 0,
            successful_clicks: successfulClicks || 0
          };
        })
      );

      setAffiliateData({
        [activeTab]: programsWithClickRates
      });

      // Transform the data for the chart - generate last 12 months
      const getLast12Months = () => {
        const months = [];
        const currentDate = new Date();
        
        for (let i = 11; i >= 0; i--) {
          const date = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
          months.push(date.toLocaleString('default', { month: 'short'}));
        }
        return months;
      };

      const chartData: TrackingData[] = getLast12Months().map(month => ({
        month,
        revenue: month === new Date().toLocaleString('default', { month: 'short' })
          ? programsWithClickRates.reduce((sum, program) => 
              sum + (program.successful_clicks * program.commission), 0)
          : 0,
        click: month === new Date().toLocaleString('default', { month: 'short' })
          ? programsWithClickRates.reduce((sum, program) => 
              sum + program.total_clicks, 0)
          : 0,
        category: category
      }));

      setTrackingData({
        [activeTab]: chartData
      });

    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  const currentMockData = affiliateData[activeTab] || [];
  const totalPages = Math.ceil(currentMockData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  const currentData = currentMockData.slice(startIndex, endIndex);
  const currentChartData = trackingData[activeTab] || [];

  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab]);

  const onSubmit = async (data: FormData) => {
    console.log(data);
    setIsSubmitting(true);
    try {
      const programData: AffiliateProgram = {
        name: data.name,
        benefits: data.benefits,
        commission: Number(data.commission),
        category: data.category,
        program_link: data.programLink,
        annual_fee: data.annualFee,
        click_rate: '0',
        ...(data.category === 'loan' && {
          total_amount: Number(data.totalAmount),
          loan_type: data.loanType,
          tag_type: data.tagType,
          estimated_apr: Number(data.estimatedApr),
          per_month: Number(data.perMonth),
          total_months: Number(data.totalMonths),
          interest_and_fees: Number(data.interestAndFees),
          loan_tags: data.loanTags,
          loan_details: data.loanDetails,
          loan_origination: data.loanOrigination,
          logo: data.logo,
          card_details: null,
          intro_purchase_apr: null,
          regular_purchase_apr: null,
          intro_balance_transfer_apr: null,
          regular_balance_transfer_apr: null,
          cash_advance_apr: null,
          product_image: null,
        }),
        ...(data.category === 'card' && {
          card_details: data.cardDetails,
          intro_purchase_apr: data.introPurchaseApr,
          regular_purchase_apr: data.regularPurchaseApr,
          intro_balance_transfer_apr: data.introBalanceTransferApr,
          regular_balance_transfer_apr: data.regularBalanceTransferApr,
          cash_advance_apr: data.cashAdvanceApr,
          total_amount: null,
          product_image: null,
        }),
        ...(data.category === 'shop' && {
          total_amount: Number(data.totalAmount),
          product_image: data.productImage,
          card_details: null,
          intro_purchase_apr: null,
          regular_purchase_apr: null,
          intro_balance_transfer_apr: null,
          regular_balance_transfer_apr: null,
          cash_advance_apr: null,
        }),
      };

      const { error } = await supabase
        .from('affiliate_programs')
        .insert([programData]);

      if (error) throw error;
      
      toast({title:'Program created successfully'});
      setIsModalOpen(false);
      form.reset();
      await fetchData();
      
    } catch (error) {
      console.error('Error creating program:', error);
      toast({title:'Failed to create program',variant:'destructive'});
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <DashboardLayout headerTitle="Affiliate Marketing Programs Management System">
     <div className="flex flex-col space-y-4 sm:space-y-0 sm:flex-row sm:justify-between sm:items-center mb-8">
          <div className="flex gap-1 border border-[#2A2A2A] rounded-full overflow-hidden w-full sm:w-auto">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 sm:px-6 py-2.5 font-medium transition-colors flex-1 sm:flex-none ${
                  activeTab === tab
                    ? "bg-[#B69C6C] text-white"
                    : "text-gray-400 hover:bg-[#2A2A2A]"
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
          <div className="flex items-center gap-4">
            <div className="relative w-full sm:w-[300px]">
              <Search className="w-5 h-5 absolute left-3 top-3 text-gray-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search..."
                className="w-full pl-10 pr-4 py-2.5 rounded-full bg-[#2A2A2A] text-white placeholder-gray-400 focus:outline-none border border-transparent focus:border-[#B69C6C]"
              />
            </div>
            <button
              onClick={() => navigate('/admin/program/reviews')}
              className="px-4 py-2.5 bg-[#2A2A2A] text-white rounded-full hover:bg-[#3A3A3A] transition-colors"
            >
              Manage Reviews
            </button>
            <Dialog open={isModalOpen} onOpenChange={setIsModalOpen}>
              <DialogTrigger asChild>
                <button className="px-4 py-2.5 bg-[#B69C6C] text-white rounded-full hover:bg-[#A58B5B] transition-colors">
                  Create Program
                </button>
              </DialogTrigger>
              <DialogContent className="bg-[#1C1C1C] border-[#2A2A2A] text-white max-h-[80vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>Create New Affiliate Program</DialogTitle>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Bank/Provider Name</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter bank or provider name"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="category"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Category</FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="w-full bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-md px-3 py-2"
                            >
                              <option value="">Select category</option>
                              <option value="loan">Loan</option>
                              <option value="card">Card</option>
                              <option value="shop">Shop Bazaar</option>
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="benefits"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Benefits</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter benefits"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="commission"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Commission</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              type="number"
                              step="0.01"
                              min="0"
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter commission rate"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="programLink"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Program Link</FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter program URL"
                              type="url"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    
                    {selectedCategory !== 'shop' && (
                      <FormField
                        control={form.control}
                        name="annualFee"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Annual Fees</FormLabel>
                            <FormControl>
                              <Input
                                {...field}
                                className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                placeholder="Enter Annual Fees"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    {selectedCategory === 'card' && (
                      <>
                        <FormField
                          control={form.control}
                          name="cardDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Card Details</FormLabel>
                              <FormControl>
                              <RichTextEditor 
                          value={field.value}
                          onChange={field.onChange}
                        />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="introPurchaseApr">Intro Purchase APR</Label>
                            <Input
                              {...form.register("introPurchaseApr")}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter intro purchase APR"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="regularPurchaseApr">Regular Purchase APR</Label>
                            <Input
                              {...form.register("regularPurchaseApr")}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter regular purchase APR"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="introBalanceTransferApr">Intro Balance Transfer APR</Label>
                            <Input
                              {...form.register("introBalanceTransferApr")}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter intro balance transfer APR"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="regularBalanceTransferApr">Regular Balance Transfer APR</Label>
                            <Input
                              {...form.register("regularBalanceTransferApr")}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter regular balance transfer APR"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="cashAdvanceApr">Cash Advance APR</Label>
                            <Input
                              {...form.register("cashAdvanceApr")}
                              className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                              placeholder="Enter cash advance APR"
                            />
                          </div>
                        </div>
                      </>
                    )}

                    {selectedCategory === 'loan' && (
                      <>
                        <FormField
                          control={form.control}
                          name="loanType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Type</FormLabel>
                              <FormControl>
                                <select
                                  {...field}
                                  className="w-full bg-[#2A2A2A] border border-[#3A3A3A] text-white rounded-md px-3 py-2"
                                >
                                  <option value="">Select loan type</option>
                                  <option value="personal_loan">Personal Loan</option>
                                  <option value="home_loan">Home Loan</option>
                                  <option value="auto_loan">Auto Loan</option>
                                </select>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                          <FormField
                          control={form.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Amount</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                  placeholder="Enter loan amount"
                                />
                              </FormControl>
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
                                <div className="space-y-4">
                                  <Input
                                    {...field}
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          const fileExt = file.name.split('.').pop();
                                          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                                          
                                          const { data, error } = await supabase.storage
                                            .from('partner_logos')
                                            .upload(fileName, file);
                                            
                                          if (error) throw error;
                                          
                                          const { data: { publicUrl } } = supabase.storage
                                            .from('partner_logos')
                                            .getPublicUrl(fileName);
                                            
                                          onChange(publicUrl);
                                        } catch (error) {
                                          console.error('Error uploading file:', error);
                                          toast({
                                            title: 'Error uploading image',
                                            variant: 'destructive'
                                          });
                                        }
                                      }
                                    }}
                                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white file:mr-4 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B69C6C] file:text-white hover:file:bg-[#A58B5B]"
                                  />
                                  {value && (
                                    <div className="relative w-24 h-24">
                                      <img 
                                        src={value} 
                                        alt="Logo preview" 
                                        className="w-full h-full object-cover rounded-md"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => onChange('')}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="tagType"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Tag Type</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      value="lowest_monthly_payment"
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const currentTags = field.value || [];
                                        field.onChange(
                                          e.target.checked
                                            ? [...currentTags, value]
                                            : currentTags.filter(tag => tag !== value)
                                        );
                                      }}
                                      className="bg-[#2A2A2A] border-[#3A3A3A]"
                                    />
                                    <span className="text-white">Lowest Monthly Payment</span>
                                  </label>
                                  <label className="flex items-center space-x-2">
                                    <input
                                      type="checkbox"
                                      value="lowest_apr"
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        const currentTags = field.value || [];
                                        field.onChange(
                                          e.target.checked
                                            ? [...currentTags, value]
                                            : currentTags.filter(tag => tag !== value)
                                        );
                                      }}
                                      className="bg-[#2A2A2A] border-[#3A3A3A]"
                                    />
                                    <span className="text-white">Lowest APR</span>
                                  </label>
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="estimatedApr"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Estimated APR (%)</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="perMonth"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Per Month</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                          <FormField
                            control={form.control}
                            name="totalMonths"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Total Months</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />

                          <FormField
                            control={form.control}
                            name="interestAndFees"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Interest & Fees Est.</FormLabel>
                                <FormControl>
                                  <Input
                                    {...field}
                                    type="number"
                                    step="0.01"
                                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>

                        <FormField
                          control={form.control}
                          name="loanDetails"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Details</FormLabel>
                              <FormControl>
                                <RichTextEditor 
                                  value={field.value}
                                  onChange={field.onChange}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="loanOrigination"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Origination</FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white min-h-[80px]"
                                  placeholder="Enter your loan company origination"
                                  rows={3}
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                       

                      

                        <FormField
                          control={form.control}
                          name="loanTags"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Loan Tags</FormLabel>
                              <FormControl>
                                <div className="space-y-2">
                                  <div className="flex flex-wrap gap-2 mb-2">
                                    {field.value.map((tag, index) => (
                                      <div
                                        key={index}
                                        className="flex items-center gap-1 bg-[#2A2A2A] text-white px-2 py-1 rounded-full"
                                      >
                                        <span>{tag}</span>
                                        <button
                                          type="button"
                                          onClick={() => {
                                            const newTags = [...field.value];
                                            newTags.splice(index, 1);
                                            field.onChange(newTags);
                                          }}
                                          className="text-gray-400 hover:text-white"
                                        >
                                          <X className="h-4 w-4" />
                                        </button>
                                      </div>
                                    ))}
                                  </div>
                                  <Input
                                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                    placeholder="Type a tag and press Enter"
                                    onKeyDown={(e) => {
                                      if (e.key === 'Enter') {
                                        e.preventDefault();
                                        const input = e.currentTarget;
                                        const value = input.value.trim();
                                        if (value && !field.value.includes(value)) {
                                          field.onChange([...field.value, value]);
                                          input.value = '';
                                        }
                                      }
                                    }}
                                  />
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    {selectedCategory === 'shop' && (
                      <>
                        <FormField
                          control={form.control}
                          name="totalAmount"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>Total Price</FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  type="number"
                                  step="0.01"
                                  min="0"
                                  className="bg-[#2A2A2A] border-[#3A3A3A] text-white"
                                  placeholder="Enter product price"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />

                        <FormField
                          control={form.control}
                          name="productImage"
                          render={({ field: { value, onChange, ...field } }) => (
                            <FormItem>
                              <FormLabel>Product Image</FormLabel>
                              <FormControl>
                                <div className="space-y-4">
                                  <Input
                                    {...field}
                                    type="file"
                                    accept="image/*"
                                    onChange={async (e) => {
                                      const file = e.target.files?.[0];
                                      if (file) {
                                        try {
                                          // Create a unique file name
                                          const fileExt = file.name.split('.').pop();
                                          const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
                                          
                                          // Upload to Supabase storage
                                          const { data, error } = await supabase.storage
                                            .from('partner_logos')
                                            .upload(fileName, file);
                                            
                                          if (error) throw error;
                                          
                                          // Get the public URL
                                          const { data: { publicUrl } } = supabase.storage
                                            .from('partner_logos')
                                            .getPublicUrl(fileName);
                                            
                                          onChange(publicUrl);
                                        } catch (error) {
                                          console.error('Error uploading file:', error);
                                          toast({
                                            title: 'Error uploading image',
                                            variant: 'destructive'
                                          });
                                        }
                                      }
                                    }}
                                    className="bg-[#2A2A2A] border-[#3A3A3A] text-white file:mr-4  file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-[#B69C6C] file:text-white hover:file:bg-[#A58B5B]"
                                  />
                                  {value && (
                                    <div className="relative w-24 h-24">
                                      <img 
                                        src={value} 
                                        alt="Product preview" 
                                        className="w-full h-full object-cover rounded-md"
                                      />
                                      <button
                                        type="button"
                                        onClick={() => onChange('')}
                                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-2 hover:bg-red-600"
                                      >
                                        <X className="w-4 h-4" />
                                      </button>
                                    </div>
                                  )}
                                </div>
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </>
                    )}

                    

                    <div className="flex justify-end gap-3 pt-4">
                      <button
                        type="button"
                        onClick={() => {
                          setIsModalOpen(false);
                          form.reset();
                        }}
                        className="px-4 py-2 rounded-md bg-[#2A2A2A] text-white hover:bg-[#3A3A3A] disabled:opacity-50"
                        disabled={isSubmitting}
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="px-4 py-2 rounded-md bg-[#B69C6C] text-white hover:bg-[#A58B5B] disabled:opacity-50 flex items-center gap-2"
                      >
                        {isSubmitting ? (
                          <>
                            <Loader2 className="h-4 w-4 animate-spin" />
                            Creating...
                          </>
                        ) : (
                          'Create Program'
                        )}
                      </button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
      </div>

      {/* Affiliate Programs Table */}
      <div className="rounded-lg border border-[#2A2A2A] mb-8">
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="border-b border-[#2A2A2A] hover:bg-transparent">
                <TableHead className="text-gray-400">Bank/Provider Name</TableHead>
                <TableHead className="text-gray-400">Interest Rate/Benefits</TableHead>
                <TableHead className="text-gray-400">Commission</TableHead>
                <TableHead className="text-gray-400">Click-Through Rate (%)</TableHead>
                <TableHead className="text-gray-400 text-right">Affiliate Link</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {currentData.map((row) => (
                <TableRow key={row.name} className="border-b border-[#2A2A2A] hover:bg-[#1C1C1C]">
                  <TableCell className="font-medium text-white">{row.name}</TableCell>
                  <TableCell className="text-gray-300">{row.benefits}</TableCell>
                  <TableCell className="text-gray-300">${row.commission} per referral</TableCell>
                  <TableCell className="text-gray-300">{row.click_rate}%</TableCell>
                  <TableCell className="text-right">
                    <button 
                      onClick={() => {
                        const url = `${window.location.origin}/money/${row.id}`;
                        navigator.clipboard.writeText(url);
                        toast({title:'Link copied to clipboard!'});
                      }}
                      className="text-[#B69C6C] hover:underline cursor-pointer"
                    >
                      Apply now
                    </button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
        
        {/* Add pagination controls below the table */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-[#2A2A2A]">
          <div className="flex items-center text-sm text-gray-400">
            Showing {startIndex + 1}-{Math.min(endIndex, currentMockData.length)} from {currentMockData.length}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className={`px-3 py-1 rounded-md ${
                currentPage === 1
                  ? 'bg-[#2A2A2A] text-gray-500 cursor-not-allowed'
                  : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
              }`}
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <div className="flex items-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => setCurrentPage(page)}
                  className={`px-3 py-1 rounded-md ${
                    currentPage === page
                      ? 'bg-[#B69C6C] text-white'
                      : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
            <button
              onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
              disabled={currentPage === totalPages}
              className={`px-3 py-1 rounded-md ${
                currentPage === totalPages
                  ? 'bg-[#2A2A2A] text-gray-500 cursor-not-allowed'
                  : 'bg-[#2A2A2A] text-white hover:bg-[#3A3A3A]'
              }`}
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Tracking Section */}
      <div className="rounded-lg border border-[#2A2A2A] p-6">
        <h2 className="text-xl font-semibold text-white mb-6">Tracking Section</h2>
        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-white" />
          </div>
        ) : (
          <LineChart width={1000} height={400} data={currentChartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#2A2A2A" />
            <XAxis dataKey="month" stroke="#666" />
            <YAxis stroke="#666" />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1C1C1C",
                border: "1px solid #2A2A2A",
                borderRadius: "8px",
              }}
            />
            <Legend />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#8884d8"
              dot={false}
              name="Revenue"
            />
            <Line
              type="monotone"
              dataKey="click"
              stroke="#B69C6C"
              dot={false}
              name="Click"
            />
          </LineChart>
        )}
      </div>
    </DashboardLayout>
  );
};

export default AffiliateManagement;
