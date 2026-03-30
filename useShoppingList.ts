import { useState, useEffect, useCallback } from 'react';
import type { ShoppingList, ShoppingItem } from '@/types';

const STORAGE_KEY = 'smart-shopping-lists';

export function useShoppingList(listId?: string) {
  const [lists, setLists] = useState<ShoppingList[]>([]);
  const [currentList, setCurrentList] = useState<ShoppingList | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Load from localStorage on mount
  useEffect(() => {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      try {
        const parsed = JSON.parse(stored);
        setLists(parsed);
      } catch (e) {
        console.error('Failed to parse stored lists:', e);
      }
    }
    setIsLoaded(true);
  }, []);

  // Save to localStorage whenever lists change
  useEffect(() => {
    if (isLoaded) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lists));
    }
  }, [lists, isLoaded]);

  // Load specific list when listId changes
  useEffect(() => {
    if (listId && isLoaded) {
      const list = lists.find(l => l.id === listId);
      if (list) {
        setCurrentList(list);
      }
    }
  }, [listId, lists, isLoaded]);

  const generateId = () => Math.random().toString(36).substring(2, 15);

  const createList = useCallback((name: string): ShoppingList => {
    const newList: ShoppingList = {
      id: generateId(),
      name,
      items: [],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setLists(prev => [newList, ...prev]);
    setCurrentList(newList);
    return newList;
  }, []);

  const updateList = useCallback((listId: string, updates: Partial<ShoppingList>) => {
    setLists(prev => prev.map(list => 
      list.id === listId 
        ? { ...list, ...updates, updatedAt: Date.now() }
        : list
    ));
    if (currentList?.id === listId) {
      setCurrentList(prev => prev ? { ...prev, ...updates, updatedAt: Date.now() } : null);
    }
  }, [currentList]);

  const deleteList = useCallback((listId: string) => {
    setLists(prev => prev.filter(list => list.id !== listId));
    if (currentList?.id === listId) {
      setCurrentList(null);
    }
  }, [currentList]);

  const addItem = useCallback((listId: string, itemData: Omit<ShoppingItem, 'id' | 'createdAt'>) => {
    const newItem: ShoppingItem = {
      ...itemData,
      id: generateId(),
      createdAt: Date.now(),
    };
    
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: [...list.items, newItem],
          updatedAt: Date.now(),
        };
      }
      return list;
    }));

    if (currentList?.id === listId) {
      setCurrentList(prev => prev ? {
        ...prev,
        items: [...prev.items, newItem],
        updatedAt: Date.now(),
      } : null);
    }

    return newItem;
  }, [currentList]);

  const updateItem = useCallback((listId: string, itemId: string, updates: Partial<ShoppingItem>) => {
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item =>
            item.id === itemId ? { ...item, ...updates } : item
          ),
          updatedAt: Date.now(),
        };
      }
      return list;
    }));

    if (currentList?.id === listId) {
      setCurrentList(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, ...updates } : item
        ),
        updatedAt: Date.now(),
      } : null);
    }
  }, [currentList]);

  const deleteItem = useCallback((listId: string, itemId: string) => {
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.filter(item => item.id !== itemId),
          updatedAt: Date.now(),
        };
      }
      return list;
    }));

    if (currentList?.id === listId) {
      setCurrentList(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => item.id !== itemId),
        updatedAt: Date.now(),
      } : null);
    }
  }, [currentList]);

  const toggleItemChecked = useCallback((listId: string, itemId: string) => {
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.map(item =>
            item.id === itemId ? { ...item, checked: !item.checked } : item
          ),
          updatedAt: Date.now(),
        };
      }
      return list;
    }));

    if (currentList?.id === listId) {
      setCurrentList(prev => prev ? {
        ...prev,
        items: prev.items.map(item =>
          item.id === itemId ? { ...item, checked: !item.checked } : item
        ),
        updatedAt: Date.now(),
      } : null);
    }
  }, [currentList]);

  const clearCheckedItems = useCallback((listId: string) => {
    setLists(prev => prev.map(list => {
      if (list.id === listId) {
        return {
          ...list,
          items: list.items.filter(item => !item.checked),
          updatedAt: Date.now(),
        };
      }
      return list;
    }));

    if (currentList?.id === listId) {
      setCurrentList(prev => prev ? {
        ...prev,
        items: prev.items.filter(item => !item.checked),
        updatedAt: Date.now(),
      } : null);
    }
  }, [currentList]);

  const getListById = useCallback((id: string): ShoppingList | undefined => {
    return lists.find(list => list.id === id);
  }, [lists]);

  const importList = useCallback((listData: ShoppingList) => {
    const newList: ShoppingList = {
      ...listData,
      id: generateId(),
      createdAt: Date.now(),
      updatedAt: Date.now(),
      name: `${listData.name} (Imported)`,
    };
    setLists(prev => [newList, ...prev]);
    return newList;
  }, []);

  const getTotalPrice = useCallback((listId: string): number => {
    const list = lists.find(l => l.id === listId);
    if (!list) return 0;
    return list.items.reduce((total, item) => {
      return total + (item.price || 0) * item.quantity;
    }, 0);
  }, [lists]);

  const getCheckedCount = useCallback((listId: string): { checked: number; total: number } => {
    const list = lists.find(l => l.id === listId);
    if (!list) return { checked: 0, total: 0 };
    const checked = list.items.filter(item => item.checked).length;
    return { checked, total: list.items.length };
  }, [lists]);

  return {
    lists,
    currentList,
    isLoaded,
    createList,
    updateList,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    toggleItemChecked,
    clearCheckedItems,
    getListById,
    importList,
    getTotalPrice,
    getCheckedCount,
    setCurrentList,
  };
}
