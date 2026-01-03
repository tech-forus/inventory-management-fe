import React from 'react';
import TagInput from './TagInput';

interface ItemCategory {
  id: number;
  name: string;
  productCategoryId: number;
}

interface SubCategory {
  id: number;
  name: string;
  itemCategoryId: number;
}

interface Step3SubCategoriesProps {
  productCategories: string[];
  itemCategories: { [productCategoryName: string]: string[] };
  subCategories: { [itemCategoryName: string]: string[] };
  onChange: (subCategories: { [itemCategoryName: string]: string[] }) => void;
  existingSubCategories: SubCategory[];
  existingItemCategories: ItemCategory[];
}

const Step3SubCategories: React.FC<Step3SubCategoriesProps> = ({
  productCategories,
  itemCategories,
  subCategories,
  onChange,
  existingSubCategories,
  existingItemCategories,
}) => {
  const handleSubCategoryChange = (itemCategoryName: string, categories: string[]) => {
    onChange({
      ...subCategories,
      [itemCategoryName]: categories,
    });
  };

  const getAllItemCategories = (): Array<{ name: string; productCategoryName: string }> => {
    const allItems: Array<{ name: string; productCategoryName: string }> = [];
    productCategories.forEach((productCategoryName) => {
      const items = itemCategories[productCategoryName] || [];
      items.forEach((itemName) => {
        allItems.push({ name: itemName, productCategoryName });
      });
    });
    return allItems;
  };

  const getExistingSubCategoriesForItem = (itemCategoryName: string): SubCategory[] => {
    // Find the item category ID from existingItemCategories
    const itemCategory = existingItemCategories.find(
      ic => ic.name.toLowerCase() === itemCategoryName.toLowerCase()
    );
    if (!itemCategory) return [];
    
    return existingSubCategories.filter(
      sc => sc.itemCategoryId === itemCategory.id
    );
  };

  const allItemCategories = getAllItemCategories();

  return (
    <div className="space-y-6">
      {allItemCategories.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <p className="text-sm">Please add item categories in Step 2 first.</p>
        </div>
      ) : (
        productCategories.map((productCategoryName) => {
          const itemsForProduct = itemCategories[productCategoryName] || [];
          
          if (itemsForProduct.length === 0) return null;

          return (
            <div key={productCategoryName} className="space-y-4">
              <h4 className="text-sm font-semibold text-gray-700 border-b border-gray-200 pb-2">
                Product: {productCategoryName}
              </h4>
              {itemsForProduct.map((itemCategoryName) => {
                const currentSubCategories = subCategories[itemCategoryName] || [];
                const existingForItem = getExistingSubCategoriesForItem(itemCategoryName);

                return (
                  <div
                    key={itemCategoryName}
                    className="space-y-3 p-4 bg-gray-50 rounded-lg border border-gray-200 ml-4"
                  >
                    <div className="flex items-center justify-between">
                      <label className="block text-sm font-semibold text-gray-700">
                        Sub-Categories for: <span className="text-green-600">{itemCategoryName}</span>
                      </label>
                      <span className="text-xs text-gray-500">
                        {currentSubCategories.length} added
                      </span>
                    </div>

                    <TagInput
                      tags={currentSubCategories}
                      onChange={(tags) => handleSubCategoryChange(itemCategoryName, tags)}
                      placeholder={`Add sub-categories for ${itemCategoryName}...`}
                      existingItems={existingForItem}
                    />

                    {/* Existing Sub-Categories Display */}
                    {existingForItem.length > 0 && (
                      <div>
                        <label className="block text-xs font-medium text-gray-600 mb-1.5">
                          Existing Sub-Categories
                        </label>
                        <div className="flex flex-wrap gap-2">
                          {existingForItem.map((category) => {
                            const isSelected = currentSubCategories.some(
                              cat => cat.toLowerCase() === category.name.toLowerCase()
                            );
                            return (
                              <button
                                key={category.id}
                                type="button"
                                onClick={() => {
                                  if (!isSelected) {
                                    handleSubCategoryChange(itemCategoryName, [
                                      ...currentSubCategories,
                                      category.name,
                                    ]);
                                  }
                                }}
                                disabled={isSelected}
                                className={`px-2 py-1 rounded text-xs transition-colors ${
                                  isSelected
                                    ? 'bg-green-100 text-green-700 border border-green-300'
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
              })}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Step3SubCategories;

