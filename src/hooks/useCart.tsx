import { createContext, ReactNode, useContext, useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../services/api';
import { Product } from '../types';

interface CartProviderProps {
  children: ReactNode;
}

interface UpdateProductAmount {
  productId: number;
  amount: number;
}

interface CartContextData {
  cart: Product[];
  addProduct: (productId: number) => Promise<void>;
  removeProduct: (productId: number) => void;
  updateProductAmount: ({ productId, amount }: UpdateProductAmount) => void;
}

const CartContext = createContext<CartContextData>({} as CartContextData);

export function CartProvider({ children }: CartProviderProps): JSX.Element {
  const [cart, setCart] = useState<Product[]>(() => {
    const storagedCart = localStorage.getItem('@RocketShoes:cart')

    if (storagedCart) {
      return JSON.parse(storagedCart);
    }

    return [];
  });

  const addProduct = async (productId: number) => {
    try {
      const { data: stockItem } = await api.get(`stock/${productId}`)
      const { data: product } = await api.get(`products/${productId}`)

      if(stockItem.amount < 1) {
        toast.error('Quantidade solicitada fora de estoque')
        throw new Error('Quantidade solicitada fora de estoque')
      }

      const cartItem = cart.find(item => item.id === productId)

      if(cartItem && cartItem.amount + 1 > stockItem.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        throw new Error('Quantidade solicitada fora de estoque')
      }

      const newCart = cartItem ? 
        cart.map((item) => {
          if(item.id === productId) {
            return {
              ...item,
              amount: item.amount + 1
            }
          }

          return item
        })
      : [...cart, {
        ...product,
        amount: 1,
      }]

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na adição do produto');
    }
  };

  const removeProduct = (productId: number) => {
    try {
      const cartItem = cart.find(item => item.id === productId)
      if (!cartItem) throw new Error()

      const newCart = [...cart.filter(item => item.id !== productId)]

      setCart(newCart)

      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na remoção do produto');
    }
  };

  const updateProductAmount = async ({
    productId,
    amount,
  }: UpdateProductAmount) => {
    if (amount < 1) return 

    try {
      const { data: stockItem } = await api.get(`stock/${productId}`)

      if (amount > stockItem.amount) {
        toast.error('Quantidade solicitada fora de estoque')
        throw new Error('Quantidade solicitada fora de estoque')
      }

      const newCart = cart.map(item => {
        if (item.id === productId) {
          return {
            ...item,
            amount: amount
          }
        }

        return item
      })

      setCart(newCart)
      localStorage.setItem('@RocketShoes:cart', JSON.stringify(newCart))
    } catch {
      toast.error('Erro na alteração de quantidade do produto');
    }
  };

  return (
    <CartContext.Provider
      value={{ cart, addProduct, removeProduct, updateProductAmount }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartContextData {
  const context = useContext(CartContext);

  return context;
}
