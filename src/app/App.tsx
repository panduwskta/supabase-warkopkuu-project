import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import writeExcelFile from 'write-excel-file/browser';
import { DESKTOP_COMING_SOON_ITEMS } from '../features/desktop';
import {
  checkoutCartLocal,
  createExpenseLocal,
  createMenuProduct,
  deleteExpenseLocal,
  deleteMenuProduct,
  ensureLocalV2Store,
  loadLocalV2AppData,
  updateMenuProduct,
} from '../features/local-app';
import { shareReceipt } from '../features/receipts/share-receipt';
import type { ReceiptData } from '../features/receipts/types';
import {
  Coffee,
  ShoppingCart,
  List,
  LayoutDashboard,
  Monitor,
  Plus,
  Trash2,
  Receipt,
  Search,
  UserCircle2,
  CheckCircle2,
  X,
  LogOut,
  Store,
  Download,
  FileText,
  Pencil,
  Package,
  WalletCards,
} from 'lucide-react';
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY || import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;
const supabase = SUPABASE_URL && SUPABASE_KEY ? createClient(SUPABASE_URL, SUPABASE_KEY) : null;
const LOCAL_KEY = 'warkopkuu_local_v1';

const uid = () => crypto.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`;
const now = () => Date.now();
const formatRp = (amount) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(
    Number(amount || 0)
  );
const formatDate = (timestamp) =>
  new Intl.DateTimeFormat('id-ID', { dateStyle: 'medium', timeStyle: 'short' }).format(new Date(timestamp));
const todayStart = () => new Date().setHours(0, 0, 0, 0);
const weekStart = () => { const d = new Date(); const day = d.getDay() || 7; d.setHours(0, 0, 0, 0); d.setDate(d.getDate() - day + 1); return d.getTime(); };
const monthStart = () => { const d = new Date(); return new Date(d.getFullYear(), d.getMonth(), 1).getTime(); };
const PERIODS = [
  ['today', 'Hari ini'],
  ['week', 'Minggu ini'],
  ['month', 'Bulan ini'],
  ['all', 'Semua'],
];
const periodStart = (period) => (period === 'today' ? todayStart() : period === 'week' ? weekStart() : period === 'month' ? monthStart() : 0);
const periodLabel = (period) => PERIODS.find(([id]) => id === period)?.[1] || 'Semua';
const receiptNo = (order) => order.items?.[0]?._receipt_no || `WRG-${String(order.id || order.timestamp).slice(0, 8).toUpperCase()}`;
const paidAmount = (order) => Number(order.items?.[0]?._paid_amount || 0);
const changeAmount = (order) => Number(order.items?.[0]?._change_amount || 0);
const receiptText = (order) => {
  const lines = [
    'Struk Warungin',
    `No: ${receiptNo(order)}`,
    `Waktu: ${formatDate(order.timestamp)}`,
    '',
    ...order.items.map((i) => `${i.qty}x ${i.name} — ${formatRp(i.price * i.qty)}`),
    '',
    `Total: ${formatRp(order.total)}`,
  ];
  if (paidAmount(order)) lines.push(`Dibayar: ${formatRp(paidAmount(order))}`, `Kembalian: ${formatRp(changeAmount(order))}`);
  lines.push('', 'Terima kasih 🙏');
  return lines.join('\n');
};
const safeJson = (v, fallback) => {
  try {
    return JSON.parse(v) ?? fallback;
  } catch {
    return fallback;
  }
};

const downloadBlob = (blob, filename) => {
  const a = document.createElement('a');
  const url = URL.createObjectURL(blob);
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
};

const orderItemCost = (item) => Number(item.hppSnapshot ?? item.hpp ?? item.cost ?? item.modal ?? 0) * Number(item.qty || item.quantity || 0);
const orderItemQty = (item) => Number(item.qty || item.quantity || 0);
const orderItemSubtotal = (item) => Number(item.subtotal ?? Number(item.price || 0) * orderItemQty(item));

function buildReportData({ orders, expenses, menu, period }) {
  const from = periodStart(period);
  const filteredOrders = orders.filter((order) => Number(order.timestamp || 0) >= from);
  const filteredExpenses = expenses.filter((item) => Number(item.timestamp || 0) >= from);
  const pendapatan = filteredOrders.reduce((sum, order) => sum + Number(order.total || 0), 0);
  const pengeluaran = filteredExpenses.reduce((sum, item) => sum + Number(item.amount || 0), 0);
  const modal = filteredOrders.reduce((sum, order) => sum + (order.items || []).reduce((itemSum, item) => itemSum + orderItemCost(item), 0), 0);
  const productMap = new Map();

  filteredOrders.forEach((order) => {
    (order.items || []).forEach((item) => {
      const key = item.id || item.name;
      const current = productMap.get(key) || { name: item.name, qty: 0, total: 0 };
      current.qty += orderItemQty(item);
      current.total += orderItemSubtotal(item);
      productMap.set(key, current);
    });
  });

  const topProducts = Array.from(productMap.values()).sort((a, b) => b.qty - a.qty || b.total - a.total).slice(0, 5);
  const lowStock = menu.filter((item) => item.stock != null && Number(item.stock) <= 5).sort((a, b) => Number(a.stock || 0) - Number(b.stock || 0)).slice(0, 6);

  return {
    period,
    periodLabel: periodLabel(period),
    generatedAt: new Date(),
    orders: filteredOrders,
    expenses: filteredExpenses,
    summary: {
      pendapatan,
      jumlahTransaksi: filteredOrders.length,
      pengeluaran,
      perkiraanLaba: pendapatan - modal - pengeluaran,
      modal,
    },
    topProducts,
    lowStock,
    recentOrders: filteredOrders.slice(0, 5),
  };
}

function exportReportCsv(report) {
  const rows = [
    ['Periode', report.periodLabel],
    ['Waktu unduh', formatDate(report.generatedAt.getTime())],
    [],
    ['Ringkasan'],
    ['Pendapatan', report.summary.pendapatan],
    ['Jumlah Transaksi', report.summary.jumlahTransaksi],
    ['Pengeluaran', report.summary.pengeluaran],
    ['Perkiraan Laba', report.summary.perkiraanLaba],
    [],
    ['Transaksi'],
    ['No Struk', 'Waktu', 'Item', 'Total'],
    ...report.orders.map((order) => [receiptNo(order), formatDate(order.timestamp), (order.items || []).map((item) => `${orderItemQty(item)}x ${item.name}`).join('; '), order.total]),
    [],
    ['Pengeluaran'],
    ['Waktu', 'Nama', 'Kategori', 'Nominal'],
    ...report.expenses.map((item) => [formatDate(item.timestamp), item.name, item.category, item.amount]),
  ];
  const csv = '\uFEFF' + rows.map((row) => row.map((value) => `"${String(value ?? '').replaceAll('"', '""')}"`).join(',')).join('\n');
  downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `laporan-warungin-${report.period}-${new Date().toISOString().slice(0, 10)}.csv`);
}

