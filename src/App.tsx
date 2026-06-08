
import React from 'react';
import { BrowserRouter as Router, Route, Routes } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { MembershipProvider } from './hooks/useMembership';
import { CartProvider } from './contexts/CartContext';
import Index from './pages/Index';
import About from './pages/About';
import Team from './pages/Team';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import { AuthGuard } from './components/auth/AuthGuard';
import { DashboardLayout } from './components/dashboard/DashboardLayout';
import Music from './pages/Music';
import Community from './pages/Community';
import Money from './pages/Money';
import Knowledge from './pages/Knowledge';
import CreateCourse from './pages/CreateCourse';
import CourseDetail from './pages/CourseDetail';
import Profile from './pages/Profile';
import NotFound from './pages/NotFound';
import { Toaster } from "@/components/ui/toaster"
import ViewPost from './pages/ViewPost';
import MarketBazar from './pages/MarketBazar';
import AskNotes from './pages/AskNotes';
import AskRakim from './pages/AskRakim';
import Marketplace from './pages/Marketplace';
import MembershipPlans from "./pages/Membership";
import ProductDetail from './pages/ProductDetail';
import ProductManagement from './pages/admin/ProductManagement';
import KnowledgeCourses from './pages/KnowledgeCourses';
import TopicDetail from './pages/TopicDetail';
import QuizDetail from './pages/QuizDetail';
import ReviewManagement from "./pages/admin/ReviewManagement";
import Orders from './pages/Orders';
import Subscriptions from './pages/Subscriptions';
import MemberProfile from './pages/MemberProfile';
import MoneyProgram from './pages/MoneyProgram';
import AffiliateManagement from './pages/admin/AffiliateManagement';
import ProgramReviews from './pages/admin/ProgramReviews';
import LMS from './pages/admin/LMS';
import Analytics from './pages/Analytics';
import NewsletterManagement from "./pages/admin/NewsletterManagement";
import NewsletterCreate from "./pages/admin/NewsletterCreate";
import NewsletterEdit from "./pages/admin/NewsletterEdit";
import NewsletterPreviewPage from "./pages/admin/NewsletterPreviewPage";
import VerifySubscription from "./pages/VerifySubscription";
import PrivacyPolicy from './pages/PrivacyPolicy';
import TermsOfService from './pages/TermsOfService';
import Disclosure from './pages/Disclosure';
import PressReleaseManagement from './pages/admin/PressReleaseManagement';
import PressReleaseCreate from './pages/admin/PressReleaseCreate';
import PressReleaseEdit from './pages/admin/PressReleaseEdit';
import PressReleaseList from './pages/PressReleaseList';
import PressReleaseDetail from './pages/PressReleaseDetail';
import Notifications from './pages/Notifications';
import Messages from './pages/Messages';
import SubscriptionHistory from './pages/admin/SubscriptionHistory';
import NoteslinkStage from './pages/NoteslinkStage';
import NoteslinkManage from './pages/NoteslinkManage';
import { supabase } from './integrations/supabase/client';

