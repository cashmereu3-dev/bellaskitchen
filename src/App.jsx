import React, { useState, useEffect, useRef } from "react";
import {
  Flame,
  Heart,
  Sparkles,
  Clock,
  Smartphone,
  TrendingUp,
  DollarSign,
  CheckCircle,
  AlertCircle,
  Trash2,
  Plus,
  Minus,
  ShoppingBag,
  ChefHat,
  Truck,
  Copy,
  Check,
  Lock,
  Settings,
  Layers,
  Utensils,
  ChevronRight,
  Info,
  PhoneCall,
  Mic,
  MicOff,
  Image as ImageIcon,
  Share2,
  Send,
  Volume2
} from "lucide-react";

import {
  getMenu,
  toggleStock,
  getSettings,
  updateSettings,
  getOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  updateOrderPaymentStatus,
  getSmsLogs,
  clearSmsLogs,
  getAnalytics,
  subscribeToSync,
  getSocialAccounts,
  updateSocialAccounts,
  getAiSuggestedPosts,
  getSharedPostsLog,
  approveAndSharePost,
  draftCustomPost,
  declineSuggestedPost
} from "./services/store";

// Helper audio chimes using browser Web Audio API
function playAlertSound(type = "success") {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    
    osc.connect(gain);
    gain.connect(ctx.destination);
    
    if (type === "success") {
      osc.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(659.25, ctx.currentTime + 0.15); // E5
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
      osc.stop(ctx.currentTime + 0.4);
    } else if (type === "order") {
      osc.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      gain.gain.setValueAtTime(0.2, ctx.currentTime);
      osc.start();
      osc.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.12); // C6
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
      osc.stop(ctx.currentTime + 0.5);
    } else {
      osc.type = "sawtooth";
      osc.frequency.setValueAtTime(150, ctx.currentTime);
      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      osc.start();
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (e) {
    console.warn("Web Audio API not supported or blocked by permissions");
  }
}

// -------------------------------------------------------------
// MAIN SAAS APPLICATION MODULE
// -------------------------------------------------------------
export default function App() {
  const [currentRoute, setCurrentRoute] = useState("");
  const [routeParam, setRouteParam] = useState("");
  const [toast, setToast] = useState(null);

  // Sync state dynamically across tabs
  const showToast = (message, type = "success") => {
    setToast({ message, type });
    playAlertSound(type === "error" ? "error" : "success");
    setTimeout(() => setToast(null), 4000);
  };

  useEffect(() => {
    const handleHash = () => {
      const hash = window.location.hash || "#/";
      if (hash.startsWith("#/receipt/")) {
        setCurrentRoute("receipt");
        setRouteParam(hash.replace("#/receipt/", ""));
      } else if (hash.startsWith("#/admin")) {
        setCurrentRoute("admin");
        setRouteParam("");
      } else {
        setCurrentRoute("menu");
        setRouteParam("");
      }
    };

    window.addEventListener("hashchange", handleHash);
    handleHash(); // Initial route resolve

    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === "ORDER_CREATE") {
        if (window.location.hash.includes("admin")) {
          showToast(`🎉 New Order #${msg.payload.id} received!`, "order");
        }
      }
    });

    return () => {
      window.removeEventListener("hashchange", handleHash);
      unsubscribe();
    };
  }, []);

  return (
    <div className="min-h-screen text-slate-100 flex flex-col relative select-none">
      {/* Dynamic Notification Toast */}
      {toast && (
        <div className="fixed top-6 right-6 z-50 animate-bounce shadow-2xl flex items-center gap-3 p-4 rounded-xl border border-pink-500 bg-[#16181e] max-w-sm">
          <Sparkles className="text-pink-500 animate-spin" />
          <p className="font-semibold text-sm">{toast.message}</p>
        </div>
      )}

      {/* Route Router */}
      {currentRoute === "admin" && <AdminView showToast={showToast} />}
      {currentRoute === "receipt" && <ReceiptView id={routeParam} showToast={showToast} />}
      {currentRoute === "menu" && <CustomerMenuView showToast={showToast} />}
    </div>
  );
}

