import { useLocation, Link } from "wouter";
import { useAuth } from "@/hooks/use-auth";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
} from "@/components/ui/sidebar";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import {
  MessageSquare,
  Users,
  User,
  LogOut,
  Image as ImageIcon,
  BookOpen,
  Loader2,
  Bot,
} from "lucide-react";

const navItems = [
  { href: "/chats", icon: MessageSquare, label: "Chats" },
  { href: "/bot", icon: Bot, label: "Bot" },
  { href: "/scenarios", icon: BookOpen, label: "Scenarios" },
  { href: "/library", icon: ImageIcon, label: "Library" },
  { href: "/contacts", icon: Users, label: "Contacts" },
  { href: "/profile", icon: User, label: "Profile" },
];

export function AppSidebar() {
  const [location] = useLocation();
  const { user, logout, isLoggingOut } = useAuth();

  if (!user) return null;

  return (
    <Sidebar data-testid="nav-sidebar">
      <SidebarHeader className="px-3 py-4">
        <div className="flex items-center gap-2 px-1">
          <div className="w-7 h-7 rounded-md bg-primary flex items-center justify-center text-white font-bold text-xs shrink-0">
            R
          </div>
          <span className="font-semibold text-sm text-sidebar-foreground">RolePlayer</span>
        </div>
      </SidebarHeader>

      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navItems.map((item) => {
                const isActive = location === item.href || location.startsWith(item.href + "/");
                return (
                  <SidebarMenuItem key={item.href}>
                    <SidebarMenuButton asChild isActive={isActive} data-testid={`nav-${item.label.toLowerCase()}`}>
                      <Link href={item.href}>
                        <item.icon />
                        <span>{item.label}</span>
                      </Link>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>

      <SidebarFooter className="px-3 pb-3">
        <div className="flex items-center gap-2 px-1 py-1">
          <Avatar className="w-7 h-7">
            <AvatarImage src={(user as any)?.profileImageUrl || undefined} />
            <AvatarFallback className="text-xs">{(user as any)?.username?.charAt(0)?.toUpperCase() || "U"}</AvatarFallback>
          </Avatar>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-medium truncate text-sidebar-foreground">{(user as any)?.username || "User"}</p>
          </div>
          <button
            onClick={() => logout()}
            disabled={isLoggingOut}
            className="flex items-center justify-center w-7 h-7 rounded-md text-muted-foreground hover:text-destructive transition-colors"
            data-testid="button-logout"
          >
            {isLoggingOut ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LogOut className="w-3.5 h-3.5" />}
          </button>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
