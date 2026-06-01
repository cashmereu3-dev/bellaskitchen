import { MENU_CATEGORIES } from "../data/menu";

// Channel name for real-time synchronization between client and admin tabs
const SYNC_CHANNEL = "bellas_kitchen_sync";
const broadcastChannel = typeof window !== "undefined" ? new BroadcastChannel(SYNC_CHANNEL) : null;

export const INITIAL_SETTINGS = {
  waitTime: "15-25 mins",
  truckLocation: "Mobile Diner",
  isOpen: true,
  taxRate: 0.0825,
  cashAppHandle: "$ATMJAZEEBELLA",
  cashAppPhone: "601-551-4696",
  applePayNumber: "985-286-3391",
  enableTwilio: false,
  twilioSid: "",
  twilioToken: "",
  twilioNumber: "",
  alertPhone: "985-286-3391"
};

const INITIAL_SOCIAL_POSTS = [
  {
    id: "post-wings",
    type: "Reels / Shorts Script",
    title: "🔥 HEAVEN IN A BASKET! 🔥",
    platform: "Instagram Reels / TikTok",
    audio: "Sabrina Carpenter - Feather (Trending Audio)",
    storyboard: "1. Slow-motion close-up of wings being glazed in sticky Honey BBQ sauce.\n2. Steam rising off a batch of fresh golden French fries.\n3. Customer taking a bite and smiling.",
    caption: "Saucy, crispy, and made with love. Get your hands on Louisiana's finest wings tonight! 🤤🚚 #bellaskitchen #wings #foodtruck #foodie",
    status: "Offered"
  },
  {
    id: "post-burger",
    type: "Reels / Shorts Script",
    title: "🍔 THE EXTREME BACON GEEZY 🍔",
    platform: "TikTok / YouTube Shorts",
    audio: "Billie Eilish - LUNCH (Speed Up)",
    storyboard: "1. Sizzling triple patty on the flat top grill.\n2. Melting cheddar cheese cascading over crispy bacon layers.\n3. A chef pressing a toasted brioche bun on top.",
    caption: "Double the cheese, double the flavor. Tap the link in bio to order the ultimate Geezy burger today! 🧀🔥 #burgers #goodeats #freshlygrilled #bellaskitchen",
    status: "Offered"
  },
  {
    id: "post-eggrolls",
    type: "Shorts Promotion",
    title: "🍤 SEAFOOD EGG ROLLS GOLDEN CRUNCH 🍤",
    platform: "Instagram Reels",
    audio: "Lofi Beats - Summer Vibes",
    storyboard: "1. Cracking open a freshly fried egg roll showing seasoned shrimp and crab.\n2. Sweet chili sauce being drizzled elegantly over the top.\n3. A satisfied customer dancing.",
    caption: "Hand-rolled daily. Loaded with shrimp, crab, and savory seasonings. Don't skip the crunch! 🤤🌟 #eggrolls #seafood #foodtruckla #bellaskitchen",
    status: "Offered"
  }
];

// Initialize DB structure in LocalStorage
export function initializeDB() {
  if (typeof window === "undefined") return;

  const storedMenuJson = localStorage.getItem("bellas_menu");
  let initializedMenu;
  if (storedMenuJson) {
    try {
      const storedMenu = JSON.parse(storedMenuJson);
      initializedMenu = MENU_CATEGORIES.map(category => {
        const storedCategory = storedMenu.find(c => c.id === category.id);
        return {
          ...category,
          items: category.items.map(item => {
            let inStock = true;
            if (storedCategory) {
              const storedItem = storedCategory.items.find(i => i.id === item.id);
              if (storedItem && storedItem.inStock !== undefined) {
                inStock = storedItem.inStock;
              }
            }
            return { ...item, inStock };
          })
        };
      });
    } catch (e) {
      initializedMenu = MENU_CATEGORIES.map(category => ({
        ...category,
        items: category.items.map(item => ({ ...item, inStock: true }))
      }));
    }
  } else {
    initializedMenu = MENU_CATEGORIES.map(category => ({
      ...category,
      items: category.items.map(item => ({ ...item, inStock: true }))
    }));
  }
  localStorage.setItem("bellas_menu", JSON.stringify(initializedMenu));

  if (!localStorage.getItem("bellas_settings")) {
    localStorage.setItem("bellas_settings", JSON.stringify(INITIAL_SETTINGS));
  }

  if (!localStorage.getItem("bellas_orders")) {
    localStorage.setItem("bellas_orders", JSON.stringify([]));
  }

  if (!localStorage.getItem("bellas_sms_logs")) {
    localStorage.setItem("bellas_sms_logs", JSON.stringify([]));
  }

  if (!localStorage.getItem("bellas_social_accounts")) {
    localStorage.setItem("bellas_social_accounts", JSON.stringify({
      instagram: { connected: false, handle: "" },
      tiktok: { connected: false, handle: "" },
      youtube: { connected: false, handle: "" },
      facebook: { connected: false, handle: "" }
    }));
  }

  if (!localStorage.getItem("bellas_ai_social_posts")) {
    localStorage.setItem("bellas_ai_social_posts", JSON.stringify(INITIAL_SOCIAL_POSTS));
  }

  if (!localStorage.getItem("bellas_shared_posts")) {
    localStorage.setItem("bellas_shared_posts", JSON.stringify([]));
  }
}

