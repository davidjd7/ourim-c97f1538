import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import { ProtectedRoute } from "@/components/layout/ProtectedRoute";
import Dashboard from "./pages/Dashboard";
import PipelineImmo from "./pages/PipelineImmo";
import PipelinePE from "./pages/PipelinePE";
import Investissements from "./pages/Investissements";
import InvestissementDetail from "./pages/InvestissementDetail";
import Dettes from "./pages/Dettes";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";
import Auth from "./pages/Auth";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          <Route path="/auth" element={<Auth />} />
          <Route path="/" element={
            <ProtectedRoute>
              <MainLayout>
                <Dashboard />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/pipeline-immo" element={
            <ProtectedRoute>
              <MainLayout>
                <PipelineImmo />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/pipeline-pe" element={
            <ProtectedRoute>
              <MainLayout>
                <PipelinePE />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/investissements" element={
            <ProtectedRoute>
              <MainLayout>
                <Investissements />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/investissement/:id" element={
            <ProtectedRoute>
              <MainLayout>
                <InvestissementDetail />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/dettes" element={
            <ProtectedRoute>
              <MainLayout>
                <Dettes />
              </MainLayout>
            </ProtectedRoute>
          } />
          <Route path="/parametres" element={
            <ProtectedRoute>
              <MainLayout>
                <Parametres />
              </MainLayout>
            </ProtectedRoute>
          } />
          {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
