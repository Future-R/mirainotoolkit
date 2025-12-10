import { LucideIcon } from 'lucide-react';

export interface Tool {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: LucideIcon;
  status: 'active' | 'coming_soon';
  isExternal?: boolean; // New flag for external links
}

export interface NavItem {
  label: string;
  path: string;
}