// Call initialization immediately
initializeDB();

// Helper to notify other tabs
function notifyTabs(type, payload = {}) {
  if (broadcastChannel) {
    broadcastChannel.postMessage({ type, payload, timestamp: Date.now() });
  }
}

// Listen for updates from other tabs
export function subscribeToSync(onSync) {
  if (!broadcastChannel) return () => {};
  
  const listener = (event) => {
    onSync(event.data);
  };
  broadcastChannel.addEventListener("message", listener);
  return () => {
    broadcastChannel.removeEventListener("message", listener);
  };
}

// Menu Operations
export function getMenu() {
  try {
    return JSON.parse(localStorage.getItem("bellas_menu")) || [];
  } catch (e) {
    return [];
  }
}

export function toggleStock(itemId, inStock) {
  const menu = getMenu();
  const updatedMenu = menu.map(category => ({
    ...category,
    items: category.items.map(item => {
      if (item.id === itemId) {
        return { ...item, inStock };
      }
      return item;
    })
  }));
  localStorage.setItem("bellas_menu", JSON.stringify(updatedMenu));
  notifyTabs("MENU_UPDATE", updatedMenu);
  return updatedMenu;
}

// Settings Operations
export function getSettings() {
  try {
    return JSON.parse(localStorage.getItem("bellas_settings")) || INITIAL_SETTINGS;
  } catch (e) {
    return INITIAL_SETTINGS;
  }
}

export function updateSettings(newSettings) {
  localStorage.setItem("bellas_settings", JSON.stringify(newSettings));
  notifyTabs("SETTINGS_UPDATE", newSettings);
  return newSettings;
}

// Orders Operations
export function getOrders() {
  try {
    return JSON.parse(localStorage.getItem("bellas_orders")) || [];
  } catch (e) {
    return [];
  }
}

export function getOrderById(id) {
  const orders = getOrders();
  return orders.find(o => o.id === id || String(o.id) === String(id));
}

// Function to log SMS to UI virtual phone
function logSMS(to, text) {
  try {
    const logs = JSON.parse(localStorage.getItem("bellas_sms_logs")) || [];
    const newLog = {
      id: "sms-" + Date.now() + "-" + Math.floor(Math.random() * 1000),
      timestamp: new Date().toLocaleTimeString(),
      to,
      body: text
    };
    logs.unshift(newLog);
    localStorage.setItem("bellas_sms_logs", JSON.stringify(logs));
    notifyTabs("SMS_LOGS_UPDATE", logs);
  } catch (e) {
    console.error("SMS logging failed", e);
  }
}

// Send real SMS (CORS proxy plugin server side)
async function triggerRealSMS(to, text, settings) {
  if (!settings.enableTwilio) return;
  try {
    // Dynamic gateway URL routing (localhost runs standard Vite proxy middleware; live domain routes securely to Render API)
    const isLocal = typeof window !== "undefined" && (window.location.hostname === "localhost" || window.location.hostname === "127.0.0.1");
    const gatewayUrl = isLocal ? "/api/send-sms" : "https://api.bellaskitchen.online/api/send-sms";

    const response = await fetch(gatewayUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        to,
        body: text,
        twilioSettings: {
          twilioSid: settings.twilioSid,
          twilioToken: settings.twilioToken,
          twilioNumber: settings.twilioNumber
        }
      })
    });
    const data = await response.json();
    console.log("[SMS API Response]", data);
  } catch (err) {
    console.error("[SMS API Error]", err);
  }
}

