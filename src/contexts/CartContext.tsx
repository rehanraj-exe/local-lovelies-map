import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

export interface CartItem {
  id: string;
  quantity: number;
  product_id: string;
  shop_id: string;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
  shop: {
    id: string;
    name: string;
  };
}

export interface LocalCartItem {
  product_id: string;
  shop_id: string;
  quantity: number;
  product: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
  shop: {
    id: string;
    name: string;
  };
}

interface CartContextType {
  cartItems: CartItem[];
  addToCart: (product: any, showToast?: boolean) => Promise<void>;
  updateQuantity: (itemId: string, newQuantity: number, isProductId?: boolean) => Promise<void>;
  removeItem: (itemId: string, isProductId?: boolean) => Promise<void>;
  fetchCartItems: () => Promise<void>;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

const CART_STORAGE_KEY = 'guest_cart';

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cartItems, setCartItems] = useState<CartItem[]>([]);

  const getLocalCart = (): LocalCartItem[] => {
    try {
      const cart = localStorage.getItem(CART_STORAGE_KEY);
      return cart ? JSON.parse(cart) : [];
    } catch {
      return [];
    }
  };

  const saveLocalCart = (items: LocalCartItem[]) => {
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  };

  const fetchCartItems = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data, error } = await supabase
          .from('cart_items')
          .select(`
            id,
            quantity,
            product_id,
            shop_id,
            product:products(id, name, price, image_url),
            shop:shops(id, name)
          `)
          .eq('user_id', user.id);

        if (error) throw error;
        setCartItems((data as any) || []);
      } else {
        const localCart = getLocalCart();
        const formattedItems: CartItem[] = localCart.map((item, index) => ({
          id: `local-${index}`,
          quantity: item.quantity,
          product_id: item.product_id,
          shop_id: item.shop_id,
          product: item.product,
          shop: item.shop,
        }));
        setCartItems(formattedItems);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    }
  };

  const addToCart = async (product: any, showToast = true) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { data: existing } = await supabase
          .from('cart_items')
          .select('id, quantity')
          .eq('user_id', user.id)
          .eq('product_id', product.id)
          .maybeSingle();

        if (existing) {
          await supabase
            .from('cart_items')
            .update({ quantity: existing.quantity + 1 })
            .eq('id', existing.id);
        } else {
          await supabase
            .from('cart_items')
            .insert({
              user_id: user.id,
              product_id: product.id,
              shop_id: product.shop_id || product.shop?.id,
              quantity: 1
            });
        }
      } else {
        const cart = getLocalCart();
        const existingIndex = cart.findIndex((item) => item.product_id === product.id);
        
        if (existingIndex >= 0) {
          cart[existingIndex].quantity += 1;
        } else {
          cart.push({
            product_id: product.id,
            shop_id: product.shop_id || product.shop?.id,
            quantity: 1,
            product: {
              id: product.id,
              name: product.name,
              price: product.price,
              image_url: product.image_url
            },
            shop: product.shop ? {
              id: product.shop.id,
              name: product.shop.name
            } : { id: product.shop_id, name: '' }
          });
        }
        saveLocalCart(cart);
      }
      
      await fetchCartItems();
      if (showToast) toast.success('Added to cart!');
    } catch (error) {
      console.error('Error adding to cart:', error);
      if (showToast) toast.error('Failed to add to cart');
    }
  };

  // If isProductId is true, itemId is actually product_id. We need to find the real cart item ID.
  const updateQuantity = async (id: string, newQuantity: number, isProductId = false) => {
    if (newQuantity < 1) {
      await removeItem(id, isProductId);
      return;
    }
    
    let targetItemId = id;
    if (isProductId) {
      const item = cartItems.find(i => i.product_id === id);
      if (!item) return;
      targetItemId = item.id;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: newQuantity })
          .eq('id', targetItemId);

        if (error) throw error;
      } else {
        const localCart = getLocalCart();
        const itemIndex = parseInt(targetItemId.replace('local-', ''));
        if (localCart[itemIndex]) {
          localCart[itemIndex].quantity = newQuantity;
          saveLocalCart(localCart);
        }
      }
      await fetchCartItems();
    } catch (error) {
      toast.error('Error updating quantity');
    }
  };

  const removeItem = async (id: string, isProductId = false) => {
    let targetItemId = id;
    if (isProductId) {
      const item = cartItems.find(i => i.product_id === id);
      if (!item) return;
      targetItemId = item.id;
    }

    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (user) {
        const { error } = await supabase
          .from('cart_items')
          .delete()
          .eq('id', targetItemId);

        if (error) throw error;
      } else {
        const localCart = getLocalCart();
        const itemIndex = parseInt(targetItemId.replace('local-', ''));
        if (!isNaN(itemIndex)) {
          localCart.splice(itemIndex, 1);
          saveLocalCart(localCart);
        }
      }
      await fetchCartItems();
    } catch (error) {
      toast.error('Error removing item');
    }
  };

  useEffect(() => {
    fetchCartItems();

    // Listen to auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => {
      fetchCartItems();
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <CartContext.Provider value={{ cartItems, addToCart, updateQuantity, removeItem, fetchCartItems }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}
