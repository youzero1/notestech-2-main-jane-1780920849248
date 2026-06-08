import React, { createContext, useContext, useReducer, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import type { Database } from '@/integrations/supabase/types';

type Product = Database['public']['Tables']['products']['Row'];

interface CartItem extends Product {
  quantity: number;
  selectedSize?: string;
  selectedColor?: string;
}

interface CartState {
  items: CartItem[];
  isOpen: boolean;
}

type CartAction =
  | { type: 'ADD_ITEM'; payload: CartItem }
  | { type: 'REMOVE_ITEM'; payload: { id: string; selectedSize?: string; selectedColor?: string } }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number; selectedSize?: string; selectedColor?: string } }
  | { type: 'CLEAR_CART' }
  | { type: 'TOGGLE_CART' };

const CartContext = createContext<{
  state: CartState;
  addItem: (item: CartItem) => void;
  removeItem: (id: string, selectedSize?: string, selectedColor?: string) => void;
  updateQuantity: (id: string, quantity: number, selectedSize?: string, selectedColor?: string) => void;
  clearCart: () => void;
  toggleCart: () => void;
  getItemQuantity: (id: string, selectedSize?: string, selectedColor?: string) => number;
} | undefined>(undefined);

const cartReducer = (state: CartState, action: CartAction): CartState => {
  switch (action.type) {
    case 'ADD_ITEM':
      const existingItem = state.items.find(
        item => 
          item.id === action.payload.id && 
          item.selectedSize === action.payload.selectedSize &&
          item.selectedColor === action.payload.selectedColor
      );

      if (existingItem) {
        return {
          ...state,
          items: state.items.map(item =>
            item.id === action.payload.id &&
            item.selectedSize === action.payload.selectedSize &&
            item.selectedColor === action.payload.selectedColor
              ? { ...item, quantity: action.payload.quantity }
              : item
          ),
        };
      }
      return { ...state, items: [...state.items, action.payload] };

    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => 
          !(item.id === action.payload.id && 
            item.selectedSize === action.payload.selectedSize && 
            item.selectedColor === action.payload.selectedColor)
        ),
      };

    case 'UPDATE_QUANTITY':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id && 
          item.selectedSize === action.payload.selectedSize && 
          item.selectedColor === action.payload.selectedColor
            ? { ...item, quantity: action.payload.quantity }
            : item
        ),
      };

    case 'CLEAR_CART':
      return { items: [], isOpen: false };

    case 'TOGGLE_CART':
      return { ...state, isOpen: !state.isOpen };

    default:
      return state;
  }
};

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(cartReducer, { items: [], isOpen: false });
  const { toast } = useToast();

  const addItem = useCallback((item: CartItem) => {
    const existingItem = state.items.find(
      cartItem => 
        cartItem.id === item.id && 
        cartItem.selectedSize === item.selectedSize && 
        cartItem.selectedColor === item.selectedColor
    );

    if (existingItem) {
      dispatch({ 
        type: 'UPDATE_QUANTITY', 
        payload: { 
          id: item.id, 
          quantity: item.quantity, 
          selectedSize: item.selectedSize, 
          selectedColor: item.selectedColor 
        } 
      });
      toast({
        title: "Cart updated",
        description: `${item.name} quantity has been updated in your cart.`
      });
    } else {
      dispatch({ type: 'ADD_ITEM', payload: item });
      toast({
        title: "Added to cart",
        description: `${item.name} has been added to your cart.`
      });
    }
  }, [state.items, toast]);

  const removeItem = useCallback((id: string, selectedSize?: string, selectedColor?: string) => {
    dispatch({ 
      type: 'REMOVE_ITEM', 
      payload: { id, selectedSize, selectedColor } 
    });
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number, selectedSize?: string, selectedColor?: string) => {
    dispatch({ 
      type: 'UPDATE_QUANTITY', 
      payload: { id, quantity, selectedSize, selectedColor } 
    });
  }, []);

  const clearCart = useCallback(() => {
    dispatch({ type: 'CLEAR_CART' });
  }, []);

  const toggleCart = useCallback(() => {
    dispatch({ type: 'TOGGLE_CART' });
  }, []);

  const getItemQuantity = useCallback((id: string, selectedSize?: string, selectedColor?: string): number => {
    const item = state.items.find(
      i => i.id === id && 
          i.selectedSize === selectedSize && 
          i.selectedColor === selectedColor
    );
    return item ? item.quantity : 0;
  }, [state.items]);

  return (
    <CartContext.Provider 
      value={{ 
        state, 
        addItem, 
        removeItem, 
        updateQuantity, 
        clearCart, 
        toggleCart,
        getItemQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
