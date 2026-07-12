import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { PRODUCT_IMAGE_MAP } from './productImageMap';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function getProductImage(url: string | null | undefined, name: string) {
  if (!url || url.includes('unsplash.com') || url.includes('picsum.photos') || url.includes('placeholder') || url.includes('loremflickr.com')) {
    const lowerName = name.toLowerCase();
    if (PRODUCT_IMAGE_MAP[lowerName]) {
      return PRODUCT_IMAGE_MAP[lowerName];
    }
    const keyword = encodeURIComponent(lowerName.replace(/ /g, ','));
    return `https://loremflickr.com/400/300/${keyword},product/all`;
  }
  return url;
}
