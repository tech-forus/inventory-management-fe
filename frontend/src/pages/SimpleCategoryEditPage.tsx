import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { libraryService } from '../services/libraryService';

interface FormData {
  productCategory: string;
  itemCategory: string;
  subCategory: string;
  productCategoryId?: number;
  itemCategoryId?: number;
}

export default function SimpleCategoryEditPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [formData, setFormData] = useState<FormData>({
    productCategory: '',
    itemCategory: '',
    subCategory: ''
  });

  const [originalData, setOriginalData] = useState<FormData | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (id) {
      fetchCategory();
    }
  }, [id]);

  const fetchCategory = async () => {
    if (!id) return;

    setLoading(true);
    setError(null);

    try {
      // Parse the ID format: "sub-123" or "item-123" or "product-123"
      const [type, numericId] = id.split('-');

      console.log('Fetching category:', { type, numericId, id });

      let data: FormData = {
        productCategory: '',
        itemCategory: '',
        subCategory: ''
      };

      if (type === 'sub') {
        // Fetch sub category
        const subRes = await libraryService.getSubCategoryById(Number(numericId));
        console.log('Sub category response:', subRes);

        // Extract data from axios response
        const subCat = subRes.data?.data || subRes.data;
        console.log('Sub category data:', subCat);

        if (!subCat) {
          throw new Error('Sub category not found');
        }

        // Fetch parent item category
        const itemRes = await libraryService.getItemCategoryById(subCat.itemCategoryId || subCat.item_category_id);
        console.log('Item category response:', itemRes);
        const itemCat = itemRes.data?.data || itemRes.data;
        console.log('Item category data:', itemCat);

        if (!itemCat) {
          throw new Error('Item category not found');
        }

        // Fetch grandparent product category
        const prodRes = await libraryService.getProductCategoryById(itemCat.productCategoryId || itemCat.product_category_id);
        console.log('Product category response:', prodRes);
        const prodCat = prodRes.data?.data || prodRes.data;
        console.log('Product category data:', prodCat);

        if (!prodCat) {
          throw new Error('Product category not found');
        }

        data = {
          productCategory: prodCat.name || '',
          itemCategory: itemCat.name || '',
          subCategory: subCat.name || '',
          productCategoryId: prodCat.id,
          itemCategoryId: itemCat.id
        };
      } else if (type === 'item') {
        // Fetch item category
        const itemRes = await libraryService.getItemCategoryById(Number(numericId));
        console.log('Item category response:', itemRes);
        const itemCat = itemRes.data?.data || itemRes.data;

        if (!itemCat) {
          throw new Error('Item category not found');
        }

        // Fetch parent product category
        const prodRes = await libraryService.getProductCategoryById(itemCat.productCategoryId || itemCat.product_category_id);
        console.log('Product category response:', prodRes);
        const prodCat = prodRes.data?.data || prodRes.data;

        if (!prodCat) {
          throw new Error('Product category not found');
        }

        data = {
          productCategory: prodCat.name || '',
          itemCategory: itemCat.name || '',
          subCategory: '-',
          productCategoryId: prodCat.id,
          itemCategoryId: itemCat.id
        };
      } else if (type === 'product') {
        // Fetch product category only
        const prodRes = await libraryService.getProductCategoryById(Number(numericId));
        console.log('Product category response:', prodRes);
        const prodCat = prodRes.data?.data || prodRes.data;

        if (!prodCat) {
          throw new Error('Product category not found');
        }

        data = {
          productCategory: prodCat.name || '',
          itemCategory: '-',
          subCategory: '-',
          productCategoryId: prodCat.id
        };
      }

      console.log('Final form data:', data);
      setFormData(data);
      setOriginalData(data);
    } catch (err: any) {
      console.error('Failed to fetch category:', err);
      console.error('Error response:', err.response);
      setError(err.response?.data?.error || 'Failed to load category data');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleUndo = () => {
    if (originalData) {
      setFormData(originalData);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;

    setSaving(true);
    setError(null);

    try {
      const [type, numericId] = id.split('-');

      if (type === 'sub') {
        await libraryService.updateYourSubCategory(Number(numericId), {
          name: formData.subCategory,
          itemCategoryId: formData.itemCategoryId
        });
      } else if (type === 'item') {
        await libraryService.updateYourItemCategory(Number(numericId), {
          name: formData.itemCategory,
          productCategoryId: formData.productCategoryId
        });
      } else if (type === 'product') {
        await libraryService.updateYourProductCategory(Number(numericId), {
          name: formData.productCategory
        });
      }

      navigate('/app/library');
    } catch (err: any) {
      console.error('Failed to save category:', err);
      setError(err.response?.data?.error || 'Failed to save category');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    navigate('/app/library');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600">Loading category...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-8 space-y-6 max-w-2xl mx-auto">
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-600 hover:text-gray-900 transition-colors"
        >
          <ArrowLeft className="w-6 h-6" />
        </button>
        <h1 className="text-3xl font-bold text-gray-900">Edit Category</h1>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <p className="text-red-800 text-sm">{error}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Product Category
          </label>
          <input
            type="text"
            name="productCategory"
            value={formData.productCategory}
            onChange={handleChange}
            disabled={formData.productCategory === '-'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Category
          </label>
          <input
            type="text"
            name="itemCategory"
            value={formData.itemCategory}
            onChange={handleChange}
            disabled={formData.itemCategory === '-'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required={formData.itemCategory !== '-'}
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Sub Category
          </label>
          <input
            type="text"
            name="subCategory"
            value={formData.subCategory}
            onChange={handleChange}
            disabled={formData.subCategory === '-'}
            className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:bg-gray-100 disabled:cursor-not-allowed"
            required={formData.subCategory !== '-'}
          />
        </div>

        <div className="flex gap-3 pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed font-medium"
          >
            {saving ? 'Updating...' : 'Update'}
          </button>

          <button
            type="button"
            onClick={handleUndo}
            disabled={saving}
            className="px-6 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 disabled:opacity-50 font-medium"
          >
            Undo
          </button>

          <button
            type="button"
            onClick={handleCancel}
            disabled={saving}
            className="px-6 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 font-medium"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
