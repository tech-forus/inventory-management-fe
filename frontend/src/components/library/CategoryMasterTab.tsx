import React, { useState, useEffect, useRef } from 'react';
import { Plus, Search, Edit, Trash2, X, Upload, Download } from 'lucide-react';
import * as XLSX from 'xlsx';
import { libraryService } from '../../services/libraryService';
import { formatDate } from '../../utils/formatters';
import CategoryWizard from './CategoryWizard';

interface ProductCategory {
  id: number;
  name: string;
  description?: string;
  createdAt?: string;
}

interface ItemCategory {
  id: number;
  name: string;
  productCategoryId: number;
  productCategoryName?: string;
  description?: string;
  createdAt?: string;
}

interface SubCategory {
  id: number;
  name: string;
  itemCategoryId: number;
  itemCategoryName?: string;
  description?: string;
  createdAt?: string;
}

type UnifiedCategoryRow = {
  id: string;
  type: 'product' | 'item' | 'sub';
  productCategory: string;
  itemCategory: string;
  subCategory: string;
  createdAt: string;
  productCategoryId?: number;
  itemCategoryId?: number;
  subCategoryId?: number;
};

interface CategoryMasterTabProps {
  productCategories: ProductCategory[];
  itemCategories: ItemCategory[];
  subCategories: SubCategory[];
  loading: boolean;
  onRefresh: () => void;
}

