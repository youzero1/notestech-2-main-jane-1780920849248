import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import FileUpload from "@/components/courses/FileUpload";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Link } from "react-router-dom";
import { Plus, Pencil, Trash2, Image, Loader2, X, ClipboardCheck } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import * as productsApi from "@/lib/products";
import type { Database } from "@/integrations/supabase/types";

type Product = Database['public']['Tables']['products']['Row'];
type ProductInsert = Database['public']['Tables']['products']['Insert'];

const productFormSchema = z.object({
  name: z.string().min(1, "Name is required"),
  price: z.coerce.number()
    .min(1, "Price must be at least 1")
    .max(9999, "Price cannot exceed 9999")
    .nonnegative("Price cannot be negative"),
  originalPrice: z.coerce.number()
    .min(1, "Original price must be at least 1")
    .max(9999, "Original price cannot exceed 9999")
    .nonnegative("Original price cannot be negative")
    .optional(),
  description: z.string().min(1, "Description is required"),
  sizes: z.array(z.string())
    .min(1, "At least one size must be selected"),
  colors: z.array(z.object({
    name: z.string(),
    class: z.string()
  }))
    .min(1, "At least one color must be selected"),
  type: z.enum(["direct", "affiliate"]),
  affiliateLink: z.string().optional()
    .superRefine((val, ctx) => {
      const type = (ctx as any).parent?.type;
      if (type === "affiliate") {
        if (!val) {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Affiliate link is required for affiliate products",
          });
          return;
        }
        try {
          new URL(val);
        } catch {
          ctx.addIssue({
            code: z.ZodIssueCode.custom,
            message: "Must be a valid URL",
          });
        }
      }
    }),
  status: z.enum(["active", "draft", "archived"]),
  mainImage: z.any()
    .refine((file) => file instanceof File || typeof file === 'string', {
      message: "Main image is required",
    }),
  galleryImages: z.array(z.any())
});

type ProductFormData = z.infer<typeof productFormSchema>;

const AVAILABLE_SIZES = ["XS", "S", "M", "L", "XL", "XXL"];
const AVAILABLE_COLORS = [
  { name: "Black", class: "bg-black" },
  { name: "White", class: "bg-white border border-gray-200" },
  { name: "Red", class: "bg-red-500" },
  { name: "Blue", class: "bg-blue-500" },
  { name: "Green", class: "bg-green-500" },
  { name: "Yellow", class: "bg-yellow-500" },
  { name: "Purple", class: "bg-purple-500" },
  { name: "Pink", class: "bg-pink-500" },
];