async function exportReportExcel(report, storeName) {
  const headerCell = (value) => ({ value, fontWeight: 'bold', backgroundColor: '#DCFCE7' });
  await writeExcelFile([
    {
      sheet: 'Ringkasan',
      data: [
    ['Warungin POS'],
    ['Nama usaha', storeName],
    ['Periode', report.periodLabel],
    ['Waktu unduh', formatDate(report.generatedAt.getTime())],
    [],
    [headerCell('Ringkasan'), headerCell('Nominal/Jumlah')],
    ['Pendapatan', report.summary.pendapatan],
    ['Jumlah Transaksi', report.summary.jumlahTransaksi],
    ['Pengeluaran', report.summary.pengeluaran],
    ['Perkiraan Laba', report.summary.perkiraanLaba],
      ],
      columns: [{ width: 28 }, { width: 20 }],
    },
    {
      sheet: 'Transaksi',
      data: [[headerCell('No Struk'), headerCell('Waktu'), headerCell('Item'), headerCell('Total'), headerCell('Dibayar'), headerCell('Kembalian')], ...report.orders.map((order) => [receiptNo(order), formatDate(order.timestamp), (order.items || []).map((item) => `${orderItemQty(item)}x ${item.name}`).join('; '), Number(order.total || 0), paidAmount(order), changeAmount(order)])],
      columns: [{ width: 20 }, { width: 24 }, { width: 44 }, { width: 16 }, { width: 16 }, { width: 16 }],
    },
    {
      sheet: 'Item Transaksi',
      data: [[headerCell('No Struk'), headerCell('Waktu'), headerCell('Menu'), headerCell('Jumlah'), headerCell('Harga'), headerCell('Total')], ...report.orders.flatMap((order) => (order.items || []).map((item) => [receiptNo(order), formatDate(order.timestamp), item.name, orderItemQty(item), Number(item.price || 0), orderItemSubtotal(item)]))],
      columns: [{ width: 20 }, { width: 24 }, { width: 28 }, { width: 12 }, { width: 16 }, { width: 16 }],
    },
    {
      sheet: 'Pengeluaran',
      data: [[headerCell('Waktu'), headerCell('Nama'), headerCell('Kategori'), headerCell('Nominal')], ...report.expenses.map((item) => [formatDate(item.timestamp), item.name, item.category, Number(item.amount || 0)])],
      columns: [{ width: 24 }, { width: 28 }, { width: 20 }, { width: 16 }],
    },
    {
      sheet: 'Stok Menipis',
      data: [[headerCell('Menu'), headerCell('Kategori'), headerCell('Stok'), headerCell('Harga')], ...report.lowStock.map((item) => [item.name, item.category, Number(item.stock || 0), Number(item.price || 0)])],
      columns: [{ width: 28 }, { width: 20 }, { width: 12 }, { width: 16 }],
    },
  ]).toFile(`laporan-warungin-${report.period}-${new Date().toISOString().slice(0, 10)}.xlsx`);
}

function exportReportPdf(report, storeName) {
  const doc = new jsPDF({ unit: 'pt', format: 'a4' });
  const margin = 40;
  doc.setTextColor(30, 41, 59);
  doc.setFontSize(18);
  doc.text('Laporan Warungin POS', margin, 44);
  doc.setFontSize(10);
  doc.setTextColor(100, 116, 139);
  doc.text(`${storeName} · ${report.periodLabel} · Diunduh ${formatDate(report.generatedAt.getTime())}`, margin, 62);
  autoTable(doc, {
    startY: 86,
    head: [['Ringkasan', 'Nilai']],
    body: [
      ['Pendapatan', formatRp(report.summary.pendapatan)],
      ['Jumlah Transaksi', `${report.summary.jumlahTransaksi} transaksi`],
      ['Pengeluaran', formatRp(report.summary.pengeluaran)],
      ['Perkiraan Laba', formatRp(report.summary.perkiraanLaba)],
    ],
    styles: { fontSize: 10 },
    headStyles: { fillColor: [5, 150, 105] },
    margin: { left: margin, right: margin },
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 22,
    head: [['Menu Terlaris', 'Terjual', 'Pendapatan']],
    body: report.topProducts.length ? report.topProducts.map((item) => [item.name, item.qty, formatRp(item.total)]) : [['Belum ada data', '-', '-']],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [245, 158, 11] },
    margin: { left: margin, right: margin },
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 22,
    head: [['Transaksi Terbaru', 'Waktu', 'Total']],
    body: report.recentOrders.length ? report.recentOrders.map((order) => [receiptNo(order), formatDate(order.timestamp), formatRp(order.total)]) : [['Belum ada transaksi', '-', '-']],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [30, 41, 59] },
    margin: { left: margin, right: margin },
  });
  autoTable(doc, {
    startY: (doc as any).lastAutoTable.finalY + 22,
    head: [['Pengeluaran', 'Kategori', 'Nominal']],
    body: report.expenses.slice(0, 8).length ? report.expenses.slice(0, 8).map((item) => [item.name, item.category, formatRp(item.amount)]) : [['Belum ada pengeluaran', '-', '-']],
    styles: { fontSize: 9 },
    headStyles: { fillColor: [220, 38, 38] },
    margin: { left: margin, right: margin },
  });
  const pageHeight = doc.internal.pageSize.getHeight();
  doc.setFontSize(9);
  doc.setTextColor(148, 163, 184);
  doc.text('Built by Takis Agency · Crafted by Pandu W Aji', margin, pageHeight - 28);
  doc.save(`laporan-warungin-${report.period}-${new Date().toISOString().slice(0, 10)}.pdf`);
}

