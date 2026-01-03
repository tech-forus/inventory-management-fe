import React from 'react';
import TagInput from './TagInput';

interface ProductCategory {
  id: number;
  name: string;
}

interface ItemCategory {
  id: number;
  name: string;
  productCategoryId: number;
}

interface UnifiedCategoryRow {
  id: string;
  type: 'product' | 'item' | 'sub';
  productCategory: string;
  itemCategory: string;
  subCategory: string;
  productCategoryId?: number;
  itemCategoryId?: number;
  subCategoryId?: number;
}

interface Step2ItemCategoriesProps {
  productCategories: string[];
  itemCategories: { [productCategoryName: string]: string[] };
  onChange: (itemCategories: { [productCategoryName: string]: string[] }) => void;
  existingItemCategories: ItemCategory[];
  isEditing?: boolean;
  editingRow?: UnifiedCategoryRow | null;
}

const Step2ItemCategories: React.FC<Step2ItemCategoriesProps> = ({
  productCategories,
  itemCategories,
  onChange,
  existingItemCategories,
  isEditing = false,
  editingRow,
}) => {
  const handleItemCategoryChange = (productCategoryName: string, categories: string[]) => {
    onChange({
      ...itemCategories,
      [productCategoryName]: categories,
    });
  };

  const getExistingItemCategoriesForProduct = (productCategoryName: string): ItemCategory[] => {
    return existingItemCategories.filter(
      ic => ic.productCategoryId && 
      productCategories.some(
        pc => pc.toLowerCase() === productCategoryName.toLowerCase()
      )
    );
  };

  // For edit mode, show simple text input
  if (isEditing && editingRow && productCategories.length > 0) {
    const productCategoryName = productCategories[0];
    const currentValue = itemCategories[productCategoryName]?.[0] || editingRow.itemCategory || '';
    const existingForProduct = getExistingItemCategoriesForProduct(productCategoryName);

    return (
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Item Category <span className="text-red-500">*</span>
          </label>
          <div className="mb-2">
            <span className="text-sm text-gray-600">For Product Category: <span className="text-blue-600 font-semibold">{productCategoryName}</span></span>
          </div>
          <input
            type="text"
            value={currentValue}
            onChange={(e) => {
              const value = e.target.value;
              handleItemCategoryChange(productCategoryName, value ? [value] : []);
            }}
            placeholder="Enter item category name"
            className="w-full px-4 py-3 border border-blue-500 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-base"
          />
          <p className="text-xs text-gray-500 mt-2">
            Edit the item category name.
          </p>
        </div>

        {/* Existing Item Categories Display */}
        {existingForProduct.length > 0 && (
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">
              Existing Item Categories
            </label>
            <div className="flex flex-wrap gap-2">
              {existingForProduct.map((category) => {
                const isSelected = currentValue.toLowerCase() === category.name.toLowerCase();
                return (
                  <button
                    key={category.id}
                    type="button"
                    onClick={() => handleItemCategoryChange(productCategoryName, [category.name])}
                    className={`px-2 py-1 rounded text-xs transition-colors ${
                      isSelected
                        ? 'bg-blue-100 text-blue-700 border border-blue-300'
                        : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                    }`}
                  >
                    {category.name}
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {productCategories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Please add product categories in Step 1 first.</p>
        </div>
      ) : (
        productCategories.map((productCategoryName) => {
          const currentItemCategories = itemCategories[productCategoryName] || [];
          const existingForProduct = getExistingItemCategoriesForProduct(productCategoryName);

          return (
            <div key={productCategoryName} className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="flex items-center justify-between">
                <label className="block text-sm font-semibold text-gray-700">
                  Item Categories for: <span className="text-blue-600">{productCategoryName}</span>
                </label>
                <span className="text-xs text-gray-500">
                  {currentItemCategories.length} added
                </span>
              </div>
              
              <TagInput
                tags={currentItemCategories}
                onChange={(tags) => handleItemCategoryChange(productCategoryName, tags)}
                placeholder={`Add item categories for ${productCategoryName}...`}
                existingItems={existingForProduct}
              />

              {/* Existing Item Categories Display */}
              {existingForProduct.length > 0 && (
                <div>
                  <label className="block text-xs font-medium text-gray-600 mb-1.5">
                    Existing Item Categories
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {existingForProduct.map((category) => {
                      const isSelected = currentItemCategories.some(
                        cat => cat.toLowerCase() === category.name.toLowerCase()
                      );
                      return (
                        <button
                          key={category.id}
                          type="button"
                          onClick={() => {
                            if (!isSelected) {
                              handleItemCategoryChange(productCategoryName, [
                                ...currentItemCategories,
                                category.name,
                              ]);
                            }
                          }}
                          disabled={isSelected}
                          className={`px-2 py-1 rounded text-xs transition-colors ${
                            isSelected
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-100'
                          }`}
                        >
                          {category.name}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Step2ItemCategories;

