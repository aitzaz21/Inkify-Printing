import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { AuthProvider } from './shared/hooks/useAuthContext';
import { useAuth } from './shared/hooks/useAuthContext';
import { PageLoader } from './shared/components/Spinner';
import FloatingCartButton from './shared/components/FloatingCartButton';

// ── Layout ─────────────────────────────────────────────────────
import Navbar from './modules/home/components/Navbar';
import Footer from './modules/home/components/Footer';

// ── Public pages ───────────────────────────────────────────────
import HomePage    from './modules/home/pages/HomePage';
import PrivacyPage from './modules/home/pages/PrivacyPage';
import AboutPage   from './modules/home/pages/AboutPage';
import ContactPage from './modules/home/pages/ContactPage';

// ── Shirt catalogue ────────────────────────────────────────────
import DesignsPage       from './modules/home/pages/DesignsPage';
import ProductDetailPage from './modules/products/pages/ProductDetailPage';

// ── Marketplace ────────────────────────────────────────────────
import MarketplacePage   from './modules/marketplace/pages/MarketplacePage';
import DesignDetailPage  from './modules/marketplace/pages/DesignDetailPage';
import UploadDesignPage  from './modules/marketplace/pages/UploadDesignPage';
import MyDesignsPage     from './modules/marketplace/pages/MyDesignsPage';

// ── Auth ───────────────────────────────────────────────────────
import LoginPage           from './modules/auth/pages/LoginPage';
import SignupPage          from './modules/auth/pages/SignupPage';
import VerifyEmailPage     from './modules/auth/pages/VerifyEmailPage';
import ForgotPasswordPage  from './modules/auth/pages/ForgotPasswordPage';
import ResetPasswordPage   from './modules/auth/pages/ResetPasswordPage';
import CompleteProfilePage from './modules/auth/pages/CompleteProfilePage';

// ── Shop ───────────────────────────────────────────────────────
import CustomizePage   from './modules/customize/pages/CustomizePage';
import CartPage        from './modules/cart/pages/CartPage';
import CheckoutPage    from './modules/checkout/pages/CheckoutPage';
import OrdersPage       from './modules/orders/pages/OrdersPage';
import OrderDetailPage  from './modules/orders/pages/OrderDetailPage';
import OrderSuccessPage from './modules/orders/pages/OrderSuccessPage';
import ProfilePage     from './modules/shop/pages/ProfilePage';

// ── Admin ──────────────────────────────────────────────────────
import AdminLayout          from './modules/admin/components/AdminLayout';
import AdminDashboard       from './modules/admin/pages/AdminDashboard';
import AdminOrdersPage      from './modules/admin/pages/AdminOrdersPage';
import AdminProductsPage    from './modules/admin/pages/AdminProductsPage';
import AdminDesignsPage     from './modules/admin/pages/AdminDesignsPage';
import AdminUsersPage       from './modules/admin/pages/AdminUsersPage';
import AdminPrivacyPage     from './modules/admin/pages/AdminPrivacyPage';
import AdminAboutPage       from './modules/admin/pages/AdminAboutPage';
import AdminContactPage     from './modules/admin/pages/AdminContactPage';
import AdminDesignersPage    from './modules/admin/pages/AdminDesignersPage';
import AdminEarningsPage     from './modules/admin/pages/AdminEarningsPage';
import AdminWithdrawalsPage  from './modules/admin/pages/AdminWithdrawalsPage';
import AdminShirtConfigPage from './modules/admin/pages/AdminShirtConfigPage';
import AdminBlogPage        from './modules/admin/pages/AdminBlogPage';
import AdminFAQPage         from './modules/admin/pages/AdminFAQPage';
import AdminReviewsPage     from './modules/admin/pages/AdminReviewsPage';
import AdminFooterPage      from './modules/admin/pages/AdminFooterPage';

// ── Public content ─────────────────────────────────────────────
import BlogPage       from './modules/blog/pages/BlogPage';
import BlogDetailPage from './modules/blog/pages/BlogDetailPage';
import FAQPage        from './modules/faq/pages/FAQPage';
import ReviewsPage    from './modules/reviews/pages/ReviewsPage';

import NotFoundPage from './shared/components/NotFoundPage';

// ── Guards ─────────────────────────────────────────────────────
const GuestOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? <Navigate to="/" replace /> : children;
};

const ProtectedOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  return user ? children : <Navigate to="/login" replace />;
};

const AdminOnly = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) return <PageLoader />;
  if (!user)               return <Navigate to="/login" replace />;
  if (user.role !== 'admin') return <Navigate to="/" replace />;
  return children;
};

// ── Standard layout ────────────────────────────────────────────
const PageLayout = ({ children }) => (
  <>
    <Navbar />
    <motion.main
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -6 }}
      transition={{ duration: 0.28, ease: 'easeOut' }}
    >
      {children}
    </motion.main>
    <Footer />
    <FloatingCartButton />
  </>
);

