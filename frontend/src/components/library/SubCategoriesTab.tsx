import React, { useState, useRef, useEffect } from 'react';
import { Plus, Search, Edit, Trash2, X, Upload } from 'lucide-react';
import { libraryService } from '../../services/libraryService';
import { validateRequired } from '../../utils/validators';
import { formatDate } from '../../utils/formatters';

interface SubCategory {
  id: number;
  name: string;
  itemCategoryId: number;
  itemCategoryName?: string;
  description?: string;
  createdAt?: string;
}

interface ItemCategory {
  id: number;
  name: string;
}

interface SubCategoriesTabProps {
  subCategories: SubCategory[];
  loading: boolean;
  onRefresh: () => void;
  filterItemCategory: string;
  onFilterChange: (value: string) => void;
}

const SubCategoriesTab: React.FC<SubCategoriesTabProps> = ({
  subCategories,
  loading,
  onRefresh,
  filterItemCategory,
  onFilterChange,
}) => {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingCategory, setEditingCategory] = useState<SubCategory | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [itemCategories, setItemCategories] = useState<ItemCategory[]>([]);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const PRODUCT_CACHE_KEY = 'productCategoryFormDraft';
  const ITEM_CACHE_KEY = 'itemCategoryFormDraft';
  const SUB_CACHE_KEY = 'subCategoryFormDraft';
  const CACHE_EXPIRY = 24 * 60 * 60 * 1000; // 24 hours

  const [categoryForm, setCategoryForm] = useState<Partial<SubCategory>>({
    name: '',
    itemCategoryId: filterItemCategory ? parseInt(filterItemCategory) : 0,
    description: '',
  });

  const [multipleCategories, setMultipleCategories] = useState<Array<{ name: string }>>([
    { name: '' }
  ]);

  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showUnsavedWarning, setShowUnsavedWarning] = useState(false);
  const [pendingNavigation, setPendingNavigation] = useState<(() => void) | null>(null);

  // Cache functions
  const loadProductFromCache = (products: any[]): number | null => {
    try {
      const cached = localStorage.getItem(PRODUCT_CACHE_KEY);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const cacheAge = Date.now() - (cacheData.timestamp || 0);
      
      if (cacheAge > CACHE_EXPIRY) {
        localStorage.removeItem(PRODUCT_CACHE_KEY);
        return null;
      }
      
      if (cacheData.categoryForm?.name) {
        const matchingProduct = products.find(
          p => p.name.toLowerCase() === cacheData.categoryForm.name.toLowerCase()
        );
        return matchingProduct?.id || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to load product from cache:', error);
      return null;
    }
  };

  const loadItemFromCache = (items: ItemCategory[]): number | null => {
    try {
      const cached = localStorage.getItem(ITEM_CACHE_KEY);
      if (!cached) return null;
      
      const cacheData = JSON.parse(cached);
      const cacheAge = Date.now() - (cacheData.timestamp || 0);
      
      if (cacheAge > CACHE_EXPIRY) {
        localStorage.removeItem(ITEM_CACHE_KEY);
        return null;
      }
      
      if (cacheData.categoryForm?.name) {
        const matchingItem = items.find(
          i => i.name.toLowerCase() === cacheData.categoryForm.name.toLowerCase()
        );
        return matchingItem?.id || null;
      }
      return null;
    } catch (error) {
      console.error('Failed to load item from cache:', error);
      return null;
    }
  };

  const saveToCache = () => {
    try {
      const cacheData = {
        categoryForm,
        multipleCategories,
        timestamp: Date.now()
      };
      localStorage.setItem(SUB_CACHE_KEY, JSON.stringify(cacheData));
      setHasUnsavedChanges(true);
    } catch (error) {
      console.error('Failed to save to cache:', error);
    }
  };

  const loadFromCache = (): boolean => {
    try {
      const cached = localStorage.getItem(SUB_CACHE_KEY);
      if (!cached) return false;
      
      const cacheData = JSON.parse(cached);
      const cacheAge = Date.now() - (cacheData.timestamp || 0);
      
      if (cacheAge > CACHE_EXPIRY) {
        localStorage.removeItem(SUB_CACHE_KEY);
        return false;
      }
      
      if (cacheData.categoryForm) {
        setCategoryForm(cacheData.categoryForm);
      }
      if (cacheData.multipleCategories) {
        setMultipleCategories(cacheData.multipleCategories);
      }
      return true;
    } catch (error) {
      console.error('Failed to load from cache:', error);
      localStorage.removeItem(SUB_CACHE_KEY);
      return false;
    }
  };

  const clearAllCaches = () => {
    localStorage.removeItem(PRODUCT_CACHE_KEY);
    localStorage.removeItem(ITEM_CACHE_KEY);
    localStorage.removeItem(SUB_CACHE_KEY);
    setHasUnsavedChanges(false);
  };

  useEffect(() => {
    // Load item categories
    libraryService.getYourItemCategories().then((res) => {
      const items = res.data || [];
      setItemCategories(items);
      
      // After items are loaded, try to load cached data
      if (!editingCategory && !filterItemCategory) {
        // Load product category from cache
        libraryService.getYourProductCategories().then((productRes) => {
          const products = productRes.data || [];
          loadProductFromCache(products); // Load but don't use directly - item cache has the ID
          
          // Load item category from cache
          const cachedItemId = loadItemFromCache(items);
          
          if (cachedItemId) {
            setCategoryForm(prev => ({ ...prev, itemCategoryId: cachedItemId }));
          }
          
          // Load sub category cache
          loadFromCache();
        });
      }
    });
  }, []);

  // Save to cache when form changes (only for new categories)
  useEffect(() => {
    if (!editingCategory && (categoryForm.itemCategoryId || categoryForm.name || multipleCategories.some(c => c.name))) {
      saveToCache();
    }
  }, [categoryForm, multipleCategories]);

  // Handle browser back/refresh warning
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        clearAllCaches(); // Clear cache when closing tab
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  const handleOpenDialog = (category?: SubCategory) => {
    if (category) {
      setEditingCategory(category);
      setCategoryForm(category);
      setMultipleCategories([{ name: '' }]);
    } else {
      setEditingCategory(null);
      setCategoryForm({
        name: '',
        itemCategoryId: filterItemCategory ? parseInt(filterItemCategory) : 0,
        description: '',
      });
      setMultipleCategories([{ name: '' }]);
    }
    setShowDialog(true);
    setErrors({});
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!categoryForm.itemCategoryId || categoryForm.itemCategoryId === 0) {
      newErrors.itemCategoryId = 'Item Category is required';
    }
    if (!validateRequired(categoryForm.name || '')) {
      newErrors.name = 'Sub Category Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      if (editingCategory) {
        await libraryService.updateYourSubCategory(editingCategory.id, categoryForm);
      } else {
        await libraryService.createYourSubCategory(categoryForm);
      }
      setShowDialog(false);
      if (!editingCategory) {
        clearAllCaches(); // Clear cache after successful save
      }
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save sub category');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveMultiple = async () => {
    const newErrors: Record<string, string> = {};
    if (!categoryForm.itemCategoryId || categoryForm.itemCategoryId === 0) {
      newErrors.itemCategoryId = 'Item Category is required';
      setErrors(newErrors);
      return;
    }

    const validItems = multipleCategories.filter(item => item.name.trim() !== '');
    if (validItems.length === 0) {
      alert('Please add at least one sub category');
      return;
    }

    try {
      setSaving(true);
      const promises = validItems.map(item =>
        libraryService.createYourSubCategory({
          itemCategoryId: categoryForm.itemCategoryId,
          name: item.name.trim(),
          description: '',
        })
      );
      await Promise.all(promises);
      setShowDialog(false);
      setMultipleCategories([{ name: '' }]);
      clearAllCaches(); // Clear cache after successful save
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save sub categories');
    } finally {
      setSaving(false);
    }
  };

  // Save All function - validates and saves all three levels atomically
  const handleSaveAll = async () => {
    // Load all caches
    const productCache = localStorage.getItem(PRODUCT_CACHE_KEY);
    const itemCache = localStorage.getItem(ITEM_CACHE_KEY);
    const subCache = localStorage.getItem(SUB_CACHE_KEY);

    if (!productCache || !itemCache || !subCache) {
      alert('Please complete all three levels (Product Category, Item Category, Sub Category) before saving.');
      return;
    }

    try {
      const productData = JSON.parse(productCache);
      const itemData = JSON.parse(itemCache);
      const subData = JSON.parse(subCache);

      // Validate Product Category
      if (!productData.categoryForm?.name || !productData.categoryForm.name.trim()) {
        alert('Product Category name is required');
        return;
      }

      // Validate Item Category
      if (!itemData.categoryForm?.name || !itemData.categoryForm.name.trim()) {
        alert('Item Category name is required');
        return;
      }

      // Validate Sub Category
      if (!subData.categoryForm?.itemCategoryId || subData.categoryForm.itemCategoryId === 0) {
        alert('Item Category must be selected in Sub Category');
        return;
      }
      const validSubs = subData.multipleCategories?.filter((c: any) => c.name?.trim()) || [];
      if (validSubs.length === 0) {
        alert('At least one Sub Category is required');
        return;
      }

      setSaving(true);

      // 1. Save Product Category
      let productCategoryId: number;
      const productRes = await libraryService.createYourProductCategory({
        name: productData.categoryForm.name.trim(),
        description: productData.categoryForm.description || '',
      });
      productCategoryId = productRes.data?.id;
      if (!productCategoryId) {
        throw new Error('Failed to create product category');
      }

      // 2. Save Item Category (use the newly created productCategoryId)
      let itemCategoryId: number;
      const itemRes = await libraryService.createYourItemCategory({
        productCategoryId: productCategoryId, // Use the newly created product category ID
        name: itemData.categoryForm.name.trim(),
        description: itemData.categoryForm.description || '',
      });
      itemCategoryId = itemRes.data?.id;
      if (!itemCategoryId) {
        throw new Error('Failed to create item category');
      }

      // 3. Save all Sub Categories
      const subPromises = validSubs.map((sub: any) =>
        libraryService.createYourSubCategory({
          itemCategoryId: itemCategoryId,
          name: sub.name.trim(),
          description: '',
        })
      );
      await Promise.all(subPromises);

      // Clear all caches after successful save
      clearAllCaches();
      alert('All categories saved successfully!');
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save all categories');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this sub category?')) return;

    try {
      setSaving(true);
      await libraryService.deleteYourSubCategory(id);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete sub category');
    } finally {
      setSaving(false);
    }
  };

  const addCategoryField = () => {
    setMultipleCategories([...multipleCategories, { name: '' }]);
  };

  const removeCategoryField = (index: number) => {
    if (multipleCategories.length > 1) {
      setMultipleCategories(multipleCategories.filter((_, i) => i !== index));
    }
  };

  const updateCategoryField = (index: number, value: string) => {
    const updated = [...multipleCategories];
    updated[index] = { name: value };
    setMultipleCategories(updated);
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    try {
      setSaving(true);
      const result = await libraryService.uploadSubCategories(file);
      if (result.success) {
        alert(`${result.message}\nInserted: ${result.inserted}\nErrors: ${result.errors}`);
        onRefresh();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredCategories = subCategories.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.itemCategoryName?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <>
      {/* Unsaved Changes Warning Dialog */}
      {showUnsavedWarning && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Unsaved Changes</h2>
            <p className="text-gray-700 mb-6">
              Unsaved changes will be lost. Nothing will be saved to database.
            </p>
            <div className="flex justify-end gap-3">
              <button
                onClick={() => {
                  setShowUnsavedWarning(false);
                  setPendingNavigation(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
              >
                Stay & Continue Editing
              </button>
              <button
                onClick={() => {
                  setShowUnsavedWarning(false);
                  clearAllCaches(); // Clear all caches when discarding
                  setHasUnsavedChanges(false);
                  if (pendingNavigation) {
                    pendingNavigation();
                    setPendingNavigation(null);
                  }
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
              >
                Discard & Leave
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={handleSaveAll}
              disabled={saving || !hasUnsavedChanges}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Save All to Database
            </button>
            <button
              onClick={() => handleOpenDialog()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Sub Category
            </button>
            <button
              onClick={handleFileSelect}
              className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
            >
              <Upload className="w-5 h-5" />
              Upload Excel
            </button>
            <input
              type="file"
              ref={fileInputRef}
              onChange={(e) => handleFileUpload(e.target.files?.[0] || null)}
              accept=".xlsx,.xls,.csv"
              className="hidden"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Item Category</label>
          <select
            value={filterItemCategory}
            onChange={(e) => onFilterChange(e.target.value)}
            className="w-full sm:w-64 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Item Categories</option>
            {itemCategories.map((cat) => (
              <option key={cat.id} value={cat.id}>
                {cat.name}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sub Category Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item Category</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Created Date</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredCategories.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="px-4 py-8 text-center text-gray-500">No sub categories found</td>
                    </tr>
                  ) : (
                    filteredCategories.map((category) => (
                      <tr key={category.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm font-medium text-gray-900">{category.name}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">{category.itemCategoryName || '-'}</td>
                        <td className="px-4 py-3 text-sm text-gray-700">
                          {category.createdAt ? formatDate(category.createdAt) : '-'}
                        </td>
                        <td className="px-4 py-3 text-sm">
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleOpenDialog(category)}
                              className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                              title="Edit"
                            >
                              <Edit className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDelete(category.id)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingCategory ? 'Edit Sub Category' : 'Add Sub Category'}
                </h2>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Item Category <span className="text-red-500">*</span>
                  </label>
                  <select
                    value={categoryForm.itemCategoryId}
                    onChange={(e) => setCategoryForm({ ...categoryForm, itemCategoryId: parseInt(e.target.value) })}
                    className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                      errors.itemCategoryId ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="0">Select Item Category</option>
                    {itemCategories.map((cat) => (
                      <option key={cat.id} value={cat.id}>
                        {cat.name}
                      </option>
                    ))}
                  </select>
                  {errors.itemCategoryId && <p className="text-red-500 text-xs mt-1">{errors.itemCategoryId}</p>}
                </div>
                {editingCategory ? (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Sub Category Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={categoryForm.name}
                      onChange={(e) => setCategoryForm({ ...categoryForm, name: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.name ? 'border-red-500' : 'border-gray-300'
                      }`}
                    />
                    {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
                  </div>
                ) : (
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="block text-sm font-medium text-gray-700">
                        Sub Category Name <span className="text-red-500">*</span>
                      </label>
                      <button
                        type="button"
                        onClick={addCategoryField}
                        className="text-sm text-blue-600 hover:text-blue-700 font-medium flex items-center gap-1"
                      >
                        <Plus className="w-4 h-4" />
                        Add Another
                      </button>
                    </div>
                    <div className="space-y-3 max-h-[400px] overflow-y-auto pr-2">
                      {multipleCategories.map((item, index) => (
                        <div key={index} className="flex gap-2 items-center p-3 bg-gray-50 rounded-lg border border-gray-200">
                          <div className="flex-1">
                            <input
                              type="text"
                              value={item.name}
                              onChange={(e) => updateCategoryField(index, e.target.value)}
                              placeholder={`Sub Category Name ${index + 1}`}
                              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 bg-white"
                            />
                          </div>
                          {multipleCategories.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeCategoryField(index)}
                              className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                              title="Remove"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {editingCategory && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                    <textarea
                      value={categoryForm.description}
                      onChange={(e) => setCategoryForm({ ...categoryForm, description: e.target.value })}
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                )}
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => {
                    setShowDialog(false);
                    setMultipleCategories([{ name: '' }]);
                  }}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                {editingCategory ? (
                  <button
                    onClick={handleSave}
                    disabled={saving || !categoryForm.itemCategoryId || categoryForm.itemCategoryId === 0 || !categoryForm.name || categoryForm.name.trim() === ''}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                ) : (
                  <button
                    onClick={handleSaveMultiple}
                    disabled={saving || !categoryForm.itemCategoryId || categoryForm.itemCategoryId === 0 || multipleCategories.filter(i => i.name.trim()).length === 0}
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {saving ? 'Saving...' : `Save ${multipleCategories.filter(i => i.name.trim()).length} Item(s)`}
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default SubCategoriesTab;