// Initialize the Supabase client with appropriate configuration
// Note: In newer Supabase versions, setPresenceTimeout is not available directly
// The presence timeout is set when creating channels instead

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router>
        <AuthProvider>
          <MembershipProvider>
            <CartProvider>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/about" element={<About />} />
              <Route path="/team" element={<Team />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsOfService />} />
              <Route path="/disclosure" element={<Disclosure />} />
              <Route path="/verify-subscription" element={<VerifySubscription />} />
              <Route path="/dashboard" element={<AuthGuard><Dashboard /></AuthGuard>} />
              <Route path="/music" element={<AuthGuard><Music /></AuthGuard>} />
              <Route path="/community" element={<AuthGuard><Community /></AuthGuard>} />
              <Route path="/money" element={<AuthGuard><Money /></AuthGuard>} />
              <Route path="/money/:programId" element={<AuthGuard><MoneyProgram /></AuthGuard>} />
              <Route path="/knowledge" element={<AuthGuard><Knowledge /></AuthGuard>} />
              <Route path="/knowledge/:categoryId" element={<AuthGuard><KnowledgeCourses  /></AuthGuard>} />
              <Route path="/create-course" element={<AuthGuard><CreateCourse /></AuthGuard>} />
              <Route path="/courses/:id" element={<AuthGuard><CourseDetail /></AuthGuard>} />
              <Route path="/profile" element={<AuthGuard><Profile /></AuthGuard>} />
              <Route path="/profile/:profileId" element={<AuthGuard><MemberProfile /></AuthGuard>} />
              <Route path="/orders" element={<AuthGuard><Orders /></AuthGuard>} />
              <Route path="/subscriptions" element={<AuthGuard><Subscriptions /></AuthGuard>} />
              <Route path="/membership" element={<AuthGuard><MembershipPlans /></AuthGuard>} />
              <Route path="/notifications" element={<AuthGuard><Notifications /></AuthGuard>} />
              <Route path="/messages" element={<AuthGuard><Messages /></AuthGuard>} />
              <Route path="/posts/:id" element={<AuthGuard><ViewPost /></AuthGuard>} />
              <Route path="/courses/:courseId/topics/:topicId" element={<AuthGuard><TopicDetail /></AuthGuard>} />
              <Route path="/courses/:courseId/quiz/:topicId" element={<AuthGuard><QuizDetail /></AuthGuard>} />
              <Route path="/admin/reviews" element={
                <AuthGuard>
                  <ReviewManagement />
                </AuthGuard>
              } />
              <Route path="/analytics" element={<AuthGuard><Analytics /></AuthGuard>} />
              <Route path="/marketplace" element={<AuthGuard><MarketBazar /></AuthGuard>} />
              <Route path="/asknotes" element={<AuthGuard><AskNotes /></AuthGuard>} />
              <Route path="/askrakim" element={<AuthGuard><AskRakim /></AuthGuard>} />
              <Route path="/marketplace/product/:id" element={<AuthGuard><ProductDetail /></AuthGuard>} />
              <Route path="/admin/product-management" element={<AuthGuard><ProductManagement /></AuthGuard>} />
              <Route path="/admin/affiliate-management" element={<AuthGuard><AffiliateManagement /></AuthGuard>} />
              <Route path="/admin/program/reviews" element={<AuthGuard><ProgramReviews /></AuthGuard>} />
              <Route path="/admin/lms" element={<AuthGuard><LMS/></AuthGuard>} />
              <Route path="/admin/subscription-history" element={
                <AuthGuard>
                  <SubscriptionHistory />
                </AuthGuard>
              } />

              {/* Newsletter routes - Updated to use AuthGuard and DashboardLayout */}
              <Route path="/admin/newsletters" element={
                <AuthGuard>
                  <DashboardLayout>
                    <NewsletterManagement />
                  </DashboardLayout>
                </AuthGuard>
              } />
              <Route path="/admin/newsletters/create" element={
                <AuthGuard>
                  <DashboardLayout>
                    <NewsletterCreate />
                  </DashboardLayout>
                </AuthGuard>
              } />
              <Route path="/admin/newsletters/edit/:id" element={
                <AuthGuard>
                  <DashboardLayout>
                    <NewsletterEdit />
                  </DashboardLayout>
                </AuthGuard>
              } />
              <Route path="/admin/newsletters/preview/:id" element={
                <AuthGuard>
                  <DashboardLayout>
                    <NewsletterPreviewPage />
                  </DashboardLayout>
                </AuthGuard>
              } />
              
              {/* Press Release Management Routes */}
              <Route path="/admin/press-releases" element={
                <AuthGuard>
                  <PressReleaseManagement />
                </AuthGuard>
              } />
              <Route path="/admin/press-releases/create" element={
                <AuthGuard>
                  <PressReleaseCreate />
                </AuthGuard>
              } />
              <Route path="/admin/press-releases/edit/:id" element={
                <AuthGuard>
                  <PressReleaseEdit />
                </AuthGuard>
              } />
              
              {/* Public Press Release Routes */}
              <Route path="/press-releases" element={<PressReleaseList />} />
              <Route path="/press-releases/:slug" element={<PressReleaseDetail />} />          
              
              {/* Noteslink Routes */}
              <Route path="/noteslink" element={<AuthGuard><NoteslinkManage /></AuthGuard>} />
              
              {/* Catch-all for Noteslink usernames - BEFORE 404 */}
              <Route path="/:username" element={<NoteslinkStage />} />
              
              {/* 404 Not Found - This won't be reached due to /:username above */}
              <Route path="*" element={<NotFound />} />
            </Routes>
              <Toaster />
            </CartProvider>
          </MembershipProvider>
        </AuthProvider>
      </Router>
    </QueryClientProvider>
  );
}

export default App;
