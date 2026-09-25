import { Search, ShoppingCart, CalendarCheck, Package } from "lucide-react";
/* MarketLink — decorative marketing assets only (no fake catalog rows). */

export const U = (id, w = 900) => `https://images.unsplash.com/photo-${id}?auto=format&fit=crop&w=${w}&q=80`;

export const IMG = {
  heroFarmer: [U("1595855759920-86582396756a", 1100), U("1488459716781-31db52582fe9", 1100)],
  heroField: [U("1500382017468-9049fed747ef", 1800), U("1464226184884-fa280b87c399", 1800)],
  crate: [U("1566385101042-1a0aa0c1268c", 700), U("1540420773420-3366772f4999", 700)],
  basket: [U("1518843875459-f738682238a6", 600), U("1610832958506-aa56368176cf", 600)],
  surplus: [U("1610832958506-aa56368176cf", 800), U("1540420773420-3366772f4999", 800)],
  cta: [U("1464226184884-fa280b87c399", 1800), U("1500937386664-56d1dfef3854", 1800)],
  avatar: [U("1494790108377-be9c29b29330", 200), "https://randomuser.me/api/portraits/women/44.jpg"],
  marketFallback: [U("1488459716781-31db52582fe9", 400), U("1542838132-92c53300491e", 400)],
  produceFallback: [U("1592924357228-91a4daadcfea", 600), U("1546094096-0df4bcaaa337", 600)],
};

export const STEPS = [
  { icon: Search, t: "Discover", d: "Find nearby markets and farmers" },
  { icon: ShoppingCart, t: "Select", d: "Choose your fresh produce" },
  { icon: CalendarCheck, t: "Pre-order", d: "Book your order and pickup slot" },
  { icon: Package, t: "Pickup", d: "Collect from market at your convenience" },
];

/** Decorative map pins only — not catalog data. */
export const DECOR_PINS = [[12, 22], [22, 46], [40, 22], [64, 16], [86, 28], [91, 56], [60, 84], [16, 84], [84, 88], [44, 72], [70, 44]];

/** Static marketing ticker when no live products exist. */
export const TICKER_FALLBACK = [
  "Pre-order fresh produce for pickup",
  "Support local farmers this week",
  "Pickup slots from 8 AM",
  "Browse markets near you",
];
