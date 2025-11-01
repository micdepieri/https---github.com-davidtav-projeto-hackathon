"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, LayoutDashboard, Leaf, Map, Settings } from 'lucide-react';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';

const menuItems = [
  { href: '/dashboard', label: 'Diagnostics', icon: LayoutDashboard },
  { href: '/dashboard/recommendations', label: 'Recommendations', icon: Map },
  { href: '/dashboard/plan-generator', label: 'Plan Generator', icon: FileText },
  { href: '/dashboard/assistant', label: 'AI Assistant', icon: Bot },
];

export function SidebarNav() {
  const pathname = usePathname();

  return (
    <Sidebar>
      <SidebarContent>
        <SidebarHeader>
          <Link href="/dashboard" className="flex items-center gap-2 px-2">
            <Leaf className="w-6 h-6 text-primary" />
            <span className="text-lg font-semibold">Cool Cities</span>
          </Link>
        </SidebarHeader>
        <SidebarMenu>
          {menuItems.map((item) => (
            <SidebarMenuItem key={item.href}>
              <SidebarMenuButton
                asChild
                tooltip={item.label}
                isActive={pathname === item.href || (item.href !== '/dashboard' && pathname.startsWith(item.href))}
              >
                <Link href={item.href}>
                  <item.icon />
                  <span>{item.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter>
         <SidebarMenu>
          <SidebarMenuItem>
            <SidebarMenuButton asChild tooltip="Settings">
              <Link href="#">
                <Settings />
                <span>Settings</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
