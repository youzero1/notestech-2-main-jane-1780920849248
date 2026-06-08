
import { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import NewsletterList from "@/components/newsletter/NewsletterList";
import SubscriberList from "@/components/newsletter/SubscriberList";
import { 
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator
} from "@/components/ui/breadcrumb";

export default function NewsletterManagement() {
  const [activeTab, setActiveTab] = useState("newsletters");

  return (
    <div className="space-y-4">
      <Breadcrumb>
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="/dashboard">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbSeparator />
          <BreadcrumbItem>
            <BreadcrumbPage>Newsletter Management</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
      
      <h1 className="text-3xl font-bold mb-6">Newsletter Management</h1>
      
      <Tabs defaultValue="newsletters" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="newsletters">Newsletters</TabsTrigger>
          <TabsTrigger value="subscribers">Subscribers</TabsTrigger>
        </TabsList>
        <TabsContent value="newsletters">
          <NewsletterList />
        </TabsContent>
        <TabsContent value="subscribers">
          <SubscriberList />
        </TabsContent>
      </Tabs>
    </div>
  );
}