const NAV_ITEMS = [
  ['dashboard', 'Dashboard', LayoutDashboard],
  ['kasir', 'Kasir', ShoppingCart],
  ['menu', 'Menu', List],
  ['pesanan', 'Pesanan', Receipt],
  ['pengeluaran', 'Biaya', WalletCards],
];

function readLocal() {
  return safeJson(localStorage.getItem(LOCAL_KEY), { accounts: [], sessions: {}, menu: [], orders: [], expenses: [] });
}
function writeLocal(db) {
  localStorage.setItem(LOCAL_KEY, JSON.stringify(db));
  window.dispatchEvent(new Event('warkop-local-change'));
}
async function hashPassword(password, salt) {
  const enc = new TextEncoder();
  const buf = await crypto.subtle.digest('SHA-256', enc.encode(`${salt}:${password}`));
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, '0'))
    .join('');
}

function useAuth() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (supabase) {
      const {
        data: { subscription },
      } = supabase.auth.onAuthStateChange((_e, session) => {
        setUser(session?.user ?? null);
        setLoading(false);
      });
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user ?? null);
        setLoading(false);
      });
      return () => subscription.unsubscribe();
    }
    const sid = localStorage.getItem('warkop_session');
    const db = readLocal();
    setUser(sid ? db.accounts.find((a) => a.id === sid) ?? null : null);
    setLoading(false);
    const on = () => {
      const s = localStorage.getItem('warkop_session');
      const d = readLocal();
      setUser(s ? d.accounts.find((a) => a.id === s) ?? null : null);
    };
    window.addEventListener('storage', on);
    window.addEventListener('warkop-local-change', on);
    return () => {
      window.removeEventListener('storage', on);
      window.removeEventListener('warkop-local-change', on);
    };
  }, []);
  const signUp = async ({ name, email, password }) => {
    if (supabase) {
      const { error } = await supabase.auth.signUp({ email, password, options: { data: { name } } });
      if (error) throw error;
      return;
    }
    const db = readLocal();
    if (db.accounts.some((a) => a.email.toLowerCase() === email.toLowerCase())) throw new Error('Email sudah terdaftar.');
    const salt = uid();
    const passHash = await hashPassword(password, salt);
    const account = { id: uid(), name, email, salt, passHash, created_at: now() };
    db.accounts.push(account);
    writeLocal(db);
    localStorage.setItem('warkop_session', account.id);
    window.dispatchEvent(new Event('warkop-local-change'));
  };
  const signIn = async ({ email, password }) => {
    if (supabase) {
      const { error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      return;
    }
    const db = readLocal();
    const account = db.accounts.find((a) => a.email.toLowerCase() === email.toLowerCase());
    if (!account) throw new Error('Email atau password salah.');
    const passHash = await hashPassword(password, account.salt);
    if (passHash !== account.passHash) throw new Error('Email atau password salah.');
    localStorage.setItem('warkop_session', account.id);
    window.dispatchEvent(new Event('warkop-local-change'));
  };
  const signOut = async () => {
    if (supabase) await supabase.auth.signOut();
    localStorage.removeItem('warkop_session');
    window.dispatchEvent(new Event('warkop-local-change'));
  };
  return { user, loading, signUp, signIn, signOut, mode: supabase ? 'cloud' : 'local' };
}

function useStore(user) {
  const [menu, setMenu] = useState([]);
  const [orders, setOrders] = useState([]);
  const [expenses, setExpenses] = useState([]);
  const [localStore, setLocalStore] = useState(null);
  const [syncSummary, setSyncSummary] = useState({ pending: 0, syncing: 0, failed: 0, conflict: 0 });
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  const refresh = useCallback(async () => {
    if (!userId) return;
    const store = localStore ?? (await ensureLocalV2Store(user));
    const data = await loadLocalV2AppData(store.localId);
    setLocalStore(store);
    setMenu(data.menu);
    setOrders(data.orders);
    setExpenses(data.expenses);
    setSyncSummary(data.syncSummary);
    setLoading(false);
  }, [localStore, user, userId]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    refresh().catch(() => setLoading(false));
  }, [userId, refresh]);

  const addMenu = async (item) => {
    if (!localStore) throw new Error('Local store belum siap.');
    await createMenuProduct(localStore.localId, item);
    await refresh();
  };

  const updateMenu = async (id, item) => {
    await updateMenuProduct(id, item);
    await refresh();
  };

  const deleteMenu = async (id) => {
    await deleteMenuProduct(id);
    await refresh();
  };

  const checkoutCart = async (cart, paymentAmount) => {
    if (!localStore) throw new Error('Local store belum siap.');
    await checkoutCartLocal(localStore, cart, paymentAmount);
    await refresh();
  };

  const addExpense = async (exp) => {
    if (!localStore) throw new Error('Local store belum siap.');
    await createExpenseLocal(localStore.localId, exp);
    await refresh();
  };

  const deleteExpense = async (id) => {
    await deleteExpenseLocal(id);
    await refresh();
  };

  return { menu, orders, expenses, loading, localStore, syncSummary, addMenu, updateMenu, deleteMenu, checkoutCart, addExpense, deleteExpense, refresh };
}

