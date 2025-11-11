import { NavLink } from "react-router-dom";
import { LayoutDashboard, Users, MapPin, BarChart3, Activity } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/admin", icon: LayoutDashboard },
  { title: "Students", url: "/admin/students", icon: Users },
  { title: "Check-ins", url: "/admin/check-ins", icon: Activity },
  { title: "Locations", url: "/admin/locations", icon: MapPin },
  { title: "Analytics", url: "/admin/analytics", icon: BarChart3 },
];

export function AdminSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className={open ? "w-60 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]" : "w-14 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm text-[hsl(var(--sidebar-foreground))]">Admin Portal</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {items.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink
                      to={item.url}
                      end
                      className={({ isActive }) =>
                        isActive
                          ? "bg-primary text-primary-foreground font-medium text-sm"
                          : "hover:bg-muted/50 text-[hsl(var(--sidebar-foreground))] text-sm"
                      }
                    >
                      <item.icon className="h-4 w-4 flex-shrink-0 text-[hsl(var(--sidebar-foreground))]" />
                      {open && <span className="truncate text-[hsl(var(--sidebar-foreground))]">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}