const ProductManagement = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [productToDelete, setProductToDelete] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState("direct");
  const queryClient = useQueryClient();

  const defaultValues = {
    name: "",
    price: 1,
    description: "",
    sizes: [],
    colors: [],
    type: "direct" as const,
    status: "draft" as const,
    galleryImages: [],
    mainImage: undefined,
    affiliateLink: undefined,
  };

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productFormSchema),
    defaultValues,
  });

  const handleModalOpenChange = (open: boolean) => {
    if (!open) {
      form.reset(defaultValues);
      setSelectedProduct(null);
    }
    setIsModalOpen(open);
  };

  const createMutation = useMutation({
    mutationFn: async (data: ProductFormData) => {
      try {
        console.log('Product data to save:', {
          name: data.name,
          price: data.price,
          original_price: data.originalPrice,
          description: data.description,
          type: data.type,
          status: data.status,
          affiliate_link: data.affiliateLink,
          sizes: data.sizes,
          colors: data.colors,
        });

        let product;
        if (selectedProduct) {
          console.log('Updating existing product:', selectedProduct.id);
          product = await productsApi.updateProduct(selectedProduct.id, {
            name: data.name,
            price: data.price,
            original_price: data.originalPrice,
            description: data.description,
            type: data.type,
            status: data.status,
            affiliate_link: data.affiliateLink,
            sizes: data.sizes,
            colors: data.colors,
          });
        } else {
          console.log('Creating new product');
          product = await productsApi.createProduct({
            name: data.name,
            price: data.price,
            original_price: data.originalPrice,
            description: data.description,
            type: data.type,
            status: data.status,
            affiliate_link: data.affiliateLink,
            sizes: data.sizes,
            colors: data.colors,
          });
        }

        console.log('Product saved:', product);

        let mainImageUrl = '';
        if (data.mainImage instanceof File) {
          console.log('Uploading new main image');
          mainImageUrl = await productsApi.uploadProductImage(data.mainImage, product.id);
        } else if (typeof data.mainImage === 'string') {
          console.log('Using existing main image');
          mainImageUrl = data.mainImage;
        }

        const galleryUrls: string[] = [];
        if (Array.isArray(data.galleryImages)) {
          console.log('Processing gallery images');
          for (const image of data.galleryImages) {
            if (image instanceof File) {
              const url = await productsApi.uploadProductImage(image, product.id);
              galleryUrls.push(url);
            } else if (typeof image === 'string') {
              galleryUrls.push(image);
            }
          }
        }

        const imageUpdates: Partial<Product> = {};
        if (mainImageUrl) {
          imageUpdates.main_image = mainImageUrl;
        }
        if (galleryUrls.length > 0) {
          imageUpdates.gallery_images = galleryUrls;
        }

        if (Object.keys(imageUpdates).length > 0) {
          console.log('Updating product with image URLs:', imageUpdates);
          await productsApi.updateProduct(product.id, imageUpdates);
        }

        return product;
      } catch (error) {
        console.error('Mutation error:', error);
        throw error;
      }
    },
    onSuccess: () => {
      console.log('Mutation successful');
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: selectedProduct ? "Product updated successfully" : "Product created successfully",
      });
      form.reset(defaultValues);
      setIsModalOpen(false);
      setSelectedProduct(null);
    },
    onError: (error) => {
      console.error('Mutation error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error.message || "Something went wrong",
      });
    },
  });

  const onSubmit = async (data: ProductFormData) => {
    try {
      console.log('Form submitted with data:', data);
      await createMutation.mutateAsync(data);
    } catch (error) {
      console.error('Submit error:', error);
    }
  };

  const handleEditProduct = (product: Product) => {
    console.log('Editing product:', product);
    form.reset({
      name: product.name,
      price: product.price,
      originalPrice: product.original_price || undefined,
      description: product.description || "",
      sizes: product.sizes as string[] || [],
      colors: product.colors as { name: string; class: string }[] || [],
      type: product.type,
      affiliateLink: product.affiliate_link || undefined,
      status: product.status,
      mainImage: product.main_image || undefined,
      galleryImages: Array.isArray(product.gallery_images) ? product.gallery_images : []
    });
    setSelectedProduct(product);
    setIsModalOpen(true);
  };

  const productType = form.watch("type");

  const { data: products, isLoading } = useQuery({
    queryKey: ['products', activeTab],
    queryFn: () => productsApi.listProducts(activeTab as 'direct')
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await productsApi.deleteProduct(id);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      toast({
        title: "Success",
        description: "Product deleted successfully",
      });
      setDeleteConfirmOpen(false);
      setProductToDelete(null);
    },
    onError: (error) => {
      console.error('Delete error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to delete product",
      });
    },
  });

  const handleDeleteClick = (id: string) => {
    setProductToDelete(id);
    setDeleteConfirmOpen(true);
  };

  const confirmDelete = async () => {
    if (productToDelete) {
      await deleteMutation.mutateAsync(productToDelete);
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-10 px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col sm:flex-row justify-between items-center mb-5">
          <h1 className="text-2xl sm:text-3xl font-bold mb-4 sm:mb-0">Product Management</h1>
          <div className="flex gap-2 sm:gap-4">
            <Link to="/admin/reviews">
              <Button variant="outline" className="text-sm sm:text-base">
                <ClipboardCheck className="mr-2 h-4 w-4" />
                Manage Reviews
              </Button>
            </Link>
            <Dialog open={isModalOpen} onOpenChange={handleModalOpenChange}>
              <DialogTrigger asChild>
                <Button onClick={() => {
                  form.reset(defaultValues);
                  setSelectedProduct(null);
                  setIsModalOpen(true);
                }} className="text-sm sm:text-base">
                  <Plus className="mr-2 h-4 w-4" />
                  Add Product
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-full sm:max-w-3xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                  <DialogTitle>
                    {selectedProduct ? "Edit Product" : "Add New Product"}
                  </DialogTitle>
                  <DialogDescription>
                    {selectedProduct 
                      ? "Update the product details below." 
                      : "Fill in the product details below."}
                  </DialogDescription>
                </DialogHeader>
                <Form {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Product name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="grid grid-cols-2 gap-4">
                      <FormField
                        control={form.control}
                        name="price"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Price (Required)</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="Product price"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? Number(value) : '');
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />

                      <FormField
                        control={form.control}
                        name="originalPrice"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Original Price</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                min="1"
                                step="0.01"
                                placeholder="Original price"
                                {...field}
                                onChange={(e) => {
                                  const value = e.target.value;
                                  field.onChange(value ? Number(value) : undefined);
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>

                    <FormField
                      control={form.control}
                      name="description"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Description</FormLabel>
                          <FormControl>
                            <Textarea
                              placeholder="Product description"
                              {...field}
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="sizes"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Sizes (Required)</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_SIZES.map((size) => (
                              <Button
                                key={size}
                                type="button"
                                variant={field.value.includes(size) ? "default" : "outline"}
                                onClick={() => {
                                  const newSizes = field.value.includes(size)
                                    ? field.value.filter((s) => s !== size)
                                    : [...field.value, size];
                                  field.onChange(newSizes);
                                }}
                              >
                                {size}
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="colors"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Colors (Required)</FormLabel>
                          <div className="flex flex-wrap gap-2">
                            {AVAILABLE_COLORS.map((color) => (
                              <Button
                                key={color.name}
                                type="button"
                                variant="outline"
                                className={`w-8 h-8 rounded-full p-0 ${
                                  field.value.some((c) => c.name === color.name)
                                    ? "ring-2 ring-primary ring-offset-2"
                                    : ""
                                }`}
                                onClick={() => {
                                  const newColors = field.value.some(
                                    (c) => c.name === color.name
                                  )
                                    ? field.value.filter(
                                        (c) => c.name !== color.name
                                      )
                                    : [...field.value, color];
                                  field.onChange(newColors);
                                }}
                              >
                                <span
                                  className={`w-full h-full rounded-full ${color.class}`}
                                />
                                <span className="sr-only">{color.name}</span>
                              </Button>
                            ))}
                          </div>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="type"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Product Type</FormLabel>
                          <Select 
                            value={field.value}
                            onValueChange={(value) => {
                              field.onChange(value);
                            }}
                            disabled
                          >
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="direct">Direct</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    {productType === "affiliate" && (
                      <FormField
                        control={form.control}
                        name="affiliateLink"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Affiliate Link (Required)</FormLabel>
                            <FormControl>
                              <Input
                                placeholder="Affiliate link"
                                {...field}
                                value={field.value || ""}
                                onChange={(e) => {
                                  field.onChange(e.target.value);
                                  form.trigger('affiliateLink');
                                }}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    )}

                    <FormField
                      control={form.control}
                      name="status"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Status</FormLabel>
                          <Select onValueChange={field.onChange} defaultValue={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select a status" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="active">Active</SelectItem>
                              <SelectItem value="draft">Draft</SelectItem>
                              <SelectItem value="archived">Archived</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="mainImage"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Main Image (Required)</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              {typeof field.value === 'string' && (
                                <div className="relative w-full aspect-video rounded-lg overflow-hidden">
                                  <img
                                    src={field.value}
                                    alt="Main product"
                                    className="object-cover w-full h-full"
                                  />
                                  <Button
                                    type="button"
                                    variant="destructive"
                                    size="icon"
                                    className="absolute top-2 right-2"
                                    onClick={() => field.onChange(null)}
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              )}
                              <FileUpload
                                onUpload={(files) => field.onChange(files[0])}
                                maxFiles={1}
                                acceptedFileTypes={{
                                  'image/*': ['.png', '.jpeg', '.jpg']
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="galleryImages"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Gallery Images</FormLabel>
                          <FormControl>
                            <div className="space-y-4">
                              {Array.isArray(field.value) && field.value.some(img => typeof img === 'string') && (
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                                  {field.value.map((image, index) => {
                                    if (typeof image === 'string') {
                                      return (
                                        <div key={index} className="relative aspect-video rounded-lg overflow-hidden">
                                          <img
                                            src={image}
                                            alt={`Gallery ${index + 1}`}
                                            className="object-cover w-full h-full"
                                          />
                                          <Button
                                            type="button"
                                            variant="destructive"
                                            size="icon"
                                            className="absolute top-2 right-2"
                                            onClick={() => {
                                              const newImages = field.value.filter((_, i) => i !== index);
                                              field.onChange(newImages);
                                            }}
                                          >
                                            <X className="h-4 w-4" />
                                          </Button>
                                        </div>
                                      );
                                    }
                                    return null;
                                  })}
                                </div>
                              )}
                              <FileUpload
                                onUpload={(files) => {
                                  const currentImages = Array.isArray(field.value) ? field.value : [];
                                  field.onChange([...currentImages, ...files]);
                                }}
                                maxFiles={5}
                                acceptedFileTypes={{
                                  'image/*': ['.png', '.jpeg', '.jpg']
                                }}
                              />
                            </div>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => {
                          form.reset(defaultValues);
                          setIsModalOpen(false);
                        }}
                        disabled={createMutation.isPending}
                      >
                        Cancel
                      </Button>
                      <Button 
                        type="submit"
                        disabled={createMutation.isPending}
                      >
                        {createMutation.isPending ? (
                          <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            {selectedProduct ? "Updating..." : "Saving..."}
                          </>
                        ) : (
                          selectedProduct ? "Update Product" : "Save Product"
                        )}
                      </Button>
                    </div>
                  </form>
                </Form>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <AlertDialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
              <AlertDialogDescription>
                This action cannot be undone. This will permanently delete the
                product and all associated data.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={confirmDelete}
                disabled={deleteMutation.isPending}
              >
                {deleteMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Deleting...
                  </>
                ) : (
                  "Delete"
                )}
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>

        {isLoading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {products?.map((product) => (
              <Card key={product.id} className="p-4">
                <div className="relative">
                  {product.main_image && (
                    <img
                      src={product.main_image}
                      alt={product.name}
                      className="w-full h-32 sm:h-48 object-cover rounded-md mb-4"
                    />
                  )}
                  <div className="absolute top-2 right-2 flex gap-2">
                    <Button
                      variant="secondary"
                      size="icon"
                      onClick={() => handleEditProduct(product)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="destructive"
                      size="icon"
                      onClick={() => handleDeleteClick(product.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                <h3 className="text-lg font-semibold mb-2">{product.name}</h3>
                <p className="text-sm text-muted-foreground mb-2">
                  {product.description}
                </p>
                <div className="flex justify-between items-center">
                  <div>
                    <span className="font-medium">${product.price}</span>
                    {product.original_price && (
                      <span className="text-sm text-muted-foreground line-through ml-2">
                        ${product.original_price}
                      </span>
                    )}
                  </div>
                  <span className="text-xs sm:text-sm px-2 py-1 bg-primary/10 rounded-full">
                    {product.type}
                  </span>
                </div>
              </Card>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
};

export default ProductManagement;