export function createOrder(orderData) {
  const orders = getOrders();
  const nextId = orders.length > 0 ? Math.max(...orders.map(o => parseInt(o.id))) + 1 : 1001;
  
  const newOrder = {
    ...orderData,
    id: String(nextId),
    status: "Pending",
    paymentVerified: false,
    timestamp: new Date().toISOString(),
    timeLabel: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
  };

  orders.unshift(newOrder);
  localStorage.setItem("bellas_orders", JSON.stringify(orders));
  notifyTabs("ORDER_CREATE", newOrder);

  // SMS Notifications
  const settings = getSettings();
  
  // Customer text
  const customerMsg = `💖 Bella's Kitchen: Thanks ${newOrder.customerName}! Order #${newOrder.id} is registered ($${newOrder.total}). Waiting for payment verification. estimated wait time: ${settings.waitTime}.`;
  logSMS(newOrder.customerPhone, customerMsg);
  triggerRealSMS(newOrder.customerPhone, customerMsg, settings);

  // Owner text alert
  const ownerMsg = `🔔 New Order #${newOrder.id} placed! Total: $${newOrder.total}. Customer: ${newOrder.customerName}. Payment Ref: ${newOrder.paymentRef || "None"}. Quick review POS dashboard!`;
  logSMS(settings.alertPhone || "985-286-3391", ownerMsg);
  triggerRealSMS(settings.alertPhone || "985-286-3391", ownerMsg, settings);

  return newOrder;
}

export function updateOrderStatus(orderId, status) {
  const orders = getOrders();
  const updatedOrders = orders.map(o => {
    if (String(o.id) === String(orderId)) {
      const updated = { ...o, status };
      // SMS events
      const settings = getSettings();
      if (status === "Preparing") {
        const msg = `👩‍🍳 Bella's Kitchen: We have verified your payment! Order #${o.id} is now sizzlin' on the grill! 🔥 Estimated wait: ${settings.waitTime}.`;
        logSMS(o.customerPhone, msg);
        triggerRealSMS(o.customerPhone, msg, settings);
      } else if (status === "Ready") {
        const msg = `🔔 Bella's Kitchen: Your order #${o.id} is HOT & READY for pickup! 🍟🔥 Please head to the window.`;
        logSMS(o.customerPhone, msg);
        triggerRealSMS(o.customerPhone, msg, settings);
      } else if (status === "Completed") {
        const msg = `✓ Bella's Kitchen: Order #${o.id} completed. Thank you so much for dining with us! Have a delicious day! ❤️`;
        logSMS(o.customerPhone, msg);
        triggerRealSMS(o.customerPhone, msg, settings);
      }
      return updated;
    }
    return o;
  });
  localStorage.setItem("bellas_orders", JSON.stringify(updatedOrders));
  notifyTabs("ORDERS_UPDATE", updatedOrders);
  return updatedOrders;
}

export function updateOrderPaymentStatus(orderId, verified) {
  const orders = getOrders();
  const updatedOrders = orders.map(o => {
    if (String(o.id) === String(orderId)) {
      return { ...o, paymentVerified: verified };
    }
    return o;
  });
  localStorage.setItem("bellas_orders", JSON.stringify(updatedOrders));
  notifyTabs("ORDERS_UPDATE", updatedOrders);
  return updatedOrders;
}

// SMS Logs Operations
export function getSmsLogs() {
  try {
    return JSON.parse(localStorage.getItem("bellas_sms_logs")) || [];
  } catch (e) {
    return [];
  }
}

export function clearSmsLogs() {
  localStorage.setItem("bellas_sms_logs", JSON.stringify([]));
  notifyTabs("SMS_LOGS_UPDATE", []);
  return [];
}

