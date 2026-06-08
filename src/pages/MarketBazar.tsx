import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Grid2X2, List, Search, ChevronDown, LayoutGrid, LayoutList } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import type { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['products']['Row'];

const MarketBazar = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [selectedSize, setSelectedSize] = useState<string>("");
  const [selectedColor, setSelectedColor] = useState<string>(""); // Changed to single color
  const [priceRange, setPriceRange] = useState<string>("");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedGender, setSelectedGender] = useState<string[]>([]);
  const [selectedFabric, setSelectedFabric] = useState<string>(""); // Changed to single string
  const [sortBy, setSortBy] = useState<string>("newest");

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', searchQuery, selectedSize, selectedColor, priceRange, selectedGender, selectedFabric, sortBy], // Updated to use selectedColor
    queryFn: async () => {
      let query = supabase
        .from('products')
        .select('*')
        .eq('status', 'active');

      if (searchQuery) {
        query = query.ilike('name', `%${searchQuery}%`);
      }

      const { data, error } = await query;
      if (error) throw error;

      let filteredProducts = data;

      // Filter by size
      if (selectedSize) {
        filteredProducts = filteredProducts.filter(product => {
          const sizes = product.sizes as string[] || [];
          return sizes.includes(selectedSize);
        });
      }

      // Filter by single color
      if (selectedColor) {
        filteredProducts = filteredProducts.filter(product => {
          const productColors = (product.colors as { name: string }[] || []).map(c => c.name);
          return productColors.includes(selectedColor);
        });
      }

      // Filter by price range
      if (priceRange) {
        const [min, max] = priceRange.split('-').map(Number);
        filteredProducts = filteredProducts.filter(product => 
          product.price >= min && product.price <= max
        );
      }

      // Sort products
      filteredProducts.sort((a, b) => {
        switch (sortBy) {
          case "newest":
            return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
          case "price-low":
            return a.price - b.price;
          case "price-high":
            return b.price - a.price;
          case "name":
            return a.name.localeCompare(b.name);
          default:
            return 0;
        }
      });

      return filteredProducts;
    }
  });

  // Separate query to get all products for counting
  const { data: allProducts } = useQuery({
    queryKey: ['all-products'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .eq('status', 'active');
      
      if (error) throw error;
      return data;
    }
  });

  const sizes = ["XS", "S", "M", "L", "XL", "2XL", "3XL"];
  const colors = [
    { name: "White", class: "bg-white border border-gray-200" },
      { name: "Black", class: "bg-black" },
      { name: "Red", class: "bg-red-500" },
      { name: "Blue", class: "bg-blue-500" },
      { name: "Green", class: "bg-green-500" },
      { name: "Yellow", class: "bg-yellow-500" },
      { name: "Purple", class: "bg-purple-500" },
      { name: "Pink", class: "bg-pink-500" },
  ];

  const priceRanges = [
    { label: "UNDER 25 USD", value: "0-25" },
    { label: "25 USD - 50 USD", value: "25-50" },
    { label: "50 USD - 75 USD", value: "50-75" },
    { label: "75 USD - 100 USD", value: "75-100" },
    { label: "100 USD - 150 USD", value: "100-150" },
    { label: "150 USD - 200 USD", value: "150-200" }
  ];

  const genders = ["FEMALE", "MALE", "UNISEX"];
  const fabrics = ["VELOUR", "CRINKLE NYLON", "DEBOSSED", "AIR MESH", "NYLON"];

  const handleColorToggle = (colorName: string) => {
    setSelectedColor(selectedColor === colorName ? "" : colorName); // Toggle single color selection
  };

  const getPriceRangeCounts = () => {
    if (!allProducts) return {};
    
    return priceRanges.reduce((acc, range) => {
      const [min, max] = range.value.split('-').map(Number);
      const count = allProducts.filter(product => 
        product.price >= min && product.price <= max
      ).length;
      acc[range.value] = count;
      return acc;
    }, {} as Record<string, number>);
  };

  const priceRangeCounts = getPriceRangeCounts();

  const getFabricCounts = () => {
    if (!allProducts) return {};
    
    return fabrics.reduce((acc, fabric) => {
      const count = allProducts.filter((product:any) => 
        product?.fabric === fabric
      ).length;
      acc[fabric] = count;
      return acc;
    }, {} as Record<string, number>);
  };

  const fabricCounts = getFabricCounts();

  return (
    <DashboardLayout headerTitle="Notes Merch">
      <div className="flex flex-col lg:flex-row max-w-full overflow-hidden">
        <div className="w-full lg:w-64 flex-shrink-0 bg-[#161618]  p-4 px-8 space-y-4 h-full overflow-y-auto">
          <Accordion type="multiple" defaultValue={["size", "price", "color", "gender", "fabric"]} className="space-y-4">
            <AccordionItem value="size" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline flex flex-row-reverse justify-end gap-2">
                SIZE
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-4 lg:grid-cols-3 gap-2 pt-2">
                  {sizes.map((size) => (
                    <button
                      key={size}
                      className={`px-3 py-2 text-sm border rounded bg-[#1E1E20] ${
                        selectedSize === size
                          ? 'bg-white text-black border-white'
                          : 'border-gray-800 hover:border-white'
                      }`}
                      onClick={() => setSelectedSize(selectedSize === size ? "" : size)}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </AccordionContent>
              <div className="h-px bg-neutral-800 mt-4"></div>
            </AccordionItem>

            <AccordionItem value="price" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline flex flex-row-reverse justify-end gap-2">
                PRICE
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {priceRanges.map((range) => (
                    <label key={range.value} className="flex items-center justify-between hover:bg-neutral-900 p-1 rounded cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox" 
                          className="rounded border-[#2C2C30] bg-[#1E1E20] appearance-none checked:bg-white w-4 h-4"
                          checked={priceRange === range.value}
                          onChange={() => setPriceRange(priceRange === range.value ? "" : range.value)}
                        />
                        <span className="text-sm">{range.label}</span>
                      </div>
                      <span className="text-sm text-neutral-400">({priceRangeCounts[range.value] || 0})</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
              <div className="h-px bg-neutral-800 mt-4"></div>
            </AccordionItem>

            <AccordionItem value="color" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline flex flex-row-reverse justify-end gap-2">
                COLOR
              </AccordionTrigger>
              <AccordionContent>
                <div className="grid grid-cols-6 lg:grid-cols-4 gap-2 p-2">
                  {colors.map((color) => (
                    <button
                      key={color.name}
                      className={`w-6 h-6 rounded-full ${color.class} border border-gray-800 hover:border-white ${
                        selectedColor === color.name ? 'ring-2 ring-white' : ''
                      }`}
                      onClick={() => handleColorToggle(color.name)}
                      title={color.name}
                    />
                  ))}
                </div>
              </AccordionContent>
              <div className="h-px bg-neutral-800 mt-4"></div>
            </AccordionItem>

            <AccordionItem value="fabric" className="border-b-0">
              <AccordionTrigger className="text-sm font-semibold hover:no-underline flex flex-row-reverse justify-end gap-2">
                SHOP BY FABRIC
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-3 pt-2">
                  {fabrics.map((fabric) => (
                    <label key={fabric} className="flex items-center justify-between hover:bg-neutral-900 p-1 rounded cursor-pointer">
                      <div className="flex items-center space-x-2">
                        <input 
                          type="checkbox"
                          className="rounded border-[#2C2C30] bg-[#1E1E20] appearance-none checked:bg-white w-4 h-4"
                          checked={selectedFabric === fabric}
                          onChange={() => setSelectedFabric(selectedFabric === fabric ? "" : fabric)}
                        />
                        <span className="text-sm">{fabric}</span>
                      </div>
                      <span className="text-sm text-neutral-400">({fabricCounts[fabric] || 0})</span>
                    </label>
                  ))}
                </div>
              </AccordionContent>
              <div className="h-px bg-neutral-800 mt-4"></div>
            </AccordionItem>
          </Accordion>
        </div>

        <div className="flex-1 min-w-0">
          <div className="sticky top-0 bg-[#161618] z-10 border-b border-neutral-800">
            <div className="p-4 flex flex-col gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-neutral-400" />
                <Input
                  placeholder="Search products..."
                  className="pl-10 w-full bg-neutral-900 border-neutral-800 focus:border-neutral-700 rounded-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">VIEW AS</span>
                  <div className="flex items-center gap-1">
                    <Button
                      variant={viewMode === 'grid' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('grid')}
                    >
                      <LayoutGrid className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'secondary' : 'ghost'}
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => setViewMode('list')}
                    >
                      <LayoutList className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <span className="text-sm text-neutral-400">{products?.length || 0} PRODUCTS</span>

                <div className="flex items-center gap-2">
                  <span className="text-sm text-neutral-400">SORT BY:</span>
                  <Select onValueChange={(value) => setSortBy(value)}>
                    <SelectTrigger className="w-[40px] bg-[#161618] border-0 hover:bg-neutral-900 focus:ring-0">
                      {/* <ChevronDown className="h-4 w-4 opacity-50" /> */}
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="newest">Newest</SelectItem>
                      <SelectItem value="price-low">Price: Low to High</SelectItem>
                      <SelectItem value="price-high">Price: High to Low</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4">
            {isLoading ? (
              <div className={`grid ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3' 
                  : 'grid-cols-1'
                } gap-4`}>
                {[1, 2, 3, 4, 5, 6].map((i) => (
                  <div key={i} className="space-y-4 p-4 border border-gray-800 rounded-lg">
                    <Skeleton className="h-[300px] w-full" />
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-4 w-1/2" />
                  </div>
                ))}
              </div>
            ) : (
              <div className={`grid ${
                viewMode === 'grid' 
                  ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-3' 
                  : 'grid-cols-1'
                } gap-4`}>
                {products?.map((product) => (
                  <Link
                    to={`/marketplace/product/${product.id}`}
                    key={product.id}
                    className={`group bg-[#161618] rounded-lg overflow-hidden hover:border-gray-600 transition-all duration-300 ${
                      viewMode === 'list' 
                        ? 'flex flex-col sm:flex-row sm:h-[200px] hover:shadow-lg hover:shadow-black/20' 
                        : 'hover:shadow-lg hover:shadow-black/20'
                    }`}
                  >
                    <div className={`relative overflow-hidden ${
                      viewMode === 'list' 
                        ? 'sm:w-[200px] md:w-[250px]' 
                        : 'aspect-[4/5] rounded-lg'
                    }`}>
                      <img
                        src={product.main_image || '/placeholder.svg'}
                        alt={product.name}
                        className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${
                          viewMode === 'list' 
                            ? 'sm:h-[200px]' 
                            : 'rounded-lg'
                        }`}
                      />
                    </div>
                    <div className={`flex flex-col ${
                      viewMode === 'list' 
                        ? 'flex-1 p-6 sm:justify-between sm:max-w-[calc(100%-250px)]' 
                        : 'p-4'
                    }`}>
                      <div>
                        {viewMode === 'list' ? (
                          <div className="flex items-start justify-between gap-4">
                            <h3 className="text-xl font-medium">{product.name}</h3>
                            <div className="text-right">
                              <p className="font-bold text-lg">${product.price} USD</p>
                              {product.original_price && (
                                <p className="text-sm text-gray-400 line-through">
                                  ${product.original_price} USD
                                </p>
                              )}
                            </div>
                          </div>
                        ) : (
                          <>
                            <h3 className="text-base font-medium truncate mb-1">{product.name}</h3>
                            <p className="font-bold">${product.price} USD</p>
                          </>
                        )}
                        
                        {viewMode === 'list' && (
                          <>
                            <p className={`text-sm text-gray-400 mt-2 ${
                              viewMode === 'list' ? 'line-clamp-2' : 'truncate'
                            }`}>{product.description}</p>
                            
                            <div className="mt-4 flex flex-wrap gap-2">
                              {(product.sizes as string[])?.map((size) => (
                                <Badge key={size} variant="outline" className="text-xs">
                                  {size}
                                </Badge>
                              ))}
                            </div>
                            
                            <div className="mt-4 flex items-center gap-3">
                              <div className="flex -space-x-1">
                                {(product.colors as { name: string; class: string }[])?.slice(0, 4).map((color) => (
                                  <div
                                    key={color.name}
                                    className={`w-4 h-4 rounded-full border border-gray-800 ${color.class}`}
                                    title={color.name}
                                  />
                                ))}
                              </div>
                              {(product.colors as { name: string }[])?.length > 4 && (
                                <span className="text-xs text-gray-400">
                                  +{(product.colors as { name: string }[]).length - 4} more
                                </span>
                              )}
                            </div>
                          </>
                        )}
                      </div>
                      
                      {viewMode === 'list' && (
                        <div className="mt-4 flex items-center justify-between">
                          <div className="flex items-center gap-2 text-sm text-gray-400">
                            <Badge variant="secondary" className="text-xs">
                              Fashion
                            </Badge>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="opacity-0 group-hover:opacity-100 transition-opacity"
                          >
                            View Details →
                          </Button>
                        </div>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MarketBazar;