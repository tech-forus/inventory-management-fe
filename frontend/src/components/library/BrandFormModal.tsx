import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { libraryService } from '../../services/libraryService';
import { validateRequired } from '../../utils/validators';

interface Brand {
  id: number;
  name: string;
  description?: string;
  isActive: boolean;
  createdAt?: string;
}

interface BrandFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (brandId: number) => void;
  editingBrand?: Brand | null;
}

const BrandFormModal: React.FC<BrandFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingBrand,
}) => {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [brandForm, setBrandForm] = useState<Partial<Brand>>({
    name: '',
    description: '',
    isActive: true,
  });

  useEffect(() => {
    if (isOpen) {
      if (editingBrand) {
        setBrandForm(editingBrand);
      } else {
        setBrandForm({
          name: '',
          description: '',
          isActive: true,
        });
      }
      setErrors({});
    }
  }, [isOpen, editingBrand]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    if (!validateRequired(brandForm.name || '')) {
      newErrors.name = 'Brand Name is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      let brandId: number;
      if (editingBrand) {
        await libraryService.updateYourBrand(editingBrand.id, brandForm);
        brandId = editingBrand.id;
      } else {
        const result = await libraryService.createYourBrand(brandForm);
        brandId = result.data.id;
      }
      onSave(brandId);
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save brand');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-lg w-full mx-4">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingBrand ? 'Edit Brand' : 'Add Brand'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
              disabled={saving}
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Brand Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={brandForm.name}
                onChange={(e) => setBrandForm({ ...brandForm, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
              <textarea
                value={brandForm.description}
                onChange={(e) => setBrandForm({ ...brandForm, description: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Status</label>
              <div className="flex gap-4">
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={brandForm.isActive === true}
                    onChange={() => setBrandForm({ ...brandForm, isActive: true })}
                    className="text-blue-600"
                  />
                  <span>Active</span>
                </label>
                <label className="flex items-center gap-2">
                  <input
                    type="radio"
                    checked={brandForm.isActive === false}
                    onChange={() => setBrandForm({ ...brandForm, isActive: false })}
                    className="text-blue-600"
                  />
                  <span>Inactive</span>
                </label>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-4 mt-6">
            <button
              onClick={onClose}
              disabled={saving}
              className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BrandFormModal;

