import type { DefaultSampleData } from './types';

export function getDefaultSampleData(): DefaultSampleData {
  return {
    store: {
      name: 'Warung Contoh Pak Budi',
      businessType: 'warung',
      receiptPrefix: 'WRG',
      receiptFooter: 'Terima kasih sudah berbelanja 🙏',
      themeKey: 'warungin-default',
    },
    categories: [
      { key: 'minuman', name: 'Minuman', color: '#16a34a', icon: 'coffee', sortOrder: 1 },
      { key: 'makanan', name: 'Makanan', color: '#f59e0b', icon: 'utensils', sortOrder: 2 },
      { key: 'cemilan', name: 'Cemilan', color: '#f97316', icon: 'cookie', sortOrder: 3 },
      { key: 'paket', name: 'Paket Hemat', color: '#2563eb', icon: 'package', sortOrder: 4 },
    ],
    products: [
      { name: 'Kopi Hitam', categoryKey: 'minuman', price: 5000, hpp: 2200, stock: 40, unit: 'gelas', sku: 'MNM-KOPI-HITAM' },
      { name: 'Kopi Susu', categoryKey: 'minuman', price: 7000, hpp: 3500, stock: 35, unit: 'gelas', sku: 'MNM-KOPI-SUSU' },
      { name: 'Teh Manis', categoryKey: 'minuman', price: 4000, hpp: 1500, stock: 45, unit: 'gelas', sku: 'MNM-TEH-MANIS' },
      { name: 'Es Jeruk', categoryKey: 'minuman', price: 6000, hpp: 3000, stock: 25, unit: 'gelas', sku: 'MNM-ES-JERUK' },
      { name: 'Nasi Goreng', categoryKey: 'makanan', price: 15000, hpp: 8500, stock: 20, unit: 'porsi', sku: 'MKN-NASI-GORENG' },
      { name: 'Mie Goreng', categoryKey: 'makanan', price: 12000, hpp: 6500, stock: 25, unit: 'porsi', sku: 'MKN-MIE-GORENG' },
      { name: 'Telur Dadar', categoryKey: 'makanan', price: 5000, hpp: 2500, stock: 30, unit: 'porsi', sku: 'MKN-TELUR-DADAR' },
      { name: 'Pisang Goreng', categoryKey: 'cemilan', price: 8000, hpp: 4200, stock: 18, unit: 'porsi', sku: 'CML-PISANG-GORENG' },
      { name: 'Tempe Mendoan', categoryKey: 'cemilan', price: 7000, hpp: 0, stock: 22, unit: 'porsi', sku: 'CML-TEMPE-MENDOAN' },
      { name: 'Paket Kopi + Pisang', categoryKey: 'paket', price: 12000, hpp: 0, stock: 15, unit: 'paket', sku: 'PKT-KOPI-PISANG' },
    ],
    paymentMethods: [
      { name: 'Tunai', kind: 'cash', isDefault: true },
      { name: 'QRIS', kind: 'qris' },
      { name: 'Transfer Bank', kind: 'transfer' },
    ],
    expenseCategories: [
      { key: 'bahan', name: 'Belanja Bahan', color: '#16a34a', icon: 'shopping-bag', isDefault: true },
      { key: 'operasional', name: 'Operasional', color: '#2563eb', icon: 'settings' },
      { key: 'lainnya', name: 'Lainnya', color: '#64748b', icon: 'wallet' },
    ],
    expenses: [
      { title: 'Belanja kopi dan gula', categoryName: 'Belanja Bahan', amount: 85000, notes: 'Contoh pengeluaran bahan harian' },
      { title: 'Gas LPG', categoryName: 'Operasional', amount: 22000, notes: 'Contoh biaya operasional' },
      { title: 'Plastik dan tisu', categoryName: 'Lainnya', amount: 18000, notes: 'Contoh perlengkapan warung' },
    ],
  };
}