function AuthScreen({ auth }) {
  const authMode = new URLSearchParams(window.location.search).get('mode');
  const [mode, setMode] = useState(authMode === 'register' ? 'register' : 'login');
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);
  const submit = async (e) => {
    e.preventDefault();
    setBusy(true);
    setErr('');
    try {
      if (mode === 'register') await auth.signUp(form);
      else await auth.signIn(form);
    } catch (x) {
      setErr(x.message || 'Gagal masuk.');
    } finally {
      setBusy(false);
    }
  };
  return (
    <div className="auth">
      <div className="auth-card">
        <div className="brand">
          <div className="brand-icon"><Coffee /></div>
          <div>
            <h1>Warung<span>in</span></h1>
            <p>Kasir warung UMKM Indonesia</p>
          </div>
        </div>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Masuk</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Daftar</button>
        </div>
        <form onSubmit={submit} className="form">
          {mode === 'register' && <label>Nama Usaha / Owner<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Warung Pak Budi" /></label>}
          <label>Email<input type="email" required value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="nama@email.com" /></label>
          <label>Password<input type="password" required minLength="6" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Minimal 6 karakter" /></label>
          {err && <div className="error">{err}</div>}
          <button disabled={busy} className="primary">{busy ? 'Memproses...' : mode === 'login' ? 'Masuk ke Dashboard' : 'Buat Akun'}</button>
        </form>
        <p className="muted small">Mode penyimpanan: <b>{auth.mode === 'cloud' ? 'Cloud database/auth' : 'Akun lokal browser'}</b></p>
        <Credit />
      </div>
    </div>
  );
}

function PublicLanding() {
  const goToLogin = (mode = 'login') => {
    window.history.pushState({}, '', mode === 'register' ? '/login?mode=register' : '/login');
    window.dispatchEvent(new PopStateEvent('popstate'));
  };
  return <div className="landing-page"><header className="landing-header"><div className="side-brand landing-brand"><div className="brand-icon"><Coffee /></div><div><h1>Warung<span>in</span></h1><p>Kasir warung UMKM Indonesia</p></div></div><nav className="landing-actions"><button type="button" onClick={() => goToLogin('login')}>Masuk</button><button type="button" className="primary compact" onClick={() => goToLogin('register')}>Daftar</button></nav></header><main className="landing-main"><section className="landing-hero"><span className="hero-pill"><Monitor /> Portal resmi Warungin</span><h2>POS sederhana untuk warung yang mau operasionalnya lebih rapi.</h2><p>Warungin membantu pemilik warung mencatat penjualan, mengelola menu, memantau pengeluaran, dan mengunduh laporan usaha tanpa sistem yang ribet.</p><div className="landing-cta"><button type="button" className="primary" onClick={() => goToLogin('register')}>Mulai Daftar</button><button type="button" onClick={() => goToLogin('login')}>Masuk ke App</button></div></section><section className="landing-feature-grid"><div><Receipt /><b>Kasir Harian</b><small>Catat pesanan, pembayaran, kembalian, dan riwayat transaksi.</small></div><div><List /><b>Menu & Stok</b><small>Kelola menu utama dan pantau stok dasar untuk operasional harian.</small></div><div><LayoutDashboard /><b>Laporan Basic</b><small>Lihat pendapatan, transaksi, pengeluaran, laba perkiraan, dan menu terlaris.</small></div><div><Download /><b>Export Laporan</b><small>Unduh laporan Excel/PDF untuk rekap usaha sederhana.</small></div></section></main><footer className="landing-footer"><Credit /></footer></div>;
}

