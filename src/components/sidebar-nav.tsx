
"use client";
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Bot, FileText, LayoutDashboard, Leaf, Map, Settings, Building } from 'lucide-react';
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
  { href: '/dashboard', label: 'Diagnóstico', icon: LayoutDashboard },
  { href: '/dashboard/cities', label: 'Cidades', icon: Building },
  { href: '/dashboard/recommendations', label: 'Recomendações', icon: Map },
  { href: '/dashboard/plan-generator', label: 'Gerador de Planos', icon: FileText },
  { href: '/dashboard/assistant', label: 'Assistente IA', icon: Bot },
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
            <SidebarMenuButton asChild tooltip="Configurações">
              <Link href="#">
                <Settings />
                <span>Configurações</span>
              </Link>
            </SidebarMenuButton>
          </SidebarMenuItem>
        </SidebarMenu>
      </SidebarFooter>
    </Sidebar>
  );
}
