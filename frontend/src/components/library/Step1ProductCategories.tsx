import React from 'react';
import TagInput from './TagInput';

interface ProductCategory {
  id: number;
  name: string;
}

interface Step1ProductCategoriesProps {
  productCategories: string[];
  onChange: (categories: string[]) => void;
  existingProductCategories: ProductCategory[];
}

const PRODUCT_CATEGORY_PRESETS = [
  'Raw Materials',
  'Semi-Finished Goods',
  'Finished Goods',
  'Components & Parts',
  'Consumables',
  'Packaging Materials',
  'Machinery & Equipment',
  'Electrical & Electronics',
  'Construction Materials',
  'Hazardous Goods',
  'Perishable Goods',
  'Pharmaceuticals & Medical',
  'Textiles & Apparel',
  'Scrap & Recyclables',
  'Documents & Valuables',
];

const Step1ProductCategories: React.FC<Step1ProductCategoriesProps> = ({
  productCategories,
  onChange,
  existingProductCategories,
}) => {
  const handlePresetClick = (preset: string) => {
    const presetLower = preset.toLowerCase();
    const isAlreadyAdded = productCategories.some(
      cat => cat.toLowerCase() === presetLower
    );
    
    if (!isAlreadyAdded) {
      onChange([...productCategories, preset]);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Product Categories <span className="text-red-500">*</span>
        </label>
        <TagInput
          tags={productCategories}
          onChange={onChange}
          placeholder="Type and press Enter (or use commas) to add. Suggestions will appear as you type."
          existingItems={existingProductCategories}
        />
        <p className="text-xs text-gray-500 mt-2">
          Add one or more product categories. You can type and press Enter, or separate multiple entries with commas.
        </p>
      </div>

      {/* Quick Select Presets */}
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Quick Select
        </label>
        <div className="flex flex-wrap gap-2">
          {PRODUCT_CATEGORY_PRESETS.map((preset) => {
            const isSelected = productCategories.some(
              cat => cat.toLowerCase() === preset.toLowerCase()
            );
            return (
              <button
                key={preset}
                type="button"
                onClick={() => handlePresetClick(preset)}
                disabled={isSelected}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                  isSelected
                    ? 'bg-gray-200 text-gray-500 cursor-not-allowed opacity-50'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {preset}
              </button>
            );
          })}
        </div>
      </div>

      {/* Existing Categories Display */}
      {existingProductCategories.length > 0 && (
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Existing Product Categories
          </label>
          <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
            {existingProductCategories.map((category) => {
              const isSelected = productCategories.some(
                cat => cat.toLowerCase() === category.name.toLowerCase()
              );
              return (
                <button
                  key={category.id}
                  type="button"
                  onClick={() => handlePresetClick(category.name)}
                  disabled={isSelected}
                  className={`px-2.5 py-1 rounded text-xs transition-colors ${
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
};

export default Step1ProductCategories;

