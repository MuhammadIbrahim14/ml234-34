import { Search, ShoppingCart, CalendarCheck, Package, Store, Users, MapPin, Leaf } from "lucide-react";
/* MarketLink — sample data & image links
   Apni photos lagani hon: public/images/ mein rakhein aur
   U("...") ki jagah "/images/file.jpg" likh dein. */

export const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  heroFarmer: [U("1595855759920-86582396756a", 1100), U("1488459716781-31db52582fe9", 1100)],
  heroField: [U("1500382017468-9049fed747ef", 1800), U("1464226184884-fa280b87c399", 1800)],
  crate: [U("1566385101042-1a0aa0c1268c", 700), U("1540420773420-3366772f4999", 700)],
  basket: [U("1518843875459-f738682238a6", 600), U("1610832958506-aa56368176cf", 600)],
  surplus: [U("1610832958506-aa56368176cf", 800), U("1540420773420-3366772f4999", 800)],
  cta: [U("1464226184884-fa280b87c399", 1800), U("1500937386664-56d1dfef3854", 1800)],
  avatar: [U("1494790108377-be9c29b29330", 200), "https://randomuser.me/api/portraits/women/44.jpg"],
};

export const MARKETS = [
  { name: "Green Valley Market", city: "Lahore", km: "2.3", farmers: 12, type: "Fresh Produce", rating: 4.8, reviews: 230, x: 52, y: 40, img: [U("1488459716781-31db52582fe9", 400), U("1542838132-92c53300491e", 400)] },
  { name: "Sunrise Market", city: "Lahore", km: "5.6", farmers: 8, type: "Fresh Produce", rating: 4.6, reviews: 142, x: 28, y: 64, img: [U("1542838132-92c53300491e", 400), U("1610832958506-aa56368176cf", 400)] },
  { name: "Riverside Market", city: "Lahore", km: "8.2", farmers: 10, type: "Organic Produce", rating: 4.7, reviews: 188, x: 76, y: 70, img: [U("1533900298318-6b8da08a523e", 400), U("1540420773420-3366772f4999", 400)] },
];

export const PRODUCTS = [
  { name: "Fresh Tomatoes", price: 120, unit: "kg", badge: "Best Seller", farmer: "Ali Raza", km: "2.3", img: [U("1592924357228-91a4daadcfea", 600), U("1546094096-0df4bcaaa337", 600)] },
  { name: "Organic Spinach", price: 80, unit: "bunch", badge: "Organic", farmer: "Fatima Khan", km: "3.1", img: [U("1576045057995-568f588f82fb", 600), U("1515543904379-3d757afe72e4", 600)] },
  { name: "Red Onions", price: 150, unit: "kg", badge: "Fresh", farmer: "Hassan Mehmood", km: "4.2", img: [U("1618512496248-a07fe83aa8cb", 600), U("1508747703725-719777637510", 600)] },
  { name: "Fresh Potatoes", price: 100, unit: "kg", badge: "Seasonal", farmer: "Zainab Ali", km: "5.6", img: [U("1518977676601-b53f82aba655", 600), U("1590165482129-1b8b27698780", 600)] },
  { name: "Fresh Strawberries", price: 250, unit: "kg", badge: "Popular", farmer: "Usman Tariq", km: "6.8", img: [U("1464965911861-746a04b4bca6", 600), U("1543528176-61b239494933", 600)] },
];

export const FARMERS = [
  { name: "Ali Raza", role: "Vegetables & Fruits", km: "2.3", tags: ["Tomatoes", "Spinach", "Chillies"], badge: "Top Rated", img: [U("1500648767791-00dcc994a43e", 500), "https://randomuser.me/api/portraits/men/32.jpg"] },
  { name: "Fatima Khan", role: "Organic Produce", km: "3.1", tags: ["Onions", "Potatoes", "Garlic"], badge: "Verified", img: [U("1438761681033-6461ffad8d80", 500), "https://randomuser.me/api/portraits/women/65.jpg"] },
  { name: "Hassan Mehmood", role: "Seasonal Crops", km: "4.2", tags: ["Cabbage", "Cauliflower", "Carrots"], badge: "Top Rated", img: [U("1507003211169-0a1dd7228f2d", 500), "https://randomuser.me/api/portraits/men/41.jpg"] },
  { name: "Zainab Ali", role: "Fruits & Vegetables", km: "6.8", tags: ["Potatoes", "Onions", "Greens"], badge: "Verified", img: [U("1494790108377-be9c29b29330", 500), "https://randomuser.me/api/portraits/women/68.jpg"] },
  { name: "Usman Tariq", role: "Berries & Fruits", km: "7.4", tags: ["Strawberries", "Guava", "Kinnow"], badge: "Verified", img: [U("1506794778202-cad84cf45f1d", 500), "https://randomuser.me/api/portraits/men/75.jpg"] },
];

export const STEPS = [
  { icon: Search, t: "Discover", d: "Find nearby markets and farmers" },
  { icon: ShoppingCart, t: "Select", d: "Choose your fresh produce" },
  { icon: CalendarCheck, t: "Pre-order", d: "Book your order and pickup slot" },
  { icon: Package, t: "Pickup", d: "Collect from market at your convenience" },
];

export const STATS = [
  { icon: Store, n: 500, s: "+", l: "Happy Farmers" },
  { icon: Users, n: 10, s: "K+", l: "Active Buyers" },
  { icon: MapPin, n: 50, s: "+", l: "Markets" },
  { icon: Leaf, n: 100, s: "%", l: "Fresh & Natural" },
];

export const SURPLUS = [
  { name: "Mixed Vegetables", price: 60, off: 40, km: "1.2", img: [U("1540420773420-3366772f4999", 500), U("1566385101042-1a0aa0c1268c", 500)] },
  { name: "Mangoes (Local)", price: 120, off: 30, km: "2.1", img: [U("1553279768-865429fa0078", 500), U("1601493700631-2b16ec4b4716", 500)] },
  { name: "Green Capsicum", price: 70, off: 25, km: "3.4", img: [U("1563565375-f3fdfdbefa83", 500), U("1525607551316-4a8e16d1f9ba", 500)] },
];

export const TICKER = ["Tomatoes Rs. 120/kg", "Spinach Rs. 80/bunch", "Mangoes 30% OFF", "12 markets open today", "Strawberries Rs. 250/kg", "Pickup slots from 8 AM", "Potatoes Rs. 100/kg", "New farmers this week: 14"];

export const DECOR_PINS = [[12, 22], [22, 46], [40, 22], [64, 16], [86, 28], [91, 56], [60, 84], [16, 84], [84, 88], [44, 72], [70, 44]];
