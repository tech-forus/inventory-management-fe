import React, { useState, useEffect } from 'react';
import { X, AlertTriangle } from 'lucide-react';
import StepIndicator from './StepIndicator';
import Step1ProductCategories from './Step1ProductCategories';
import Step2ItemCategories from './Step2ItemCategories';
import Step3SubCategories from './Step3SubCategories';
import ProgressTracker from './ProgressTracker';
import { libraryService } from '../../services/libraryService';

interface ProductCategory {
  id: number;
  name: string;
}

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

interface CategoryWizardProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: () => void;
  editingRow?: UnifiedCategoryRow | null;
  existingProductCategories: ProductCategory[];
  existingItemCategories: ItemCategory[];
  existingSubCategories: SubCategory[];
}

interface WizardState {
  productCategories: string[];
  itemCategories: { [productCategoryName: string]: string[] };
  subCategories: { [itemCategoryName: string]: string[] };
}

const CategoryWizard: React.FC<CategoryWizardProps> = ({
  isOpen,
  onClose,
  onSave,
  editingRow,
  existingProductCategories,
  existingItemCategories,
  existingSubCategories,
}) => {
  const [currentStep, setCurrentStep] = useState<1 | 2 | 3>(1);
  const [wizardState, setWizardState] = useState<WizardState>({
    productCategories: [],
    itemCategories: {},
    subCategories: {},
  });
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [showDiscardModal, setShowDiscardModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [loadingExisting, setLoadingExisting] = useState(false);

  // Track changes
  useEffect(() => {
    const hasChanges =
      wizardState.productCategories.length > 0 ||
      Object.keys(wizardState.itemCategories).length > 0 ||
      Object.keys(wizardState.subCategories).length > 0;
    setHasUnsavedChanges(hasChanges);
  }, [wizardState]);

  // Browser back/close warning
  useEffect(() => {
    if (!isOpen) return;

    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
        return '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isOpen, hasUnsavedChanges]);

  // Initialize wizard state when editing
  useEffect(() => {
    if (isOpen && editingRow) {
      setLoadingExisting(true);
      // Pre-populate with existing data
      const productCat = editingRow.productCategory !== '—' ? editingRow.productCategory : '';
      const itemCat = editingRow.itemCategory !== '—' ? editingRow.itemCategory : '';
      const subCat = editingRow.subCategory !== '—' ? editingRow.subCategory : '';

      setWizardState({
        productCategories: productCat ? [productCat] : [],
        itemCategories: productCat && itemCat ? { [productCat]: [itemCat] } : {},
        subCategories: itemCat && subCat ? { [itemCat]: [subCat] } : {},
      });
      setLoadingExisting(false);
    } else if (isOpen && !editingRow) {
      // Reset for new category
      setWizardState({
        productCategories: [],
        itemCategories: {},
        subCategories: {},
      });
      setCurrentStep(1);
    }
  }, [isOpen, editingRow]);

  const handleProductCategoriesChange = (categories: string[]) => {
    setWizardState(prev => ({
      ...prev,
      productCategories: categories,
    }));
  };

  const handleItemCategoriesChange = (itemCategories: { [key: string]: string[] }) => {
    setWizardState(prev => ({
      ...prev,
      itemCategories,
    }));
  };

  const handleSubCategoriesChange = (subCategories: { [key: string]: string[] }) => {
    setWizardState(prev => ({
      ...prev,
      subCategories,
    }));
  };

  const handleNext = () => {
    if (currentStep < 3) {
      // Validate current step before proceeding
      if (currentStep === 1 && wizardState.productCategories.length === 0) {
        return; // Cannot proceed without product categories
      }
      if (currentStep === 2) {
        const totalItems = Object.values(wizardState.itemCategories).flat().length;
        if (totalItems === 0) {
          return; // Cannot proceed without item categories
        }
      }
      setCurrentStep((prev) => (prev + 1) as 1 | 2 | 3);
    }
  };

  const handleBack = () => {
    if (hasUnsavedChanges && currentStep > 1) {
      setShowDiscardModal(true);
    } else {
      setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
    }
  };

  const handleDiscardAndGoBack = () => {
    setShowDiscardModal(false);
    setCurrentStep((prev) => (prev - 1) as 1 | 2 | 3);
  };

  const handleClose = () => {
    if (hasUnsavedChanges) {
      setShowDiscardModal(true);
    } else {
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setWizardState({
      productCategories: [],
      itemCategories: {},
      subCategories: {},
    });
    setCurrentStep(1);
    setHasUnsavedChanges(false);
    setShowDiscardModal(false);
  };

  const findOrCreateCategory = async (
    categoryName: string,
    existingCategories: Array<{ id: number; name: string }>,
    createFn: (data: any) => Promise<any>,
    updateFn?: (id: number, data: any) => Promise<any>
  ): Promise<number> => {
    const existing = existingCategories.find(
      c => c.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    if (existing) {
      // If editing and we have update function, update it
      if (updateFn && editingRow) {
        await updateFn(existing.id, { name: categoryName });
      }
      return existing.id;
    }
    
    // Create new
    const result = await createFn({ name: categoryName });
    // API returns { success: true, data: { id, name, ... } }
    return result.data?.id || result.id || (result as any).id;
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Step 1: Create/Update Product Categories
      const productCategoryMap: { [name: string]: number } = {};
      for (const productCategoryName of wizardState.productCategories) {
        const id = await findOrCreateCategory(
          productCategoryName,
          existingProductCategories,
          (data) => libraryService.createYourProductCategory(data),
          editingRow?.productCategoryId ? (id, data) => libraryService.updateYourProductCategory(id, data) : undefined
        );
        productCategoryMap[productCategoryName] = id;
      }

      // Step 2: Create/Update Item Categories
      const itemCategoryMap: { [name: string]: number } = {};
      for (const [productCategoryName, itemCategoryNames] of Object.entries(wizardState.itemCategories)) {
        const productCategoryId = productCategoryMap[productCategoryName];
        if (!productCategoryId) continue;

        for (const itemCategoryName of itemCategoryNames) {
          const existingItem = existingItemCategories.find(
            ic => ic.name.toLowerCase() === itemCategoryName.toLowerCase() &&
            ic.productCategoryId === productCategoryId
          );

          let itemCategoryId: number;
          if (existingItem) {
            if (editingRow?.itemCategoryId === existingItem.id) {
              await libraryService.updateYourItemCategory(existingItem.id, {
                name: itemCategoryName,
                productCategoryId,
              });
            }
            itemCategoryId = existingItem.id;
          } else {
            const result = await libraryService.createYourItemCategory({
              name: itemCategoryName,
              productCategoryId,
            });
            // API returns { success: true, data: { id, name, ... } }
            itemCategoryId = result.data?.id || result.id || (result as any).id;
          }
          itemCategoryMap[itemCategoryName] = itemCategoryId;
        }
      }

      // Step 3: Create/Update Sub-Categories
      for (const [itemCategoryName, subCategoryNames] of Object.entries(wizardState.subCategories)) {
        const itemCategoryId = itemCategoryMap[itemCategoryName];
        if (!itemCategoryId) continue;

        for (const subCategoryName of subCategoryNames) {
          const existingSub = existingSubCategories.find(
            sc => sc.name.toLowerCase() === subCategoryName.toLowerCase() &&
            sc.itemCategoryId === itemCategoryId
          );

          if (existingSub) {
            if (editingRow?.subCategoryId === existingSub.id) {
              await libraryService.updateYourSubCategory(existingSub.id, {
                name: subCategoryName,
                itemCategoryId,
              });
            }
          } else {
            await libraryService.createYourSubCategory({
              name: subCategoryName,
              itemCategoryId,
            });
          }
        }
      }

      handleReset();
      onSave();
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save categories');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const productCount = wizardState.productCategories.length;
  const itemCount = Object.values(wizardState.itemCategories).flat().length;
  const subCount = Object.values(wizardState.subCategories).flat().length;

  const canProceedFromStep1 = productCount > 0;
  const canProceedFromStep2 = itemCount > 0;
  const canSave = subCount > 0 || (productCount > 0 && itemCount > 0);

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg shadow-xl w-full mx-4 max-w-6xl max-h-[90vh] overflow-hidden flex flex-col">
          {/* Header */}
          <div className="p-6 border-b border-gray-200 flex-shrink-0">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-2xl font-bold text-gray-900">
                {editingRow ? 'Edit Category' : 'Add Category'}
              </h2>
              <button
                onClick={handleClose}
                className="text-gray-400 hover:text-gray-600 transition-colors"
                disabled={saving}
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            <StepIndicator currentStep={currentStep} />
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
              {/* Main Content */}
              <div className="lg:col-span-3">
                {loadingExisting ? (
                  <div className="flex justify-center py-12">
                    <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
                  </div>
                ) : (
                  <>
                    {currentStep === 1 && (
                      <Step1ProductCategories
                        productCategories={wizardState.productCategories}
                        onChange={handleProductCategoriesChange}
                        existingProductCategories={existingProductCategories}
                        isEditing={!!editingRow}
                        editingRow={editingRow}
                      />
                    )}
                    {currentStep === 2 && (
                      <Step2ItemCategories
                        productCategories={wizardState.productCategories}
                        itemCategories={wizardState.itemCategories}
                        onChange={handleItemCategoriesChange}
                        existingItemCategories={existingItemCategories}
                        isEditing={!!editingRow}
                        editingRow={editingRow}
                      />
                    )}
                    {currentStep === 3 && (
                      <Step3SubCategories
                        productCategories={wizardState.productCategories}
                        itemCategories={wizardState.itemCategories}
                        subCategories={wizardState.subCategories}
                        onChange={handleSubCategoriesChange}
                        existingSubCategories={existingSubCategories}
                        existingItemCategories={existingItemCategories}
                        isEditing={!!editingRow}
                        editingRow={editingRow}
                      />
                    )}
                  </>
                )}
              </div>

              {/* Progress Tracker Sidebar */}
              <div className="lg:col-span-1">
                <ProgressTracker
                  productCount={productCount}
                  itemCount={itemCount}
                  subCount={subCount}
                />
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="p-6 border-t border-gray-200 flex justify-between items-center flex-shrink-0">
            <div>
              {currentStep > 1 && (
                <button
                  onClick={handleBack}
                  disabled={saving}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                >
                  Back
                </button>
              )}
            </div>
            <div className="flex gap-3">
              <button
                onClick={handleClose}
                disabled={saving}
                className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
              >
                Cancel
              </button>
              {currentStep < 3 ? (
                <button
                  onClick={handleNext}
                  disabled={saving || (currentStep === 1 && !canProceedFromStep1) || (currentStep === 2 && !canProceedFromStep2)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium"
                >
                  Next
                </button>
              ) : (
                <button
                  onClick={handleSave}
                  disabled={saving || !canSave}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed text-sm font-medium flex items-center gap-2"
                >
                  {saving ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Saving...
                    </>
                  ) : (
                    'Save & Exit'
                  )}
                </button>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Discard Confirmation Modal */}
      {showDiscardModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[60]">
          <div className="bg-white rounded-lg shadow-xl w-full mx-4 max-w-md">
            <div className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle className="w-6 h-6 text-yellow-600" />
                <h3 className="text-lg font-semibold text-gray-900">Unsaved Changes</h3>
              </div>
              <p className="text-sm text-gray-600 mb-6">
                You will lose all unsaved data. Are you sure you want to go back?
              </p>
              <div className="flex justify-end gap-3">
                <button
                  onClick={() => setShowDiscardModal(false)}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 text-sm font-medium"
                >
                  Keep Editing
                </button>
                <button
                  onClick={() => {
                    handleDiscardAndGoBack();
                    if (currentStep === 1) {
                      handleReset();
                      onClose();
                    }
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Discard & Go Back
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default CategoryWizard;

