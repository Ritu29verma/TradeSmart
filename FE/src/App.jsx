import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";
import Login from "@/pages/Login";
import Register from "@/pages/Register";
import VendorDashboard from "@/pages/VendorDashboard";
import BuyerDashboard from "@/pages/BuyerDashboard";
import AdminPanel from "@/pages/AdminPanel";
import Marketplace from "@/pages/Marketplace";
import ProductDetails from "@/pages/ProductDetails";
import AITools from "@/pages/AITools";
import Profile from "@/pages/Profile";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import PricingChart from "./components/PricingChart";
import { AuthManager } from "./lib/auth";

function Router() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navbar />
      <main className="flex-1">
        <Switch>
          <Route path="/" component={Home} />
          <Route path="/login" component={Login} />
          <Route path="/register" component={Register} />
          <Route path="/marketplace" component={Marketplace} />
          <Route path="/product/:id" component={ProductDetails} />
          <Route path="/vendor-dashboard" exact component={VendorDashboard} />
          <Route path="/vendor-dashboard/:id" component={VendorDashboard} />
          <Route path="/buyer-dashboard" exact component={BuyerDashboard} />
          <Route path="/buyer-dashboard/:id" component={BuyerDashboard} />
          <Route path="/admin-panel" component={AdminPanel} />
          <Route path="/ai-tools" component={AITools} />
          <Route path="/profile" component={Profile} />
          <Route path="/pricing-chart" component={PricingChart}/>
          <Route component={NotFound} />
        </Switch>
      </main>
      <Footer />
    </div>
  );
}

function App() {
  AuthManager.restore();
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <Toaster />
        <Router />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
