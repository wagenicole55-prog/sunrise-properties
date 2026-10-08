
import { useEffect, useMemo, useState } from 'react';
import { api, auth } from '@appdeploy/client';
import OwnerDashboard from './OwnerDashboard';
import {
  Search, Menu, X, MapPin, BedDouble, Bath, Ruler, Heart, Phone, Mail,
  Globe2, Home, LandPlot, KeyRound, ShieldCheck, PlayCircle, ChevronRight, Sparkles, Wand2, Copy, Download
} from 'lucide-react';

type Listing = {
  id: string | number; title: string; type: string; location: string; country: string;
  priceLabel: string; beds?: number; baths?: number; size: string; image: string; tag?: string;
};

const fallbackListings: Listing[] = [
  { id: 1, title: 'Modern Lakeside Tiny Home', type: 'Tiny Home', location: 'Austin, Texas', country: 'USA', priceLabel: '$89,500', beds: 2, baths: 1, size: '520 sq ft', image: 'https://images.unsplash.com/photo-1510798831971-661eb04b3739?auto=format&fit=crop&w=1200&q=85', tag: 'Featured' },
  { id: 2, title: 'Modern Desert Tiny Home', type: 'Tiny Home', location: 'Phoenix, Arizona', country: 'USA', priceLabel: '$76,000', beds: 2, baths: 1, size: '420 sq ft', image: 'https://images.unsplash.com/photo-1449158743715-0a90ebb6d2d8?auto=format&fit=crop&w=1200&q=85', tag: 'New' },
  { id: 3, title: 'Residential Land Parcel', type: 'Land', location: 'Dallas, Texas', country: 'USA', priceLabel: '$98,000', size: '1.2 acres', image: 'https://images.unsplash.com/photo-1500382017468-9049fed747ef?auto=format&fit=crop&w=1200&q=85', tag: 'Hot Land' },
  { id: 4, title: 'Contemporary Family Home', type: 'Home Rental', location: 'Atlanta, Georgia', country: 'USA', priceLabel: '$3,200 / month', beds: 4, baths: 3, size: '2,300 sq ft', image: 'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1200&q=85', tag: 'Available' },
  { id: 5, title: 'Forest Edge Tiny Retreat', type: 'Tiny Home', location: 'Asheville, North Carolina', country: 'USA', priceLabel: '$112,000', beds: 1, baths: 1, size: '480 sq ft', image: 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85?auto=format&fit=crop&w=1200&q=85' },
  { id: 6, title: 'Ocean View Land', type: 'Land', location: 'Tampa, Florida', country: 'USA', priceLabel: '$145,000', size: '1.1 acres', image: 'https://images.unsplash.com/photo-1494526585095-c41746248156?auto=format&fit=crop&w=1200&q=85' },
  { id: 7, title: 'City Apartment Rental', type: 'Home Rental', location: 'Chicago, Illinois', country: 'USA', priceLabel: '$2,900 / month', beds: 2, baths: 2, size: '1,050 sq ft', image: 'https://images.unsplash.com/photo-1522708323590-d24dbb6b0267?auto=format&fit=crop&w=1200&q=85', tag: 'Available' },
  { id: 8, title: 'Mountain Modern Tiny Home', type: 'Tiny Home', location: 'Denver, Colorado', country: 'USA', priceLabel: '$129,000', beds: 2, baths: 1, size: '560 sq ft', image: 'https://images.unsplash.com/photo-1520984032042-162d526883e0?auto=format&fit=crop&w=1200&q=85' }
];

const types = ['All', 'Tiny Home', 'Land', 'Home Rental'];
const countries = ['Nationwide U.S.'];

export default function App() {
  const [listings, setListings] = useState<Listing[]>(fallbackListings);
  const [type, setType] = useState('All');
  const [country, setCountry] = useState('Nationwide U.S.');
  const [query, setQuery] = useState('');
  const [menu, setMenu] = useState(false);
  const [saved, setSaved] = useState<Array<string | number>>([]);
  const [selected, setSelected] = useState<Listing | null>(null);
  const [notice, setNotice] = useState('');
  const [aiTitle, setAiTitle] = useState('');
  const [aiLocation, setAiLocation] = useState('');
  const [aiType, setAiType] = useState('Tiny Home');
  const [aiPrice, setAiPrice] = useState('');
  const [aiFeatures, setAiFeatures] = useState('');
  const [aiTone, setAiTone] = useState('Luxury & premium');
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPost, setAiPost] = useState('');
  const [aiImage, setAiImage] = useState('');
  const [aiImageLoading, setAiImageLoading] = useState(false);
  const [ownerOpen, setOwnerOpen] = useState(false);
  const [accountUser, setAccountUser] = useState<any>(null);
  const [ownerUser, setOwnerUser] = useState<any>(null);
  const [enquiryName, setEnquiryName] = useState('');
  const [enquiryContact, setEnquiryContact] = useState('');
  const [enquiryMessage, setEnquiryMessage] = useState('');

  useEffect(() => {
    api.get('/api/properties').then(response => setListings(response.data.properties || fallbackListings)).catch(() => undefined);
  }, []);

  const openAccount = async (mode: 'login' | 'register') => {
    try {
      const current = await auth.getUser();
      if (current) { setAccountUser(current); notify('You are already signed in.'); return; }
      const result = await auth.signIn({ scope: 'openid email profile offline_access' });
      setAccountUser(result.user);
      notify(mode === 'register' ? 'Account ready. Welcome to Sunrise Properties.' : 'Login successful.');
    } catch (error: any) {
      notify(error?.code === 'popup_blocked' ? 'Please allow popups to continue.' : 'Authentication was cancelled or failed.');
    }
  };

  const logoutAccount = async () => {
    await auth.signOut();
    setAccountUser(null);
    notify('You have been logged out.');
  };

  const openOwnerPanel = async () => {
    try {
      const current = await auth.getUser();
      if (current?.email === 'wagenicole55@gmail.com') {
        setOwnerUser(current);
        setOwnerOpen(true);
        return;
      }
      const result = await auth.signIn({ scope: 'openid email profile offline_access' });
      if (result.user.email !== 'wagenicole55@gmail.com') {
        await auth.signOut();
        notify('This account is not authorized for the owner panel.');
        return;
      }
      setOwnerUser(result.user);
      setOwnerOpen(true);
    } catch (error: any) {
      notify(error?.code === 'popup_blocked' ? 'Please allow popups to sign in as the owner.' : 'Owner sign-in was cancelled or failed.');
    }
  };

  const results = useMemo(() => listings.filter(item => {
    const haystack = (item.title + ' ' + item.location + ' ' + item.country + ' ' + item.type).toLowerCase();
    return (type === 'All' || item.type === type) &&
      (country === 'Nationwide U.S.' || item.country === 'USA') &&
      haystack.includes(query.toLowerCase());
  }), [type, country, query]);

  const notify = (message: string) => {
    setNotice(message);
    window.setTimeout(() => setNotice(''), 2200);
  };

  const selectType = (value: string) => {
    setType(value);
    document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' });
    setMenu(false);
  };

  const generateAiPost = async () => {
    if (!aiTitle || !aiLocation) return notify('Add a property name and location first');
    setAiLoading(true);
    try { const response = await api.post('/api/ai/property-post', { title: aiTitle, location: aiLocation, type: aiType, price: aiPrice, features: aiFeatures, tone: aiTone }); setAiPost(response.data.post); }
    catch { notify('AI post generation failed. Please try again.'); }
    finally { setAiLoading(false); }
  };

  const generateAiImage = async () => {
    if (!aiTitle || !aiLocation) return notify('Add a property name and location first');
    setAiImageLoading(true);
    try { const response = await api.post('/api/ai/property-image', { title: aiTitle, location: aiLocation, type: aiType, features: aiFeatures }); setAiImage('data:' + response.data.image.mimeType + ';base64,' + response.data.image.data); }
    catch { notify('AI visual generation failed. Please try again.'); }
    finally { setAiImageLoading(false); }
  };

  const copyAiPost = async () => { if (!aiPost) return; await navigator.clipboard?.writeText(aiPost); notify('AI post copied'); };
  const downloadAiImage = () => { if (!aiImage) return; const a = document.createElement('a'); a.href = aiImage; a.download = 'sunrise-properties-ai-post.png'; a.click(); };

  const submitEnquiry = async () => {
    if (!selected || !enquiryName || !enquiryContact) return notify('Add your name and phone or email');
    try {
      await api.post('/api/enquiries', { propertyId: selected.id, propertyTitle: selected.title, propertyLocation: selected.location, name: enquiryName, contact: enquiryContact, message: enquiryMessage });
      setEnquiryName(''); setEnquiryContact(''); setEnquiryMessage(''); setSelected(null); notify('Enquiry sent successfully. Our property team will contact you.');
    } catch { notify('Unable to send enquiry. Please try again.'); }
  };

  return (
    <div className='site'>
      <header className='header'>
        <div className='nav'>
          <button className='mobileMenu' onClick={() => setMenu(!menu)}><Menu /></button>
          <button className='brand' onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label='Sunrise Properties home'>
            <img className='brandLogo' src='https://sunrise-store-llc-qnih7n.v2.appdeploy.ai/resources/sunrise-properties-logo.png' alt='Sunrise Properties official logo' />
          </button>
          <nav className={menu ? 'navLinks open' : 'navLinks'}>
            <button onClick={() => selectType('All')}>Buy</button>
            <button onClick={() => selectType('Tiny Home')}>Tiny Homes</button>
            <button onClick={() => selectType('Land')}>Land</button>
            <button onClick={() => selectType('Home Rental')}>Rent</button>
            <button onClick={() => document.getElementById('how')?.scrollIntoView({ behavior: 'smooth' })}>How it works</button>
            <button onClick={() => document.getElementById('ai-studio')?.scrollIntoView({ behavior: 'smooth' })}>AI Post Studio</button>
          </nav>
          <div className='navRight'>
            <button className='authButton loginButton' onClick={() => openAccount('login')}>Log in</button>
            <button className='authButton registerButton' onClick={() => openAccount('register')}>Register</button>
            {accountUser && <button className='accountButton' onClick={logoutAccount}>{accountUser.name || accountUser.email || 'Account'} · Log out</button>}
            <button className='savedTop' onClick={() => notify(saved.length ? saved.length + ' saved properties' : 'No saved properties yet')}><Heart size={17}/> {saved.length}</button>
            <button className='listProperty' onClick={() => document.getElementById('ai-studio')?.scrollIntoView({ behavior: 'smooth' })}><Sparkles size={15}/> Create AI post</button>
            <button className='listProperty ownerButton' onClick={openOwnerPanel}><KeyRound size={15}/> Owner Panel</button>
          </div>
        </div>
      </header>

      <section className='hero'>
        <div className='heroShade'></div>
        <div className='heroContent'>
          <span className='eyebrow light'>U.S. NATIONWIDE PROPERTY MARKETPLACE</span>
          <h1>Find a place to <em>build, buy or rent.</em></h1>
          <p>Discover tiny homes, land and rental properties across the United States — all in one place.</p>
          <div className='searchBox'>
            <div className='searchInput'><Search size={19}/><input value={query} onChange={e => setQuery(e.target.value)} placeholder='City, state, ZIP code or property keyword'/></div>
            <select value={type} onChange={e => setType(e.target.value)}>{types.map(value => <option key={value}>{value}</option>)}</select>
            <select value={country} onChange={e => setCountry(e.target.value)}>{countries.map(value => <option key={value}>{value}</option>)}</select>
            <button onClick={() => document.getElementById('properties')?.scrollIntoView({ behavior: 'smooth' })}>Search</button>
          </div>
          <div className='heroLinks'>
            <button onClick={() => selectType('Tiny Home')}>Explore tiny homes <ChevronRight size={15}/></button>
            <button onClick={() => selectType('Land')}>Find land <ChevronRight size={15}/></button>
            <button onClick={() => selectType('Home Rental')}>Browse rentals <ChevronRight size={15}/></button>
          </div>
        </div>
      </section>

      <section className='quick'>
        <button onClick={() => selectType('Tiny Home')}><span><Home/></span><div><b>Buy a Tiny Home</b><small>Compact, modern and ready for your plans</small></div><ChevronRight/></button>
        <button onClick={() => selectType('Land')}><span><LandPlot/></span><div><b>Buy Land</b><small>Find land for your next home or project</small></div><ChevronRight/></button>
        <button onClick={() => selectType('Home Rental')}><span><KeyRound/></span><div><b>Rent a Home</b><small>Find your next place to live</small></div><ChevronRight/></button>
      </section>

      <section className='aiStudio' id='ai-studio'>
        <div className='aiIntro'><span className='eyebrow'>AI CONTENT STUDIO</span><h2>Make every property post look professionally produced.</h2><p>Generate polished listing copy, social captions, hashtags and an AI concept visual from the same property details.</p><div className='aiPills'><span><Sparkles/> AI listing copy</span><span><Wand2/> AI visual</span><span>Social-ready</span></div></div>
        <div className='aiPanel'>
          <div className='aiFields'><input value={aiTitle} onChange={e => setAiTitle(e.target.value)} placeholder='Property name'/><input value={aiLocation} onChange={e => setAiLocation(e.target.value)} placeholder='City, State'/><select value={aiType} onChange={e => setAiType(e.target.value)}><option>Tiny Home</option><option>Land</option><option>Home Rental</option></select><input value={aiPrice} onChange={e => setAiPrice(e.target.value)} placeholder='Price or monthly rent'/><select value={aiTone} onChange={e => setAiTone(e.target.value)}><option>Luxury & premium</option><option>Warm & family-friendly</option><option>Modern & minimalist</option><option>Bold & attention-grabbing</option></select><textarea value={aiFeatures} onChange={e => setAiFeatures(e.target.value)} placeholder='Key features: 2 beds, lake view, solar panels, 520 sq ft...'/></div>
          <div className='aiActions'><button className='primary' onClick={generateAiPost} disabled={aiLoading}><Sparkles size={17}/>{aiLoading ? 'Writing...' : 'Generate AI post'}</button><button className='aiSecondary' onClick={generateAiImage} disabled={aiImageLoading}><Wand2 size={17}/>{aiImageLoading ? 'Creating visual...' : 'Create AI visual'}</button></div>
          {aiPost && <div className='aiOutput'><div className='aiOutputHead'><b>AI-ready post</b><button onClick={copyAiPost}><Copy size={15}/> Copy</button></div><p>{aiPost}</p></div>}
          {aiImage && <div className='aiVisual'><img src={aiImage} alt='AI-generated Sunrise Properties concept visual'/><div><span>AI concept visual — verify property details against real photos.</span><button onClick={downloadAiImage}><Download size={15}/> Save image</button></div></div>}
        </div>
      </section>

      <section className='section' id='properties'>
        <div className='sectionHead'>
          <div><span className='eyebrow'>HANDPICKED PROPERTIES</span><h2>Explore properties nationwide</h2><p>Browse homes, land and tiny living spaces across the United States.</p></div>
          <button className='outline' onClick={() => { setType('All'); setCountry('Nationwide U.S.'); setQuery(''); }}>View all</button>
        </div>
        <div className='chips'>{types.map(value => <button key={value} className={type === value ? 'active' : ''} onClick={() => setType(value)}>{value}</button>)}</div>
        <div className='grid'>
          {results.map(item => (
            <article className='card' key={item.id}>
              <div className='photo'>
                <img src={item.image} alt={item.title}/>
                {item.tag && <span className='tag'>{item.tag}</span>}
                <button className={saved.includes(item.id) ? 'heart saved' : 'heart'} onClick={() => setSaved(current => current.includes(item.id) ? current.filter(id => id !== item.id) : [...current, item.id])}><Heart size={18} fill={saved.includes(item.id) ? 'currentColor' : 'none'}/></button>
                <span className='badge'>{item.type}</span>
              </div>
              <div className='cardBody'>
                <div className='location'><MapPin size={14}/>{item.location}, {item.country}</div>
                <h3>{item.title}</h3>
                <div className='specs'>
                  {item.beds && <span><BedDouble/> {item.beds} beds</span>}
                  {item.baths && <span><Bath/> {item.baths} baths</span>}
                  <span><Ruler/> {item.size}</span>
                </div>
                <div className='priceRow'><div><b>{item.priceLabel}</b><small>{item.type === 'Home Rental' ? 'Rental' : 'For sale'}</small></div><button onClick={() => setSelected(item)}>View property</button></div>
              </div>
            </article>
          ))}
        </div>
        {!results.length && <div className='empty'><Search/><h3>No matching properties</h3><p>Try another U.S. city, state, ZIP code or property type.</p><button className='primary' onClick={() => { setQuery(''); setCountry('Nationwide U.S.'); setType('All'); }}>Reset search</button></div>}
      </section>

      <section className='feature'>
        <div><span className='eyebrow light'>A BETTER WAY TO SEARCH</span><h2>See more before you decide.</h2><p>Detailed listings, rich photography and future-ready virtual tours help you understand a property before requesting a viewing.</p><button className='primary' onClick={() => notify('Virtual tours can be added to your listings')}><PlayCircle size={17}/> Explore virtual tours</button></div>
        <div className='featureImage'><img src='https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1200&q=85' alt='Modern home interior'/><span><PlayCircle/> 3D / Virtual Tour</span></div>
      </section>

      <section className='how' id='how'>
        <div className='center'><span className='eyebrow'>HOW IT WORKS</span><h2>From search to new keys.</h2></div>
        <div className='steps'>
          <div><b>01</b><h3>Search</h3><p>Choose a property type, location and budget.</p></div>
          <div><b>02</b><h3>Explore</h3><p>Review photos, features, pricing and details.</p></div>
          <div><b>03</b><h3>Enquire</h3><p>Ask questions or request a viewing.</p></div>
          <div><b>04</b><h3>Move forward</h3><p>Complete the appropriate local property process.</p></div>
        </div>
      </section>

      <section className='trust'>
        <div><ShieldCheck/><p><b>Clear property information</b><span>Show location, pricing, features and availability clearly. Always complete local verification and legal checks before a transaction.</span></p></div>
        <div><Globe2/><p><b>Nationwide U.S. discovery</b><span>Search property opportunities across all 50 states from one modern U.S. marketplace.</span></p></div>
        <div><KeyRound/><p><b>Buy, land or rent</b><span>One destination for tiny homes, land purchases and rental properties.</span></p></div>
      </section>

      <section className='customerService'>
        <div><span className='eyebrow'>CUSTOMER SERVICE</span><h2>Call or message us</h2><p>Our Sunrise Properties customer service team is available for property questions, enquiries and viewing requests.</p></div>
        <div className='customerActions'><a className='primary' href='tel:+15012266522'><Phone size={17}/> Call +1 501 226 6522</a><a className='outline' href='mailto:sunrise.tiny.lands.official@gmail.com'><Mail size={17}/> Email us</a></div>
      </section>

      <footer>
        <div className='footerGrid'>
          <div><button className='brand' onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })} aria-label='Sunrise Properties home'><img className='brandLogo footerLogo' src='https://sunrise-store-llc-qnih7n.v2.appdeploy.ai/resources/sunrise-properties-logo.png' alt='Sunrise Properties official logo' /></button><p>Nationwide U.S. tiny homes, land and rental properties.</p></div>
          <div><b>Explore</b><button onClick={() => selectType('Tiny Home')}>Tiny Homes</button><button onClick={() => selectType('Land')}>Land for Sale</button><button onClick={() => selectType('Home Rental')}>Homes for Rent</button></div>
          <div><b>Services</b><button>Property enquiries</button><button>Viewing requests</button><button onClick={() => document.getElementById('ai-studio')?.scrollIntoView({ behavior: 'smooth' })}>AI Post Studio</button></div>
          <div><b>Company</b><button>About Sunrise</button><button>Contact</button><button>Privacy & Terms</button><button onClick={openOwnerPanel}>Owner Panel</button><a className='footerLink' href='https://t.me/sunrisetinyproperties' target='_blank' rel='noreferrer'>Telegram Channel</a></div>
        </div>
        <div className='footerBottom'>© 2026 Sunrise Properties · Nationwide U.S. property marketplace</div>
      </footer>

      {ownerOpen && ownerUser?.email === 'wagenicole55@gmail.com' && <OwnerDashboard onClose={() => setOwnerOpen(false)} notify={notify} onPublicRefresh={setListings} />}

      {selected && <div className='modalBg' onClick={() => setSelected(null)}>
        <div className='modal' onClick={event => event.stopPropagation()}>
          <button className='close' onClick={() => setSelected(null)}><X/></button>
          <img src={selected.image} alt={selected.title}/>
          <div className='modalBody'><span className='modalBadge'>{selected.type}</span><div className='location'><MapPin size={14}/>{selected.location}, {selected.country}</div><h2>{selected.title}</h2><strong className='modalPrice'>{selected.priceLabel}</strong><div className='specs'>{selected.beds && <span><BedDouble/> {selected.beds} beds</span>}{selected.baths && <span><Bath/> {selected.baths} baths</span>}<span><Ruler/> {selected.size}</span></div><p>Interested in this property? Contact the property team to request availability, documents, pricing details or a viewing.</p><div className='form'><input value={enquiryName} onChange={e => setEnquiryName(e.target.value)} placeholder='Your name'/><input value={enquiryContact} onChange={e => setEnquiryContact(e.target.value)} placeholder='Email or phone'/><textarea value={enquiryMessage} onChange={e => setEnquiryMessage(e.target.value)} placeholder='Tell us what you would like to know'></textarea><button className='primary' onClick={submitEnquiry}>Send enquiry</button></div></div>
        </div>
      </div>}

      {notice && <div className='toast'>{notice}</div>}
    </div>
  );
}
