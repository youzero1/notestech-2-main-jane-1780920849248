
import { DashboardLayout } from "@/components/dashboard/DashboardLayout";
import { StatCards } from "@/components/dashboard/StatCards";
import { EarningsChart } from "@/components/dashboard/EarningsChart";
import { AffiliateRevenueChart } from "@/components/dashboard/AffiliateRevenueChart";
import { RecentTracks } from "@/components/dashboard/RecentTracks";
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbSeparator } from "@/components/ui/breadcrumb";
import { Link, useLocation } from "react-router-dom";

const MoneyDuplicate = () => {
  const location = useLocation();
  const isAffiliateRevenue = location.pathname === '/affiliate-revenue';

  if (isAffiliateRevenue) {
    return (
      <DashboardLayout headerTitle="Money">
        <div className="space-y-6">
          <Breadcrumb>
            <BreadcrumbList>
              <BreadcrumbItem>
                <BreadcrumbLink asChild>
                  <Link to="/dashboard">Dashboard</Link>
                </BreadcrumbLink>
              </BreadcrumbItem>
              <BreadcrumbSeparator />
              <BreadcrumbItem>
                <BreadcrumbLink>Affiliate Revenue</BreadcrumbLink>
              </BreadcrumbItem>
            </BreadcrumbList>
          </Breadcrumb>

          <div>
            <h1 className="text-4xl font-light tracking-tight mb-2">Affiliate Revenue Overview</h1>
            <p className="text-muted-foreground text-lg font-light">
              Track your affiliate program performance and earnings
            </p>
          </div>

          <AffiliateRevenueChart />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <Breadcrumb>
          <BreadcrumbList>
            <BreadcrumbItem>
              <BreadcrumbLink asChild>
                <Link to="/dashboard">Dashboard</Link>
              </BreadcrumbLink>
            </BreadcrumbItem>
            <BreadcrumbSeparator />
            <BreadcrumbItem>
              <BreadcrumbLink>Money</BreadcrumbLink>
            </BreadcrumbItem>
          </BreadcrumbList>
        </Breadcrumb>

        <div>
          <h1 className="text-4xl font-light tracking-tight mb-2">Financial Overview</h1>
          <p className="text-muted-foreground text-lg font-light">
            Track your earnings and performance across platforms
          </p>
        </div>

        <StatCards />

        <div className="grid gap-6">
          <div>
            <EarningsChart />
          </div>
          <div>
            <RecentTracks />
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
};

export default MoneyDuplicate;