function App() {
  const auth = useAuth();
  const store = useStore(auth.user);
  const [active, setActive] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [newMenu, setNewMenu] = useState({ name: '', price: '', hpp: '', category: 'Minuman', stock: '' });
  const [edit, setEdit] = useState(null);
  const [expense, setExpense] = useState({ name: '', amount: '', category: 'Belanja Bahan' });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('today');
  const [, setPathname] = useState(window.location.pathname);
  const show = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };

  useEffect(() => {
    const updatePath = () => setPathname(window.location.pathname);
    window.addEventListener('popstate', updatePath);
    return () => window.removeEventListener('popstate', updatePath);
  }, []);

  if (auth.loading) return <Splash />;
  if (!auth.user && window.location.pathname === '/') return <PublicLanding />;
  if (!auth.user) return <AuthScreen auth={auth} />;

  const report = buildReportData({ orders: store.orders, expenses: store.expenses, menu: store.menu, period: reportPeriod });
  const addToCart = (item) => setCart((prev) => {
    const existingQty = prev.find((i) => i.id === item.id)?.qty || 0;
    if (item.stock != null && existingQty + 1 > Number(item.stock)) {
      show(`Stok ${item.name} tidak cukup`, 'error');
      return prev;
    }
    const ex = prev.find((i) => i.id === item.id);
    return ex ? prev.map((i) => (i.id === item.id ? { ...i, qty: i.qty + 1 } : i)) : [...prev, { ...item, qty: 1 }];
  });
  const updateCartQty = (id, delta) => setCart((prev) => prev.map((item) => {
    if (item.id !== id) return item;
    const nextQty = Math.max(1, item.qty + delta);
    if (item.stock != null && nextQty > Number(item.stock)) {
      show(`Stok ${item.name} hanya ${item.stock}`, 'error');
      return item;
    }
    return { ...item, qty: nextQty };
  }));
  const cartTotal = cart.reduce((s, i) => s + i.price * i.qty, 0);
  const validateStock = () => {
    const stockIssue = cart.find((cartItem) => {
      const latest = store.menu.find((menuItem) => menuItem.id === cartItem.id);
      return latest?.stock != null && cartItem.qty > Number(latest.stock);
    });
    if (stockIssue) {
      const latest = store.menu.find((menuItem) => menuItem.id === stockIssue.id);
      show(`Stok ${stockIssue.name} tidak cukup. Sisa ${latest?.stock ?? 0}`, 'error');
      return false;
    }
    return true;
  };
  const checkout = () => {
    if (!cart.length) return;
    if (!validateStock()) return;
    setCheckoutOpen(true);
  };
  const processCheckout = async (paid) => {
    if (!cart.length) return;
    if (!validateStock()) return;
    const paidNumber = Number(paid || 0);
    if (paidNumber < cartTotal) {
      show('Uang diterima kurang dari total belanja', 'error');
      return;
    }
    try {
      await store.checkoutCart(cart, paidNumber);
      setCart([]);
      setCheckoutOpen(false);
      show('Pesanan tersimpan di perangkat & menunggu sync cloud.');
    } catch (e) { show(e.message, 'error'); }
  };
  const addMenu = async (e) => {
    e.preventDefault();
    if (!newMenu.name || !newMenu.price) return show('Nama dan harga wajib diisi', 'error');
    try {
      await store.addMenu({ name: newMenu.name.trim(), price: Number(newMenu.price), hpp: Number(newMenu.hpp || 0), category: newMenu.category, stock: newMenu.stock ? Number(newMenu.stock) : 0 });
      setNewMenu({ name: '', price: '', hpp: '', category: 'Minuman', stock: '' });
      store.refresh();
      show('Menu berhasil ditambahkan');
    } catch (x) { show(x.message, 'error'); }
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await store.updateMenu(edit.id, { name: edit.name, price: Number(edit.price), hpp: Number(edit.hpp || 0), category: edit.category, stock: edit.stock === '' ? 0 : Number(edit.stock) });
      setEdit(null);
      store.refresh();
      show('Menu diperbarui');
    } catch (x) { show(x.message, 'error'); }
  };
  const addExpense = async (e) => {
    e.preventDefault();
    if (!expense.name || !expense.amount) return show('Nama dan nominal pengeluaran wajib diisi', 'error');
    try {
      await store.addExpense({ name: expense.name, amount: Number(expense.amount), category: expense.category, timestamp: now() });
      setExpense({ name: '', amount: '', category: 'Belanja Bahan' });
      store.refresh();
      show('Pengeluaran dicatat');
    } catch (x) { show(x.message, 'error'); }
  };
  const currentStoreName = store.localStore?.name || auth.user.user_metadata?.name || auth.user.name || 'Warungin';
  const orderToReceiptData = (order): ReceiptData => ({
    transactionLocalId: String(order.id || order.timestamp),
    storeName: currentStoreName,
    receiptNumber: receiptNo(order),
    transactionDate: new Date(order.timestamp),
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      quantity: Number(item.qty || 0),
      price: Number(item.price || 0),
      subtotal: Number(item.price || 0) * Number(item.qty || 0),
    })),
    total: Number(order.total || 0),
    paymentAmount: paidAmount(order) || undefined,
    changeAmount: changeAmount(order),
    footer: 'Terima kasih sudah berbelanja 🙏',
  });
  const handleShareOrder = async (order) => {
    try {
      const result = await shareReceipt(orderToReceiptData(order));
      if (result.mode === 'cancelled') return;
      show(result.mode === 'native-share' ? 'Struk PNG siap dibagikan' : 'Struk PNG diunduh dan teks share disiapkan');
    } catch (error) {
      show(error instanceof Error ? error.message : 'Gagal membuat struk PNG', 'error');
    }
  };
  const exportCsv = (ordersToExport = store.orders) => {
    const rows = [['waktu', 'items', 'total'], ...ordersToExport.map((o) => [formatDate(o.timestamp), o.items.map((i) => `${i.qty}x ${i.name}`).join('; '), o.total])];
    const csv = '\uFEFF' + rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    downloadBlob(new Blob([csv], { type: 'text/csv;charset=utf-8' }), `transaksi-warungin-${new Date().toISOString().slice(0, 10)}.csv`);
  };
  const activeLabel = active === 'desktop' ? 'Desktop' : NAV_ITEMS.find((n) => n[0] === active)?.[1];
  const salesCount = store.orders.reduce((acc, order) => {
    order.items.forEach((item) => { acc[item.id] = (acc[item.id] || 0) + item.qty; });
    return acc;
  }, {});
  const bestSellingIds = Object.entries(salesCount).sort((a, b) => Number(b[1]) - Number(a[1])).slice(0, 5).map(([id]) => id);

  return (
    <div className="app">
      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'error' ? <X /> : <CheckCircle2 />} {toast.message}</div>}
      <MobileTopBar activeLabel={activeLabel} user={auth.user} />
      <aside>
        <div className="side-brand"><div className="brand-icon"><Coffee /></div><div><h1>Warung<span>in</span></h1><p>Sistem Manajemen</p></div></div>
        <nav>{NAV_ITEMS.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={active === id ? 'active' : ''}><Icon /> <span>{label}</span></button>)}<button className={active === 'desktop' ? 'active desktop-only-nav' : 'desktop-only-nav'} onClick={() => setActive('desktop')}><Monitor /> <span>Desktop</span></button></nav>
        <div className="userbox"><UserCircle2 /><div><b>{auth.user.user_metadata?.name || auth.user.name || auth.user.email}</b><small>{auth.mode === 'cloud' ? 'Cloud account' : 'Local account'}</small></div></div>
        <Credit compact />
        <button className="logout" onClick={auth.signOut}><LogOut /> Logout</button>
      </aside>
      <main>
        <header><div><h2>{activeLabel}</h2><p>Kelola penjualan, menu, pesanan, dan pengeluaran warung/kedai.</p></div><div className="header-pills"><span className="pill"><Store /> {auth.user.email}</span><SyncStatusPill summary={store.syncSummary} /></div></header>
        <div className="mobile-page-title"><h2>{activeLabel}</h2><p>Operasional kedai dari HP, cepat dan simpel.</p></div>
        {store.loading ? <Splash small /> : <>
          {active === 'dashboard' && <Dashboard report={report} period={reportPeriod} setPeriod={setReportPeriod} storeName={currentStoreName} onShareOrder={handleShareOrder} />}
          {active === 'kasir' && <Kasir menu={store.menu} bestSellingIds={bestSellingIds} cart={cart} setCart={setCart} updateCartQty={updateCartQty} addToCart={addToCart} search={search} setSearch={setSearch} cartTotal={cartTotal} checkout={checkout} setActive={setActive} />}
          {active === 'menu' && <Menu menu={store.menu} newMenu={newMenu} setNewMenu={setNewMenu} addMenu={addMenu} del={async (id) => { await store.deleteMenu(id); setCart((c) => c.filter((i) => i.id !== id)); store.refresh(); show('Menu dihapus'); }} setEdit={setEdit} />}
          {active === 'pesanan' && <Pesanan orders={store.orders} exportCsv={exportCsv} onShareOrder={handleShareOrder} />}
          {active === 'pengeluaran' && <Pengeluaran expenses={store.expenses} expense={expense} setExpense={setExpense} addExpense={addExpense} del={async (id) => { await store.deleteExpense(id); store.refresh(); show('Pengeluaran dihapus'); }} />}
          {active === 'desktop' && <DesktopDashboard report={report} period={reportPeriod} setPeriod={setReportPeriod} storeName={currentStoreName} userEmail={auth.user.email} />}
        </>}
        <div className="main-credit"><Credit /></div>
        {checkoutOpen && <CheckoutModal total={cartTotal} onClose={() => setCheckoutOpen(false)} onPay={processCheckout} />}
        {edit && <div className="modal" onClick={() => setEdit(null)}><form className="modal-card form" onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}><h3>Edit Menu</h3><label>Nama<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label><label>Harga<input type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></label><label>HPP / Modal<input type="number" min="0" value={edit.hpp ?? ''} onChange={(e) => setEdit({ ...edit, hpp: e.target.value })} /></label><label>Kategori<select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{['Minuman', 'Makanan', 'Cemilan', 'Paket'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Stok<input type="number" value={edit.stock ?? ''} onChange={(e) => setEdit({ ...edit, stock: e.target.value })} /></label><button className="primary">Simpan Perubahan</button></form></div>}
      </main>
      <MobileBottomNav active={active} setActive={setActive} />
    </div>
  );
}

