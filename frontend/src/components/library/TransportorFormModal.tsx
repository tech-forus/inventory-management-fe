import React, { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { libraryService } from '../../services/libraryService';
import { validateRequired, validateEmail, validatePhone, validateGST } from '../../utils/validators';

interface Transportor {
  id: number;
  name: string;
  subVendor: string;
  contactPerson?: string;
  contactNumber?: string;
  email?: string;
  gstNumber?: string;
  isActive: boolean;
  remarks?: string;
}

interface TransportorFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transportorId: number) => void;
  editingTransportor?: Transportor | null;
}

const TransportorFormModal: React.FC<TransportorFormModalProps> = ({
  isOpen,
  onClose,
  onSave,
  editingTransportor,
}) => {
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const [transportorForm, setTransportorForm] = useState<Partial<Transportor>>({
    name: '',
    subVendor: '',
    contactPerson: '',
    contactNumber: '',
    email: '',
    gstNumber: '',
    isActive: true,
    remarks: '',
  });

  useEffect(() => {
    if (isOpen) {
      if (editingTransportor) {
        setTransportorForm({
          name: editingTransportor.name || '',
          subVendor: editingTransportor.subVendor || '',
          contactPerson: editingTransportor.contactPerson || '',
          contactNumber: editingTransportor.contactNumber || '',
          email: editingTransportor.email || '',
          gstNumber: editingTransportor.gstNumber || '',
          isActive: editingTransportor.isActive !== false,
          remarks: editingTransportor.remarks || '',
        });
      } else {
        setTransportorForm({
          name: '',
          subVendor: '',
          contactPerson: '',
          contactNumber: '',
          email: '',
          gstNumber: '',
          isActive: true,
          remarks: '',
        });
      }
      setErrors({});
    }
  }, [isOpen, editingTransportor]);

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};

    if (!validateRequired(transportorForm.name || '')) {
      newErrors.name = 'Transporter Name is required';
    }
    if (!validateRequired(transportorForm.subVendor || '')) {
      newErrors.subVendor = 'Sub Vendor is required';
    }
    if (!validateRequired(transportorForm.contactPerson || '')) {
      newErrors.contactPerson = 'Contact Person Name is required';
    }
    if (!validateRequired(transportorForm.contactNumber || '')) {
      newErrors.contactNumber = 'Contact Number is required';
    }
    if (!validateRequired(transportorForm.email || '')) {
      newErrors.email = 'Email ID is required';
    } else if (!validateEmail(transportorForm.email || '')) {
      newErrors.email = 'Invalid email format';
    }
    // GST Number is optional, but if provided, validate format
    if (transportorForm.gstNumber && transportorForm.gstNumber.trim() && !validateGST(transportorForm.gstNumber)) {
      newErrors.gstNumber = 'Invalid GST number format';
    }

    if (transportorForm.contactNumber && !validatePhone(transportorForm.contactNumber)) {
      newErrors.contactNumber = 'Invalid phone number (10 digits)';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      let result;
      if (editingTransportor) {
        result = await libraryService.updateTransportor(editingTransportor.id, transportorForm);
        onSave(editingTransportor.id);
      } else {
        result = await libraryService.createTransportor(transportorForm);
        // Extract ID from response
        const transportorId = result?.id || result?.data?.id;
        if (transportorId) {
          onSave(transportorId);
        } else {
          onSave(0); // Will trigger refresh
        }
      }
      onClose();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save transporter');
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-2xl font-bold text-gray-900">
              {editingTransportor ? 'Edit Transporter' : 'Add Transporter'}
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Transporter Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transportorForm.name}
                onChange={(e) => setTransportorForm({ ...transportorForm, name: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.name ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.name && <p className="text-red-500 text-xs mt-1">{errors.name}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sub Vendor <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transportorForm.subVendor}
                onChange={(e) => setTransportorForm({ ...transportorForm, subVendor: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.subVendor ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.subVendor && <p className="text-red-500 text-xs mt-1">{errors.subVendor}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Contact Person Name <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={transportorForm.contactPerson}
                onChange={(e) => setTransportorForm({ ...transportorForm, contactPerson: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.contactPerson ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.contactPerson && <p className="text-red-500 text-xs mt-1">{errors.contactPerson}</p>}
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Contact Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={transportorForm.contactNumber}
                  onChange={(e) => setTransportorForm({ ...transportorForm, contactNumber: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email ID <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  value={transportorForm.email}
                  onChange={(e) => setTransportorForm({ ...transportorForm, email: e.target.value })}
                  className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                    errors.email ? 'border-red-500' : 'border-gray-300'
                  }`}
                />
                {errors.email && <p className="text-red-500 text-xs mt-1">{errors.email}</p>}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                GST Number
              </label>
              <input
                type="text"
                value={transportorForm.gstNumber}
                onChange={(e) => setTransportorForm({ ...transportorForm, gstNumber: e.target.value })}
                className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                  errors.gstNumber ? 'border-red-500' : 'border-gray-300'
                }`}
              />
              {errors.gstNumber && <p className="text-red-500 text-xs mt-1">{errors.gstNumber}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
              <textarea
                value={transportorForm.remarks}
                onChange={(e) => setTransportorForm({ ...transportorForm, remarks: e.target.value })}
                rows={3}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                id="isActive"
                checked={transportorForm.isActive !== false}
                onChange={(e) => setTransportorForm({ ...transportorForm, isActive: e.target.checked })}
                className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="isActive" className="ml-2 text-sm text-gray-700">
                Status: Active
              </label>
            </div>
          </div>
          <div className="flex justify-end gap-3 mt-6">
            <button
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              {saving ? 'Saving...' : editingTransportor ? 'Update' : 'Save'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TransportorFormModal;

