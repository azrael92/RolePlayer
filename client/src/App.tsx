import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";

import LandingPage from "@/pages/LandingPage";
import Chats from "@/pages/Chats";
import ChatDetail from "@/pages/ChatDetail";
import Scenarios from "@/pages/Scenarios";
import Library from "@/pages/Library";
import Contacts from "@/pages/Contacts";
import Profile from "@/pages/Profile";
import BotChat from "@/pages/BotChat";
import NotFound from "@/pages/not-found";
import { useAuth } from "@/hooks/use-auth";

function ProtectedRoute({ component: Component }: { component: React.ComponentType }) {
  const { isAuthenticated, isLoading } = useAuth();
  
  if (isLoading) return null;
  
  if (!isAuthenticated) {
    window.location.href = "/";
    return null;
  }
  
  return <Component />;
}

function AuthenticatedLayout() {
  const style = {
    "--sidebar-width": "15rem",
    "--sidebar-width-icon": "3rem",
  };

  return (
    <SidebarProvider style={style as React.CSSProperties}>
      <div className="flex h-screen w-full">
        <AppSidebar />
        <div className="flex flex-col flex-1 min-w-0">
          <Switch>
            <Route path="/chats"><ProtectedRoute component={Chats} /></Route>
            <Route path="/chats/:id"><ProtectedRoute component={ChatDetail} /></Route>
            <Route path="/scenarios"><ProtectedRoute component={Scenarios} /></Route>
            <Route path="/library"><ProtectedRoute component={Library} /></Route>
            <Route path="/contacts"><ProtectedRoute component={Contacts} /></Route>
            <Route path="/bot"><ProtectedRoute component={BotChat} /></Route>
            <Route path="/bot/:id"><ProtectedRoute component={BotChat} /></Route>
            <Route path="/profile"><ProtectedRoute component={Profile} /></Route>
            <Route component={NotFound} />
          </Switch>
        </div>
      </div>
    </SidebarProvider>
  );
}

function Router() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) return null;

  if (!isAuthenticated) {
    return (
      <Switch>
        <Route path="/" component={LandingPage} />
        <Route>{() => { window.location.href = "/"; return null; }}</Route>
      </Switch>
    );
  }

  return <AuthenticatedLayout />;
}

function App() {
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
