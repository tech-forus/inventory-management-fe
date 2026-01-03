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

interface Step2ItemCategoriesProps {
  productCategories: string[];
  itemCategories: { [productCategoryName: string]: string[] };
  onChange: (itemCategories: { [productCategoryName: string]: string[] }) => void;
  existingItemCategories: ItemCategory[];
}

const Step2ItemCategories: React.FC<Step2ItemCategoriesProps> = ({
  productCategories,
  itemCategories,
  onChange,
  existingItemCategories,
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