function CheckoutModal({ total, onClose, onPay }) {
  const [paid, setPaid] = useState(total);
  const change = Math.max(0, Number(paid || 0) - total);
  return <div className="modal" onClick={onClose}><div className="modal-card checkout-sheet" onClick={(e) => e.stopPropagation()}><div className="modal-head"><h3>Pembayaran</h3><button onClick={onClose}><X /></button></div><div className="pay-summary"><span>Total Belanja</span><b>{formatRp(total)}</b></div><label className="pay-input">Uang diterima<input type="number" min={0} value={paid} onChange={(e) => setPaid(e.target.value)} autoFocus /></label><div className="pay-actions"><button type="button" onClick={() => setPaid(total)}>Bayar Pas</button><button type="button" onClick={() => setPaid(Math.ceil(total / 5000) * 5000)}>Bulat 5rb</button></div><div className="change-box"><span>Kembalian</span><b>{formatRp(change)}</b></div><button className="primary" disabled={Number(paid || 0) < total} onClick={() => onPay(paid)}><CheckCircle2 /> Konfirmasi Pembayaran</button></div></div>;
}
function MobileTopBar({ activeLabel, user }) { return <div className="mobile-top"><div className="brand-mini"><div className="brand-icon"><Coffee /></div><div><b>Warungin</b><small>{activeLabel}</small></div></div><div className="avatar-mini"><UserCircle2 /><span>{user?.email?.slice(0, 1)?.toUpperCase()}</span></div></div>; }
function MobileBottomNav({ active, setActive }) { return <div className="bottom-nav">{NAV_ITEMS.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={active === id ? 'active' : ''}><Icon /><span>{label}</span></button>)}</div>; }
function Credit({ compact = false }) { return <div className={compact ? 'credit compact' : 'credit'}>Built by <b>Takis Agency</b><span> · </span>Crafted by <b>Pandu W Aji</b></div>; }
function Splash({ small = false }) { return <div className={small ? 'splash small' : 'splash'}><Coffee /><p>Menyiapkan Kedai...</p></div>; }
function SyncStatusPill({ summary }) {
  const pending = Number(summary?.pending || 0);
  const syncing = Number(summary?.syncing || 0);
  const failed = Number(summary?.failed || 0);
  const conflict = Number(summary?.conflict || 0);
  const label = conflict ? `${conflict} konflik` : failed ? `${failed} gagal sync` : syncing ? `${syncing} syncing` : pending ? `${pending} menunggu sync` : 'Tersimpan lokal';
  const cls = conflict || failed ? 'danger' : pending || syncing ? 'pending' : 'local';
  return <span className={`pill sync-pill ${cls}`}>{label}</span>;
}
function Stat({ icon: Icon, label, value, cls = '' }) { return <div className="stat"><div className={`stat-icon ${cls}`}><Icon /></div><div><p>{label}</p><h3>{value}</h3></div></div>; }
function Dashboard({ report, period, setPeriod, storeName, onShareOrder }) {
  const exportActions = <div className="export-actions"><button onClick={() => exportReportCsv(report)}><Download /> CSV</button><button onClick={() => exportReportExcel(report, storeName)}><Download /> Excel</button><button onClick={() => exportReportPdf(report, storeName)}><FileText /> PDF</button></div>;
  return <section className="space"><div className="dashboard-title"><div><h2>Ringkasan {report.periodLabel}</h2><p>Pantau pendapatan, transaksi, pengeluaran, dan stok menipis.</p></div>{exportActions}</div><div className="period-chips report-filter">{PERIODS.map(([id, label]) => <button key={id} className={period === id ? 'active' : ''} onClick={() => setPeriod(id)}>{label}</button>)}</div><div className="stats"><Stat icon={Receipt} label="Pendapatan" value={formatRp(report.summary.pendapatan)} cls="green" /><Stat icon={ShoppingCart} label="Jumlah Transaksi" value={`${report.summary.jumlahTransaksi} trx`} cls="blue" /><Stat icon={WalletCards} label="Pengeluaran" value={formatRp(report.summary.pengeluaran)} cls="red" /><Stat icon={Package} label="Perkiraan Laba" value={formatRp(report.summary.perkiraanLaba)} cls="amber" /></div><div className="dashboard-grid"><Card title="Menu Terlaris">{report.topProducts.length ? <div className="simple-list">{report.topProducts.map((item) => <div key={item.name} className="simple-row"><div><b>{item.name}</b><small>{item.qty} terjual</small></div><strong>{formatRp(item.total)}</strong></div>)}</div> : <Empty text="Belum ada menu terjual pada periode ini." />}</Card><Card title="Stok Menipis">{report.lowStock.length ? <div className="simple-list">{report.lowStock.map((item) => <div key={item.id} className="simple-row"><div><b>{item.name}</b><small>{item.category || 'Menu'} · sisa {item.stock}</small></div><span className="badge danger-badge">Perlu dicek</span></div>)}</div> : <Empty text="Tidak ada stok menipis." />}</Card></div><Card title="Transaksi Terbaru">{report.recentOrders.length ? <div className="mobile-card-list always">{report.recentOrders.map((o) => <React.Fragment key={o.id}><OrderCard order={o} onShareOrder={onShareOrder} /></React.Fragment>)}</div> : <Empty text="Belum ada transaksi pada periode ini." />}</Card></section>;
}
function DesktopDashboard({ report, period, setPeriod, storeName, userEmail }) {
  return <section className="desktop-dashboard space"><div className="desktop-hero-card"><div><span className="hero-pill"><Monitor /> Dashboard desktop</span><h2>{storeName}</h2><p>Lihat ringkasan usaha, cek performa periode berjalan, dan unduh laporan dari layar besar.</p><small>{userEmail}</small></div><div className="desktop-export-box"><span>Unduh Laporan</span><button onClick={() => exportReportExcel(report, storeName)}><Download /> Excel</button><button onClick={() => exportReportPdf(report, storeName)}><FileText /> PDF</button></div></div><div className="period-chips report-filter">{PERIODS.map(([id, label]) => <button key={id} className={period === id ? 'active' : ''} onClick={() => setPeriod(id)}>{label}</button>)}</div><div className="stats desktop-stats"><Stat icon={Receipt} label="Pendapatan" value={formatRp(report.summary.pendapatan)} cls="green" /><Stat icon={ShoppingCart} label="Jumlah Transaksi" value={`${report.summary.jumlahTransaksi} trx`} cls="blue" /><Stat icon={WalletCards} label="Pengeluaran" value={formatRp(report.summary.pengeluaran)} cls="red" /><Stat icon={Package} label="Perkiraan Laba" value={formatRp(report.summary.perkiraanLaba)} cls="amber" /></div><div className="dashboard-grid"><Card title="Menu Terlaris">{report.topProducts.length ? <div className="simple-list">{report.topProducts.map((item) => <div key={item.name} className="simple-row"><div><b>{item.name}</b><small>{item.qty} terjual</small></div><strong>{formatRp(item.total)}</strong></div>)}</div> : <Empty text="Belum ada menu terjual pada periode ini." />}</Card><Card title={`Ringkasan ${report.periodLabel}`}>{report.recentOrders.length ? <div className="desktop-report-table"><table><thead><tr><th>No Struk</th><th>Waktu</th><th className="right">Total</th></tr></thead><tbody>{report.recentOrders.map((order) => <tr key={order.id}><td><b>{receiptNo(order)}</b></td><td>{formatDate(order.timestamp)}</td><td className="right">{formatRp(order.total)}</td></tr>)}</tbody></table></div> : <Empty text="Belum ada transaksi pada periode ini." />}</Card></div><Card title="Modul Desktop Berikutnya"><div className="coming-soon-grid">{DESKTOP_COMING_SOON_ITEMS.map(({ id, label, description, icon: Icon }) => <div className="coming-soon-card" key={id}><Icon /><div><b>{label}</b><small>{description}</small></div><span>Coming Soon</span></div>)}</div></Card></section>;
}
function Kasir({ menu, bestSellingIds, cart, setCart, updateCartQty, addToCart, search, setSearch, cartTotal, checkout, setActive }) {
  const [category, setCategory] = useState('Semua');
  const categories = useMemo(() => ['Semua', ...Array.from(new Set(menu.map((i) => i.category).filter(Boolean)))], [menu]);
  const filtered = menu.filter((i) => (category === 'Semua' || i.category === category) && i.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (bestSellingIds.includes(b.id) ? 1 : 0) - (bestSellingIds.includes(a.id) ? 1 : 0));
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  return <div className="kasir"><div className="menu-grid-wrap"><div className="search"><Search /><input placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="category-chips">{categories.map((c) => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>{!menu.length ? <Empty text="Menu masih kosong." action="Tambah menu sekarang" onClick={() => setActive('menu')} /> : <div className="menu-grid">{filtered.map((item) => <button key={item.id} onClick={() => addToCart(item)} className="menu-card"><small>{item.category}{bestSellingIds.includes(item.id) ? ' · Terlaris' : ''}</small><b>{item.name}</b><span>{formatRp(item.price)}</span>{item.stock != null && <em>Stok: {item.stock}</em>}</button>)}</div>}</div><div className="cart"><h3><ShoppingCart /> Pesanan Saat Ini {totalQty ? <span>{totalQty} item</span> : null}</h3><div className="cart-list">{cart.length ? cart.map((item) => <div className="cart-item" key={item.id}><div><b>{item.name}</b><small>{formatRp(item.price)}</small></div><div className="qty"><button onClick={() => updateCartQty(item.id, -1)}>-</button><span>{item.qty}</span><button onClick={() => updateCartQty(item.id, 1)}>+</button><button className="danger" onClick={() => setCart((c) => c.filter((x) => x.id !== item.id))}><Trash2 /></button></div></div>) : <Empty text="Belum ada pesanan" />}</div><div className="cart-total"><span>Total</span><b>{formatRp(cartTotal)}</b><button disabled={!cart.length} onClick={checkout}><CheckCircle2 /> Proses Pembayaran</button></div></div></div>;
}
function Menu({ menu, newMenu, setNewMenu, addMenu, del, setEdit }) {
  const [addOpen, setAddOpen] = useState(false);
  const form = <form onSubmit={(e) => { addMenu(e); setAddOpen(false); }} className="grid-form"><label>Nama Menu<input value={newMenu.name} onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })} placeholder="Kopi Hitam" /></label><label>Harga (Rp)<input type="number" min="0" value={newMenu.price} onChange={(e) => setNewMenu({ ...newMenu, price: e.target.value })} placeholder="5000" /></label><label>HPP / Modal<input type="number" min="0" value={newMenu.hpp} onChange={(e) => setNewMenu({ ...newMenu, hpp: e.target.value })} placeholder="Opsional" /></label><label>Kategori<select value={newMenu.category} onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value })}>{['Minuman', 'Makanan', 'Cemilan', 'Paket'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Stok<input type="number" min="0" value={newMenu.stock} onChange={(e) => setNewMenu({ ...newMenu, stock: e.target.value })} placeholder="0" /></label><button className="dark"><Plus /> Simpan</button></form>;
  return <section className="space"><div className="add-menu-card"><Card title="Tambah Menu Baru">{form}</Card></div><button className="fab-menu" onClick={() => setAddOpen(true)}><Plus /> Menu</button>{addOpen && <div className="modal" onClick={() => setAddOpen(false)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><div className="modal-head"><h3>Tambah Menu Baru</h3><button onClick={() => setAddOpen(false)}><X /></button></div>{form}</div></div>}<Card title={`Daftar Menu (${menu.length})`}>{menu.length ? <><div className="menu-list-mobile">{menu.map((i) => <div className="list-card" key={i.id}><div><b>{i.name}</b><small>{i.category} · {formatRp(i.price)} · HPP {formatRp(i.hpp || 0)} · Stok {i.stock ?? 0}</small></div><div><button onClick={() => setEdit(i)}><Pencil /></button><button className="danger" onClick={() => del(i.id)}><Trash2 /></button></div></div>)}</div><table className="desktop-table"><thead><tr><th>Nama</th><th>Kategori</th><th>Harga</th><th>HPP</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>{menu.map((i) => <tr key={i.id}><td><b>{i.name}</b></td><td><span className="badge">{i.category}</span></td><td>{formatRp(i.price)}</td><td>{formatRp(i.hpp || 0)}</td><td>{i.stock ?? 0}</td><td><button onClick={() => setEdit(i)}><Pencil /></button><button className="danger" onClick={() => del(i.id)}><Trash2 /></button></td></tr>)}</tbody></table></> : <Empty text="Belum ada data menu." />}</Card></section>;
}
function Pesanan({ orders, exportCsv, onShareOrder }) {
  const [period, setPeriod] = useState('all');
  const minTime = period === 'today' ? todayStart() : period === 'week' ? weekStart() : period === 'month' ? monthStart() : 0;
  const filtered = orders.filter((o) => o.timestamp >= minTime);
  return <Card title="Riwayat Transaksi" action={<button onClick={() => exportCsv(filtered)}><Download /> CSV</button>}><div className="period-chips">{[['all', 'Semua'], ['today', 'Hari ini'], ['week', 'Minggu ini'], ['month', 'Bulan ini']].map(([id, label]) => <button key={id} className={period === id ? 'active' : ''} onClick={() => setPeriod(id)}>{label}</button>)}</div>{filtered.length ? <><div className="mobile-card-list">{filtered.map((o) => <React.Fragment key={o.id}><OrderCard order={o} onShareOrder={onShareOrder} /></React.Fragment>)}</div><table className="desktop-table"><thead><tr><th>No</th><th>Waktu</th><th>Detail Pesanan</th><th className="right">Total</th><th>Aksi</th></tr></thead><tbody>{filtered.map((o) => <tr key={o.id}><td><b>{receiptNo(o)}</b></td><td>{formatDate(o.timestamp)}</td><td>{o.items.map((i, idx) => <span className="chip" key={idx}>{i.qty}x {i.name}</span>)}</td><td className="right"><b>{formatRp(o.total)}</b></td><td><button className="share-link" type="button" onClick={() => onShareOrder(o)}>Share PNG</button></td></tr>)}</tbody></table></> : <Empty text="Belum ada transaksi pada periode ini." />}</Card>;
}
function Pengeluaran({ expenses, expense, setExpense, addExpense, del }) { return <section className="space"><Card title="Catat Pengeluaran"><form onSubmit={addExpense} className="grid-form"><label>Nama Pengeluaran<input value={expense.name} onChange={(e) => setExpense({ ...expense, name: e.target.value })} placeholder="Belanja kopi / gula" /></label><label>Nominal<input type="number" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} /></label><label>Kategori<select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>{['Belanja Bahan', 'Operasional', 'Gaji', 'Sewa', 'Lainnya'].map((x) => <option key={x}>{x}</option>)}</select></label><button className="dark">Simpan</button></form></Card><Card title="Riwayat Pengeluaran">{expenses.length ? <div className="mobile-card-list always">{expenses.map((e) => <div className="order-card" key={e.id}><div><b>{e.name}</b><small>{formatDate(e.timestamp)}</small><span className="badge">{e.category}</span></div><div className="order-total"><b>{formatRp(e.amount)}</b><button className="danger" onClick={() => del(e.id)}><Trash2 /></button></div></div>)}</div> : <Empty text="Belum ada pengeluaran." />}</Card></section>; }
function OrderCard({ order, onShareOrder }) { return <div className="order-card"><div><b>{receiptNo(order)}</b><small>{formatDate(order.timestamp)}</small><small>{order.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</small>{paidAmount(order) ? <small>Dibayar {formatRp(paidAmount(order))} · Kembali {formatRp(changeAmount(order))}</small> : null}</div><div className="order-total"><b>{formatRp(order.total)}</b><button className="share-link" type="button" onClick={() => onShareOrder(order)}>Share PNG</button></div></div>; }
function Card({ title, children, action = null }) { return <div className="card"><div className="card-head"><h3>{title}</h3>{action}</div>{children}</div>; }
function Empty({ text, action = null, onClick = undefined }) { return <div className="empty"><Coffee /><p>{text}</p>{action && <button onClick={onClick}>{action}</button>}</div>; }
export default App;
