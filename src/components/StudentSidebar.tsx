import { NavLink } from "react-router-dom";
import { LayoutDashboard, User, MapPin, FileText, Calendar } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

const items = [
  { title: "Dashboard", url: "/student", icon: LayoutDashboard },
  { title: "Profile", url: "/student/profile", icon: User },
  { title: "Attendance", url: "/student/attendance", icon: Calendar },
  { title: "Location", url: "/student/location", icon: MapPin },
  { title: "Reports", url: "/student/reports", icon: FileText },
];

export function StudentSidebar() {
  const { open } = useSidebar();

  return (
    <Sidebar className={open ? "w-60 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]" : "w-14 bg-[hsl(var(--sidebar-background))] text-[hsl(var(--sidebar-foreground))]"} collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-xs sm:text-sm text-[hsl(var(--sidebar-foreground))]">Student Portal</SidebarGroupLabel>
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