// -------------------------------------------------------------
// CUSTOMER ORDERING PORTAL VIEW
// -------------------------------------------------------------
function CustomerMenuView({ showToast }) {
  const [menu, setMenu] = useState([]);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [cart, setCart] = useState([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState("wings");
  
  // Custom Wings Configurator
  const [wingsSize, setWingsSize] = useState("wings-6");
  const [wingsFlavor, setWingsFlavor] = useState("Mild");

  // Form Details
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("cashapp");
  const [cashtagInput, setCashtagInput] = useState("");
  const [applePhoneInput, setApplePhoneInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setMenu(getMenu());
    setSettings(getSettings());

    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === "MENU_UPDATE") setMenu(msg.payload);
      if (msg.type === "SETTINGS_UPDATE") setSettings(msg.payload);
    });
    return () => unsubscribe();
  }, []);

  const handleAddToCart = (item, isWings = false) => {
    let finalItem = { ...item };
    if (isWings) {
      const selectedItem = menu.find(c => c.id === "wings").items.find(i => i.id === wingsSize);
      finalItem = {
        id: `wings-${wingsFlavor}-${wingsSize}`,
        name: `${selectedItem.name} (${wingsFlavor} Glaze)`,
        price: selectedItem.price,
        qty: 1
      };
    } else {
      finalItem = {
        id: item.id,
        name: item.name,
        price: item.price,
        qty: 1
      };
    }

    setCart(prev => {
      const exists = prev.find(i => i.id === finalItem.id);
      if (exists) {
        return prev.map(i => i.id === finalItem.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, finalItem];
    });

    showToast(`🛒 Added ${finalItem.name} to basket!`);
  };

  const updateCartQty = (itemId, change) => {
    setCart(prev => prev.map(i => {
      if (i.id === itemId) {
        const nextQty = i.qty + change;
        return nextQty > 0 ? { ...i, qty: nextQty } : null;
      }
      return i;
    }).filter(Boolean));
  };

  const getSubtotal = () => cart.reduce((sum, i) => sum + i.price * i.qty, 0);
  const getTax = () => getSubtotal() * settings.taxRate;
  const getTotal = () => getSubtotal() + getTax();

  const handlePlaceOrder = (e) => {
    e.preventDefault();
    if (!name.trim() || !phone.trim()) {
      showToast("⚠️ Contact details are required!", "error");
      return;
    }

    if (cart.length === 0) {
      showToast("⚠️ Your shopping cart is empty!", "error");
      return;
    }

    if (paymentMethod === "cashapp" && !cashtagInput.trim()) {
      showToast("⚠️ Please enter your Cash App Cashtag reference!", "error");
      return;
    }

    if (paymentMethod === "applepay" && !applePhoneInput.trim()) {
      showToast("⚠️ Please enter your Apple Pay verification phone digits!", "error");
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const order = createOrder({
        customerName: name,
        customerPhone: phone,
        notes,
        paymentMethod,
        paymentRef: paymentMethod === "cashapp" ? cashtagInput : applePhoneInput,
        cart,
        subtotal: getSubtotal().toFixed(2),
        tax: getTax().toFixed(2),
        total: getTotal().toFixed(2)
      });
      setIsSubmitting(false);
      setCart([]);
      setIsCartOpen(false);
      window.location.hash = `#/receipt/${order.id}`;
    }, 2000);
  };

  const copyToClipboard = (text, message) => {
    navigator.clipboard.writeText(text);
    showToast(message);
  };

  return (
    <div className="flex-1 flex flex-col bg-[#0f1013]">
      {/* Chalkboard Prestige Banner */}
      <header className="py-12 px-6 flex flex-col items-center justify-center border-b border-zinc-800 text-center relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(15,16,19,0.92), rgba(15,16,19,0.95)), url("/hero.png")' }}>
        <Sparkles className="absolute top-6 left-12 text-pink-500 animate-spin" size={24} />
        <Heart className="absolute bottom-8 right-12 text-pink-500 animate-ping" size={20} />
        <h1 className="font-handwritten text-7xl font-extrabold text-pink-500 tracking-wide glow-pink-text select-none">
          Bella's Kitchen
        </h1>
        <p className="text-amber-400 font-medium text-lg tracking-widest mt-2 uppercase font-display italic">
          Big Flavor. Made with Love.
        </p>

        {/* Floating Queue Stats */}
        <div className="mt-8 flex flex-wrap gap-4 items-center justify-center text-xs">
          <div className="flex items-center gap-2 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <Clock className="text-pink-500" size={16} />
            <span>WAIT TIME: <strong className="text-pink-500">{settings.waitTime}</strong></span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <Truck className="text-amber-400 animate-bounce" size={16} />
            <span>TRUCK LOCATION: <strong className="text-amber-400">{settings.truckLocation}</strong></span>
          </div>
          <div className="flex items-center gap-2 p-3 bg-zinc-900/80 rounded-xl border border-zinc-800">
            <div className={`w-3 h-3 rounded-full animate-ping ${settings.isOpen ? 'bg-emerald-500' : 'bg-red-500'}`} />
            <span>STATUS: <strong className={settings.isOpen ? "text-emerald-400" : "text-red-400"}>{settings.isOpen ? "OPEN NOW" : "CLOSED"}</strong></span>
          </div>
        </div>
      </header>

      {/* Horizontal Miniatures Pill Strip */}
      <nav className="sticky top-0 z-30 flex items-center gap-4 py-4 px-6 bg-[#0f1013]/90 backdrop-blur-md overflow-x-auto border-b border-zinc-800 scrollbar-none">
        {menu.map(category => (
          <button
            key={category.id}
            onClick={() => setSelectedCategory(category.id)}
            className={`flex items-center gap-3 py-2.5 px-5 rounded-full font-semibold border text-sm transition ${selectedCategory === category.id ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'}`}
          >
            <div className="w-6 h-6 rounded-full bg-cover bg-center border border-zinc-700" style={{ backgroundImage: `url("${category.image || '/drinks.png'}")` }} />
            <span>{category.name}</span>
          </button>
        ))}
      </nav>

      {/* Specialties Metro Content Grid */}
      <main className="flex-1 p-6 md:p-10 max-w-7xl mx-auto w-full grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Dynamic Category Banners & Menu Items */}
        <section className="lg:col-span-2 flex flex-col gap-8">
          {menu.filter(c => c.id === selectedCategory).map(category => (
            <div key={category.id} className="flex flex-col gap-6 animate-fade-in">
              <div className="relative rounded-3xl h-64 overflow-hidden border border-zinc-800 bg-zinc-950 flex flex-col justify-end p-8 bg-cover bg-center" style={{ backgroundImage: `linear-gradient(to top, rgba(0,0,0,0.85), transparent), url("${category.image || '/drinks.png'}")` }}>
                <span className="absolute top-6 right-6 px-3 py-1 text-xs bg-pink-500/20 border border-pink-500/40 text-pink-400 font-bold rounded-full">
                  🔥 Gourmet Specialties
                </span>
                <h2 className="text-3xl font-extrabold text-white font-display mb-1">{category.name}</h2>
                <p className="text-zinc-400 text-sm max-w-lg">{category.description}</p>
              </div>

              {/* Explicit Nested Item Customizer for Wings */}
              {category.id === "wings" && (
                <div className="p-8 bg-zinc-900 rounded-3xl border border-zinc-800 flex flex-col gap-6">
                  <h3 className="font-handwritten text-4xl text-amber-400">1. Customize Wings Combo</h3>
                  
                  {/* Select Pack Size */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Select Combo Pack Size:</span>
                    <div className="grid grid-cols-3 gap-4">
                      {category.items.map(item => (
                        <button
                          key={item.id}
                          onClick={() => setWingsSize(item.id)}
                          className={`p-4 rounded-2xl border text-center transition flex flex-col items-center justify-center ${wingsSize === item.id ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                        >
                          <span className="font-bold text-sm">{item.name.split(" ")[0]}</span>
                          <span className="text-xs text-zinc-500 mt-1">${item.price.toFixed(2)}</span>
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Select Glaze flavor */}
                  <div className="flex flex-col gap-3">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Choose Glaze Flavor:</span>
                    <div className="grid grid-cols-3 gap-3">
                      {category.flavors.map(flavor => (
                        <button
                          key={flavor}
                          onClick={() => setWingsFlavor(flavor)}
                          className={`py-3 px-2 rounded-xl border text-xs font-bold text-center transition ${wingsFlavor === flavor ? 'border-amber-400 bg-amber-400/10 text-amber-400' : 'border-zinc-800 bg-zinc-950 text-zinc-400'}`}
                        >
                          {flavor}
                        </button>
                      ))}
                    </div>
                  </div>

                  <button
                    disabled={!settings.isOpen}
                    onClick={() => handleAddToCart(null, true)}
                    className="w-full mt-2 py-4 bg-pink-500 hover:bg-pink-600 active:scale-95 transition rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-xl shadow-pink-500/10 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:scale-100"
                  >
                    <Plus size={20} />
                    <span>Add Wings Combo to Basket</span>
                  </button>
                </div>
              )}

              {/* Standard List Items */}
              {category.id !== "wings" && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {category.items.map(item => (
                    <div
                      key={item.id}
                      className={`p-6 rounded-2xl border bg-zinc-950 flex flex-col justify-between gap-4 transition hover:border-zinc-700 ${!item.inStock ? 'opacity-50' : ''}`}
                    >
                      <div className="flex items-start justify-between gap-4">
                        <div>
                          <h4 className="font-bold text-base font-display">{item.name}</h4>
                          <span className="text-zinc-500 text-xs">{item.qty || item.size || "Chef Special"}</span>
                        </div>
                        <span className="py-1 px-3 bg-zinc-900 border border-zinc-800 rounded-full text-pink-400 font-bold text-xs">
                          ${item.price.toFixed(2)}
                        </span>
                      </div>

                      {!item.inStock ? (
                        <div className="py-2.5 bg-zinc-900 rounded-xl text-center font-bold text-zinc-600 text-xs border border-zinc-800">
                          ○ SOLD OUT
                        </div>
                      ) : (
                        <button
                          disabled={!settings.isOpen}
                          onClick={() => handleAddToCart(item)}
                          className="w-full py-2.5 bg-zinc-900 hover:bg-pink-500/20 hover:border-pink-500 hover:text-pink-400 border border-zinc-800 rounded-xl font-bold transition flex items-center justify-center gap-2 text-xs disabled:opacity-50"
                        >
                          <Plus size={16} />
                          <span>Add to Combo Basket</span>
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))}
        </section>

        {/* Checkout Drawer/Panel */}
        <section className="bg-zinc-900 rounded-3xl border border-zinc-800 p-8 h-fit flex flex-col gap-6 sticky top-28">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
            <h3 className="font-display font-bold text-xl flex items-center gap-2">
              <ShoppingBag className="text-pink-500" />
              <span>Checkout Drawer</span>
            </h3>
            <span className="bg-pink-500 text-white rounded-full font-bold px-3 py-1 text-xs">{cart.length} items</span>
          </div>

          {cart.length === 0 ? (
            <div className="py-16 text-center text-zinc-500 text-sm flex flex-col items-center justify-center gap-3">
              <Utensils size={40} className="stroke-1" />
              <p>Your basket is currently empty.<br />Add delicious specialties to start!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {/* Basket list */}
              <div className="flex flex-col gap-4 max-h-60 overflow-y-auto pr-1">
                {cart.map(item => (
                  <div key={item.id} className="flex items-center justify-between gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                    <div className="flex-1">
                      <p className="font-bold">{item.name}</p>
                      <span className="text-zinc-500">${(item.price * item.qty).toFixed(2)}</span>
                    </div>
                    <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-1">
                      <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:bg-zinc-800 rounded"><Minus size={12} /></button>
                      <span className="font-bold px-1">{item.qty}</span>
                      <button onClick={() => updateCartQty(item.id, 1)} className="p-1 hover:bg-zinc-800 rounded"><Plus size={12} /></button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Checkout details form */}
              <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4 border-t border-zinc-800 pt-4">
                <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Contact Information:</span>
                <input
                  required
                  type="text"
                  placeholder="Your Name (for order window call)"
                  value={name}
                  onChange={e => setName(e.target.value)}
                  className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-pink-500 outline-none"
                />
                <input
                  required
                  type="tel"
                  placeholder="Mobile Phone (for automatic SMS alerts)"
                  value={phone}
                  onChange={e => setPhone(e.target.value)}
                  className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-pink-500 outline-none"
                />
                <textarea
                  placeholder="Special prep instructions (sauce on side, extra crispy...)"
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                  className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-pink-500 outline-none h-20 resize-none"
                />

                {/* Dual Billing option */}
                <div className="flex flex-col gap-3 mt-2">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Select Digital Payment Gate:</span>
                  <div className="grid grid-cols-2 gap-4">
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("cashapp")}
                      className={`p-3 rounded-xl border text-center transition font-bold text-xs ${paymentMethod === "cashapp" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}
                    >
                      Cash App
                    </button>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod("applepay")}
                      className={`p-3 rounded-xl border text-center transition font-bold text-xs ${paymentMethod === "applepay" ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}
                    >
                      Apple Pay
                    </button>
                  </div>
                </div>

                {paymentMethod === "cashapp" ? (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-3 animate-fade-in text-xs">
                    <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                      <span>Send to: <strong className="text-emerald-400">{settings.cashAppHandle}</strong></span>
                      <button type="button" onClick={() => copyToClipboard(settings.cashAppHandle, "Copied Cash App Cashtag!")} className="p-1 text-zinc-500 hover:text-white"><Copy size={14} /></button>
                    </div>
                    <p className="text-[10px] text-zinc-500">Open Cash App and send the exact total. input your sender $Cashtag here to let the owner verify and approve the order:</p>
                    <input
                      required
                      type="text"
                      placeholder="Your $Cashtag reference (e.g. $JohnDoe)"
                      value={cashtagInput}
                      onChange={e => setCashtagInput(e.target.value)}
                      className="w-full p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs focus:border-emerald-500 outline-none"
                    />
                  </div>
                ) : (
                  <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-3 animate-fade-in text-xs">
                    <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                      <span>Send to: <strong className="text-amber-400">{settings.applePayNumber}</strong></span>
                      <button type="button" onClick={() => copyToClipboard(settings.applePayNumber, "Copied Apple Pay Number!")} className="p-1 text-zinc-500 hover:text-white"><Copy size={14} /></button>
                    </div>
                    <p className="text-[10px] text-zinc-500">Send standard Apple Pay message matching the exact total. Input your active phone number digits below to verify payment:</p>
                    <input
                      required
                      type="text"
                      placeholder="Your Apple Pay Phone/Digits"
                      value={applePhoneInput}
                      onChange={e => setApplePhoneInput(e.target.value)}
                      className="w-full p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs focus:border-amber-500 outline-none"
                    />
                  </div>
                )}

                {/* Pricing summary */}
                <div className="flex flex-col gap-2 mt-2 text-xs border-t border-zinc-800 pt-4">
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Cart Subtotal:</span>
                    <span>${getSubtotal().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-zinc-500">Sales Tax (8.25%):</span>
                    <span>${getTax().toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between border-t border-zinc-800 pt-2 font-extrabold text-sm">
                    <span className="text-white">GRAND TOTAL:</span>
                    <span className="text-pink-400 animate-pulse">${getTotal().toFixed(2)}</span>
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting || !settings.isOpen}
                  className="w-full mt-4 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-xl shadow-emerald-500/10 disabled:bg-zinc-800 disabled:text-zinc-600 disabled:scale-100 text-sm"
                >
                  {isSubmitting ? (
                    <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full" />
                  ) : (
                    <>
                      <Send size={18} />
                      <span>Verify & Place Order Ticket</span>
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </section>
      </main>

      {/* Pulsing cart float for mobile viewports */}
      {cart.length > 0 && !isCartOpen && (
        <button
          onClick={() => setIsCartOpen(true)}
          className="fixed bottom-6 right-6 lg:hidden z-40 bg-pink-500 hover:bg-pink-600 text-white rounded-full p-5 shadow-2xl flex items-center gap-2 active:scale-95 transition animate-bounce border border-pink-400"
        >
          <ShoppingBag />
          <span className="font-bold text-xs bg-zinc-950 text-pink-400 rounded-full w-6 h-6 flex items-center justify-center border border-pink-400/20">{cart.length}</span>
        </button>
      )}

      {/* Mobile Drawer Overlay */}
      {isCartOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex justify-end bg-black/60 backdrop-blur-sm">
          <div className="w-full max-w-md h-full bg-[#16181e] flex flex-col p-6 animate-slide-in relative border-l border-zinc-800">
            <button onClick={() => setIsCartOpen(false)} className="absolute top-6 right-6 font-bold text-zinc-500 hover:text-white text-xs border border-zinc-800 bg-zinc-900 px-3 py-1.5 rounded-xl">CLOSE</button>
            <div className="flex-1 overflow-y-auto mt-10">
              {/* Nested Drawer details */}
              <div className="flex flex-col gap-6">
                <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
                  <h3 className="font-display font-bold text-xl flex items-center gap-2">
                    <ShoppingBag className="text-pink-500" />
                    <span>Checkout Basket</span>
                  </h3>
                </div>

                <div className="flex flex-col gap-4">
                  {cart.map(item => (
                    <div key={item.id} className="flex items-center justify-between gap-4 p-3 bg-zinc-950 rounded-xl border border-zinc-800 text-xs">
                      <div className="flex-1">
                        <p className="font-bold">{item.name}</p>
                        <span className="text-zinc-500">${(item.price * item.qty).toFixed(2)}</span>
                      </div>
                      <div className="flex items-center gap-2 border border-zinc-800 bg-zinc-900 rounded-lg p-1">
                        <button onClick={() => updateCartQty(item.id, -1)} className="p-1 hover:bg-zinc-800 rounded"><Minus size={12} /></button>
                        <span className="font-bold px-1">{item.qty}</span>
                        <button onClick={() => updateCartQty(item.id, 1)} className="p-1 hover:bg-zinc-800 rounded"><Plus size={12} /></button>
                      </div>
                    </div>
                  ))}
                </div>

                <form onSubmit={handlePlaceOrder} className="flex flex-col gap-4 border-t border-zinc-800 pt-4">
                  <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Contact Details:</span>
                  <input
                    required
                    type="text"
                    placeholder="Your Name (for order call)"
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-pink-500 outline-none"
                  />
                  <input
                    required
                    type="tel"
                    placeholder="Mobile Phone (for SMS alerts)"
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-pink-500 outline-none"
                  />
                  <textarea
                    placeholder="Special instructions..."
                    value={notes}
                    onChange={e => setNotes(e.target.value)}
                    className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-950 text-xs focus:border-pink-500 outline-none h-16 resize-none"
                  />

                  <div className="flex flex-col gap-3 mt-2">
                    <span className="text-xs font-semibold text-zinc-500 uppercase tracking-widest">Select Payment Gate:</span>
                    <div className="grid grid-cols-2 gap-4">
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("cashapp")}
                        className={`p-3 rounded-xl border text-center transition font-bold text-xs ${paymentMethod === "cashapp" ? "border-emerald-500 bg-emerald-500/10 text-emerald-400" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}
                      >
                        Cash App
                      </button>
                      <button
                        type="button"
                        onClick={() => setPaymentMethod("applepay")}
                        className={`p-3 rounded-xl border text-center transition font-bold text-xs ${paymentMethod === "applepay" ? "border-amber-400 bg-amber-400/10 text-amber-400" : "border-zinc-800 bg-zinc-950 text-zinc-400"}`}
                      >
                        Apple Pay
                      </button>
                    </div>
                  </div>

                  {paymentMethod === "cashapp" ? (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                        <span>Send to: <strong className="text-emerald-400">{settings.cashAppHandle}</strong></span>
                        <button type="button" onClick={() => copyToClipboard(settings.cashAppHandle, "Copied Cashtag!")} className="p-1 text-zinc-500 hover:text-white"><Copy size={14} /></button>
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="Your $Cashtag reference"
                        value={cashtagInput}
                        onChange={e => setCashtagInput(e.target.value)}
                        className="w-full p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs focus:border-emerald-500 outline-none"
                      />
                    </div>
                  ) : (
                    <div className="p-4 bg-zinc-950 border border-zinc-800 rounded-xl flex flex-col gap-3 text-xs">
                      <div className="flex items-center justify-between bg-zinc-900 p-2.5 rounded-lg border border-zinc-800">
                        <span>Send to: <strong className="text-amber-400">{settings.applePayNumber}</strong></span>
                        <button type="button" onClick={() => copyToClipboard(settings.applePayNumber, "Copied Number!")} className="p-1 text-zinc-500 hover:text-white"><Copy size={14} /></button>
                      </div>
                      <input
                        required
                        type="text"
                        placeholder="Your Apple Pay Phone/Digits"
                        value={applePhoneInput}
                        onChange={e => setApplePhoneInput(e.target.value)}
                        className="w-full p-3 rounded-lg border border-zinc-800 bg-zinc-900 text-xs focus:border-amber-500 outline-none"
                      />
                    </div>
                  )}

                  <div className="flex flex-col gap-2 mt-2 text-xs border-t border-zinc-800 pt-4">
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Cart Subtotal:</span>
                      <span>${getSubtotal().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-zinc-500">Sales Tax (8.25%):</span>
                      <span>${getTax().toFixed(2)}</span>
                    </div>
                    <div className="flex justify-between border-t border-zinc-800 pt-2 font-extrabold text-sm">
                      <span className="text-white">GRAND TOTAL:</span>
                      <span className="text-pink-400">${getTotal().toFixed(2)}</span>
                    </div>
                  </div>

                  <button
                    type="submit"
                    disabled={isSubmitting || !settings.isOpen}
                    className="w-full mt-4 py-4 bg-emerald-500 hover:bg-emerald-600 active:scale-95 transition rounded-2xl font-bold flex items-center justify-center gap-2 text-white shadow-xl disabled:bg-zinc-800 disabled:text-zinc-600 disabled:scale-100 text-sm"
                  >
                    {isSubmitting ? (
                      <span className="animate-spin border-2 border-white border-t-transparent w-5 h-5 rounded-full" />
                    ) : (
                      <>
                        <Send size={18} />
                        <span>Place Order Ticket</span>
                      </>
                    )}
                  </button>
                </form>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// -------------------------------------------------------------
// DIGITAL RECEIPT VOUCHER & LIVE PROGRESS TRACKER
// -------------------------------------------------------------
function ReceiptView({ id, showToast }) {
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(INITIAL_SETTINGS);

  const fetchOrder = () => {
    const o = getOrderById(id);
    if (o) setOrder(o);
  };

  useEffect(() => {
    fetchOrder();
    setSettings(getSettings());

    // Sync status adjustments instantly from tab modifications
    const unsubscribe = subscribeToSync((msg) => {
      if (msg.type === "ORDERS_UPDATE") {
        fetchOrder();
      }
    });
    return () => unsubscribe();
  }, [id]);

  if (!order) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center gap-4 bg-[#0f1013] text-center p-8">
        <AlertCircle size={48} className="text-pink-500 animate-pulse" />
        <h2 className="text-2xl font-bold font-display">Receipt Ticket Not Found</h2>
        <p className="text-zinc-500 text-xs">Verify your receipt link address or create a new order combo.</p>
        <a href="#/" className="mt-4 py-3 px-6 bg-zinc-900 border border-zinc-800 text-xs font-bold rounded-xl hover:border-pink-500 hover:text-pink-400">Return to ordering menu</a>
      </div>
    );
  }

  // Determine active prep phase index
  const getStatusIndex = () => {
    if (order.status === "Pending") return 0;
    if (order.status === "Preparing") return 1;
    if (order.status === "Ready") return 2;
    if (order.status === "Completed") return 3;
    return -1; // Cancelled
  };

  const steps = [
    { label: "Pending Verification", desc: "Awaiting Cash App/Apple Pay payment verification by the food truck kitchen owner.", color: "text-red-400" },
    { label: "Kitchen Preparing", desc: "Sizzlin' on the flat top grill combo kitchen. Estimated prepare time: " + settings.waitTime, color: "text-amber-400" },
    { label: "Ready for Pickup!", desc: "HOT & READY! Please walk up to the kitchen window and call order name.", color: "text-emerald-400" },
    { label: "Order Completed", desc: "Handed over to customer. Bon appétit!", color: "text-zinc-400" }
  ];

  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6 md:p-12 bg-[#0f1013] relative overflow-hidden bg-cover bg-center" style={{ backgroundImage: 'radial-gradient(circle at center, rgba(255, 51, 119, 0.05), transparent 70%)' }}>
      
      {/* Voucher card wrapper */}
      <div className="w-full max-w-2xl bg-zinc-950 border border-zinc-800 rounded-3xl p-6 md:p-10 flex flex-col gap-8 shadow-2xl relative">
        <div className="absolute top-6 right-6">
          <span className={`px-4 py-1.5 rounded-full border text-xs font-bold ${order.status === 'Cancelled' ? 'border-red-500 bg-red-500/10 text-red-400' : 'border-pink-500 bg-pink-500/10 text-pink-400 animate-pulse'}`}>
            ○ Status: {order.status.toUpperCase()}
          </span>
        </div>

        {/* Brand */}
        <div className="flex flex-col border-b border-zinc-800 pb-6">
          <h2 className="font-handwritten text-4xl font-extrabold text-pink-500 tracking-wider">Bella's Kitchen</h2>
          <span className="text-zinc-500 text-[10px] uppercase mt-1">Receipt ID: #{order.id} / Ordered: {order.timeLabel}</span>
        </div>

        {/* Chalkboard prepares Stepper */}
        {order.status === "Cancelled" ? (
          <div className="p-6 bg-red-950/20 border border-red-500/30 rounded-2xl flex items-center gap-3 text-red-400 text-xs">
            <AlertCircle />
            <div>
              <h4 className="font-bold">This Order Ticket was Cancelled</h4>
              <p className="text-zinc-500 mt-1">Please talk to the food truck cashier or order window support for assistance.</p>
            </div>
          </div>
        ) : (
          <div className="flex flex-col gap-6">
            <h3 className="font-display font-bold text-sm tracking-widest text-amber-400 uppercase">Preparation Queue Tracker</h3>
            <div className="flex flex-col gap-6">
              {steps.map((step, idx) => {
                const active = getStatusIndex() >= idx;
                const current = getStatusIndex() === idx;
                return (
                  <div key={idx} className="flex gap-4 items-start relative text-xs">
                    {/* Visual dot & connector */}
                    <div className="flex flex-col items-center">
                      <div className={`w-8 h-8 rounded-full border flex items-center justify-center font-bold text-xs ${current ? 'border-pink-500 bg-pink-500 text-white animate-ping' : active ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-zinc-800 bg-zinc-950 text-zinc-600'}`}>
                        {idx + 1}
                      </div>
                      {idx < steps.length - 1 && (
                        <div className={`w-0.5 h-12 ${getStatusIndex() > idx ? 'bg-pink-500' : 'bg-zinc-800'}`} />
                      )}
                    </div>
                    {/* Stepper info */}
                    <div className="flex-1 pt-1">
                      <h4 className={`font-bold ${active ? 'text-white' : 'text-zinc-600'} ${current ? 'text-pink-400' : ''}`}>{step.label}</h4>
                      {active && <p className="text-zinc-500 text-[11px] mt-1">{step.desc}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Voucher Invoice items */}
        <div className="border-t border-b border-zinc-800 py-6 my-2 text-xs flex flex-col gap-3">
          <span className="font-semibold text-zinc-500 uppercase tracking-widest">Order Details ({order.customerName}):</span>
          <div className="flex flex-col gap-3">
            {order.cart.map(item => (
              <div key={item.id} className="flex justify-between">
                <span>{item.name} <strong className="text-zinc-500 ml-1">x{item.qty}</strong></span>
                <span>${(item.price * item.qty).toFixed(2)}</span>
              </div>
            ))}
          </div>
          {order.notes && (
            <p className="p-3 bg-zinc-900 border border-zinc-800 text-[10px] rounded-xl text-zinc-500 mt-2 italic">Notes: "{order.notes}"</p>
          )}
        </div>

        {/* Cost breakdown details */}
        <div className="flex flex-col gap-2 text-xs">
          <div className="flex justify-between">
            <span className="text-zinc-500">Payment Reference Gate ({order.paymentMethod === "cashapp" ? "Cash App" : "Apple Pay"}):</span>
            <span className="font-bold text-white">{order.paymentRef}</span>
          </div>
          <div className="flex justify-between border-t border-zinc-800 pt-4 font-bold text-sm">
            <span className="text-zinc-500">Grand Total Paid:</span>
            <span className="text-pink-400">${order.total}</span>
          </div>
        </div>

        {/* Options */}
        <div className="flex gap-4 mt-4 text-xs">
          <a href="#/" className="flex-1 py-4 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-center font-bold rounded-2xl active:scale-95 transition">Return to Menu</a>
          <button onClick={() => showToast("📧 Receipt copy link saved!")} className="flex-1 py-4 bg-pink-500 hover:bg-pink-600 text-center text-white font-bold rounded-2xl active:scale-95 transition">Share Digital Receipt</button>
        </div>

      </div>
    </div>
  );
}

// -------------------------------------------------------------
// FULL SCREEN OWNER POS COCKPIT VIEW
// -------------------------------------------------------------
function AdminView({ showToast }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [passcode, setPasscode] = useState("");
  const [activeTab, setActiveTab] = useState("queue");
  const [settings, setSettings] = useState(INITIAL_SETTINGS);
  const [orders, setOrders] = useState([]);
  const [menu, setMenu] = useState([]);
  const [smsLogs, setSmsLogs] = useState([]);
  const [socialAccounts, setSocialAccounts] = useState({});
  const [aiPosts, setAiPosts] = useState([]);
  const [sharedPosts, setSharedPosts] = useState([]);

  // Live sidebar digital clock
  const [currentTime, setCurrentTime] = useState("");

  const refreshDB = () => {
    setSettings(getSettings());
    setOrders(getOrders());
    setMenu(getMenu());
    setSmsLogs(getSmsLogs());
    setSocialAccounts(getSocialAccounts());
    setAiPosts(getAiSuggestedPosts());
    setSharedPosts(getSharedPostsLog());
  };

  useEffect(() => {
    refreshDB();

    const interval = setInterval(() => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    }, 1000);

    const unsubscribe = subscribeToSync(() => {
      refreshDB();
    });

    return () => {
      clearInterval(interval);
      unsubscribe();
    };
  }, []);

  const handleLogin = (e) => {
    e.preventDefault();
    if (["admin", "601", "985"].includes(passcode.toLowerCase())) {
      setIsAuthenticated(true);
      showToast("🔓 POS Dashboard Unlocked! Welcome, Bella.");
    } else {
      showToast("🔒 Invalid passcode. Try again!", "error");
      setPasscode("");
    }
  };

  const handleUpdateStatus = (id, status) => {
    updateOrderStatus(id, status);
    showToast(`Order #${id} marked as ${status}!`);
    refreshDB();
  };

  const handleToggleStockItem = (itemId, inStock) => {
    toggleStock(itemId, inStock);
    showToast(`Stock item updated successfully!`);
    refreshDB();
  };

  const handleSaveSettings = (e) => {
    e.preventDefault();
    updateSettings(settings);
    showToast("💾 Configuration settings updated successfully!");
  };

  if (!isAuthenticated) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#0f1013] p-6 bg-cover bg-center" style={{ backgroundImage: 'linear-gradient(rgba(15,16,19,0.96), rgba(15,16,19,0.98)), url("/hero.png")' }}>
        <form onSubmit={handleLogin} className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col gap-6 text-center shadow-2xl relative">
          <ChefHat size={40} className="text-pink-500 mx-auto animate-bounce" />
          <h2 className="font-handwritten text-4xl font-extrabold text-pink-500">POS Dashboard Lock</h2>
          <p className="text-zinc-500 text-xs">Enter restaurant passcode to open the food truck admin control console.</p>
          <input
            required
            type="password"
            placeholder="Passcode (e.g. admin)"
            value={passcode}
            onChange={e => setPasscode(e.target.value)}
            className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-center tracking-widest text-white text-sm outline-none focus:border-pink-500"
          />
          <button type="submit" className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl active:scale-95 transition text-sm">
            Unlock Dashboard
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col lg:flex-row bg-[#0f1013] min-h-screen text-xs select-none">
      
      {/* Edge-to-edge fluid sidebar column */}
      <aside className="w-full lg:w-72 bg-zinc-950 border-r border-zinc-800 flex flex-col justify-between py-8 px-6 gap-8">
        <div className="flex flex-col gap-8">
          {/* Header Brand */}
          <div className="flex items-center gap-3 border-b border-zinc-800 pb-6">
            <div className="p-2.5 bg-pink-500/10 border border-pink-500/20 text-pink-400 rounded-xl animate-pulse">
              <ChefHat size={20} />
            </div>
            <div>
              <h2 className="font-display font-extrabold text-base tracking-wide text-white">Bella's POS</h2>
              <span className="text-zinc-500 text-[10px] uppercase font-bold tracking-widest">Kitchen Control</span>
            </div>
          </div>

          {/* Nav pills list */}
          <nav className="flex flex-col gap-2">
            {[
              { id: "queue", label: "👩‍🍳 Kitchen Queue", count: orders.filter(o => ["Pending", "Preparing", "Ready"].includes(o.status)).length },
              { id: "stock", label: "🥦 Stock Manager", count: 0 },
              { id: "analytics", label: "📈 POS Analytics", count: 0 },
              { id: "social", label: "🤖 AI Social Hub", count: aiPosts.length },
              { id: "autopilot", label: "🎙️ Voice Control", count: 0 },
              { id: "settings", label: "⚙️ SaaS Settings", count: 0 }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`py-3.5 px-4 rounded-xl font-bold flex items-center justify-between transition ${activeTab === tab.id ? 'bg-pink-500/10 border border-pink-500/20 text-pink-400' : 'bg-transparent text-zinc-500 hover:text-zinc-300'}`}
              >
                <span>{tab.label}</span>
                {tab.count > 0 && (
                  <span className="bg-pink-500 text-white rounded-full px-2 py-0.5 text-[9px] font-extrabold">{tab.count}</span>
                )}
              </button>
            ))}
          </nav>
        </div>

        {/* Footer clock & logout info */}
        <div className="flex flex-col gap-4 border-t border-zinc-800 pt-6">
          <div className="flex items-center justify-between text-zinc-500">
            <span className="font-semibold uppercase tracking-wider text-[10px]">Digital Clock:</span>
            <span className="font-mono text-zinc-300 font-bold">{currentTime || "--:--:--"}</span>
          </div>
          <button
            onClick={() => { setIsAuthenticated(false); setPasscode(""); }}
            className="w-full py-3 bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:text-red-400 rounded-xl font-bold transition"
          >
            Lock Dashboard
          </button>
        </div>
      </aside>

      {/* Main dashboard content panel */}
      <main className="flex-1 p-6 md:p-10 overflow-y-auto max-w-7xl mx-auto w-full">
        {activeTab === "queue" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-4">
              <div>
                <h3 className="font-display font-extrabold text-2xl">Kitchen Order Queue</h3>
                <p className="text-zinc-500 text-[11px] mt-1">Manage active orders preparation cycle and verify cash transfers.</p>
              </div>
              <button onClick={() => { localStorage.setItem("bellas_orders", JSON.stringify([])); refreshDB(); }} className="py-2.5 px-4 bg-zinc-900 border border-zinc-800 hover:border-red-500 hover:text-red-400 rounded-xl font-bold transition text-xs">Clear Orders Logs</button>
            </div>

            {orders.length === 0 ? (
              <div className="py-24 text-center text-zinc-500 text-xs border border-zinc-800 bg-zinc-950 rounded-3xl flex flex-col items-center justify-center gap-3">
                <Utensils size={48} className="text-zinc-600 stroke-1" />
                <p>No orders registered today.<br />Customer orders will sync automatically in real-time.</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {orders.map(order => (
                  <div
                    key={order.id}
                    className={`p-6 rounded-2xl border bg-zinc-950 flex flex-col justify-between gap-6 transition hover:border-zinc-800 ${order.status === 'Cancelled' ? 'opacity-40' : ''}`}
                  >
                    {/* Header */}
                    <div className="flex items-start justify-between border-b border-zinc-900 pb-4">
                      <div>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-sm">Order #{order.id}</h4>
                          <span className={`px-2 py-0.5 rounded text-[10px] font-bold ${order.status === 'Pending' ? 'bg-red-500/10 text-red-400 border border-red-500/20' : order.status === 'Preparing' ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : order.status === 'Ready' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 animate-pulse' : 'bg-zinc-800 text-zinc-400'}`}>
                            {order.status}
                          </span>
                        </div>
                        <span className="text-zinc-500 text-[10px] mt-1 block">Customer: {order.customerName} ({order.customerPhone})</span>
                      </div>
                      <span className="text-pink-400 font-extrabold text-base">${order.total}</span>
                    </div>

                    {/* Cart Items list */}
                    <div className="flex flex-col gap-2">
                      <span className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest">Ordered Combo items:</span>
                      {order.cart.map(item => (
                        <div key={item.id} className="flex justify-between">
                          <span>{item.name} <strong className="text-zinc-500 ml-1">x{item.qty}</strong></span>
                          <span>${(item.price * item.qty).toFixed(2)}</span>
                        </div>
                      ))}
                      {order.notes && (
                        <p className="p-2.5 bg-zinc-900 border border-zinc-800 text-[10px] rounded-lg text-zinc-500 italic mt-2">Notes: "{order.notes}"</p>
                      )}
                    </div>

                    {/* Payment verification */}
                    <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800 text-[11px]">
                      <div>
                        <span className="text-zinc-500 block uppercase text-[8px] tracking-wider">Ref Gate ({order.paymentMethod.toUpperCase()}):</span>
                        <strong className="text-white">{order.paymentRef}</strong>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-zinc-500">Verified?</span>
                        <input
                          type="checkbox"
                          checked={order.paymentVerified}
                          onChange={(e) => { updateOrderPaymentStatus(order.id, e.target.checked); refreshDB(); }}
                          className="w-4 h-4 accent-emerald-500"
                        />
                      </div>
                    </div>

                    {/* Queue Actions */}
                    {order.status !== "Cancelled" && order.status !== "Completed" && (
                      <div className="flex gap-2">
                        {order.status === "Pending" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "Preparing")}
                            className="flex-1 py-2.5 bg-amber-500 hover:bg-amber-600 text-white font-bold rounded-xl active:scale-95 transition"
                          >
                            👩‍🍳 Prepare
                          </button>
                        )}
                        {order.status === "Preparing" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "Ready")}
                            className="flex-1 py-2.5 bg-emerald-500 hover:bg-emerald-600 text-white font-bold rounded-xl active:scale-95 transition animate-pulse"
                          >
                            🔔 Mark Ready
                          </button>
                        )}
                        {order.status === "Ready" && (
                          <button
                            onClick={() => handleUpdateStatus(order.id, "Completed")}
                            className="flex-1 py-2.5 bg-blue-500 hover:bg-blue-600 text-white font-bold rounded-xl active:scale-95 transition"
                          >
                            ✓ Complete Order
                          </button>
                        )}
                        <button
                          onClick={() => handleUpdateStatus(order.id, "Cancelled")}
                          className="py-2.5 px-4 bg-zinc-900 hover:bg-red-500/10 border border-zinc-800 hover:border-red-500/40 hover:text-red-400 font-bold rounded-xl transition"
                        >
                          Cancel
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "stock" && (
          <div className="flex flex-col gap-6 animate-fade-in">
            <div>
              <h3 className="font-display font-extrabold text-2xl">Culinary Stock Manager</h3>
              <p className="text-zinc-500 text-[11px] mt-1">Toggle item availability in real-time. Sold out items disable immediately in customer portals.</p>
            </div>

            <div className="flex flex-col gap-8">
              {menu.map(category => (
                <div key={category.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col gap-4">
                  <h4 className="font-display font-bold text-base border-b border-zinc-900 pb-3 text-pink-400">{category.name}</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {category.items.map(item => (
                      <div key={item.id} className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                        <span className="font-bold">{item.name}</span>
                        <button
                          onClick={() => handleToggleStockItem(item.id, !item.inStock)}
                          className={`py-1.5 px-4 rounded-lg font-bold border text-[10px] tracking-wide transition ${item.inStock ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                        >
                          {item.inStock ? "● IN STOCK" : "○ SOLD OUT"}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {activeTab === "analytics" && (
          <div className="flex flex-col gap-8 animate-fade-in">
            <div>
              <h3 className="font-display font-extrabold text-2xl">POS Financial Analytics</h3>
              <p className="text-zinc-500 text-[11px] mt-1">Real-time calculations of diner revenue metrics and popular items rankings.</p>
            </div>

            {/* Metrics cards grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              {[
                { label: "Today's Revenue", val: `$${getAnalytics().todayRevenue}`, change: "Live sync updates" },
                { label: "Today's Orders", val: getAnalytics().todayOrders, change: "Cooking tickets count" },
                { label: "Lifetime Revenue", val: `$${getAnalytics().lifetimeRevenue}`, change: "SaaS baseline added" },
                { label: "Average Ticket Value", val: `$${getAnalytics().avgOrderValue}`, change: "Dynamic average" }
              ].map((card, idx) => (
                <div key={idx} className="p-6 bg-zinc-950 border border-zinc-800 rounded-2xl flex flex-col gap-2">
                  <span className="text-zinc-500 uppercase tracking-widest text-[9px] font-semibold">{card.label}</span>
                  <strong className="text-2xl font-extrabold text-white">{card.val}</strong>
                  <span className="text-pink-500 font-bold text-[10px] mt-1">{card.change}</span>
                </div>
              ))}
            </div>

            {/* Leaderboard */}
            <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-3xl max-w-xl flex flex-col gap-6">
              <h4 className="font-display font-bold text-base border-b border-zinc-900 pb-4 flex items-center gap-2">
                <TrendingUp className="text-pink-500" />
                <span>Top Sellers Leaderboard</span>
              </h4>
              <div className="flex flex-col gap-4">
                {getAnalytics().topSellers.map((item, idx) => (
                  <div key={idx} className="flex items-center justify-between gap-4 p-4 bg-zinc-900 border border-zinc-800 rounded-xl">
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-pink-500/10 border border-pink-500/20 text-pink-400 font-bold text-xs flex items-center justify-center">{idx + 1}</span>
                      <span className="font-bold">{item.name}</span>
                    </div>
                    <span className="text-amber-400 font-extrabold">{item.sales} sold</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {activeTab === "social" && (
          <SocialHubView
            showToast={showToast}
            socialAccounts={socialAccounts}
            setSocialAccounts={setSocialAccounts}
            aiPosts={aiPosts}
            setAiPosts={setAiPosts}
            sharedPosts={sharedPosts}
            setSharedPosts={setSharedPosts}
          />
        )}

        {activeTab === "autopilot" && (
          <AutopilotView
            showToast={showToast}
            settings={settings}
            setSettings={setSettings}
            menu={menu}
            setMenu={setMenu}
            orders={orders}
            setOrders={setOrders}
          />
        )}

        {activeTab === "settings" && (
          <div className="flex flex-col gap-6 max-w-2xl animate-fade-in">
            <div>
              <h3 className="font-display font-extrabold text-2xl">SaaS Config & Gateway Control</h3>
              <p className="text-zinc-500 text-[11px] mt-1">Configure credentials variables,estimated wait times, and Twilio SMS Account details.</p>
            </div>

            <form onSubmit={handleSaveSettings} className="bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col gap-6">
              
              {/* Daily business info */}
              <div className="flex flex-col gap-4">
                <h4 className="font-bold text-xs text-pink-400 uppercase tracking-widest border-b border-zinc-900 pb-3">Daily Operations</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Wait Time string:</span>
                    <input
                      type="text"
                      value={settings.waitTime}
                      onChange={e => setSettings(prev => ({ ...prev, waitTime: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none focus:border-pink-500"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Sales Tax Rate:</span>
                    <input
                      type="number"
                      step="0.0001"
                      value={settings.taxRate}
                      onChange={e => setSettings(prev => ({ ...prev, taxRate: parseFloat(e.target.value) }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none focus:border-pink-500"
                    />
                  </div>
                </div>
                <div className="flex items-center justify-between p-3 bg-zinc-900 rounded-xl border border-zinc-800 mt-2">
                  <span>Diner Order Portal Status:</span>
                  <button
                    type="button"
                    onClick={() => setSettings(prev => ({ ...prev, isOpen: !prev.isOpen }))}
                    className={`py-1.5 px-4 rounded-lg font-bold border text-[10px] tracking-wide transition ${settings.isOpen ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' : 'border-zinc-800 bg-zinc-950 text-zinc-500'}`}
                  >
                    {settings.isOpen ? "● OPEN FOR ORDERS" : "○ SHUT DOWN"}
                  </button>
                </div>
              </div>

              {/* Payment configs */}
              <div className="flex flex-col gap-4 mt-4">
                <h4 className="font-bold text-xs text-pink-400 uppercase tracking-widest border-b border-zinc-900 pb-3">Billing Gateways</h4>
                <div className="grid grid-cols-3 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Cash App Tag:</span>
                    <input
                      type="text"
                      value={settings.cashAppHandle}
                      onChange={e => setSettings(prev => ({ ...prev, cashAppHandle: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Cash App Phone:</span>
                    <input
                      type="text"
                      value={settings.cashAppPhone}
                      onChange={e => setSettings(prev => ({ ...prev, cashAppPhone: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Apple Pay Phone:</span>
                    <input
                      type="text"
                      value={settings.applePayNumber}
                      onChange={e => setSettings(prev => ({ ...prev, applePayNumber: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              {/* Twilio SMS settings */}
              <div className="flex flex-col gap-4 mt-4">
                <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                  <h4 className="font-bold text-xs text-pink-400 uppercase tracking-widest">Twilio SMS Account Gateway</h4>
                  <div className="flex items-center gap-2">
                    <span className="text-zinc-500 text-[10px]">Enable Real SMS:</span>
                    <input
                      type="checkbox"
                      checked={settings.enableTwilio}
                      onChange={e => setSettings(prev => ({ ...prev, enableTwilio: e.target.checked }))}
                      className="w-4 h-4 accent-emerald-500 animate-pulse"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Twilio Account SID:</span>
                    <input
                      placeholder="AC..."
                      type="text"
                      value={settings.twilioSid}
                      onChange={e => setSettings(prev => ({ ...prev, twilioSid: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Twilio Auth Token:</span>
                    <input
                      placeholder="token..."
                      type="password"
                      value={settings.twilioToken}
                      onChange={e => setSettings(prev => ({ ...prev, twilioToken: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Twilio Sender Number:</span>
                    <input
                      placeholder="+1985..."
                      type="text"
                      value={settings.twilioNumber}
                      onChange={e => setSettings(prev => ({ ...prev, twilioNumber: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none"
                    />
                  </div>
                  <div className="flex flex-col gap-2">
                    <span className="text-zinc-500">Alert Notification Phone:</span>
                    <input
                      placeholder="e.g. 985-286-3391"
                      type="text"
                      value={settings.alertPhone}
                      onChange={e => setSettings(prev => ({ ...prev, alertPhone: e.target.value }))}
                      className="p-3 bg-zinc-900 border border-zinc-800 rounded-lg text-xs outline-none"
                    />
                  </div>
                </div>
              </div>

              <button type="submit" className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl active:scale-95 transition text-xs mt-4">
                Save All Configurations
              </button>
            </form>
          </div>
        )}

      </main>
    </div>
  );
}

// -------------------------------------------------------------
// 🥦 AI SOCIAL HUB MODULE VIEW
// -------------------------------------------------------------
function SocialHubView({
  showToast,
  socialAccounts,
  setSocialAccounts,
  aiPosts,
  setAiPosts,
  sharedPosts,
  setSharedPosts
}) {
  const [isLinking, setIsLinking] = useState(false);
  const [linkingPlatform, setLinkingPlatform] = useState("");
  const [mockUsername, setMockUsername] = useState("");
  const [mockPass, setMockPass] = useState("");

  const [isPublishing, setIsPublishing] = useState(false);
  const [publishingStep, setPublishingStep] = useState(0);
  const [activePost, setActivePost] = useState(null);

  const [promptText, setPromptText] = useState("");

  const handleLinkChannel = (platform) => {
    setLinkingPlatform(platform);
    setMockUsername("");
    setMockPass("");
    setIsLinking(true);
  };

  const handleAuthSubmit = (e) => {
    e.preventDefault();
    if (!mockUsername.trim()) return;

    const updated = {
      ...socialAccounts,
      [linkingPlatform]: { connected: true, handle: `@${mockUsername}` }
    };
    updateSocialAccounts(updated);
    setSocialAccounts(updated);
    setIsLinking(false);
    showToast(`🟢 Connected mock ${linkingPlatform} page handle: @${mockUsername}!`);
  };

  const handleApproveAndShare = (post) => {
    setActivePost(post);
    setIsPublishing(true);
    setPublishingStep(0);

    const steps = [
      "Formatting draft storyboards details...",
      "Merging trending lofi audio tracks with reels overlay...",
      "Uploading assets to social network hosting servers...",
      "Campaign published successfully! Logging transaction logs."
    ];

    let current = 0;
    const interval = setInterval(() => {
      current++;
      if (current < steps.length) {
        setPublishingStep(current);
      } else {
        clearInterval(interval);
        const { remainingPosts, shared } = approveAndSharePost(post.id);
        setAiPosts(remainingPosts);
        setSharedPosts(shared);
        setIsPublishing(false);
        showToast("🚀 AI Social campaign live on feed logs!");
      }
    }, 1500);
  };

  const handleCustomPrompt = (e) => {
    e.preventDefault();
    if (!promptText.trim()) return;

    const remaining = draftCustomPost(promptText);
    setAiPosts(remaining);
    setPromptText("");
    showToast("🧠 AI drafted a custom campaign matching your prompt!");
  };

  const handleDecline = (id) => {
    const remaining = declineSuggestedPost(id);
    setAiPosts(remaining);
    showToast("🗑️ Social post draft suggestion declined.");
  };

  const socialList = [
    { id: "instagram", name: "Instagram Business", color: "text-pink-500", border: "border-pink-500/20" },
    { id: "tiktok", name: "TikTok Creator Hub", color: "text-zinc-300", border: "border-zinc-800" },
    { id: "youtube", name: "YouTube Shorts API", color: "text-red-500", border: "border-red-500/20" },
    { id: "facebook", name: "Facebook Business Pages", color: "text-blue-500", border: "border-blue-500/20" }
  ];

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <div>
        <h3 className="font-display font-extrabold text-2xl">AI Social Hub & Campaign Publisher</h3>
        <p className="text-zinc-500 text-[11px] mt-1">Link mock profiles handles, leverage AI campaign suggestions, and animate high-end publisher sequences.</p>
      </div>

      {/* Linked Accounts Column */}
      <div className="flex flex-col gap-4">
        <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500">Connected Social Channels</h4>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {socialList.map(platform => {
            const acc = socialAccounts[platform.id] || { connected: false };
            return (
              <div key={platform.id} className={`p-6 bg-zinc-950 border rounded-2xl flex flex-col justify-between gap-4 ${platform.border}`}>
                <div>
                  <h5 className="font-bold font-display">{platform.name}</h5>
                  <span className={`text-[10px] font-bold block mt-1 ${acc.connected ? 'text-emerald-400' : 'text-zinc-500'}`}>
                    {acc.connected ? `🟢 Connected: ${acc.handle}` : '⚪ Disconnected'}
                  </span>
                </div>
                {!acc.connected ? (
                  <button onClick={() => handleLinkChannel(platform.id)} className="w-full py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 rounded-xl font-bold transition text-[10px] text-zinc-400 hover:text-white">
                    Link Channel
                  </button>
                ) : (
                  <button onClick={() => {
                    const updated = { ...socialAccounts, [platform.id]: { connected: false, handle: "" } };
                    updateSocialAccounts(updated);
                    setSocialAccounts(updated);
                    showToast(`Dislinked ${platform.name}`);
                  }} className="w-full py-2 bg-zinc-950 border border-zinc-900 text-zinc-600 hover:text-red-400 hover:border-red-500/30 rounded-xl font-bold transition text-[10px]">
                    Disconnect
                  </button>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Campaign Suggestions & custom prompt */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Suggested posts list */}
        <div className="lg:col-span-2 flex flex-col gap-6">
          <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500">AI Suggested Draft Campaigns</h4>
          
          {aiPosts.length === 0 ? (
            <div className="py-20 text-center text-zinc-500 border border-zinc-800 bg-zinc-950 rounded-3xl flex flex-col items-center justify-center gap-3">
              <Sparkles size={36} className="text-zinc-700 animate-spin" />
              <p>No campaign drafts suggested.<br />Type a custom prompt to ask the AI Social Agent!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-6">
              {aiPosts.map(post => (
                <div key={post.id} className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col gap-4 relative">
                  <div className="flex items-center justify-between border-b border-zinc-900 pb-3">
                    <div>
                      <span className="px-2.5 py-0.5 rounded bg-pink-500/10 text-pink-400 border border-pink-500/20 font-bold text-[9px] uppercase tracking-wide">{post.type}</span>
                      <h4 className="font-bold mt-1 text-sm">{post.title}</h4>
                    </div>
                    <span className="text-[10px] text-zinc-500 font-bold uppercase">{post.platform}</span>
                  </div>

                  <div className="flex flex-col gap-2">
                    <p className="text-zinc-500"><strong className="text-zinc-400">Audio reference:</strong> {post.audio}</p>
                    <div className="p-4 bg-zinc-900 rounded-2xl border border-zinc-800 mt-1">
                      <span className="text-[10px] font-bold text-zinc-400 block mb-2 uppercase">Video Storyboard details:</span>
                      <p className="text-zinc-400 whitespace-pre-line leading-relaxed text-[11px]">{post.storyboard}</p>
                    </div>
                    <p className="text-amber-400 font-medium italic text-[11px] mt-2">"{post.caption}"</p>
                  </div>

                  <div className="flex gap-3 border-t border-zinc-900 pt-4 mt-2">
                    <button onClick={() => handleApproveAndShare(post)} className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl active:scale-95 transition text-[11px] flex items-center justify-center gap-2">
                      <Share2 size={14} />
                      <span>Approve & Share on Feed</span>
                    </button>
                    <button onClick={() => handleDecline(post.id)} className="py-3 px-5 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 font-bold rounded-xl active:scale-95 transition text-zinc-400 hover:text-white text-[11px]">
                      Decline
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Ask Social Autopilot panel */}
        <div className="flex flex-col gap-6">
          <h4 className="font-bold text-xs uppercase tracking-widest text-zinc-500">Ask AI Social Agent</h4>
          
          <form onSubmit={handleCustomPrompt} className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col gap-4">
            <span className="text-zinc-500 leading-normal">Instruct the AI Social Agent to draft campaign caption scripts and video visual outlines:</span>
            <textarea
              required
              placeholder="e.g. Write a TikTok script promoting a happy hour 6pc wings w/ loaded fries bundle..."
              value={promptText}
              onChange={e => setPromptText(e.target.value)}
              className="w-full p-4 rounded-2xl border border-zinc-800 bg-zinc-900 text-xs focus:border-pink-500 outline-none h-32 resize-none leading-relaxed"
            />
            <button type="submit" className="w-full py-4 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-2xl active:scale-95 transition text-xs flex items-center justify-center gap-2">
              <Sparkles size={16} />
              <span>Submit Campaign Command</span>
            </button>
          </form>

          {/* Social logs timeline */}
          <div className="p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col gap-4">
            <span className="font-bold text-zinc-400 uppercase tracking-wider text-[10px] border-b border-zinc-900 pb-3">Campaign Logs Feed</span>
            {sharedPosts.length === 0 ? (
              <span className="text-zinc-600 italic block py-4 text-center">No campaign posts logged.</span>
            ) : (
              <div className="flex flex-col gap-4 max-h-80 overflow-y-auto pr-1">
                {sharedPosts.map(post => (
                  <div key={post.id} className="p-3 bg-zinc-900 border border-zinc-800 rounded-xl flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-pink-400">{post.title}</span>
                      <span className="text-zinc-600 text-[9px]">{post.timestamp}</span>
                    </div>
                    <p className="text-zinc-500 text-[10px] line-clamp-2">"{post.caption}"</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

      </div>

      {/* Linked channels OAuth authenticate Modal */}
      {isLinking && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-6">
          <form onSubmit={handleAuthSubmit} className="w-full max-w-sm bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col gap-6 text-center animate-scale-up relative">
            <Lock size={36} className="text-pink-500 mx-auto animate-pulse" />
            <div>
              <h4 className="font-display font-extrabold text-lg text-white">OAuth Channel Authorize</h4>
              <p className="text-zinc-500 text-[11px] mt-1 uppercase">Link Platform: {linkingPlatform}</p>
            </div>
            <div className="flex flex-col gap-3">
              <input
                required
                type="text"
                placeholder="Linked account username"
                value={mockUsername}
                onChange={e => setMockUsername(e.target.value)}
                className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:border-pink-500 outline-none"
              />
              <input
                required
                type="password"
                placeholder="Account password credentials"
                value={mockPass}
                onChange={e => setMockPass(e.target.value)}
                className="w-full p-4 rounded-xl border border-zinc-800 bg-zinc-900 text-xs focus:border-pink-500 outline-none"
              />
            </div>
            <div className="flex gap-4">
              <button type="submit" className="flex-1 py-3 bg-pink-500 hover:bg-pink-600 text-white font-bold rounded-xl active:scale-95 transition text-[11px]">Authorize Link</button>
              <button type="button" onClick={() => setIsLinking(false)} className="flex-1 py-3 bg-zinc-900 border border-zinc-800 font-bold rounded-xl active:scale-95 transition text-zinc-400 hover:text-white text-[11px]">Cancel</button>
            </div>
          </form>
        </div>
      )}

      {/* Multi-Stage Publishing animated Overlay */}
      {isPublishing && activePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-6">
          <div className="w-full max-w-md bg-zinc-950 border border-zinc-800 rounded-3xl p-8 flex flex-col gap-6 shadow-2xl animate-scale-up relative">
            <h4 className="font-display font-extrabold text-base text-white flex items-center gap-2 border-b border-zinc-900 pb-4">
              <Sparkles className="text-pink-500 animate-spin" />
              <span>Multi-Stage AI Social Publisher</span>
            </h4>
            <p className="text-zinc-500 leading-normal">Filing social API triggers to mock server network grids...</p>

            <div className="flex flex-col gap-4 my-2">
              {[
                "Formatting draft storyboards details...",
                "Merging trending lofi audio tracks with reels overlay...",
                "Uploading assets to social network hosting servers...",
                "Campaign published successfully! Logging transaction logs."
              ].map((step, idx) => {
                const active = publishingStep >= idx;
                const current = publishingStep === idx;
                return (
                  <div key={idx} className="flex items-center gap-3 text-xs">
                    <div className={`w-5 h-5 rounded-full border flex items-center justify-center font-bold text-[10px] ${current ? 'border-pink-500 bg-pink-500 text-white animate-pulse' : active ? 'border-pink-500 bg-pink-500/10 text-pink-400' : 'border-zinc-800 bg-zinc-950 text-zinc-700'}`}>
                      {idx + 1}
                    </div>
                    <span className={`${active ? 'text-white font-bold' : 'text-zinc-600'} ${current ? 'text-pink-400 animate-pulse' : ''}`}>{step}</span>
                  </div>
                );
              })}
            </div>

            {/* Simulated loading bar */}
            <div className="w-full bg-zinc-900 h-2 rounded-full overflow-hidden border border-zinc-800">
              <div
                className="bg-pink-500 h-full transition-all duration-1000 ease-out"
                style={{ width: `${(publishingStep + 1) * 25}%` }}
              />
            </div>
          </div>
        </div>
      )}

    </div>
  );
}

// -------------------------------------------------------------
// 🎙️ AI AUTOPILOT VOICE CONTROL VIEW MODULE
// -------------------------------------------------------------
function AutopilotView({
  showToast,
  settings,
  setSettings,
  menu,
  setMenu,
  orders,
  setOrders
}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState("");
  const [typedCommand, setTypedCommand] = useState("");
  const [aiLogs, setAiLogs] = useState([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [latestAction, setLatestAction] = useState(null);

  const recognitionRef = useRef(null);

  // Initialize Speech Capture Recognition Web API
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      const rec = new SpeechRecognition();
      rec.continuous = false;
      rec.interimResults = true;
      rec.lang = "en-US";

      rec.onstart = () => {
        setIsListening(true);
        setTranscript("");
        setLatestAction(null);
        setAiLogs([
          "🎙️ [Audio Capture] Web Speech API initialized.",
          "🎤 Listening for owner voice command... Speak clearly!"
        ]);
        playAlertSound("success");
      };

      rec.onresult = (event) => {
        let currentTranscript = "";
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          currentTranscript += event.results[i][0].transcript;
        }
        setTranscript(currentTranscript);
      };

      rec.onerror = (event) => {
        console.error("Speech Recognition error:", event.error);
        setIsListening(false);
        setAiLogs(prev => [
          ...prev,
          `⚠️ [Audio Error] Speech capture failed: ${event.error}. Fallback to keyboard.`
        ]);
      };

      rec.onend = () => {
        setIsListening(false);
      };

      recognitionRef.current = rec;
    }
  }, []);

  const handleStartListening = () => {
    if (recognitionRef.current && !isListening) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.error("Speech Recognition already active");
      }
    }
  };

  const handleStopListening = () => {
    if (recognitionRef.current && isListening) {
      recognitionRef.current.stop();
      // Execute command shortly after capture
      setTimeout(() => {
        if (transcript.trim()) {
          processAutopilotQuery(transcript);
        }
      }, 500);
    }
  };

  const handleTypeSubmit = (e) => {
    e.preventDefault();
    if (!typedCommand.trim()) return;

    processAutopilotQuery(typedCommand);
    setTypedCommand("");
  };

  // NLU Local Intent Parser Autopilot logic
  const processAutopilotQuery = (query) => {
    setIsProcessing(true);
    setAiLogs(prev => [
      ...prev,
      `🎙️ [Audio Capture] Finished. Captured words: "${query}"`,
      "🧠 [NLU Parser] Tokenizing parameters, scanning intent matrices..."
    ]);

    setTimeout(() => {
      const q = query.toLowerCase();
      let matched = false;
      let logs = [];
      let toastMsg = "";
      let newSettings = { ...settings };

      // Intent 1: Truck status offline
      if (q.includes("close") || q.includes("stop taking") || q.includes("shut down")) {
        newSettings.isOpen = false;
        updateSettings(newSettings);
        setSettings(newSettings);
        toastMsg = "SaaS ordering portal has been shut down.";
        logs = [
          "🎯 [Intent Match] Match found: 'SET_PORTAL_OFFLINE'",
          "💾 [Execution] Set Daily Operations state 'isOpen' to false.",
          "💾 [Database Sync] Transmitted SETTINGS_UPDATE events to active channels."
        ];
        matched = true;
      }
      // Intent 2: Truck status online
      else if (q.includes("open") || q.includes("take order") || q.includes("start taking")) {
        newSettings.isOpen = true;
        updateSettings(newSettings);
        setSettings(newSettings);
        toastMsg = "SaaS ordering portal open for customer orders.";
        logs = [
          "🎯 [Intent Match] Match found: 'SET_PORTAL_ONLINE'",
          "💾 [Execution] Set Daily Operations state 'isOpen' to true.",
          "💾 [Database Sync] Transmitted SETTINGS_UPDATE events to active channels."
        ];
        matched = true;
      }
      // Intent 3: Set Wait Time
      else if (q.includes("wait time") || q.includes("minutes") || q.includes("mins")) {
        const matches = q.match(/\d+[\s-]*(?:to[\s-]*)?\d*/);
        const mins = matches ? matches[0] + " mins" : "15 minutes";
        newSettings.waitTime = mins;
        updateSettings(newSettings);
        setSettings(newSettings);
        toastMsg = `Estimated wait time changed to ${mins}.`;
        logs = [
          "🎯 [Intent Match] Match found: 'SET_ESTIMATED_WAIT_TIME'",
          `💾 [Execution] Set Daily Operations 'waitTime' variable to: "${mins}"`,
          "💾 [Database Sync] Transmitted SETTINGS_UPDATE events to active channels."
        ];
        matched = true;
      }
      // Intent 4: Set Cash App tag
      else if (q.includes("cash app handle") || q.includes("cash app tag") || q.includes("cashtag")) {
        const words = query.split(" ");
        const tag = words.find(w => w.startsWith("$")) || ("$" + words[words.length - 1].toUpperCase());
        newSettings.cashAppHandle = tag;
        updateSettings(newSettings);
        setSettings(newSettings);
        toastMsg = `Cash App handle tag changed to ${tag}.`;
        logs = [
          "🎯 [Intent Match] Match found: 'SET_CASH_APP_HANDLE'",
          `💾 [Execution] Set Config 'cashAppHandle' variable to: "${tag}"`,
          "💾 [Database Sync] Transmitted SETTINGS_UPDATE events to active channels."
        ];
        matched = true;
      }
      // Intent 5: Toggle stock sold out
      else if (q.includes("sold out") || q.includes("unavailable") || q.includes("stock out")) {
        // Simple fuzzy item searcher
        let targetItem = null;
        let categories = getMenu();
        for (let cat of categories) {
          for (let item of cat.items) {
            const nameParts = item.name.toLowerCase().split(" ");
            if (nameParts.some(part => q.includes(part))) {
              targetItem = item;
              break;
            }
          }
          if (targetItem) break;
        }

        if (targetItem) {
          toggleStock(targetItem.id, false);
          toastMsg = `${targetItem.name} marked as sold out.`;
          logs = [
            "🎯 [Intent Match] Match found: 'TOGGLE_STOCK_OFFLINE'",
            `💾 [Execution] Toggle stock variable in menu database: itemId: "${targetItem.id}" ➔ false`,
            "💾 [Database Sync] Transmitted MENU_UPDATE events to active channels."
          ];
          matched = true;
        }
      }
      // Intent 6: Toggle stock in stock
      else if (q.includes("in stock") || q.includes("available") || q.includes("restock")) {
        let targetItem = null;
        let categories = getMenu();
        for (let cat of categories) {
          for (let item of cat.items) {
            const nameParts = item.name.toLowerCase().split(" ");
            if (nameParts.some(part => q.includes(part))) {
              targetItem = item;
              break;
            }
          }
          if (targetItem) break;
        }

        if (targetItem) {
          toggleStock(targetItem.id, true);
          toastMsg = `${targetItem.name} restocked and available.`;
          logs = [
            "🎯 [Intent Match] Match found: 'TOGGLE_STOCK_ONLINE'",
            `💾 [Execution] Toggle stock variable in menu database: itemId: "${targetItem.id}" ➔ true`,
            "💾 [Database Sync] Transmitted MENU_UPDATE events to active channels."
          ];
          matched = true;
        }
      }
      // Intent 7: Kitchen Order updates
      else if (q.includes("order") && (q.includes("ready") || q.includes("prepare") || q.includes("complete"))) {
        const orderIdMatch = q.match(/\d+/);
        if (orderIdMatch) {
          const oId = orderIdMatch[0];
          let action = q.includes("ready") ? "Ready" : q.includes("prepare") ? "Preparing" : "Completed";
          updateOrderStatus(oId, action);
          toastMsg = `Order #${oId} marked as ${action}!`;
          logs = [
            "🎯 [Intent Match] Match found: 'UPDATE_ORDER_STATUS'",
            `💾 [Execution] Advance ticket status inside orders array: orderId: "${oId}" ➔ "${action}"`,
            "💾 [Database Sync] Transmitted ORDERS_UPDATE events. Dispatched Twilio SMS notifications."
          ];
          matched = true;
        }
      }

      if (matched) {
        setAiLogs(prev => [
          ...prev,
          ...logs,
          "🟢 [Operational Autopilot SUCCESS] State updated successfully."
        ]);
        setLatestAction(toastMsg);
        showToast("🎙️ Autopilot executed: " + toastMsg);
      } else {
        setAiLogs(prev => [
          ...prev,
          "❌ [NLU Parser] Unknown instruction intent match. Autopilot aborted.",
          "⚠️ Please speak clearly using verbs like: 'close', 'open', 'wait time', 'sold out', 'ready'."
        ]);
      }
      setIsProcessing(false);
    }, 2000);
  };

  return (
    <div className="flex flex-col gap-10 animate-fade-in">
      <div>
        <h3 className="font-display font-extrabold text-2xl">🎙️ AI Autopilot Voice Control</h3>
        <p className="text-zinc-500 text-[11px] mt-1">Leverage browser Web Speech microphone streaming to fly the SaaS completely hands-free.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        
        {/* Giant Mic control */}
        <div className="flex flex-col gap-6 items-center justify-center p-8 bg-zinc-950 border border-zinc-800 rounded-3xl text-center">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Autopilot Mic Control</span>
          
          <button
            onMouseDown={handleStartListening}
            onMouseUp={handleStopListening}
            onTouchStart={handleStartListening}
            onTouchEnd={handleStopListening}
            className={`w-32 h-32 rounded-full border flex items-center justify-center transition shadow-2xl ${isListening ? 'border-pink-500 bg-pink-500 text-white animate-pulse shadow-pink-500/20' : 'border-zinc-800 bg-zinc-900 text-zinc-400 hover:border-zinc-700'}`}
          >
            {isListening ? <Mic size={48} /> : <MicOff size={48} />}
          </button>

          <div className="flex flex-col gap-1">
            <h4 className="font-bold text-white text-sm">{isListening ? "🎤 CAPTURE MODE ACTIVE" : "🎤 HOLD TO SPEAK"}</h4>
            <p className="text-zinc-500 text-[10px] max-w-xs mt-1">Press down and hold your mouse or finger, speak clearly, then release to run.</p>
          </div>

          {/* Equalizer pulsing wave */}
          {isListening && (
            <div className="flex gap-1 h-6 items-end mt-2">
              {[...Array(6)].map((_, i) => (
                <div key={i} className="w-1.5 bg-pink-500 rounded-full animate-pulse" style={{ height: `${Math.floor(Math.random() * 20) + 4}px`, animationDelay: `${i * 150}ms` }} />
              ))}
            </div>
          )}

          {transcript && (
            <p className="mt-4 p-4 bg-zinc-900 border border-zinc-800 rounded-2xl italic text-[11px] text-pink-400">"{transcript}"</p>
          )}
        </div>

        {/* Console Log Terminal */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">Autopilot Log Terminal</span>
          
          <div className="flex-1 p-6 bg-zinc-950 border border-zinc-800 rounded-3xl flex flex-col gap-3 min-h-60 font-mono text-[10px] text-emerald-500 overflow-y-auto max-h-96">
            <span className="text-zinc-600 block">*** BELLA'S KITCHEN NLP NLU PARSER INTERNET APIS ONBOOT ***</span>
            {aiLogs.map((log, idx) => (
              <p key={idx} className={log.startsWith("❌") ? "text-red-400" : log.startsWith("🟢") ? "text-emerald-400 font-bold" : log.startsWith("🎯") ? "text-amber-400" : "text-emerald-500/80"}>
                {log}
              </p>
            ))}
            {isProcessing && (
              <span className="text-pink-400 animate-pulse block">🧠 Autopilot reasoning loops loading...</span>
            )}
            {latestAction && !isProcessing && (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 rounded-xl mt-3 flex items-start gap-2 animate-fade-in font-display">
                <CheckCircle size={16} className="mt-0.5" />
                <div>
                  <h5 className="font-bold">Operational Setting Changed:</h5>
                  <p className="text-[11px] mt-1 italic">"{latestAction}"</p>
                </div>
              </div>
            )}
          </div>

          {/* Typing fallback bar */}
          <form onSubmit={handleTypeSubmit} className="flex gap-3">
            <input
              type="text"
              placeholder="Keyboard Command Terminal Fallback (e.g. Set wait time to 10 minutes)"
              value={typedCommand}
              onChange={e => setTypedCommand(e.target.value)}
              className="flex-1 p-4 rounded-2xl border border-zinc-800 bg-zinc-950 text-xs focus:border-pink-500 outline-none"
            />
            <button type="submit" className="py-4 px-6 bg-zinc-900 border border-zinc-800 hover:border-zinc-700 font-bold rounded-2xl text-xs active:scale-95 transition">
              Submit Command
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}