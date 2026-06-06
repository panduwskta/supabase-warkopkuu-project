import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { shareReceipt } from '../features/receipts/share-receipt';
import type { ReceiptData } from '../features/receipts/types';
import {
  Coffee,
  ShoppingCart,
  List,
  LayoutDashboard,
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
  const [loading, setLoading] = useState(true);
  const userId = user?.id;

  const loadLocal = useCallback(() => {
    const db = readLocal();
    setMenu(db.menu.filter((x) => x.user_id === userId).sort((a, b) => a.name.localeCompare(b.name)));
    setOrders(db.orders.filter((x) => x.user_id === userId).sort((a, b) => b.timestamp - a.timestamp));
    setExpenses(db.expenses.filter((x) => x.user_id === userId).sort((a, b) => b.timestamp - a.timestamp));
    setLoading(false);
  }, [userId]);

  const loadCloud = useCallback(async () => {
    if (!supabase || !userId) return;
    const [m, o, e] = await Promise.all([
      supabase.from('menu_items').select('*').order('name'),
      supabase.from('orders').select('*').order('timestamp', { ascending: false }),
      supabase.from('expenses').select('*').order('timestamp', { ascending: false }),
    ]);
    if (m.error) throw m.error;
    if (o.error) throw o.error;
    if (e.error) throw e.error;
    setMenu(m.data || []);
    setOrders(o.data || []);
    setExpenses(e.data || []);
    setLoading(false);
  }, [userId]);

  const refresh = useCallback(async () => {
    if (supabase) await loadCloud();
    else loadLocal();
  }, [loadCloud, loadLocal]);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    refresh().catch(() => setLoading(false));

    if (supabase) {
      const channel = supabase
        .channel(`warkop-live-${userId}`)
        .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => refresh())
        .on('postgres_changes', { event: '*', schema: 'public', table: 'expenses' }, () => refresh())
        .subscribe();
      return () => {
        supabase.removeChannel(channel);
      };
    }

    const on = () => loadLocal();
    window.addEventListener('warkop-local-change', on);
    return () => window.removeEventListener('warkop-local-change', on);
  }, [userId, refresh, loadLocal]);

  const addMenu = async (item) => {
    if (supabase) {
      const { data, error } = await supabase.from('menu_items').insert(item).select('*').single();
      if (error) throw error;
      if (data) setMenu((prev) => [...prev, data].sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      const db = readLocal();
      db.menu.push({ id: uid(), user_id: userId, ...item, created_at: now() });
      writeLocal(db);
    }
  };

  const updateMenu = async (id, item) => {
    if (supabase) {
      const { data, error } = await supabase.from('menu_items').update(item).eq('id', id).select('*').single();
      if (error) throw error;
      if (data) setMenu((prev) => prev.map((x) => (x.id === id ? data : x)).sort((a, b) => a.name.localeCompare(b.name)));
    } else {
      const db = readLocal();
      db.menu = db.menu.map((x) => (x.id === id && x.user_id === userId ? { ...x, ...item } : x));
      writeLocal(db);
    }
  };

  const deleteMenu = async (id) => {
    if (supabase) {
      const { error } = await supabase.from('menu_items').delete().eq('id', id);
      if (error) throw error;
      setMenu((prev) => prev.filter((x) => x.id !== id));
    } else {
      const db = readLocal();
      db.menu = db.menu.filter((x) => !(x.id === id && x.user_id === userId));
      writeLocal(db);
    }
  };

  const addOrder = async (order) => {
    if (supabase) {
      const { data, error } = await supabase.from('orders').insert(order).select('*').single();
      if (error) throw error;
      if (data) setOrders((prev) => [data, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    } else {
      const db = readLocal();
      db.orders.push({ id: uid(), user_id: userId, ...order });
      writeLocal(db);
    }
  };

  const addExpense = async (exp) => {
    if (supabase) {
      const { data, error } = await supabase.from('expenses').insert(exp).select('*').single();
      if (error) throw error;
      if (data) setExpenses((prev) => [data, ...prev].sort((a, b) => b.timestamp - a.timestamp));
    } else {
      const db = readLocal();
      db.expenses.push({ id: uid(), user_id: userId, ...exp });
      writeLocal(db);
    }
  };

  const deleteExpense = async (id) => {
    if (supabase) {
      const { error } = await supabase.from('expenses').delete().eq('id', id);
      if (error) throw error;
      setExpenses((prev) => prev.filter((x) => x.id !== id));
    } else {
      const db = readLocal();
      db.expenses = db.expenses.filter((x) => !(x.id === id && x.user_id === userId));
      writeLocal(db);
    }
  };

  return { menu, orders, expenses, loading, addMenu, updateMenu, deleteMenu, addOrder, addExpense, deleteExpense, refresh };
}

function AuthScreen({ auth }) {
  const [mode, setMode] = useState('login');
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
            <h1>Warkop<span>Kuu</span></h1>
            <p>Sistem kasir & manajemen warung Indonesia</p>
          </div>
        </div>
        <div className="auth-tabs">
          <button className={mode === 'login' ? 'active' : ''} onClick={() => setMode('login')}>Masuk</button>
          <button className={mode === 'register' ? 'active' : ''} onClick={() => setMode('register')}>Daftar</button>
        </div>
        <form onSubmit={submit} className="form">
          {mode === 'register' && <label>Nama Kedai / Owner<input required value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Warkop Pak Budi" /></label>}
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

function App() {
  const auth = useAuth();
  const store = useStore(auth.user);
  const [active, setActive] = useState('dashboard');
  const [cart, setCart] = useState([]);
  const [search, setSearch] = useState('');
  const [toast, setToast] = useState(null);
  const [newMenu, setNewMenu] = useState({ name: '', price: '', category: 'Minuman', stock: '' });
  const [edit, setEdit] = useState(null);
  const [expense, setExpense] = useState({ name: '', amount: '', category: 'Belanja Bahan' });
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const show = (message, type = 'success') => { setToast({ message, type }); setTimeout(() => setToast(null), 2500); };

  if (auth.loading) return <Splash />;
  if (!auth.user) return <AuthScreen auth={auth} />;

  const todaysOrders = store.orders.filter((o) => o.timestamp >= todayStart());
  const revenue = todaysOrders.reduce((s, o) => s + Number(o.total || 0), 0);
  const todayExpense = store.expenses.filter((e) => e.timestamp >= todayStart()).reduce((s, e) => s + Number(e.amount || 0), 0);
  const profit = revenue - todayExpense;
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
    const createdAt = now();
    const no = `WRG-${createdAt.toString(36).toUpperCase()}`;
    const itemsWithMeta = cart.map((item) => ({
      ...item,
      _receipt_no: no,
      _paid_amount: paidNumber,
      _change_amount: paidNumber - cartTotal,
    }));
    try {
      await store.addOrder({ items: itemsWithMeta, total: cartTotal, timestamp: createdAt });
      await Promise.all(cart.map((cartItem) => {
        const latest = store.menu.find((menuItem) => menuItem.id === cartItem.id);
        if (latest?.stock == null) return Promise.resolve();
        const nextStock = Math.max(0, Number(latest.stock) - cartItem.qty);
        return store.updateMenu(cartItem.id, { stock: nextStock });
      }));
      setCart([]);
      setCheckoutOpen(false);
      await store.refresh();
      show('Pesanan berhasil disimpan & stok diperbarui!');
    } catch (e) { show(e.message, 'error'); }
  };
  const addMenu = async (e) => {
    e.preventDefault();
    if (!newMenu.name || !newMenu.price) return show('Nama dan harga wajib diisi', 'error');
    try {
      await store.addMenu({ name: newMenu.name.trim(), price: Number(newMenu.price), category: newMenu.category, stock: newMenu.stock ? Number(newMenu.stock) : null });
      setNewMenu({ name: '', price: '', category: 'Minuman', stock: '' });
      store.refresh();
      show('Menu berhasil ditambahkan');
    } catch (x) { show(x.message, 'error'); }
  };
  const saveEdit = async (e) => {
    e.preventDefault();
    try {
      await store.updateMenu(edit.id, { name: edit.name, price: Number(edit.price), category: edit.category, stock: edit.stock === '' ? null : Number(edit.stock) });
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
  const currentStoreName = auth.user.user_metadata?.name || auth.user.name || 'Warungin';
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
  const exportCsv = () => {
    const rows = [['waktu', 'items', 'total'], ...store.orders.map((o) => [formatDate(o.timestamp), o.items.map((i) => `${i.qty}x ${i.name}`).join('; '), o.total])];
    const csv = '\uFEFF' + rows.map((r) => r.map((v) => `"${String(v).replaceAll('"', '""')}"`).join(',')).join('\n');
    const a = document.createElement('a');
    a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
    a.download = `transaksi-warkop-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
  };
  const activeLabel = NAV_ITEMS.find((n) => n[0] === active)?.[1];
  const salesCount = store.orders.reduce((acc, order) => {
    order.items.forEach((item) => { acc[item.id] = (acc[item.id] || 0) + item.qty; });
    return acc;
  }, {});
  const bestSellingIds = Object.entries(salesCount).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([id]) => id);

  return (
    <div className="app">
      {toast && <div className={`toast ${toast.type}`}>{toast.type === 'error' ? <X /> : <CheckCircle2 />} {toast.message}</div>}
      <MobileTopBar activeLabel={activeLabel} user={auth.user} />
      <aside>
        <div className="side-brand"><div className="brand-icon"><Coffee /></div><div><h1>Warkop<span>Kuu</span></h1><p>Sistem Manajemen</p></div></div>
        <nav>{NAV_ITEMS.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={active === id ? 'active' : ''}><Icon /> <span>{label}</span></button>)}</nav>
        <div className="userbox"><UserCircle2 /><div><b>{auth.user.user_metadata?.name || auth.user.name || auth.user.email}</b><small>{auth.mode === 'cloud' ? 'Cloud account' : 'Local account'}</small></div></div>
        <Credit compact />
        <button className="logout" onClick={auth.signOut}><LogOut /> Logout</button>
      </aside>
      <main>
        <header><div><h2>{activeLabel}</h2><p>Kelola penjualan, menu, pesanan, dan pengeluaran warung/kedai.</p></div><span className="pill"><Store /> {auth.user.email}</span></header>
        <div className="mobile-page-title"><h2>{activeLabel}</h2><p>Operasional kedai dari HP, cepat dan simpel.</p></div>
        {store.loading ? <Splash small /> : <>
          {active === 'dashboard' && <Dashboard revenue={revenue} orders={todaysOrders.length} expense={todayExpense} profit={profit} latest={store.orders} onShareOrder={handleShareOrder} />}
          {active === 'kasir' && <Kasir menu={store.menu} bestSellingIds={bestSellingIds} cart={cart} setCart={setCart} updateCartQty={updateCartQty} addToCart={addToCart} search={search} setSearch={setSearch} cartTotal={cartTotal} checkout={checkout} setActive={setActive} />}
          {active === 'menu' && <Menu menu={store.menu} newMenu={newMenu} setNewMenu={setNewMenu} addMenu={addMenu} del={async (id) => { await store.deleteMenu(id); setCart((c) => c.filter((i) => i.id !== id)); store.refresh(); show('Menu dihapus'); }} setEdit={setEdit} />}
          {active === 'pesanan' && <Pesanan orders={store.orders} exportCsv={exportCsv} onShareOrder={handleShareOrder} />}
          {active === 'pengeluaran' && <Pengeluaran expenses={store.expenses} expense={expense} setExpense={setExpense} addExpense={addExpense} del={async (id) => { await store.deleteExpense(id); store.refresh(); show('Pengeluaran dihapus'); }} />}
        </>}
        <div className="main-credit"><Credit /></div>
        {checkoutOpen && <CheckoutModal total={cartTotal} onClose={() => setCheckoutOpen(false)} onPay={processCheckout} />}
        {edit && <div className="modal" onClick={() => setEdit(null)}><form className="modal-card form" onSubmit={saveEdit} onClick={(e) => e.stopPropagation()}><h3>Edit Menu</h3><label>Nama<input value={edit.name} onChange={(e) => setEdit({ ...edit, name: e.target.value })} /></label><label>Harga<input type="number" value={edit.price} onChange={(e) => setEdit({ ...edit, price: e.target.value })} /></label><label>Kategori<select value={edit.category} onChange={(e) => setEdit({ ...edit, category: e.target.value })}>{['Minuman', 'Makanan', 'Cemilan', 'Paket'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Stok opsional<input type="number" value={edit.stock ?? ''} onChange={(e) => setEdit({ ...edit, stock: e.target.value })} /></label><button className="primary">Simpan Perubahan</button></form></div>}
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
function MobileTopBar({ activeLabel, user }) { return <div className="mobile-top"><div className="brand-mini"><div className="brand-icon"><Coffee /></div><div><b>WarkopKuu</b><small>{activeLabel}</small></div></div><div className="avatar-mini"><UserCircle2 /><span>{user?.email?.slice(0, 1)?.toUpperCase()}</span></div></div>; }
function MobileBottomNav({ active, setActive }) { return <div className="bottom-nav">{NAV_ITEMS.map(([id, label, Icon]) => <button key={id} onClick={() => setActive(id)} className={active === id ? 'active' : ''}><Icon /><span>{label}</span></button>)}</div>; }
function Credit({ compact = false }) { return <div className={compact ? 'credit compact' : 'credit'}>Built by <b>Takis Agency</b><span> · </span>Crafted by <b>Pandu W Aji</b></div>; }
function Splash({ small }) { return <div className={small ? 'splash small' : 'splash'}><Coffee /><p>Menyiapkan Kedai...</p></div>; }
function Stat({ icon: Icon, label, value, cls = '' }) { return <div className="stat"><div className={`stat-icon ${cls}`}><Icon /></div><div><p>{label}</p><h3>{value}</h3></div></div>; }
function Dashboard({ revenue, orders, expense, profit, latest, onShareOrder }) { return <section className="space"><h2>Ringkasan Hari Ini</h2><div className="stats"><Stat icon={Receipt} label="Pendapatan" value={formatRp(revenue)} cls="green" /><Stat icon={ShoppingCart} label="Pesanan" value={`${orders} trx`} cls="blue" /><Stat icon={WalletCards} label="Pengeluaran" value={formatRp(expense)} cls="red" /><Stat icon={Package} label="Estimasi Laba" value={formatRp(profit)} cls="amber" /></div><Card title="Transaksi Terakhir">{latest.slice(0, 5).length ? <div className="mobile-card-list">{latest.slice(0, 5).map((o) => <OrderCard key={o.id} order={o} onShareOrder={onShareOrder} />)}</div> : <Empty text="Belum ada transaksi hari ini." />}</Card></section>; }
function Kasir({ menu, bestSellingIds, cart, setCart, updateCartQty, addToCart, search, setSearch, cartTotal, checkout, setActive }) {
  const [category, setCategory] = useState('Semua');
  const categories = useMemo(() => ['Semua', ...Array.from(new Set(menu.map((i) => i.category).filter(Boolean)))], [menu]);
  const filtered = menu.filter((i) => (category === 'Semua' || i.category === category) && i.name.toLowerCase().includes(search.toLowerCase())).sort((a, b) => (bestSellingIds.includes(b.id) ? 1 : 0) - (bestSellingIds.includes(a.id) ? 1 : 0));
  const totalQty = cart.reduce((s, i) => s + i.qty, 0);
  return <div className="kasir"><div className="menu-grid-wrap"><div className="search"><Search /><input placeholder="Cari menu..." value={search} onChange={(e) => setSearch(e.target.value)} /></div><div className="category-chips">{categories.map((c) => <button key={c} className={category === c ? 'active' : ''} onClick={() => setCategory(c)}>{c}</button>)}</div>{!menu.length ? <Empty text="Menu masih kosong." action="Tambah menu sekarang" onClick={() => setActive('menu')} /> : <div className="menu-grid">{filtered.map((item) => <button key={item.id} onClick={() => addToCart(item)} className="menu-card"><small>{item.category}{bestSellingIds.includes(item.id) ? ' · Terlaris' : ''}</small><b>{item.name}</b><span>{formatRp(item.price)}</span>{item.stock != null && <em>Stok: {item.stock}</em>}</button>)}</div>}</div><div className="cart"><h3><ShoppingCart /> Pesanan Saat Ini {totalQty ? <span>{totalQty} item</span> : null}</h3><div className="cart-list">{cart.length ? cart.map((item) => <div className="cart-item" key={item.id}><div><b>{item.name}</b><small>{formatRp(item.price)}</small></div><div className="qty"><button onClick={() => updateCartQty(item.id, -1)}>-</button><span>{item.qty}</span><button onClick={() => updateCartQty(item.id, 1)}>+</button><button className="danger" onClick={() => setCart((c) => c.filter((x) => x.id !== item.id))}><Trash2 /></button></div></div>) : <Empty text="Belum ada pesanan" />}</div><div className="cart-total"><span>Total</span><b>{formatRp(cartTotal)}</b><button disabled={!cart.length} onClick={checkout}><CheckCircle2 /> Proses Pembayaran</button></div></div></div>;
}
function Menu({ menu, newMenu, setNewMenu, addMenu, del, setEdit }) {
  const [addOpen, setAddOpen] = useState(false);
  const form = <form onSubmit={(e) => { addMenu(e); setAddOpen(false); }} className="grid-form"><label>Nama Menu<input value={newMenu.name} onChange={(e) => setNewMenu({ ...newMenu, name: e.target.value })} placeholder="Kopi Hitam" /></label><label>Harga (Rp)<input type="number" min="0" value={newMenu.price} onChange={(e) => setNewMenu({ ...newMenu, price: e.target.value })} placeholder="5000" /></label><label>Kategori<select value={newMenu.category} onChange={(e) => setNewMenu({ ...newMenu, category: e.target.value })}>{['Minuman', 'Makanan', 'Cemilan', 'Paket'].map((x) => <option key={x}>{x}</option>)}</select></label><label>Stok opsional<input type="number" min="0" value={newMenu.stock} onChange={(e) => setNewMenu({ ...newMenu, stock: e.target.value })} placeholder="Opsional" /></label><button className="dark"><Plus /> Simpan</button></form>;
  return <section className="space"><div className="add-menu-card"><Card title="Tambah Menu Baru">{form}</Card></div><button className="fab-menu" onClick={() => setAddOpen(true)}><Plus /> Menu</button>{addOpen && <div className="modal" onClick={() => setAddOpen(false)}><div className="modal-card" onClick={(e) => e.stopPropagation()}><div className="modal-head"><h3>Tambah Menu Baru</h3><button onClick={() => setAddOpen(false)}><X /></button></div>{form}</div></div>}<Card title={`Daftar Menu (${menu.length})`}>{menu.length ? <><div className="menu-list-mobile">{menu.map((i) => <div className="list-card" key={i.id}><div><b>{i.name}</b><small>{i.category} · {formatRp(i.price)} · Stok {i.stock ?? '—'}</small></div><div><button onClick={() => setEdit(i)}><Pencil /></button><button className="danger" onClick={() => del(i.id)}><Trash2 /></button></div></div>)}</div><table className="desktop-table"><thead><tr><th>Nama</th><th>Kategori</th><th>Harga</th><th>Stok</th><th>Aksi</th></tr></thead><tbody>{menu.map((i) => <tr key={i.id}><td><b>{i.name}</b></td><td><span className="badge">{i.category}</span></td><td>{formatRp(i.price)}</td><td>{i.stock ?? '—'}</td><td><button onClick={() => setEdit(i)}><Pencil /></button><button className="danger" onClick={() => del(i.id)}><Trash2 /></button></td></tr>)}</tbody></table></> : <Empty text="Belum ada data menu." />}</Card></section>;
}
function Pesanan({ orders, exportCsv, onShareOrder }) {
  const [period, setPeriod] = useState('all');
  const minTime = period === 'today' ? todayStart() : period === 'week' ? weekStart() : period === 'month' ? monthStart() : 0;
  const filtered = orders.filter((o) => o.timestamp >= minTime);
  return <Card title="Riwayat Transaksi" action={<button onClick={exportCsv}><Download /> CSV</button>}><div className="period-chips">{[['all', 'Semua'], ['today', 'Hari ini'], ['week', 'Minggu ini'], ['month', 'Bulan ini']].map(([id, label]) => <button key={id} className={period === id ? 'active' : ''} onClick={() => setPeriod(id)}>{label}</button>)}</div>{filtered.length ? <><div className="mobile-card-list">{filtered.map((o) => <OrderCard key={o.id} order={o} onShareOrder={onShareOrder} />)}</div><table className="desktop-table"><thead><tr><th>No</th><th>Waktu</th><th>Detail Pesanan</th><th className="right">Total</th><th>Aksi</th></tr></thead><tbody>{filtered.map((o) => <tr key={o.id}><td><b>{receiptNo(o)}</b></td><td>{formatDate(o.timestamp)}</td><td>{o.items.map((i, idx) => <span className="chip" key={idx}>{i.qty}x {i.name}</span>)}</td><td className="right"><b>{formatRp(o.total)}</b></td><td><button className="share-link" type="button" onClick={() => onShareOrder(o)}>Share PNG</button></td></tr>)}</tbody></table></> : <Empty text="Belum ada transaksi pada periode ini." />}</Card>;
}
function Pengeluaran({ expenses, expense, setExpense, addExpense, del }) { return <section className="space"><Card title="Catat Pengeluaran"><form onSubmit={addExpense} className="grid-form"><label>Nama Pengeluaran<input value={expense.name} onChange={(e) => setExpense({ ...expense, name: e.target.value })} placeholder="Belanja kopi / gula" /></label><label>Nominal<input type="number" value={expense.amount} onChange={(e) => setExpense({ ...expense, amount: e.target.value })} /></label><label>Kategori<select value={expense.category} onChange={(e) => setExpense({ ...expense, category: e.target.value })}>{['Belanja Bahan', 'Operasional', 'Gaji', 'Sewa', 'Lainnya'].map((x) => <option key={x}>{x}</option>)}</select></label><button className="dark">Simpan</button></form></Card><Card title="Riwayat Pengeluaran">{expenses.length ? <div className="mobile-card-list always">{expenses.map((e) => <div className="order-card" key={e.id}><div><b>{e.name}</b><small>{formatDate(e.timestamp)}</small><span className="badge">{e.category}</span></div><div className="order-total"><b>{formatRp(e.amount)}</b><button className="danger" onClick={() => del(e.id)}><Trash2 /></button></div></div>)}</div> : <Empty text="Belum ada pengeluaran." />}</Card></section>; }
function OrderCard({ order, onShareOrder }) { return <div className="order-card"><div><b>{receiptNo(order)}</b><small>{formatDate(order.timestamp)}</small><small>{order.items.map((i) => `${i.qty}x ${i.name}`).join(', ')}</small>{paidAmount(order) ? <small>Dibayar {formatRp(paidAmount(order))} · Kembali {formatRp(changeAmount(order))}</small> : null}</div><div className="order-total"><b>{formatRp(order.total)}</b><button className="share-link" type="button" onClick={() => onShareOrder(order)}>Share PNG</button></div></div>; }
function Card({ title, children, action }) { return <div className="card"><div className="card-head"><h3>{title}</h3>{action}</div>{children}</div>; }
function Empty({ text, action, onClick }) { return <div className="empty"><Coffee /><p>{text}</p>{action && <button onClick={onClick}>{action}</button>}</div>; }
export default App;
