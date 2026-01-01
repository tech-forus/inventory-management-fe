import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { Menu } from 'lucide-react'
import Sidebar from './components/layout/Sidebar'
import { SidebarProvider, useSidebar } from './contexts/SidebarContext'
import AuthGate from './components/auth/AuthGate'

// Lazy load all components for code splitting and faster initial load
const LandingPage = lazy(() => import('./components/LandingPage'))
const RegistrationPage = lazy(() => import('./pages/RegistrationPage'))
const LoginPage = lazy(() => import('./pages/LoginPage'))
const SetPasswordPage = lazy(() => import('./pages/SetPasswordPage'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const SKUManagementPage = lazy(() => import('./pages/SKUManagementPage'))
const SKUCreatePage = lazy(() => import('./pages/SKUCreatePage'))
const SKUDetailPage = lazy(() => import('./pages/SKUDetailPage'))
const SKUMostSellingPage = lazy(() => import('./pages/SKUMostSellingPage'))
const SKUSlowMovingPage = lazy(() => import('./pages/SKUSlowMovingPage'))
const SKUNonMovablePage = lazy(() => import('./pages/SKUNonMovablePage'))
const InventoryPage = lazy(() => import('./pages/InventoryPage'))
const IncomingInventoryPage = lazy(() => import('./pages/IncomingInventoryPage'))
const OutgoingInventoryPage = lazy(() => import('./pages/OutgoingInventoryPage'))
const ItemHistoryPage = lazy(() => import('./pages/ItemHistoryPage'))
const InvoiceHistoryPage = lazy(() => import('./pages/InvoiceHistoryPage'))
const RejectedItemReportPage = lazy(() => import('./pages/RejectedItemReportPage'))
const ReportsPage = lazy(() => import('./pages/ReportsPage'))
const FinancePage = lazy(() => import('./pages/FinancePage'))
const LibraryPage = lazy(() => import('./pages/LibraryPage'))
const AddManageCategoriesPage = lazy(() => import('./pages/AddManageCategoriesPage'))
const SimpleCategoryEditPage = lazy(() => import('./pages/SimpleCategoryEditPage'))
const AccessControlPage = lazy(() => import('./pages/AccessControlPage'))
const InviteUserPage = lazy(() => import('./pages/InviteUserPage'))
const ProfilePage = lazy(() => import('./pages/ProfilePage'))
const SettingsPage = lazy(() => import('./pages/SettingsPage'))
const HelpSupportPage = lazy(() => import('./pages/HelpSupportPage'))
const NotAuthorizedPage = lazy(() => import('./pages/NotAuthorizedPage'))
const SystemTestPage = lazy(() => import('./pages/SystemTestPage'))

// Loading fallback component
const LoadingFallback = () => (
  <div className="flex items-center justify-center min-h-screen">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
)

// Layout component with Sidebar
const AppLayout = ({ children, hideDefaultHeader }: { children: React.ReactNode; hideDefaultHeader?: boolean }) => {
  const { isOpen, toggleSidebar } = useSidebar();
  
  return (
    <div className="flex h-screen bg-bg-light">
      <Sidebar />
      <div className={`flex-1 overflow-auto transition-all duration-300 ${isOpen ? 'ml-[216px]' : 'ml-0'} relative bg-bg-light`}>
        {/* Top Navigation Bar with Hamburger - Hidden if hideDefaultHeader is true */}
        {!hideDefaultHeader && (
          <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
            <div className="flex items-center justify-between px-4 py-3">
              {/* Hamburger Button - Always visible */}
            <button
              onClick={toggleSidebar}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200 flex items-center justify-center"
                aria-label={isOpen ? "Close sidebar" : "Open sidebar"}
            >
                <Menu className="w-5 h-5 text-gray-700" />
            </button>
              
              {/* Right side can be used for search, user menu, etc. */}
              <div className="flex items-center gap-3">
                {/* Placeholder for future elements like search, notifications, user menu */}
              </div>
            </div>
          </div>
        )}
        
        <div>
          {children}
        </div>
      </div>
    </div>
  )
}

function App() {
  return (
    <BrowserRouter>
      <SidebarProvider>
        <Suspense fallback={<LoadingFallback />}>
          <Routes>
          <Route path="/" element={<LandingPage />} />
          <Route path="/register" element={<RegistrationPage />} />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/set-password/:token" element={<SetPasswordPage />} />
          <Route path="/not-authorized" element={<NotAuthorizedPage />} />
          {/* Legacy dashboard route (no longer public): redirect to protected dashboard */}
          <Route path="/dashboard" element={<Navigate to="/app/dashboard" replace />} />
          {/* New app routes with sidebar */}
          <Route path="/app/dashboard" element={
            <AuthGate moduleKey="dashboard" action="view">
              <AppLayout hideDefaultHeader={true}>
                <Dashboard />
              </AppLayout>
            </AuthGate>
          } />
          {/* SKU Management Routes */}
          <Route path="/app/sku" element={
            <AuthGate moduleKey="sku" action="view">
              <AppLayout>
                <SKUManagementPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/sku/create" element={
            <AuthGate moduleKey="sku" action="create">
              <AppLayout>
                <SKUCreatePage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/sku/analytics/most-selling" element={
            <AuthGate moduleKey="reports" action="view">
              <AppLayout>
                <SKUMostSellingPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/sku/analytics/slow-moving" element={
            <AuthGate moduleKey="reports" action="view">
              <AppLayout>
                <SKUSlowMovingPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/sku/analytics/non-movable" element={
            <AuthGate moduleKey="reports" action="view">
              <AppLayout>
                <SKUNonMovablePage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/sku/:id" element={
            <AuthGate moduleKey="sku" action="view">
              <AppLayout>
                <SKUDetailPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Inventory Routes */}
          <Route path="/app/inventory" element={
            <AuthGate moduleKey="inventory" action="view">
              <AppLayout>
                <InventoryPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/inventory/incoming" element={
            <AuthGate moduleKey="inventory" action="view">
              <AppLayout>
                <IncomingInventoryPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/inventory/outgoing" element={
            <AuthGate moduleKey="inventory" action="view">
              <AppLayout>
                <OutgoingInventoryPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/inventory/:id/history" element={
            <AuthGate moduleKey="inventory" action="view">
              <AppLayout>
                <ItemHistoryPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/invoice/:invoiceNumber/:skuCode/history" element={
            <AuthGate moduleKey="inventory" action="view">
              <AppLayout>
                <InvoiceHistoryPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/rejected-items" element={
            <AuthGate moduleKey="inventory" action="view">
              <AppLayout>
                <RejectedItemReportPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Reports Route */}
          <Route path="/app/reports" element={
            <AuthGate moduleKey="reports" action="view">
              <AppLayout>
                <ReportsPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Finance Route */}
          <Route path="/app/finance" element={
            <AuthGate moduleKey="reports" action="view">
              <AppLayout>
                <FinancePage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Library Route */}
          <Route path="/app/library" element={
            <AuthGate moduleKey="library" action="view">
              <AppLayout>
                <LibraryPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/library/categories/manage" element={
            <AuthGate moduleKey="library" action="view">
              <AppLayout>
                <AddManageCategoriesPage />
              </AppLayout>
            </AuthGate>
          } />
          <Route path="/app/library/categories/edit/:id" element={
            <AuthGate moduleKey="library" action="view">
              <AppLayout>
                <SimpleCategoryEditPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Access Control Route */}
          <Route path="/app/access-control" element={
            <AuthGate moduleKey="accessControl" action="view">
              <AppLayout>
                <AccessControlPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Invite User Route */}
          <Route path="/app/invite-user" element={
            <AuthGate moduleKey="accessControl" action="create">
              <AppLayout>
                <InviteUserPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Profile Route */}
          <Route path="/app/profile" element={
            <AuthGate>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Settings Route */}
          <Route path="/app/settings" element={
            <AuthGate>
              <AppLayout>
                <SettingsPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* Help & Support Route */}
          <Route path="/app/help" element={
            <AuthGate>
              <AppLayout>
                <HelpSupportPage />
              </AppLayout>
            </AuthGate>
          } />
          {/* System Test Route */}
          <Route path="/app/system-test" element={
            <AuthGate>
              <AppLayout>
                <SystemTestPage />
              </AppLayout>
            </AuthGate>
          } />
        </Routes>
        </Suspense>
      </SidebarProvider>
    </BrowserRouter>
  )
}

export default App

