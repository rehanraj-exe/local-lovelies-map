import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const PRODUCT_IMAGE_MAP: Record<string, string> = {
  "spicy chicken tacos": "https://images.unsplash.com/photo-1565299585323-38d6b0865b47?auto=format&fit=crop&w=500&q=80",
  "margherita wood-fired pizza": "https://images.unsplash.com/photo-1574071318508-1cdbab80d002?auto=format&fit=crop&w=500&q=80",
  "truffle mushroom risotto": "https://images.unsplash.com/photo-1633504581786-316c8002b1b9?auto=format&fit=crop&w=500&q=80",
  "grilled atlantic salmon": "https://images.unsplash.com/photo-1485921325833-c519f76c4927?auto=format&fit=crop&w=500&q=80",
  "vegan buddha bowl": "https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&w=500&q=80",
  "chunky knit weighted blanket": "https://images.unsplash.com/photo-1580136608260-4ebf15fac612?auto=format&fit=crop&w=500&q=80",
  "ceramic indoor planter": "https://images.unsplash.com/photo-1485955900006-10f4d324d411?auto=format&fit=crop&w=500&q=80",
  "copper watering can": "https://images.unsplash.com/photo-1599839619722-39751411ea63?auto=format&fit=crop&w=500&q=80",
  "modern minimalist table lamp": "https://images.unsplash.com/photo-1507473885765-e6ed057f782c?auto=format&fit=crop&w=500&q=80",
  "blackout window curtains": "https://images.unsplash.com/photo-1513694203232-719a280e022f?auto=format&fit=crop&w=500&q=80",
  "geometric glass vase": "https://images.unsplash.com/photo-1581783342308-f792dbdd27c5?auto=format&fit=crop&w=500&q=80",
  "steel leaf rake": "https://images.unsplash.com/photo-1590682680695-43b964a3ae17?auto=format&fit=crop&w=500&q=80",
  "heirloom vegetable seeds": "https://images.unsplash.com/photo-1592424001809-80410ff02c2e?auto=format&fit=crop&w=500&q=80",
  "soy wax scented candle": "https://images.unsplash.com/photo-1603006905003-be475563bc59?auto=format&fit=crop&w=500&q=80",
  "double shot espresso": "https://images.unsplash.com/photo-1510591509098-f4fdc6d0ff04?auto=format&fit=crop&w=500&q=80",
  "caramel macchiato": "https://images.unsplash.com/photo-1497935586351-b67a49e012bf?auto=format&fit=crop&w=500&q=80",
  "ceremonial grade matcha": "https://images.unsplash.com/photo-1582793988951-9aed5509eb97?auto=format&fit=crop&w=500&q=80",
  "freshly baked croissant": "https://images.unsplash.com/photo-1509440159596-0249088772ff?auto=format&fit=crop&w=500&q=80",
  "blueberry streusel muffin": "https://images.unsplash.com/photo-1525124568695-c4c6cd3ea8ed?auto=format&fit=crop&w=500&q=80",
  "nitro cold brew coffee": "https://images.unsplash.com/photo-1461023058943-07cb1ce8dbb4?auto=format&fit=crop&w=500&q=80",
  "single origin coffee beans": "https://images.unsplash.com/photo-1559525839-b184a4d698c7?auto=format&fit=crop&w=500&q=80"
};

export function getProductImage(url: string | null | undefined, name: string) {
  if (!url || url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder')) {
    const lowerName = name.toLowerCase();
    if (PRODUCT_IMAGE_MAP[lowerName]) {
      return PRODUCT_IMAGE_MAP[lowerName];
    }
    const keyword = encodeURIComponent(lowerName.replace(/ /g, ','));
    return `https://loremflickr.com/400/300/${keyword},product/all`;
  }
  return url;
}
