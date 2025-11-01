export interface Shop {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  rating: number;
  reviewCount: number;
  distance: string;
  image: string;
  verified: boolean;
  offer?: {
    title: string;
    discount: string;
    expiresAt: Date;
    type: 'percentage' | 'fixed' | 'bogo' | 'flash';
  };
  hours: string;
  phone: string;
  tags: string[];
  jobs?: {
    title: string;
    type: string;
    wage: string;
  }[];
}

export const mockShops: Shop[] = [
  {
    id: '1',
    name: 'SweetNest Bakery',
    category: 'Bakery',
    description: 'Freshly baked goods daily. Artisan breads, pastries, and custom cakes made with love.',
    latitude: 28.6139,
    longitude: 77.2090,
    rating: 4.8,
    reviewCount: 120,
    distance: '0.8 km',
    image: '/src/assets/shop-bakery.jpg',
    verified: true,
    offer: {
      title: '10% off croissants',
      discount: '10%',
      expiresAt: new Date(Date.now() + 3600000), // 1 hour from now
      type: 'percentage',
    },
    hours: '6:00 AM - 8:00 PM',
    phone: '+91 98765 43210',
    tags: ['Bakery', 'Desserts', 'Breakfast'],
    jobs: [
      {
        title: 'Part-time Baker Assistant',
        type: 'Part-time',
        wage: '₹300/day',
      },
    ],
  },
  {
    id: '2',
    name: 'Sai Cloth Mart',
    category: 'Clothing',
    description: 'Traditional and modern clothing for the whole family. Quality fabrics at honest prices.',
    latitude: 28.6180,
    longitude: 77.2100,
    rating: 4.6,
    reviewCount: 90,
    distance: '1.2 km',
    image: '/src/assets/shop-clothing.jpg',
    verified: true,
    offer: {
      title: 'Buy 2 Get 1 Free',
      discount: 'BOGO',
      expiresAt: new Date(Date.now() + 172800000), // 2 days from now
      type: 'bogo',
    },
    hours: '10:00 AM - 9:00 PM',
    phone: '+91 98765 43211',
    tags: ['Clothing', 'Fashion', 'Family'],
    jobs: [
      {
        title: 'Sales Assistant',
        type: 'Full-time',
        wage: '₹8,000/month',
      },
    ],
  },
  {
    id: '3',
    name: 'GreenMart Groceries',
    category: 'Grocery',
    description: 'Fresh produce and daily essentials. Supporting local farmers and your health.',
    latitude: 28.6100,
    longitude: 77.2080,
    rating: 4.5,
    reviewCount: 210,
    distance: '0.5 km',
    image: '/src/assets/shop-grocery.jpg',
    verified: true,
    offer: {
      title: 'Fresh Fruits 20% Off',
      discount: '20%',
      expiresAt: new Date(Date.now() + 86400000), // Today only (1 day)
      type: 'flash',
    },
    hours: '7:00 AM - 10:00 PM',
    phone: '+91 98765 43212',
    tags: ['Grocery', 'Fresh Produce', 'Organic'],
  },
  {
    id: '4',
    name: 'Café Bloom',
    category: 'Café',
    description: 'Cozy corner café serving artisan coffee, teas, and light bites in a warm atmosphere.',
    latitude: 28.6120,
    longitude: 77.2110,
    rating: 4.7,
    reviewCount: 156,
    distance: '0.9 km',
    image: '/src/assets/shop-bakery.jpg',
    verified: true,
    hours: '8:00 AM - 11:00 PM',
    phone: '+91 98765 43213',
    tags: ['Café', 'Coffee', 'Workspace'],
  },
  {
    id: '5',
    name: 'Book Haven',
    category: 'Bookstore',
    description: 'Independent bookstore with curated collections, reading nooks, and community events.',
    latitude: 28.6160,
    longitude: 77.2070,
    rating: 4.9,
    reviewCount: 203,
    distance: '1.0 km',
    image: '/src/assets/shop-clothing.jpg',
    verified: true,
    offer: {
      title: 'Buy 3 Books, Get 15% Off',
      discount: '15%',
      expiresAt: new Date(Date.now() + 604800000), // 1 week
      type: 'percentage',
    },
    hours: '9:00 AM - 9:00 PM',
    phone: '+91 98765 43214',
    tags: ['Books', 'Reading', 'Community'],
  },
];
