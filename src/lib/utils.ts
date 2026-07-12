import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProductImage(url: string | null | undefined, name: string) {
  if (!url || url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder')) {
    // Return an image matching the product name
    const keyword = encodeURIComponent(name.split(' ')[0].toLowerCase());
    return `https://loremflickr.com/400/300/${keyword},product/all`;
  }
  return url;
}