const CategoryMasterTab: React.FC<CategoryMasterTabProps> = ({
  productCategories,
  itemCategories,
  subCategories,
  loading,
  onRefresh,
}) => {
  const [search, setSearch] = useState('');
  const [unifiedRows, setUnifiedRows] = useState<UnifiedCategoryRow[]>([]);
  const [showWizard, setShowWizard] = useState(false);
  const [editingRow, setEditingRow] = useState<UnifiedCategoryRow | null>(null);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Upload preview states
  const [showUploadPreview, setShowUploadPreview] = useState(false);
  const [uploadPreviewData, setUploadPreviewData] = useState<{
    rows: Array<{ productCategory: string; itemCategory: string; subCategory: string }>;
    file: File | null;
  } | null>(null);
  const [uploading, setUploading] = useState(false);

  // Load existing categories for wizard
  const [existingProductCategories, setExistingProductCategories] = useState<ProductCategory[]>([]);
  const [existingItemCategories, setExistingItemCategories] = useState<ItemCategory[]>([]);
  const [existingSubCategories, setExistingSubCategories] = useState<SubCategory[]>([]);

  // Build unified rows from all category types
  useEffect(() => {
    const rows: UnifiedCategoryRow[] = [];

    // ONLY create rows for Sub Categories (complete hierarchy)
    subCategories.forEach((sc) => {
      const itemCat = itemCategories.find((ic) => ic.id === sc.itemCategoryId);
      const productCat = productCategories.find((pc) => pc.id === itemCat?.productCategoryId);
      
      rows.push({
        id: `sub-${sc.id}`,
        type: 'sub',
        productCategory: productCat?.name || '—',
        itemCategory: itemCat?.name || '—',
        subCategory: sc.name,
        createdAt: sc.createdAt || '',
        productCategoryId: productCat?.id,
        itemCategoryId: sc.itemCategoryId,
        subCategoryId: sc.id,
      });
    });

    // Sort by created date (newest first)
    rows.sort((a, b) => {
      const dateA = new Date(a.createdAt).getTime();
      const dateB = new Date(b.createdAt).getTime();
      return dateB - dateA;
    });

    setUnifiedRows(rows);
  }, [productCategories, itemCategories, subCategories]);

  // Load existing categories for wizard
  useEffect(() => {
    if (showWizard) {
      libraryService.getYourProductCategories().then((res) => {
        setExistingProductCategories(res.data || []);
      });
      libraryService.getYourItemCategories().then((res) => {
        setExistingItemCategories(res.data || []);
      });
      libraryService.getYourSubCategories().then((res) => {
        setExistingSubCategories(res.data || []);
      });
    }
  }, [showWizard]);

  const filteredRows = unifiedRows.filter((row) => {
    const searchLower = search.toLowerCase();

    // If no search term, show all rows
    if (!searchLower) return true;

    // Filter based on search term (search across all columns)
    return (
      (row.productCategory && row.productCategory !== '—' && row.productCategory.toLowerCase().includes(searchLower)) ||
      (row.itemCategory && row.itemCategory !== '—' && row.itemCategory.toLowerCase().includes(searchLower)) ||
      (row.subCategory && row.subCategory !== '—' && row.subCategory.toLowerCase().includes(searchLower))
    );
  });

  const handleOpenWizard = (row?: UnifiedCategoryRow) => {
    if (row) {
      setEditingRow(row);
    } else {
      setEditingRow(null);
    }
    setShowWizard(true);
  };

  const handleCloseWizard = () => {
    setShowWizard(false);
    setEditingRow(null);
  };


  const handleDelete = async (row: UnifiedCategoryRow) => {
    const typeName = row.type === 'product' ? 'product category' : row.type === 'item' ? 'item category' : 'sub category';
    const categoryName = row.type === 'product' ? row.productCategory : row.type === 'item' ? row.itemCategory : row.subCategory;
    
    const confirmMessage = `Are you sure you want to PERMANENTLY DELETE this ${typeName}?\n\n` +
      `Category: "${categoryName}"\n\n` +
      `This action will completely remove it from the database and cannot be undone.`;
    
    if (!window.confirm(confirmMessage)) return;

    try {
      setSaving(true);
      if (row.type === 'product' && row.productCategoryId) {
        await libraryService.deleteYourProductCategory(row.productCategoryId, true);
      } else if (row.type === 'item' && row.itemCategoryId) {
        await libraryService.deleteYourItemCategory(row.itemCategoryId, true);
      } else if (row.type === 'sub' && row.subCategoryId) {
        await libraryService.deleteYourSubCategory(row.subCategoryId, true);
      } else {
        throw new Error('Invalid category ID');
      }
      
      // Show success message
      alert(`${typeName.charAt(0).toUpperCase() + typeName.slice(1)} "${categoryName}" has been permanently deleted from the database.`);
      onRefresh();
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || 
                          error.response?.data?.message || 
                          error.message || 
                          `Failed to delete ${typeName}`;
      alert(`Error: ${errorMessage}\n\nThe category may still exist in the database.`);
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    // Create unified template with a single sheet (user-friendly)
    const wb = XLSX.utils.book_new();
    
    // Title + headers + example row (exact headers requested)
    const aoa = [
      ['Category Master Template', '', ''],
      ['Product Category', 'Item Category', 'Sub Category'],
      ['', '', ''],
    ];
    const ws = XLSX.utils.aoa_to_sheet(aoa);
    ws['!cols'] = [{ wch: 25 }, { wch: 25 }, { wch: 25 }];
    // Merge title across 3 columns
    ws['!merges'] = [{ s: { r: 0, c: 0 }, e: { r: 0, c: 2 } }];
    XLSX.utils.book_append_sheet(wb, ws, 'Category Master');
    
    XLSX.writeFile(wb, 'Category_Master_Upload_Template.xlsx');
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const parseExcelFile = (file: File): Promise<{
    rows: Array<{ productCategory: string; itemCategory: string; subCategory: string }>;
  }> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const data = new Uint8Array(e.target?.result as ArrayBuffer);
          const workbook = XLSX.read(data, { type: 'array' });
          
          // Find Category Master sheet
          const categoryMasterSheetName = workbook.SheetNames.find(name => {
            const lowerName = name.toLowerCase().trim();
            return (lowerName.includes('category') && lowerName.includes('master')) ||
                   lowerName === 'category master' ||
                   lowerName === 'categorymaster';
          });
          
          if (!categoryMasterSheetName) {
            reject(new Error('Category Master sheet not found in the file'));
            return;
          }
          
          const worksheet = workbook.Sheets[categoryMasterSheetName];
          
          // Find header row
          let dataStartRow = 2; // Default: start from row 3 (0-based index 2)
          const maxSearchRows = 5;
          for (let i = 0; i < maxSearchRows; i++) {
            const cellA = worksheet[XLSX.utils.encode_cell({ r: i, c: 0 })];
            if (cellA && cellA.v && cellA.v.toString().toLowerCase().includes('product category')) {
              dataStartRow = i + 1;
              break;
            }
          }
          
          // Parse data
          const unifiedData = XLSX.utils.sheet_to_json(worksheet, {
            header: ['Product Category', 'Item Category', 'Sub Category'],
            range: dataStartRow,
            defval: null,
            blankrows: false,
          });
          
          // Filter empty rows
          const dataRows = unifiedData.filter((row: any) =>
            (row['Product Category'] && row['Product Category'].toString().trim()) ||
            (row['Item Category'] && row['Item Category'].toString().trim()) ||
            (row['Sub Category'] && row['Sub Category'].toString().trim())
          );
          
          // Extract unique categories
          const productCategoryMap = new Map<string, string>(); // lowercase -> original
          const itemCategoryMap = new Map<string, Map<string, string>>(); // productKey -> Map(itemKey -> original)
          const subCategoryMap = new Map<string, Map<string, string>>(); // itemKey -> Map(subKey -> original)
          
          for (const row of dataRows) {
            const productCat = ((row as any)['Product Category'] || '').toString().trim();
            const itemCat = ((row as any)['Item Category'] || '').toString().trim();
            const subCat = ((row as any)['Sub Category'] || '').toString().trim();
            
            if (productCat) {
              const key = productCat.toLowerCase().trim();
              if (!productCategoryMap.has(key)) {
                productCategoryMap.set(key, productCat.trim());
              }
            }
            
            if (productCat && itemCat) {
              const productKey = productCat.toLowerCase().trim();
              if (!itemCategoryMap.has(productKey)) {
                itemCategoryMap.set(productKey, new Map());
              }
              const itemKey = itemCat.toLowerCase().trim();
              if (!itemCategoryMap.get(productKey)!.has(itemKey)) {
                itemCategoryMap.get(productKey)!.set(itemKey, itemCat.trim());
              }
            }
            
            if (productCat && itemCat && subCat) {
              const key = `${productCat.toLowerCase().trim()}|${itemCat.toLowerCase().trim()}`;
              if (!subCategoryMap.has(key)) {
                subCategoryMap.set(key, new Map());
              }
              const subKey = subCat.toLowerCase().trim();
              if (!subCategoryMap.get(key)!.has(subKey)) {
                subCategoryMap.get(key)!.set(subKey, subCat.trim());
              }
            }
          }
          
          // Convert to unified rows array (same format as Excel)
          const rows: Array<{ productCategory: string; itemCategory: string; subCategory: string }> = [];
          
          for (const row of dataRows) {
            const productCat = ((row as any)['Product Category'] || '').toString().trim();
            const itemCat = ((row as any)['Item Category'] || '').toString().trim();
            const subCat = ((row as any)['Sub Category'] || '').toString().trim();
            
            rows.push({
              productCategory: productCat || '',
              itemCategory: itemCat || '',
              subCategory: subCat || ''
            });
          }
          
          resolve({ rows });
        } catch (error) {
          reject(error);
        }
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsArrayBuffer(file);
    });
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    // Check both MIME type and file extension for better compatibility
    const validMimeTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'application/octet-stream',
      'application/x-zip-compressed',
      'text/csv',
    ];
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    const isValidMimeType = validMimeTypes.includes(file.type);
    const isValidExtension = validExtensions.includes(fileExtension);
    
    if (!isValidMimeType && !isValidExtension) {
      alert('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    try {
      setSaving(true);
      const previewData = await parseExcelFile(file);
      setUploadPreviewData({ ...previewData, file });
      setShowUploadPreview(true);
    } catch (error: any) {
      alert(error.message || 'Failed to parse Excel file');
    } finally {
      setSaving(false);
    }
  };

  const handleConfirmUpload = async () => {
    if (!uploadPreviewData?.file) return;

    try {
      setUploading(true);
      const result = await libraryService.uploadCategories(uploadPreviewData.file);
      
      if (result.success) {
        let summary = `Upload Summary:\n\n` +
          `Product Categories: ${result.productCategories?.inserted || 0} inserted, ${result.productCategories?.updated || 0} already existed, ${result.productCategories?.errors || 0} errors\n` +
          `Item Categories: ${result.itemCategories?.inserted || 0} inserted, ${result.itemCategories?.updated || 0} already existed, ${result.itemCategories?.errors || 0} errors\n` +
          `Sub Categories: ${result.subCategories?.inserted || 0} inserted, ${result.subCategories?.updated || 0} already existed, ${result.subCategories?.errors || 0} errors`;
        
        // Add error details if any
        const allErrors: string[] = [];
        
        if (result.productCategories?.errorDetails && result.productCategories.errorDetails.length > 0) {
          allErrors.push('\nProduct Category Errors:');
          result.productCategories.errorDetails.forEach((err: any) => {
            allErrors.push(`  - ${err.error}`);
          });
        }
        
        if (result.itemCategories?.errorDetails && result.itemCategories.errorDetails.length > 0) {
          allErrors.push('\nItem Category Errors:');
          result.itemCategories.errorDetails.forEach((err: any) => {
            allErrors.push(`  - ${err.error}`);
          });
        }
        
        if (result.subCategories?.errorDetails && result.subCategories.errorDetails.length > 0) {
          allErrors.push('\nSub Category Errors:');
          result.subCategories.errorDetails.forEach((err: any) => {
            allErrors.push(`  - ${err.error}`);
          });
        }
        
        if (allErrors.length > 0) {
          summary += '\n\n' + allErrors.join('\n');
        }
        
        // Close preview modal first
        setShowUploadPreview(false);
        setUploadPreviewData(null);
        
        // Show success message and refresh immediately
        alert(summary);
        
        // Refresh the list to show uploaded items immediately
        onRefresh();
      } else {
        alert(result.message || 'Failed to upload file');
      }
    } catch (error: any) {
      const errorMessage = error.response?.data?.error || error.response?.data?.message || 'Failed to upload file';
      const errorDetails = error.response?.data?.errorDetails;
      
      let fullError = errorMessage;
      if (errorDetails && Array.isArray(errorDetails) && errorDetails.length > 0) {
        fullError += '\n\nError Details:\n' + errorDetails.map((err: any) => `  - ${err.error || err}`).join('\n');
      }
      
      alert(fullError);
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleCancelUpload = () => {
    setShowUploadPreview(false);
    setUploadPreviewData(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
          <input
            type="text"
            placeholder="Search categories..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
          />
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => handleOpenWizard()}
            className="px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 text-base"
            title="Add new category using wizard"
          >
            <Plus className="w-5 h-5" />
            Add Category
          </button>
          <button
            onClick={handleDownloadTemplate}
            className="px-4 py-2.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2 text-base"
            title="Download unified Excel template with all category types"
          >
            <Download className="w-5 h-5" />
            Download Template
          </button>
          <button
            onClick={handleFileSelect}
            className="px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2 text-base"
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

      {loading ? (
        <div className="flex justify-center py-12">
          <div className="w-6 h-6 border-3 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      ) : filteredRows.length === 0 ? (
        <div className="p-12 text-center">
          <p className="text-gray-600 text-sm">No categories found</p>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="px-3 py-2 text-center text-base font-semibold text-gray-700 uppercase">Product Category</th>
                  <th className="px-3 py-2 text-center text-base font-semibold text-gray-700 uppercase">Item Category</th>
                  <th className="px-3 py-2 text-center text-base font-semibold text-gray-700 uppercase">Sub Category</th>
                  <th className="px-3 py-2 text-center text-base font-semibold text-gray-700 uppercase">Created Date</th>
                  <th className="px-3 py-2 text-center text-xs font-semibold text-gray-700 uppercase">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredRows.map((row) => (
                  <tr key={row.id} className="hover:bg-gray-50">
                    <td className="px-3 py-2 text-base text-gray-900 text-center">
                      {row.productCategory}
                    </td>
                    <td className="px-3 py-2 text-base text-gray-900 text-center">
                      {row.itemCategory}
                    </td>
                    <td className="px-3 py-2 text-base text-gray-900 text-center">
                      {row.subCategory}
                    </td>
                    <td className="px-3 py-2 text-base text-gray-500 text-center">
                      {row.createdAt ? formatDate(row.createdAt) : '—'}
                    </td>
                    <td className="px-3 py-2 text-xs text-center">
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => handleOpenWizard(row)}
                          className="p-1.5 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Edit"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        <button
                          onClick={() => handleDelete(row)}
                          className="p-1.5 text-red-600 hover:bg-red-50 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                          title="Delete"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Category Wizard */}
      <CategoryWizard
        isOpen={showWizard}
        onClose={handleCloseWizard}
        onSave={onRefresh}
        editingRow={editingRow}
        existingProductCategories={existingProductCategories}
        existingItemCategories={existingItemCategories}
        existingSubCategories={existingSubCategories}
      />

      {/* Upload Preview Modal */}
      {showUploadPreview && uploadPreviewData && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl w-full mx-4 max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-2xl font-bold text-gray-900">Upload Preview</h2>
                <button
                  onClick={handleCancelUpload}
                  className="text-gray-400 hover:text-gray-600"
                  disabled={uploading}
                >
                  <X className="w-6 h-6" />
                </button>
              </div>

              <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>File:</strong> {uploadPreviewData.file?.name}
                </p>
                <p className="text-xs text-blue-600 mt-1">
                  Review the categories below. Click "Save and Done" to upload them to the system.
                </p>
              </div>

              <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {uploadPreviewData.rows.length > 0 ? (
                  <div className="overflow-x-auto max-h-[60vh] overflow-y-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200 sticky top-0">
                        <tr>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">#</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Product Category</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Item Category</th>
                          <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Sub Category</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadPreviewData.rows.map((row, index) => (
                          <tr key={index} className="hover:bg-gray-50">
                            <td className="px-4 py-2 text-sm text-gray-600">{index + 1}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{row.productCategory || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{row.itemCategory || '—'}</td>
                            <td className="px-4 py-2 text-sm text-gray-900">{row.subCategory || '—'}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="p-4 text-center text-sm text-gray-500">No categories found</div>
                )}
              </div>

              <div className="flex justify-end gap-3 mt-6 pt-4 border-t border-gray-200">
                <button
                  onClick={handleCancelUpload}
                  disabled={uploading}
                  className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-50 text-sm font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleConfirmUpload}
                  disabled={uploading}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium flex items-center gap-2"
                >
                  {uploading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      Uploading...
                    </>
                  ) : (
                    <>
                      <span>Save and Done</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default CategoryMasterTab;

