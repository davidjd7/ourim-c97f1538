import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { MainLayout } from "@/components/layout/MainLayout";
import Dashboard from "./pages/Dashboard";
import PipelineImmo from "./pages/PipelineImmo";
import PipelinePE from "./pages/PipelinePE";
import Investissements from "./pages/Investissements";
import Dettes from "./pages/Dettes";
import Parametres from "./pages/Parametres";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <MainLayout>
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/pipeline-immo" element={<PipelineImmo />} />
            <Route path="/pipeline-pe" element={<PipelinePE />} />
            <Route path="/investissements" element={<Investissements />} />
            <Route path="/dettes" element={<Dettes />} />
            <Route path="/parametres" element={<Parametres />} />
            {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </MainLayout>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
