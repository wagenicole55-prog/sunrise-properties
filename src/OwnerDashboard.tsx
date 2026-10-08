import { useEffect, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import { X, Pencil, Trash2, RefreshCw, LogOut } from 'lucide-react';
type Listing = { id: string; title: string; type: string; location: string; country: string; priceLabel: string; beds?: number; baths?: number; size: string; image: string; tag?: string; active?: boolean; featured?: boolean };
type Form = { id: string; title: string; type: string; location: string; priceLabel: string; beds: string; baths: string; size: string; image: string; tag: string; featured: boolean; active: boolean };
const blank: Form = { id: '', title: '', type: 'Tiny Home', location: '', priceLabel: '', beds: '', baths: '', size: '', image: '', tag: '', featured: false, active: true };
export default function OwnerDashboard({ onClose, notify, onPublicRefresh }: { onClose: () => void; notify: (message: string) => void; onPublicRefresh: (items: Listing[]) => void }) {
 const [items, setItems] = useState<Listing[]>([]);
 const [form, setForm] = useState<Form>(blank);
 const [busy, setBusy] = useState(false);
 const [tab, setTab] = useState<'properties' | 'enquiries' | 'settings'>('properties');
 const [enquiries, setEnquiries] = useState<any[]>([]);
 const loadEnquiries = async () => { try { const response = await api.get('/api/admin/enquiries'); setEnquiries(response.data.enquiries || []); } catch { notify('Unable to load enquiries'); } };
 const load = async () => { setBusy(true); try { const response = await api.get('/api/admin/properties'); setItems(response.data.properties || []); } catch { notify('Unable to load owner properties'); } finally { setBusy(false); } };
 useEffect(() => { void load(); void loadEnquiries(); }, []);
 const save = async () => {
  if (!form.title || !form.location || !form.priceLabel || !form.size || !form.image) { notify('Complete title, location, price, size and photo URL'); return; }
  setBusy(true);
  try {
   const payload = { ...form, beds: form.beds ? Number(form.beds) : undefined, baths: form.baths ? Number(form.baths) : undefined };
   if (form.id) await api.put('/api/admin/properties/' + form.id, payload); else await api.post('/api/admin/properties', payload);
   setForm(blank); await load(); const publicData = await api.get('/api/properties'); onPublicRefresh(publicData.data.properties || []); notify(form.id ? 'Property updated' : 'Property added');
  } catch { notify('Unable to save property'); } finally { setBusy(false); }
 };
 const remove = async (id: string) => {
  if (!window.confirm('Delete this property permanently?')) return;
  setBusy(true); try { await api.delete('/api/admin/properties/' + id); await load(); const publicData = await api.get('/api/properties'); onPublicRefresh(publicData.data.properties || []); notify('Property deleted'); } catch { notify('Unable to delete property'); } finally { setBusy(false); }
 };
 const edit = (item: Listing) => setForm({ id: item.id, title: item.title, type: item.type, location: item.location, priceLabel: item.priceLabel, beds: item.beds ? String(item.beds) : '', baths: item.baths ? String(item.baths) : '', size: item.size, image: item.image, tag: item.tag || '', featured: !!item.featured, active: item.active !== false });
 const signOut = async () => { await auth.signOut(); onClose(); notify('Owner signed out'); };
 return (
  <div className='modalBg' onClick={onClose}>
   <div className='ownerModal' onClick={event => event.stopPropagation()}>
    <div className='ownerHead'><div><span className='eyebrow'>PRIVATE OWNER AREA</span><h2>Sunrise Properties Control Center</h2><p>Authorized owner: wagenicole55@gmail.com</p></div><button className='close' onClick={onClose}><X /></button></div>
    <div className='ownerTabs'><button className={tab === 'properties' ? 'active' : ''} onClick={() => setTab('properties')}>Properties</button><button className={tab === 'enquiries' ? 'active' : ''} onClick={() => { setTab('enquiries'); void loadEnquiries(); }}>Enquiries {enquiries.filter(e => e.status === 'NEW').length ? `(${enquiries.filter(e => e.status === 'NEW').length})` : ''}</button><button className={tab === 'settings' ? 'active' : ''} onClick={() => setTab('settings')}>Site controls</button><button onClick={signOut}><LogOut size={15} /> Sign out</button></div>
    {tab === 'properties' && <div className='ownerGrid'>
      <div className='ownerForm'><h3>{form.id ? 'Edit property' : 'Add property'}</h3>
       <input value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} placeholder='Property title' />
       <input value={form.location} onChange={event => setForm({ ...form, location: event.target.value })} placeholder='City, State' />
       <select value={form.type} onChange={event => setForm({ ...form, type: event.target.value })}><option>Tiny Home</option><option>Land</option><option>Home Rental</option></select>
       <input value={form.priceLabel} onChange={event => setForm({ ...form, priceLabel: event.target.value })} placeholder='Price or monthly rent' />
       <div className='ownerTwo'><input value={form.beds} onChange={event => setForm({ ...form, beds: event.target.value })} placeholder='Beds' /><input value={form.baths} onChange={event => setForm({ ...form, baths: event.target.value })} placeholder='Baths' /></div>
       <input value={form.size} onChange={event => setForm({ ...form, size: event.target.value })} placeholder='Size / lot size' />
       <input value={form.image} onChange={event => setForm({ ...form, image: event.target.value })} placeholder='Property photo URL' />
       <input value={form.tag} onChange={event => setForm({ ...form, tag: event.target.value })} placeholder='Tag (optional)' />
       <label><input type='checkbox' checked={form.featured} onChange={event => setForm({ ...form, featured: event.target.checked })} /> Featured</label>
       <label><input type='checkbox' checked={form.active} onChange={event => setForm({ ...form, active: event.target.checked })} /> Published</label>
       <div className='ownerActions'><button className='primary' onClick={save} disabled={busy}>{busy ? 'Saving...' : form.id ? 'Save changes' : 'Add property'}</button><button className='outline' onClick={() => setForm(blank)}>Clear</button></div>
      </div>
      <div className='ownerList'><div className='ownerListHead'><h3>Your properties</h3><button className='outline' onClick={load}><RefreshCw size={15} /> Refresh</button></div>
       {items.map(item => <div className='ownerItem' key={item.id}><div><b>{item.title}</b><span>{item.location} · {item.type} · {item.priceLabel}</span><small>{item.active === false ? 'Hidden' : 'Published'}{item.featured ? ' · Featured' : ''}</small></div><div className='ownerItemActions'><button onClick={() => edit(item)}><Pencil size={14} /> Edit</button><button onClick={() => remove(item.id)}><Trash2 size={14} /> Delete</button></div></div>)}
      </div>
    </div>}
    {tab === 'enquiries' && <div className='ownerSettings'><div className='ownerListHead'><h3>Customer enquiries</h3><button className='outline' onClick={loadEnquiries}><RefreshCw size={15}/> Refresh</button></div>{!enquiries.length && <p>No enquiries yet.</p>}{enquiries.map(item => <div className='ownerItem' key={item.id}><div><b>{item.propertyTitle || 'Property enquiry'}</b><span>{item.customerName} · {item.customerContact}</span><small>{item.message || 'No message'} · {item.status}</small></div><div className='ownerItemActions'><button onClick={async () => { await api.put('/api/admin/enquiries/' + item.id, { status: 'CONTACTED' }); await loadEnquiries(); notify('Enquiry marked contacted'); }}>Mark contacted</button></div></div>)}</div>}\n    {tab === 'settings' && <div className='ownerSettings'><h3>Site controls</h3><p>Current public customer-service channels.</p><div className='settingRow'><b>Phone</b><span>+1 501 226 6522</span></div><div className='settingRow'><b>Email</b><span>sunrise.tiny.lands.official@gmail.com</span></div><div className='settingRow'><b>Telegram</b><span>@sunrisetinyproperties</span></div><button className='outline' onClick={() => notify('Contact settings are ready for management')}>Manage contact settings</button></div>}
   </div>
  </div>
 );
}