// ── Route tree ─────────────────────────────────────────────────
function AppRoutes() {
  const { loading } = useAuth();
  if (loading) return <PageLoader />;

  const location = useLocation();
  return (
    <AnimatePresence mode="wait">
    <Routes location={location} key={location.pathname}>
      {/* Public */}
      <Route path="/"        element={<PageLayout><HomePage /></PageLayout>} />
      <Route path="/designs"       element={<PageLayout><DesignsPage /></PageLayout>} />
      <Route path="/products/:id"  element={<PageLayout><ProductDetailPage /></PageLayout>} />
      <Route path="/privacy" element={<PageLayout><PrivacyPage /></PageLayout>} />
      <Route path="/about"   element={<PageLayout><AboutPage /></PageLayout>} />
      <Route path="/contact" element={<PageLayout><ContactPage /></PageLayout>} />
      <Route path="/blog"    element={<PageLayout><BlogPage /></PageLayout>} />
      <Route path="/blog/:slug" element={<PageLayout><BlogDetailPage /></PageLayout>} />
      <Route path="/faq"     element={<PageLayout><FAQPage /></PageLayout>} />
      <Route path="/reviews" element={<PageLayout><ReviewsPage /></PageLayout>} />

      {/* Marketplace */}
      <Route path="/marketplace"           element={<PageLayout><MarketplacePage /></PageLayout>} />
      <Route path="/marketplace/:id"       element={<PageLayout><DesignDetailPage /></PageLayout>} />
      <Route path="/marketplace/upload"    element={<ProtectedOnly><PageLayout><UploadDesignPage /></PageLayout></ProtectedOnly>} />
      <Route path="/marketplace/my"        element={<ProtectedOnly><PageLayout><MyDesignsPage /></PageLayout></ProtectedOnly>} />
      <Route path="/profile/designs"       element={<ProtectedOnly><PageLayout><MyDesignsPage /></PageLayout></ProtectedOnly>} />

      {/* Auth — guest only */}
      <Route path="/login"           element={<GuestOnly><LoginPage /></GuestOnly>} />
      <Route path="/signup"          element={<GuestOnly><SignupPage /></GuestOnly>} />
      <Route path="/forgot-password" element={<GuestOnly><ForgotPasswordPage /></GuestOnly>} />
      <Route path="/reset-password"  element={<GuestOnly><ResetPasswordPage /></GuestOnly>} />

      {/* Auth — semi-public */}
      <Route path="/verify-email"     element={<VerifyEmailPage />} />

      {/* Auth — protected */}
      <Route path="/complete-profile" element={<ProtectedOnly><CompleteProfilePage /></ProtectedOnly>} />

      {/* Shop — protected */}
      <Route path="/customize" element={<ProtectedOnly><PageLayout><CustomizePage /></PageLayout></ProtectedOnly>} />
      <Route path="/cart"          element={<ProtectedOnly><PageLayout><CartPage /></PageLayout></ProtectedOnly>} />
      <Route path="/checkout"      element={<ProtectedOnly><PageLayout><CheckoutPage /></PageLayout></ProtectedOnly>} />
      <Route path="/orders"            element={<ProtectedOnly><PageLayout><OrdersPage /></PageLayout></ProtectedOnly>} />
      <Route path="/orders/success/:id" element={<ProtectedOnly><PageLayout><OrderSuccessPage /></PageLayout></ProtectedOnly>} />
      <Route path="/orders/:id"     element={<ProtectedOnly><PageLayout><OrderDetailPage /></PageLayout></ProtectedOnly>} />
      <Route path="/profile"       element={<ProtectedOnly><PageLayout><ProfilePage /></PageLayout></ProtectedOnly>} />

      {/* Admin */}
      <Route path="/admin"              element={<AdminOnly><AdminLayout><AdminDashboard /></AdminLayout></AdminOnly>} />
      <Route path="/admin/orders"       element={<AdminOnly><AdminLayout><AdminOrdersPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/products"     element={<AdminOnly><AdminLayout><AdminProductsPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/designs"      element={<AdminOnly><AdminLayout><AdminDesignsPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/users"        element={<AdminOnly><AdminLayout><AdminUsersPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/privacy"      element={<AdminOnly><AdminLayout><AdminPrivacyPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/about"        element={<AdminOnly><AdminLayout><AdminAboutPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/contact"      element={<AdminOnly><AdminLayout><AdminContactPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/designers"    element={<AdminOnly><AdminLayout><AdminDesignersPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/earnings"     element={<AdminOnly><AdminLayout><AdminEarningsPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/withdrawals"  element={<AdminOnly><AdminLayout><AdminWithdrawalsPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/shirt-config" element={<AdminOnly><AdminLayout><AdminShirtConfigPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/blog"         element={<AdminOnly><AdminLayout><AdminBlogPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/faq"          element={<AdminOnly><AdminLayout><AdminFAQPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/reviews"      element={<AdminOnly><AdminLayout><AdminReviewsPage /></AdminLayout></AdminOnly>} />
      <Route path="/admin/footer"       element={<AdminOnly><AdminLayout><AdminFooterPage /></AdminLayout></AdminOnly>} />

      {/* 404 */}
      <Route path="*" element={<NotFoundPage />} />
    </Routes>
    </AnimatePresence>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
