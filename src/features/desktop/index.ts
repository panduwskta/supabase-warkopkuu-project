import { BarChart3, Boxes, ClipboardList, Settings, Users } from 'lucide-react';

import type { DesktopComingSoonItem } from './types';

export const DESKTOP_COMING_SOON_ITEMS: DesktopComingSoonItem[] = [
  {
    id: 'stock',
    label: 'Stok & Inventori',
    description: 'Pantau stok lebih detail dari desktop setelah mobile stabil.',
    icon: Boxes,
  },
  {
    id: 'reports',
    label: 'Laporan Lanjutan',
    description: 'Ringkasan lebih lengkap tanpa menjadi report builder berat.',
    icon: BarChart3,
  },
  {
    id: 'team',
    label: 'Tim & Kasir',
    description: 'Akses owner/staff akan disiapkan setelah MVP single-user matang.',
    icon: Users,
  },
  {
    id: 'records',
    label: 'Catatan Operasional',
    description: 'Ruang kerja desktop untuk rekap usaha, bukan CRUD penuh dulu.',
    icon: ClipboardList,
  },
  {
    id: 'settings',
    label: 'Pengaturan Usaha',
    description: 'Profil usaha, preferensi struk, dan opsi lanjutan nanti.',
    icon: Settings,
  },
];

export type { DesktopComingSoonItem } from './types';