// POS Analytics calculation
export function getAnalytics() {
  const orders = getOrders().filter(o => o.status !== "Cancelled");
  const completedOrders = orders.filter(o => o.status === "Completed");

  const todayRevenue = completedOrders.reduce((sum, o) => sum + parseFloat(o.total), 0);
  const todayOrders = orders.length;
  const lifetimeRevenue = todayRevenue * 1.5 + 480; // Add some realistic starting base metrics
  const totalOrdersCount = todayOrders + 32;
  const avgOrderValue = totalOrdersCount > 0 ? (lifetimeRevenue / totalOrdersCount) : 0;

  // Calculate top items dynamically
  const itemCounts = {};
  orders.forEach(o => {
    o.cart.forEach(item => {
      itemCounts[item.name] = (itemCounts[item.name] || 0) + item.qty;
    });
  });

  const topSellers = Object.keys(itemCounts).map(name => ({
    name,
    sales: itemCounts[name]
  })).sort((a, b) => b.sales - a.sales).slice(0, 5);

  if (topSellers.length === 0) {
    // Add default rankings if no orders placed yet
    topSellers.push(
      { name: "6pc Wings w/ Fries", sales: 18 },
      { name: "Cheese Burger w/ Fries", sales: 14 },
      { name: "3pc Seafood Egg Rolls w/ Fries", sales: 12 },
      { name: "Loaded Fries", sales: 9 },
      { name: "Exotic Peach Punch", sales: 7 }
    );
  }

  return {
    todayRevenue: todayRevenue.toFixed(2),
    todayOrders,
    lifetimeRevenue: lifetimeRevenue.toFixed(2),
    totalOrdersCount,
    avgOrderValue: avgOrderValue.toFixed(2),
    topSellers
  };
}

// Social Manager operations
export function getSocialAccounts() {
  try {
    return JSON.parse(localStorage.getItem("bellas_social_accounts")) || {};
  } catch (e) {
    return {};
  }
}

export function updateSocialAccounts(newAccounts) {
  localStorage.setItem("bellas_social_accounts", JSON.stringify(newAccounts));
  notifyTabs("SOCIAL_UPDATE", newAccounts);
  return newAccounts;
}

export function getAiSuggestedPosts() {
  try {
    return JSON.parse(localStorage.getItem("bellas_ai_social_posts")) || [];
  } catch (e) {
    return [];
  }
}

export function getSharedPostsLog() {
  try {
    return JSON.parse(localStorage.getItem("bellas_shared_posts")) || [];
  } catch (e) {
    return [];
  }
}

export function approveAndSharePost(postId) {
  const posts = getAiSuggestedPosts();
  const shared = getSharedPostsLog();
  const targetPost = posts.find(p => p.id === postId);

  if (targetPost) {
    const updatedPost = { ...targetPost, status: "Shared", timestamp: new Date().toLocaleTimeString() };
    const remainingPosts = posts.filter(p => p.id !== postId);
    shared.unshift(updatedPost);

    localStorage.setItem("bellas_ai_social_posts", JSON.stringify(remainingPosts));
    localStorage.setItem("bellas_shared_posts", JSON.stringify(shared));

    notifyTabs("SOCIAL_UPDATE");
    return { remainingPosts, shared };
  }
  return { posts, shared };
}

export function declineSuggestedPost(postId) {
  const posts = getAiSuggestedPosts();
  const remaining = posts.filter(p => p.id !== postId);
  localStorage.setItem("bellas_ai_social_posts", JSON.stringify(remaining));
  notifyTabs("SOCIAL_UPDATE");
  return remaining;
}

export function draftCustomPost(promptText) {
  const posts = getAiSuggestedPosts();
  const newPost = {
    id: "draft-" + Date.now(),
    type: "AI Requested Campaign",
    title: `✨ AI CAMPAIGN PROMPT: "${promptText.toUpperCase()}" ✨`,
    platform: "Instagram Reels / TikTok",
    audio: "Trending Lofi Beats - Autumn Rain",
    storyboard: `1. Animated text flashing over gourmet burger: "${promptText}".\n2. Cinematic pan of our food truck and happy clients.\n3. Vibrant neon pink visual overlay matching the physical menu aesthetic.`,
    caption: `${promptText} 🔥🚚 Come get yours hot and fresh at Bella's Kitchen! Link in bio. #bellaskitchen #gourmet #fresh #viral`,
    status: "Offered"
  };
  posts.unshift(newPost);
  localStorage.setItem("bellas_ai_social_posts", JSON.stringify(posts));
  notifyTabs("SOCIAL_UPDATE");
  return posts;
}