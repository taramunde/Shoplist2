import { useState, useEffect, useRef } from 'react';
import { 
  Plus, Trash2, Check, Share2, ScanLine, 
  ShoppingCart, Store, MapPin, DollarSign, Image as ImageIcon,
  ChevronLeft, MoreVertical, Copy, MessageCircle, Download,
  List, Upload
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { toast } from 'sonner';
import { Toaster } from '@/components/ui/sonner';
import type { ShoppingList, ShoppingItem, Category } from '@/types';
import { CATEGORY_LABELS, DEFAULT_IMAGES } from '@/types';
import { useShoppingList } from '@/hooks/useShoppingList';
import QRCode from 'qrcode';
import { Html5QrcodeScanner } from 'html5-qrcode';

// Generate shareable URL
const generateShareUrl = (listId: string) => {
  const baseUrl = window.location.origin + window.location.pathname;
  return `${baseUrl}?list=${listId}`;
};

// Encode list data for QR code
const encodeListForQR = (list: ShoppingList): string => {
  const data = {
    id: list.id,
    name: list.name,
    items: list.items.map(item => ({
      name: item.name,
      quantity: item.quantity,
      unit: item.unit,
      price: item.price,
      store: item.store,
      location: item.location,
      category: item.category,
      notes: item.notes,
    })),
  };
  return btoa(JSON.stringify(data));
};

// Decode list data from QR
const decodeListFromQR = (encoded: string): Partial<ShoppingList> | null => {
  try {
    const decoded = JSON.parse(atob(encoded));
    return decoded;
  } catch (e) {
    return null;
  }
};

export default function App() {
  const [view, setView] = useState<'home' | 'list' | 'scan'>('home');
  const [currentListId, setCurrentListId] = useState<string | null>(null);
  const [showAddItem, setShowAddItem] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [showScanner, setShowScanner] = useState(false);
  const [editingItem, setEditingItem] = useState<ShoppingItem | null>(null);
  
  const {
    lists,
    currentList,
    isLoaded,
    createList,
    deleteList,
    addItem,
    updateItem,
    deleteItem,
    toggleItemChecked,
    clearCheckedItems,
    importList,
    getTotalPrice,
    getCheckedCount,
    setCurrentList,
  } = useShoppingList(currentListId || undefined);

  // Check URL params on load
  useEffect(() => {
    if (!isLoaded) return;
    
    const params = new URLSearchParams(window.location.search);
    const listId = params.get('list');
    const sharedData = params.get('data');
    
    if (sharedData) {
      const decoded = decodeListFromQR(sharedData);
      if (decoded) {
        const imported = importList(decoded as ShoppingList);
        setCurrentListId(imported.id);
        setView('list');
        toast.success('List imported successfully!');
      }
    } else if (listId) {
      const list = lists.find(l => l.id === listId);
      if (list) {
        setCurrentListId(listId);
        setCurrentList(list);
        setView('list');
      }
    }
  }, [isLoaded, lists, setCurrentList, importList]);

  const handleCreateList = (name: string) => {
    const list = createList(name);
    setCurrentListId(list.id);
    setView('list');
    toast.success('Shopping list created!');
  };

  const handleDeleteList = (listId: string) => {
    deleteList(listId);
    if (currentListId === listId) {
      setCurrentListId(null);
      setView('home');
    }
    toast.success('List deleted');
  };

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 to-teal-50">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-emerald-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-50">
      <Toaster position="top-center" />
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-emerald-100 sticky top-0 z-50">
        <div className="max-w-4xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {view !== 'home' && (
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setView('home')}
                className="mr-2"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
            )}
            <div className="bg-gradient-to-r from-emerald-500 to-teal-500 p-2 rounded-xl">
              <ShoppingCart className="h-6 w-6 text-white" />
            </div>
            <h1 className="text-xl font-bold bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
              Smart Shopping List
            </h1>
          </div>
          
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={() => setShowScanner(true)}
              className="border-emerald-200 hover:bg-emerald-50"
            >
              <ScanLine className="h-5 w-5 text-emerald-600" />
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-6">
        {view === 'home' && (
          <HomeView 
            lists={lists}
            onCreateList={handleCreateList}
            onOpenList={(id) => {
              setCurrentListId(id);
              setView('list');
            }}
            onDeleteList={handleDeleteList}
          />
        )}
        
        {view === 'list' && currentList && (
          <ListView
            list={currentList}
            onAddItem={() => setShowAddItem(true)}
            onEditItem={setEditingItem}
            onDeleteItem={(itemId) => deleteItem(currentList.id, itemId)}
            onToggleItem={(itemId) => toggleItemChecked(currentList.id, itemId)}
            onClearChecked={() => clearCheckedItems(currentList.id)}
            onShare={() => setShowShare(true)}
            totalPrice={getTotalPrice(currentList.id)}
            checkedCount={getCheckedCount(currentList.id)}
          />
        )}
        
        {view === 'scan' && (
          <ScanView onScanComplete={(list) => {
            const imported = importList(list as ShoppingList);
            setCurrentListId(imported.id);
            setView('list');
          }} />
        )}
      </main>

      {/* Add/Edit Item Dialog */}
      <Dialog open={showAddItem || !!editingItem} onOpenChange={(open) => {
        if (!open) {
          setShowAddItem(false);
          setEditingItem(null);
        }
      }}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingItem ? 'Edit Item' : 'Add New Item'}</DialogTitle>
          </DialogHeader>
          <ItemForm
            item={editingItem}
            onSubmit={(data) => {
              if (editingItem && currentList) {
                updateItem(currentList.id, editingItem.id, data);
                toast.success('Item updated!');
              } else if (currentList) {
                addItem(currentList.id, data);
                toast.success('Item added!');
              }
              setShowAddItem(false);
              setEditingItem(null);
            }}
            onCancel={() => {
              setShowAddItem(false);
              setEditingItem(null);
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Share Dialog */}
      <Dialog open={showShare} onOpenChange={setShowShare}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Share List</DialogTitle>
          </DialogHeader>
          {currentList && (
            <ShareOptions 
              list={currentList} 
              onClose={() => setShowShare(false)}
            />
          )}
        </DialogContent>
      </Dialog>

      {/* Scanner Dialog */}
      <Dialog open={showScanner} onOpenChange={setShowScanner}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Scan QR Code</DialogTitle>
          </DialogHeader>
          <QRScanner 
            onScan={(data) => {
              const decoded = decodeListFromQR(data);
              if (decoded) {
                const imported = importList(decoded as ShoppingList);
                setCurrentListId(imported.id);
                setView('list');
                setShowScanner(false);
                toast.success('List imported successfully!');
              } else {
                toast.error('Invalid QR code');
              }
            }}
            onClose={() => setShowScanner(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}

// Home View Component
function HomeView({ 
  lists, 
  onCreateList, 
  onOpenList, 
  onDeleteList 
}: { 
  lists: ShoppingList[];
  onCreateList: (name: string) => void;
  onOpenList: (id: string) => void;
  onDeleteList: (id: string) => void;
}) {
  const [newListName, setNewListName] = useState('');
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  return (
    <div className="space-y-6">
      {/* Create New List Card */}
      <Card className="border-emerald-100 bg-gradient-to-r from-emerald-500 to-teal-500 text-white">
        <CardContent className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold mb-2">Create New List</h2>
              <p className="text-emerald-100">Start organizing your shopping</p>
            </div>
            <Button 
              onClick={() => setShowCreateDialog(true)}
              className="bg-white text-emerald-600 hover:bg-emerald-50"
            >
              <Plus className="h-5 w-5 mr-2" />
              New List
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* My Lists */}
      <div>
        <h2 className="text-xl font-semibold text-gray-800 mb-4 flex items-center gap-2">
          <List className="h-5 w-5 text-emerald-600" />
          My Lists ({lists.length})
        </h2>
        
        {lists.length === 0 ? (
          <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-gray-500">No shopping lists yet</p>
              <p className="text-sm text-gray-400 mt-1">Create your first list to get started</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2">
            {lists.map(list => {
              const checkedCount = list.items.filter(i => i.checked).length;
              const totalPrice = list.items.reduce((sum, item) => sum + (item.price || 0) * item.quantity, 0);
              
              return (
                <Card 
                  key={list.id} 
                  className="cursor-pointer hover:shadow-lg transition-shadow border-emerald-100 group"
                  onClick={() => onOpenList(list.id)}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <CardTitle className="text-lg font-semibold text-gray-800 line-clamp-1">
                        {list.name}
                      </CardTitle>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="opacity-0 group-hover:opacity-100 transition-opacity h-8 w-8"
                        onClick={(e) => {
                          e.stopPropagation();
                          onDeleteList(list.id);
                        }}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="pt-0">
                    <div className="flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center gap-4">
                        <span className="flex items-center gap-1">
                          <Check className="h-4 w-4" />
                          {checkedCount}/{list.items.length} items
                        </span>
                        {totalPrice > 0 && (
                          <span className="flex items-center gap-1">
                            <DollarSign className="h-4 w-4" />
                            {totalPrice.toFixed(2)}
                          </span>
                        )}
                      </div>
                      <span className="text-xs">
                        {new Date(list.updatedAt).toLocaleDateString()}
                      </span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>

      {/* Create List Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Shopping List</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="listName">List Name</Label>
              <Input
                id="listName"
                placeholder="e.g., Weekly Groceries"
                value={newListName}
                onChange={(e) => setNewListName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && newListName.trim()) {
                    onCreateList(newListName.trim());
                    setNewListName('');
                    setShowCreateDialog(false);
                  }
                }}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
                Cancel
              </Button>
              <Button 
                onClick={() => {
                  if (newListName.trim()) {
                    onCreateList(newListName.trim());
                    setNewListName('');
                    setShowCreateDialog(false);
                  }
                }}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                Create
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// List View Component
function ListView({
  list,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onToggleItem,
  onClearChecked,
  onShare,
  totalPrice,
  checkedCount,
}: {
  list: ShoppingList;
  onAddItem: () => void;
  onEditItem: (item: ShoppingItem) => void;
  onDeleteItem: (itemId: string) => void;
  onToggleItem: (itemId: string) => void;
  onClearChecked: () => void;
  onShare: () => void;
  totalPrice: number;
  checkedCount: { checked: number; total: number };
}) {
  const [filter, setFilter] = useState<'all' | 'unchecked' | 'checked'>('all');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');

  const filteredItems = list.items.filter(item => {
    if (filter === 'checked') return item.checked;
    if (filter === 'unchecked') return !item.checked;
    return true;
  }).filter(item => {
    if (categoryFilter === 'all') return true;
    return item.category === categoryFilter;
  });

  const categories = Array.from(new Set(list.items.map(item => item.category)));

  return (
    <div className="space-y-4">
      {/* List Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">{list.name}</h2>
          <p className="text-sm text-gray-500">
            {checkedCount.checked} of {checkedCount.total} items checked
            {totalPrice > 0 && ` • $${totalPrice.toFixed(2)}`}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="icon"
            onClick={onShare}
            className="border-emerald-200 hover:bg-emerald-50"
          >
            <Share2 className="h-5 w-5 text-emerald-600" />
          </Button>
          <Button
            onClick={onAddItem}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Progress Bar */}
      {list.items.length > 0 && (
        <div className="bg-white rounded-lg p-4 border border-emerald-100">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-gray-600">Progress</span>
            <span className="text-sm text-gray-500">
              {Math.round((checkedCount.checked / checkedCount.total) * 100) || 0}%
            </span>
          </div>
          <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
            <div 
              className="h-full bg-gradient-to-r from-emerald-500 to-teal-500 transition-all duration-300"
              style={{ width: `${(checkedCount.checked / checkedCount.total) * 100 || 0}%` }}
            />
          </div>
        </div>
      )}

      {/* Filters */}
      {list.items.length > 0 && (
        <div className="flex flex-wrap gap-2">
          <div className="flex bg-white rounded-lg border border-emerald-100 p-1">
            {(['all', 'unchecked', 'checked'] as const).map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-3 py-1 rounded-md text-sm capitalize transition-colors ${
                  filter === f 
                    ? 'bg-emerald-100 text-emerald-700' 
                    : 'text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f}
              </button>
            ))}
          </div>
          
          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
            className="bg-white border border-emerald-100 rounded-lg px-3 py-1 text-sm text-gray-600 focus:outline-none focus:ring-2 focus:ring-emerald-500"
          >
            <option value="all">All Categories</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>
                {CATEGORY_LABELS[cat as Category]}
              </option>
            ))}
          </select>

          {checkedCount.checked > 0 && (
            <Button
              variant="outline"
              size="sm"
              onClick={onClearChecked}
              className="border-red-200 text-red-600 hover:bg-red-50 ml-auto"
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Clear Checked
            </Button>
          )}
        </div>
      )}

      {/* Items List */}
      <div className="space-y-3">
        {filteredItems.length === 0 ? (
          <Card className="border-dashed border-2 border-emerald-200 bg-emerald-50/50">
            <CardContent className="p-8 text-center">
              <ShoppingCart className="h-12 w-12 text-emerald-300 mx-auto mb-4" />
              <p className="text-gray-500">
                {list.items.length === 0 ? 'No items yet' : 'No items match your filter'}
              </p>
              {list.items.length === 0 && (
                <Button onClick={onAddItem} className="mt-4 bg-emerald-600 hover:bg-emerald-700">
                  <Plus className="h-4 w-4 mr-2" />
                  Add First Item
                </Button>
              )}
            </CardContent>
          </Card>
        ) : (
          filteredItems.map(item => (
            <ItemCard
              key={item.id}
              item={item}
              onToggle={() => onToggleItem(item.id)}
              onEdit={() => onEditItem(item)}
              onDelete={() => onDeleteItem(item.id)}
            />
          ))
        )}
      </div>
    </div>
  );
}

// Item Card Component
function ItemCard({
  item,
  onToggle,
  onEdit,
  onDelete,
}: {
  item: ShoppingItem;
  onToggle: () => void;
  onEdit: () => void;
  onDelete: () => void;
}) {
  return (
    <Card className={`border-emerald-100 transition-all ${item.checked ? 'opacity-60 bg-gray-50' : 'bg-white'}`}>
      <CardContent className="p-4">
        <div className="flex items-center gap-4">
          {/* Checkbox */}
          <button
            onClick={onToggle}
            className={`flex-shrink-0 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${
              item.checked
                ? 'bg-emerald-500 border-emerald-500'
                : 'border-gray-300 hover:border-emerald-400'
            }`}
          >
            {item.checked && <Check className="h-4 w-4 text-white" />}
          </button>

          {/* Image */}
          <div 
            className="w-16 h-16 rounded-lg bg-gray-100 flex-shrink-0 overflow-hidden cursor-pointer"
            onClick={onEdit}
          >
            <img
              src={item.image || DEFAULT_IMAGES[item.category as Category] || DEFAULT_IMAGES.other}
              alt={item.name}
              className="w-full h-full object-cover"
            />
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0 cursor-pointer" onClick={onEdit}>
            <div className="flex items-center gap-2">
              <h3 className={`font-semibold text-gray-800 truncate ${item.checked ? 'line-through text-gray-500' : ''}`}>
                {item.name}
              </h3>
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700">
                {CATEGORY_LABELS[item.category as Category] || item.category}
              </Badge>
            </div>
            
            <div className="flex items-center gap-3 mt-1 text-sm text-gray-500 flex-wrap">
              <span className="flex items-center gap-1">
                {item.quantity} {item.unit}
              </span>
              
              {item.price !== undefined && item.price > 0 && (
                <span className="flex items-center gap-1 text-emerald-600 font-medium">
                  <DollarSign className="h-3 w-3" />
                  {item.price.toFixed(2)}
                  {item.quantity > 1 && (
                    <span className="text-gray-400 text-xs">
                      (${(item.price * item.quantity).toFixed(2)} total)
                    </span>
                  )}
                </span>
              )}
              
              {item.store && (
                <span className="flex items-center gap-1">
                  <Store className="h-3 w-3" />
                  {item.store}
                </span>
              )}
              
              {item.location && (
                <span className="flex items-center gap-1">
                  <MapPin className="h-3 w-3" />
                  {item.location}
                </span>
              )}
            </div>

            {item.notes && (
              <p className="text-xs text-gray-400 mt-1 line-clamp-1">{item.notes}</p>
            )}
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1">
            <Button
              variant="ghost"
              size="icon"
              onClick={onEdit}
              className="h-8 w-8 text-gray-400 hover:text-emerald-600"
            >
              <MoreVertical className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={onDelete}
              className="h-8 w-8 text-gray-400 hover:text-red-500"
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Item Form Component
function ItemForm({
  item,
  onSubmit,
  onCancel,
}: {
  item: ShoppingItem | null;
  onSubmit: (data: any) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    name: item?.name || '',
    quantity: item?.quantity || 1,
    unit: item?.unit || 'pcs',
    price: item?.price || '',
    store: item?.store || '',
    location: item?.location || '',
    category: item?.category || 'other',
    notes: item?.notes || '',
    image: item?.image || '',
  });
  const [previewImage, setPreviewImage] = useState<string | null>(item?.image || null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const result = reader.result as string;
        setPreviewImage(result);
        setFormData(prev => ({ ...prev, image: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name.trim()) return;
    
    onSubmit({
      ...formData,
      name: formData.name.trim(),
      price: formData.price ? parseFloat(formData.price as string) : undefined,
      checked: item?.checked || false,
    });
  };

  const categories: Category[] = ['produce', 'dairy', 'meat', 'bakery', 'beverages', 'pantry', 'frozen', 'household', 'personal', 'other'];

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {/* Image Upload */}
      <div className="flex justify-center">
        <div 
          className="relative w-32 h-32 rounded-xl bg-gray-100 overflow-hidden cursor-pointer group border-2 border-dashed border-emerald-300 hover:border-emerald-500 transition-colors"
          onClick={() => fileInputRef.current?.click()}
        >
          {previewImage ? (
            <img src={previewImage} alt="Preview" className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center text-gray-400">
              <ImageIcon className="h-8 w-8 mb-2" />
              <span className="text-xs">Add Image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <Upload className="h-6 w-6 text-white" />
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleImageUpload}
            className="hidden"
          />
        </div>
      </div>

      {/* Name */}
      <div>
        <Label htmlFor="name">Product Name *</Label>
        <Input
          id="name"
          value={formData.name}
          onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
          placeholder="e.g., Apples"
          required
        />
      </div>

      {/* Quantity & Unit */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="quantity">Quantity</Label>
          <Input
            id="quantity"
            type="number"
            min="0.1"
            step="0.1"
            value={formData.quantity}
            onChange={(e) => setFormData(prev => ({ ...prev, quantity: parseFloat(e.target.value) || 1 }))}
          />
        </div>
        <div>
          <Label htmlFor="unit">Unit</Label>
          <select
            id="unit"
            value={formData.unit}
            onChange={(e) => setFormData(prev => ({ ...prev, unit: e.target.value }))}
            className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
          >
            <option value="pcs">Pieces</option>
            <option value="kg">Kilograms</option>
            <option value="g">Grams</option>
            <option value="lb">Pounds</option>
            <option value="oz">Ounces</option>
            <option value="L">Liters</option>
            <option value="ml">Milliliters</option>
            <option value="pack">Pack</option>
            <option value="box">Box</option>
            <option value="bottle">Bottle</option>
            <option value="can">Can</option>
            <option value="bag">Bag</option>
          </select>
        </div>
      </div>

      {/* Price */}
      <div>
        <Label htmlFor="price">Price (optional)</Label>
        <Input
          id="price"
          type="number"
          min="0"
          step="0.01"
          value={formData.price}
          onChange={(e) => setFormData(prev => ({ ...prev, price: e.target.value }))}
          placeholder="0.00"
        />
      </div>

      {/* Category */}
      <div>
        <Label htmlFor="category">Category</Label>
        <select
          id="category"
          value={formData.category}
          onChange={(e) => setFormData(prev => ({ ...prev, category: e.target.value }))}
          className="w-full h-10 px-3 rounded-md border border-input bg-background text-sm"
        >
          {categories.map(cat => (
            <option key={cat} value={cat}>
              {CATEGORY_LABELS[cat]}
            </option>
          ))}
        </select>
      </div>

      {/* Store & Location */}
      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="store">Store (optional)</Label>
          <Input
            id="store"
            value={formData.store}
            onChange={(e) => setFormData(prev => ({ ...prev, store: e.target.value }))}
            placeholder="e.g., Walmart"
          />
        </div>
        <div>
          <Label htmlFor="location">Location (optional)</Label>
          <Input
            id="location"
            value={formData.location}
            onChange={(e) => setFormData(prev => ({ ...prev, location: e.target.value }))}
            placeholder="e.g., Aisle 3"
          />
        </div>
      </div>

      {/* Notes */}
      <div>
        <Label htmlFor="notes">Notes (optional)</Label>
        <textarea
          id="notes"
          value={formData.notes}
          onChange={(e) => setFormData(prev => ({ ...prev, notes: e.target.value }))}
          placeholder="Any additional notes..."
          className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm resize-none"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" className="bg-emerald-600 hover:bg-emerald-700">
          {item ? 'Update' : 'Add'} Item
        </Button>
      </div>
    </form>
  );
}

// Share Options Component
function ShareOptions({ list }: { list: ShoppingList; onClose?: () => void }) {
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('link');

  const shareUrl = generateShareUrl(list.id);
  const encodedData = encodeListForQR(list);
  const qrDataUrl = `${window.location.origin}${window.location.pathname}?data=${encodedData}`;

  useEffect(() => {
    QRCode.toDataURL(qrDataUrl, { width: 300, margin: 2 }).then(setQrCodeUrl);
  }, [qrDataUrl]);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!');
  };

  const shareViaWhatsApp = () => {
    const text = `Check out my shopping list: ${list.name}\n\n${shareUrl}`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, '_blank');
  };

  const downloadQR = () => {
    if (qrCodeUrl) {
      const link = document.createElement('a');
      link.href = qrCodeUrl;
      link.download = `${list.name.replace(/\s+/g, '_')}_qr.png`;
      link.click();
      toast.success('QR code downloaded!');
    }
  };

  return (
    <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
      <TabsList className="grid w-full grid-cols-2">
        <TabsTrigger value="link">Share Link</TabsTrigger>
        <TabsTrigger value="qr">QR Code</TabsTrigger>
      </TabsList>

      <TabsContent value="link" className="space-y-4">
        <div className="space-y-2">
          <Label>Share URL</Label>
          <div className="flex gap-2">
            <Input value={shareUrl} readOnly className="flex-1" />
            <Button
              variant="outline"
              size="icon"
              onClick={() => copyToClipboard(shareUrl)}
            >
              <Copy className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <Button
            variant="outline"
            onClick={shareViaWhatsApp}
            className="w-full"
          >
            <MessageCircle className="h-4 w-4 mr-2 text-green-600" />
            WhatsApp
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              if (navigator.share) {
                navigator.share({
                  title: list.name,
                  text: `Check out my shopping list: ${list.name}`,
                  url: shareUrl,
                });
              } else {
                copyToClipboard(shareUrl);
              }
            }}
            className="w-full"
          >
            <Share2 className="h-4 w-4 mr-2" />
            More
          </Button>
        </div>
      </TabsContent>

      <TabsContent value="qr" className="space-y-4">
        <div className="flex flex-col items-center">
          {qrCodeUrl && (
            <>
              <img 
                src={qrCodeUrl} 
                alt="QR Code" 
                className="w-64 h-64 rounded-xl border-2 border-emerald-100"
              />
              <p className="text-sm text-gray-500 mt-4 text-center">
                Scan this QR code to view the shopping list
              </p>
              <Button
                onClick={downloadQR}
                className="mt-4 bg-emerald-600 hover:bg-emerald-700"
              >
                <Download className="h-4 w-4 mr-2" />
                Download QR Code
              </Button>
            </>
          )}
        </div>
      </TabsContent>
    </Tabs>
  );
}

// QR Scanner Component
function QRScanner({ onScan, onClose }: { onScan: (data: string) => void; onClose: () => void }) {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);
  const scannerDivRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scannerDivRef.current && !scannerRef.current) {
      scannerRef.current = new Html5QrcodeScanner(
        'qr-reader',
        { fps: 10, qrbox: { width: 250, height: 250 } },
        false
      );

      scannerRef.current.render(
        (decodedText) => {
          onScan(decodedText);
          scannerRef.current?.clear();
        },
        () => {
          // Ignore scan errors (no QR code in frame)
        }
      );
    }

    return () => {
      scannerRef.current?.clear().catch(() => {});
    };
  }, [onScan]);

  return (
    <div className="space-y-4">
      <div id="qr-reader" ref={scannerDivRef} className="w-full" />
      <Button onClick={onClose} variant="outline" className="w-full">
        Cancel
      </Button>
    </div>
  );
}

// Scan View Component (for direct QR scanning)
function ScanView({ onScanComplete }: { onScanComplete: (list: Partial<ShoppingList>) => void }) {
  return (
    <div className="space-y-4">
      <Card>
        <CardContent className="p-6">
          <h2 className="text-xl font-semibold mb-4">Scan a Shopping List</h2>
          <p className="text-gray-500 mb-6">
            Point your camera at a QR code to import a shopping list
          </p>
          <QRScanner
            onScan={(data) => {
              const decoded = decodeListFromQR(data);
              if (decoded) {
                onScanComplete(decoded);
              } else {
                toast.error('Invalid QR code');
              }
            }}
            onClose={() => {}}
          />
        </CardContent>
      </Card>
    </div>
  );
}
