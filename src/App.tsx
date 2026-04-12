import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/context/AuthContext";
import { BookProvider } from "@/context/BookContext";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index.tsx";
import Onboarding from "@/components/OnboardingScreens";
import HomePage from "./pages/HomePage.tsx";
import CreateBook from "./pages/CreateBook.tsx";
import Editor from "./pages/Editor.tsx";
import Basket from "./pages/Basket.tsx";
import Checkout from "./pages/Checkout.tsx";
import Creations from "./pages/Creations.tsx";
import Account from "./pages/Account.tsx";
import PrivacyPolicy from "./pages/PrivacyPolicy.tsx";
import NotFound from "./pages/NotFound.tsx";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <AuthProvider>
        <BookProvider>
          <BrowserRouter>
            <Routes>
              <Route path="/" element={<Index />} />
              <Route path="/onboarding" element={<Onboarding onComplete={() => window.location.replace('/home')} />} />
              <Route path="/home" element={<HomePage />} />
              <Route path="/create" element={<CreateBook />} />
              <Route path="/editor/:id" element={<Editor />} />
              <Route path="/basket" element={<Basket />} />
              <Route path="/checkout/:id" element={<Checkout />} />
              <Route path="/creations" element={<Creations />} />
              <Route path="/account" element={<Account />} />
              <Route path="/privacy" element={<PrivacyPolicy />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
            <BottomNav />
          </BrowserRouter>
        </BookProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
