import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ArrowUp, ArrowDown } from 'lucide-react';
import { inventoryService } from '../services/inventoryService';
import { libraryService } from '../services/libraryService';
import { skuService } from '../services/skuService';
import { getDateRange, formatNumber, formatDate } from '../utils/formatters';
import { InventoryItem, IncomingInventoryRecord, OutgoingInventoryRecord } from '../components/inventory/types';
import { exportToExcel, exportToPDF } from '../utils/reportExporter';
import InventoryFilters from '../components/inventory/InventoryFilters';
import IncomingRecordsFilters from '../components/inventory/IncomingRecordsFilters';
import OutgoingRecordsFilters from '../components/inventory/OutgoingRecordsFilters';
import InventoryTable from '../components/inventory/InventoryTable';
import IncomingRecordsTable from '../components/inventory/IncomingRecordsTable';
import OutgoingRecordsTable from '../components/inventory/OutgoingRecordsTable';
import EditRejectedShortModal from '../components/inventory/EditRejectedShortModal';
import { IncomingInventoryItem, OutgoingInventoryItem } from '../components/inventory/types';
import { onCategoriesUpdated } from '../utils/categoriesEvents';
import { onInventoryUpdated } from '../utils/inventoryEvents';
import { RejectedItemReport, ActionFormData } from '../components/inventory/rejectedItemReports/types';
import { ShortItemReport, ShortItemActionFormData } from '../components/inventory/shortItemReports/types';
import RejectedItemReportTable from '../components/inventory/rejectedItemReports/RejectedItemReportTable';
import ShortItemReportTable from '../components/inventory/shortItemReports/ShortItemReportTable';
import SendToVendorModal from '../components/inventory/rejectedItemReports/modals/SendToVendorModal';
import ReceiveFromVendorModal from '../components/inventory/rejectedItemReports/modals/ReceiveFromVendorModal';
import ScrapModal from '../components/inventory/rejectedItemReports/modals/ScrapModal';
import HistoryModal from '../components/inventory/rejectedItemReports/modals/HistoryModal';
import ReceiveBackModal from '../components/inventory/shortItemReports/modals/ReceiveBackModal';

const InventoryPage: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'all' | 'incoming' | 'outgoing' | 'rejected' | 'short'>('all');
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [incomingRecords, setIncomingRecords] = useState<IncomingInventoryRecord[]>([]);
  const [outgoingRecords, setOutgoingRecords] = useState<OutgoingInventoryRecord[]>([]);
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [expandedIncomingRows, setExpandedIncomingRows] = useState<Set<string>>(new Set());
  const [expandedOutgoingRows, setExpandedOutgoingRows] = useState<Set<string>>(new Set());
  const [incomingRecordItems, setIncomingRecordItems] = useState<Record<number, IncomingInventoryItem[]>>({});
  const [outgoingRecordItems, setOutgoingRecordItems] = useState<Record<number, OutgoingInventoryItem[]>>({});
  const [showExportDropdown, setShowExportDropdown] = useState(false);
  const exportDropdownRef = useRef<HTMLDivElement>(null);

  // Filters
  const [search, setSearch] = useState('');
  const [productCategory, setProductCategory] = useState('');
  const [itemCategory, setItemCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [brand, setBrand] = useState('');
  const [stockStatus, setStockStatus] = useState('all');
  
  // Date filters
  const [datePreset, setDatePreset] = useState<string>('');
  const [customDateFrom, setCustomDateFrom] = useState('');
  const [customDateTo, setCustomDateTo] = useState('');
  const [showCustomDatePicker, setShowCustomDatePicker] = useState(false);

  // Sorting
  const [sortBy, setSortBy] = useState<string>('');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  
  // Incoming records sorting
  const [incomingSortBy, setIncomingSortBy] = useState<string>('');
  const [incomingSortOrder, setIncomingSortOrder] = useState<'asc' | 'desc'>('asc');

  // Dropdown data
  const [productCategories, setProductCategories] = useState<any[]>([]);
  const [itemCategories, setItemCategories] = useState<any[]>([]);
  const [subCategories, setSubCategories] = useState<any[]>([]);
  const [brands, setBrands] = useState<any[]>([]);
  const [vendors, setVendors] = useState<any[]>([]);
  const [customers, setCustomers] = useState<any[]>([]);
  const [teams, setTeams] = useState<any[]>([]);

  // Incoming inventory filters
  const [incomingSearch, setIncomingSearch] = useState('');
  const [incomingDatePreset, setIncomingDatePreset] = useState<string>('');
  const [incomingCustomDateFrom, setIncomingCustomDateFrom] = useState('');
  const [incomingCustomDateTo, setIncomingCustomDateTo] = useState('');
  const [incomingShowCustomDatePicker, setIncomingShowCustomDatePicker] = useState(false);
  const [incomingFilterVendor, setIncomingFilterVendor] = useState('');
  const [incomingFilterStatus, setIncomingFilterStatus] = useState('');

  // Outgoing inventory filters
  const [outgoingDatePreset, setOutgoingDatePreset] = useState<string>('');
  const [outgoingCustomDateFrom, setOutgoingCustomDateFrom] = useState('');
  const [outgoingCustomDateTo, setOutgoingCustomDateTo] = useState('');
  const [outgoingShowCustomDatePicker, setOutgoingShowCustomDatePicker] = useState(false);
  const [outgoingFilterDestination, setOutgoingFilterDestination] = useState('');
  const [outgoingFilterStatus, setOutgoingFilterStatus] = useState('');

  // Edit rejected/short modal
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<IncomingInventoryRecord | null>(null);
  const [editingItems, setEditingItems] = useState<IncomingInventoryItem[]>([]);
  const [selectedItemId, setSelectedItemId] = useState<number | null>(null);
  const [editFormData, setEditFormData] = useState({
    rejected: 0,
    short: 0,
    invoiceNumber: '',
    invoiceDate: '',
  });
  const [updating, setUpdating] = useState(false);

  // Rejected items state
  const [rejectedItemReports, setRejectedItemReports] = useState<RejectedItemReport[]>([]);
  const [filteredRejectedReports, setFilteredRejectedReports] = useState<RejectedItemReport[]>([]);
  const [rejectedLoading, setRejectedLoading] = useState(false);
  const [openRejectedDropdownId, setOpenRejectedDropdownId] = useState<number | null>(null);
  const rejectedDropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [rejectedSearch, setRejectedSearch] = useState('');
  const [rejectedDateFrom, setRejectedDateFrom] = useState('');
  const [rejectedDateTo, setRejectedDateTo] = useState('');

  // Short items state
  const [shortItemReports, setShortItemReports] = useState<ShortItemReport[]>([]);
  const [filteredShortReports, setFilteredShortReports] = useState<ShortItemReport[]>([]);
  const [shortLoading, setShortLoading] = useState(false);
  const [openShortDropdownId, setOpenShortDropdownId] = useState<number | null>(null);
  const shortDropdownRefs = useRef<{ [key: number]: HTMLDivElement | null }>({});
  const [shortSearch, setShortSearch] = useState('');
  const [shortDateFrom, setShortDateFrom] = useState('');
  const [shortDateTo, setShortDateTo] = useState('');

  // Rejected items modals
  const [sendToVendorModal, setSendToVendorModal] = useState<RejectedItemReport | null>(null);
  const [receiveFromVendorModal, setReceiveFromVendorModal] = useState<RejectedItemReport | null>(null);
  const [scrapModal, setScrapModal] = useState<RejectedItemReport | null>(null);
  const [historyModal, setHistoryModal] = useState<RejectedItemReport | null>(null);

  // Short items modals
  const [receiveBackModal, setReceiveBackModal] = useState<ShortItemReport | null>(null);

  // Form states for rejected items actions
  const [actionFormData, setActionFormData] = useState<ActionFormData>({
    quantity: 0,
    remarks: '',
    vendorId: '',
    brandId: '',
    date: new Date().toISOString().split('T')[0],
    docketTracking: '',
    transporter: '',
    reason: '',
    condition: 'replaced',
    invoiceChallan: '',
    addToStock: true,
    scrapReason: 'beyond-repair',
    scrapReasonOther: '',
    approvedBy: '',
    unitPrice: undefined,
    shortItem: undefined,
  });
  const [processing, setProcessing] = useState(false);

  // Short item form data
  const [shortItemFormData, setShortItemFormData] = useState<ShortItemActionFormData>({
    quantity: 0,
    remarks: '',
    vendorId: '',
    brandId: '',
    date: new Date().toISOString().split('T')[0],
    docketTracking: '',
    transporter: '',
    reason: '',
    condition: 'replaced',
    invoiceChallan: '',
    addToStock: true,
    receivedBy: '',
  });

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    return onCategoriesUpdated(() => {
      loadInitialData();
      if (productCategory) loadItemCategories(parseInt(productCategory));
      if (itemCategory) loadSubCategories(parseInt(itemCategory));
    });
  }, [productCategory, itemCategory]);

  useEffect(() => {
    return onInventoryUpdated(() => {
      if (activeTab === 'all') {
        loadInventory();
      } else if (activeTab === 'incoming') {
        loadIncomingRecords();
      } else if (activeTab === 'outgoing') {
        loadOutgoingRecords();
      } else if (activeTab === 'rejected') {
        loadRejectedItemReports();
      } else if (activeTab === 'short') {
        loadShortItemReports();
      }
    });
  }, [activeTab]);

  // Close export dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (exportDropdownRef.current && !exportDropdownRef.current.contains(event.target as Node)) {
        setShowExportDropdown(false);
      }
    };

    if (showExportDropdown) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showExportDropdown]);

  useEffect(() => {
    if (activeTab === 'all') {
      loadInventory();
    } else if (activeTab === 'incoming') {
      loadIncomingRecords();
    } else if (activeTab === 'outgoing') {
      loadOutgoingRecords();
    } else if (activeTab === 'rejected') {
      loadRejectedItemReports();
    } else if (activeTab === 'short') {
      loadShortItemReports();
    }
  }, [activeTab, search, productCategory, itemCategory, subCategory, brand, stockStatus, datePreset, customDateFrom, customDateTo, sortBy, sortOrder, incomingDatePreset, incomingCustomDateFrom, incomingCustomDateTo, incomingFilterVendor, incomingFilterStatus, outgoingDatePreset, outgoingCustomDateFrom, outgoingCustomDateTo, outgoingFilterDestination, outgoingFilterStatus, rejectedSearch, rejectedDateFrom, rejectedDateTo, shortSearch, shortDateFrom, shortDateTo]);

  useEffect(() => {
    if (productCategory) {
      loadItemCategories(parseInt(productCategory));
    } else {
      setItemCategories([]);
      setItemCategory('');
      setSubCategory('');
      setSubCategories([]);
    }
  }, [productCategory]);

  useEffect(() => {
    if (itemCategory) {
      loadSubCategories(parseInt(itemCategory));
    } else {
      setSubCategories([]);
      setSubCategory('');
    }
  }, [itemCategory]);

  const loadInitialData = async () => {
    try {
      const [productCats, brandsData, vendorsData, customersData, teamsData] = await Promise.all([
        libraryService.getYourProductCategories(),
        libraryService.getBrands(),
        libraryService.getYourVendors(),
        libraryService.getCustomers(),
        libraryService.getTeams(),
      ]);
      setProductCategories(productCats.data || []);
      setBrands(brandsData.data || []);
      setVendors(vendorsData.data || []);
      setCustomers(customersData.data || []);
      setTeams(teamsData.data || []);
    } catch (error) {
      console.error('Error loading initial data:', error);
    }
  };

  const loadItemCategories = async (productCategoryId: number) => {
    try {
      const response = await libraryService.getYourItemCategories(productCategoryId);
      setItemCategories(response.data || []);
    } catch (error) {
      console.error('Error loading item categories:', error);
    }
  };

  const loadSubCategories = async (itemCategoryId: number) => {
    try {
      const response = await libraryService.getYourSubCategories(itemCategoryId);
      setSubCategories(response.data || []);
    } catch (error) {
      console.error('Error loading sub categories:', error);
    }
  };

  const loadInventory = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (search) params.search = search;
      if (productCategory) params.productCategory = productCategory;
      if (itemCategory) params.itemCategory = itemCategory;
      if (subCategory) params.subCategory = subCategory;
      if (brand) params.brand = brand;
      if (stockStatus !== 'all') {
        // Map frontend values to backend expected values
        const statusMap: { [key: string]: string } = {
          'out_of_stock': 'out',
          'low_stock': 'low',
          'in_stock': 'in'
        };
        params.stockStatus = statusMap[stockStatus] || stockStatus;
      }

      // Handle date filters
      if (datePreset === 'custom') {
        if (customDateFrom) params.dateFrom = customDateFrom;
        if (customDateTo) params.dateTo = customDateTo;
      } else if (datePreset) {
        const dateRange = getDateRange(datePreset);
        if (dateRange) {
          params.dateFrom = dateRange.dateFrom;
          params.dateTo = dateRange.dateTo;
        }
      }

      const response = await skuService.getAll(params);
      let inventoryData = response.data || [];
      
      // Map backend fields to frontend interface fields for compatibility
      inventoryData = inventoryData.map((item: any) => ({
        ...item,
        lastUpdated: item.updatedAt || item.lastUpdated || item.last_updated || null,
        minStock: item.minStockLevel || item.minStock || item.min_stock || 0,
      }));
      
      // Client-side sorting
      if (sortBy && inventoryData.length > 0) {
        inventoryData = [...inventoryData].sort((a, b) => {
          let aValue: any;
          let bValue: any;
          
          switch (sortBy) {
            case 'productCategory':
              aValue = a.productCategory?.toLowerCase() || '';
              bValue = b.productCategory?.toLowerCase() || '';
              break;
            case 'itemCategory':
              aValue = a.itemCategory?.toLowerCase() || '';
              bValue = b.itemCategory?.toLowerCase() || '';
              break;
            case 'subCategory':
              aValue = a.subCategory?.toLowerCase() || '';
              bValue = b.subCategory?.toLowerCase() || '';
              break;
            case 'itemName':
              aValue = a.itemName?.toLowerCase() || '';
              bValue = b.itemName?.toLowerCase() || '';
              break;
            case 'brand':
              aValue = a.brand?.toLowerCase() || '';
              bValue = b.brand?.toLowerCase() || '';
              break;
            case 'vendor':
              aValue = a.vendor?.toLowerCase() || '';
              bValue = b.vendor?.toLowerCase() || '';
              break;
            case 'currentStock':
              aValue = a.currentStock ?? 0;
              bValue = b.currentStock ?? 0;
              break;
            default:
              return 0;
          }
          
          if (typeof aValue === 'string' && typeof bValue === 'string') {
            return sortOrder === 'asc' 
              ? aValue.localeCompare(bValue)
              : bValue.localeCompare(aValue);
          } else {
            return sortOrder === 'asc' 
              ? (aValue as number) - (bValue as number)
              : (bValue as number) - (aValue as number);
          }
        });
      }
      
      setInventory(inventoryData);
    } catch (error) {
      console.error('Error loading inventory:', error);
      setInventory([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSort = (field: string) => {
    if (sortBy === field) {
      // Toggle sort order if same field
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  const SortIcon = ({ field }: { field: string }) => {
    if (sortBy !== field) {
      return (
        <span className="inline-flex flex-col ml-1 text-gray-400">
          <ArrowUp className="w-3 h-3 -mb-0.5" />
          <ArrowDown className="w-3 h-3" />
        </span>
      );
    }
    return sortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />
    );
  };

  const handleIncomingSort = (field: string) => {
    if (incomingSortBy === field) {
      // Toggle sort order if same field
      setIncomingSortOrder(incomingSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new sort field with ascending order
      setIncomingSortBy(field);
      setIncomingSortOrder('asc');
    }
  };

  const IncomingSortIcon = ({ field }: { field: string }) => {
    if (incomingSortBy !== field) {
      return (
        <span className="inline-flex flex-col ml-1 text-gray-400">
          <ArrowUp className="w-3 h-3 -mb-0.5" />
          <ArrowDown className="w-3 h-3" />
        </span>
      );
    }
    return incomingSortOrder === 'asc' ? (
      <ArrowUp className="w-4 h-4 ml-1 text-blue-600" />
    ) : (
      <ArrowDown className="w-4 h-4 ml-1 text-blue-600" />
    );
  };

  const handleDeleteItem = async (itemId: number) => {
    if (!window.confirm('Are you sure you want to delete this item? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      await skuService.delete(itemId);
      // Reload inventory to reflect the deletion
      await loadInventory();
      alert('Item deleted successfully');
    } catch (error: any) {
      console.error('Error deleting item:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to delete item');
    } finally {
      setLoading(false);
    }
  };

  const loadIncomingRecords = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (incomingFilterVendor) params.vendor = incomingFilterVendor;
      if (incomingFilterStatus) params.status = incomingFilterStatus;

      // Handle date filters
      if (incomingDatePreset === 'custom') {
        if (incomingCustomDateFrom) params.dateFrom = incomingCustomDateFrom;
        if (incomingCustomDateTo) params.dateTo = incomingCustomDateTo;
      } else if (incomingDatePreset) {
        const dateRange = getDateRange(incomingDatePreset);
        if (dateRange) {
          params.dateFrom = dateRange.dateFrom;
          params.dateTo = dateRange.dateTo;
        }
      }

      const response = await inventoryService.getIncoming(params);
      
      let records = [];
      if (response && response.success && Array.isArray(response.data)) {
        records = response.data;
      } else if (Array.isArray(response)) {
        records = response;
      } else if (response && Array.isArray(response.data)) {
        records = response.data;
      }
      
      setIncomingRecords(records);
      
      // Load items for all records in parallel
      const itemsMap: Record<number, IncomingInventoryItem[]> = {};
      const itemPromises = records.map(async (record: { id: number; items: IncomingInventoryItem[] }) => {
        try {
          const itemResponse = await inventoryService.getIncomingById(record.id);
          if (itemResponse.success && itemResponse.data.items) {
            itemsMap[record.id] = itemResponse.data.items;
          }
        } catch (error) {
          console.error(`Error loading items for record ${record.id}:`, error);
        }
      });
      
      await Promise.all(itemPromises);
      setIncomingRecordItems(itemsMap);
    } catch (error: any) {
      console.error('Error loading incoming records:', error);
      setIncomingRecords([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDatePresetChange = (preset: string) => {
    setDatePreset(preset);
    if (preset === 'custom') {
      setShowCustomDatePicker(true);
    } else {
      setShowCustomDatePicker(false);
      setCustomDateFrom('');
      setCustomDateTo('');
    }
  };

  const handleIncomingDatePresetChange = (preset: string) => {
    setIncomingDatePreset(preset);
    if (preset === 'custom') {
      setIncomingShowCustomDatePicker(true);
    } else {
      setIncomingShowCustomDatePicker(false);
      setIncomingCustomDateFrom('');
      setIncomingCustomDateTo('');
    }
  };

  const handleOutgoingDatePresetChange = (preset: string) => {
    setOutgoingDatePreset(preset);
    if (preset === 'custom') {
      setOutgoingShowCustomDatePicker(true);
    } else {
      setOutgoingShowCustomDatePicker(false);
      setOutgoingCustomDateFrom('');
      setOutgoingCustomDateTo('');
    }
  };

  const loadOutgoingRecords = async () => {
    try {
      setLoading(true);
      const params: any = {};
      if (outgoingFilterDestination) params.destination = outgoingFilterDestination;
      if (outgoingFilterStatus) params.status = outgoingFilterStatus;

      // Handle date filters
      if (outgoingDatePreset === 'custom') {
        if (outgoingCustomDateFrom) params.dateFrom = outgoingCustomDateFrom;
        if (outgoingCustomDateTo) params.dateTo = outgoingCustomDateTo;
      } else if (outgoingDatePreset) {
        const dateRange = getDateRange(outgoingDatePreset);
        if (dateRange) {
          params.dateFrom = dateRange.dateFrom;
          params.dateTo = dateRange.dateTo;
        }
      }

      console.log('Loading outgoing records with params:', params);
      const response = await inventoryService.getOutgoing(params);
      console.log('Outgoing records response:', response);
      
      let records = [];
      if (response && response.success && Array.isArray(response.data)) {
        records = response.data;
      } else if (Array.isArray(response)) {
        records = response;
      } else if (response && response.data && Array.isArray(response.data)) {
        records = response.data;
      }
      
      console.log('Parsed records:', records);
      setOutgoingRecords(records);
      
      // Load items for all records in parallel
      const itemsMap: Record<number, OutgoingInventoryItem[]> = {};
      if (records.length > 0) {
        const itemPromises = records.map(async (record: { id: number; items: OutgoingInventoryItem[] }) => {
          try {
            const itemResponse = await inventoryService.getOutgoingById(record.id);
            console.log(`Items for record ${record.id}:`, itemResponse);
            if (itemResponse?.success && itemResponse.data?.items) {
              itemsMap[record.id] = itemResponse.data.items;
            } else if (itemResponse?.data?.items) {
              itemsMap[record.id] = itemResponse.data.items;
            }
          } catch (error) {
            console.error(`Error loading items for record ${record.id}:`, error);
          }
        });
        
        await Promise.all(itemPromises);
        console.log('Items map:', itemsMap);
      }
      setOutgoingRecordItems(itemsMap);
    } catch (error: any) {
      console.error('Error loading outgoing records:', error);
      setOutgoingRecords([]);
      setOutgoingRecordItems({});
    } finally {
      setLoading(false);
    }
  };

  // Load rejected item reports
  const loadRejectedItemReports = useCallback(async () => {
    try {
      setRejectedLoading(true);
      const params: any = {};
      if (rejectedDateFrom) params.dateFrom = rejectedDateFrom;
      if (rejectedDateTo) params.dateTo = rejectedDateTo;
      if (rejectedSearch) params.search = rejectedSearch;

      const response = await inventoryService.getRejectedItemReports(params);
      if (response.success) {
        const reports = response.data || [];
        setRejectedItemReports(reports);
      }
    } catch (error) {
      console.error('Error loading rejected item reports:', error);
      setRejectedItemReports([]);
    } finally {
      setRejectedLoading(false);
    }
  }, [rejectedDateFrom, rejectedDateTo, rejectedSearch]);

  // Load short item reports
  const loadShortItemReports = useCallback(async () => {
    try {
      setShortLoading(true);
      const params: any = {};
      if (shortDateFrom) params.dateFrom = shortDateFrom;
      if (shortDateTo) params.dateTo = shortDateTo;
      if (shortSearch) params.search = shortSearch;

      const response = await inventoryService.getShortItemReports(params);
      if (response.success) {
        const reports = response.data || [];
        setShortItemReports(reports);
      }
    } catch (error) {
      console.error('Error loading short item reports:', error);
      setShortItemReports([]);
    } finally {
      setShortLoading(false);
    }
  }, [shortDateFrom, shortDateTo, shortSearch]);

  // Apply filters for rejected items
  useEffect(() => {
    let filtered = [...rejectedItemReports];
    if (rejectedSearch) {
      const searchLower = rejectedSearch.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.reportNumber?.toLowerCase().includes(searchLower) ||
          report.skuCode?.toLowerCase().includes(searchLower) ||
          report.itemName?.toLowerCase().includes(searchLower) ||
          report.originalInvoiceNumber?.toLowerCase().includes(searchLower)
      );
    }
    setFilteredRejectedReports(filtered);
  }, [rejectedItemReports, rejectedSearch]);

  // Apply filters for short items
  useEffect(() => {
    let filtered = [...shortItemReports];
    if (shortSearch) {
      const searchLower = shortSearch.toLowerCase();
      filtered = filtered.filter(
        (report) =>
          report.invoiceNumber?.toLowerCase().includes(searchLower) ||
          report.skuCode?.toLowerCase().includes(searchLower) ||
          report.itemName?.toLowerCase().includes(searchLower)
      );
    }
    setFilteredShortReports(filtered);
  }, [shortItemReports, shortSearch]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (openRejectedDropdownId !== null) {
        const dropdown = rejectedDropdownRefs.current[openRejectedDropdownId];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpenRejectedDropdownId(null);
        }
      }
      if (openShortDropdownId !== null) {
        const dropdown = shortDropdownRefs.current[openShortDropdownId];
        if (dropdown && !dropdown.contains(event.target as Node)) {
          setOpenShortDropdownId(null);
        }
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [openRejectedDropdownId, openShortDropdownId]);

  const toggleOutgoingRow = async (itemKey: string) => {
    const newExpanded = new Set(expandedOutgoingRows);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
      // Parse record ID from itemKey (format: "recordId-itemId")
      const [recordIdStr] = itemKey.split('-');
      const recordId = parseInt(recordIdStr);
      
      // Fetch items if not already loaded
      if (!outgoingRecordItems[recordId]) {
        try {
          const itemResponse = await inventoryService.getOutgoingById(recordId);
          if (itemResponse?.success && itemResponse.data?.items) {
            setOutgoingRecordItems(prev => ({
              ...prev,
              [recordId]: itemResponse.data.items
            }));
          } else if (itemResponse?.data?.items) {
            setOutgoingRecordItems(prev => ({
              ...prev,
              [recordId]: itemResponse.data.items
            }));
          }
        } catch (error) {
          console.error('Error loading record items:', error);
        }
      }
    }
    setExpandedOutgoingRows(newExpanded);
  };

  const toggleRow = (id: number) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const toggleIncomingRow = async (itemKey: string) => {
    const newExpanded = new Set(expandedIncomingRows);
    if (newExpanded.has(itemKey)) {
      newExpanded.delete(itemKey);
    } else {
      newExpanded.add(itemKey);
      // Parse record ID from itemKey (format: "recordId-itemId")
      const [recordIdStr] = itemKey.split('-');
      const recordId = parseInt(recordIdStr);
      
      // Fetch items if not already loaded
      if (!incomingRecordItems[recordId]) {
        try {
          const response = await inventoryService.getIncomingById(recordId);
          if (response.success && response.data.items) {
            setIncomingRecordItems(prev => ({
              ...prev,
              [recordId]: response.data.items
            }));
          }
        } catch (error) {
          console.error('Error loading record items:', error);
        }
      }
    }
    setExpandedIncomingRows(newExpanded);
  };

  const handleEditRejectedShort = async (record: IncomingInventoryRecord, item: IncomingInventoryItem) => {
    try {
      setEditingRecord(record);
      
      // Fetch record details to get all items
      const response = await inventoryService.getIncomingById(record.id);
      
      if (response.success && response.data.items && response.data.items.length > 0) {
        setEditingItems(response.data.items);
        const itemId = item.itemId || item.item_id || item.id;
        setSelectedItemId(itemId || null);
        setEditFormData({
          rejected: item.rejected || 0,
          short: item.short || 0,
          invoiceNumber: record.invoiceNumber || '',
          invoiceDate: record.invoiceDate || '',
        });
      } else {
        const itemId = item.itemId || item.item_id || item.id || 0;
        setEditingItems([item]);
        setSelectedItemId(itemId);
        setEditFormData({
          rejected: item.rejected || 0,
          short: item.short || 0,
          invoiceNumber: record.invoiceNumber || '',
          invoiceDate: record.invoiceDate || '',
        });
      }

      setEditModalOpen(true);
    } catch (error) {
      console.error('Error loading record details:', error);
      const itemId = item.itemId || item.item_id || item.id || 0;
      setEditingItems([item]);
      setSelectedItemId(itemId);
      setEditFormData({
        rejected: item.rejected || 0,
        short: item.short || 0,
        invoiceNumber: record.invoiceNumber || '',
        invoiceDate: record.invoiceDate || '',
      });
      setEditModalOpen(true);
    }
  };

  const handleUpdateRejectedShort = async () => {
    if (!editingRecord || selectedItemId === null) {
      alert('Please select an item to update');
      return;
    }

    const selectedItem = editingItems.find(item => {
      const itemId = item.itemId || item.item_id || item.id;
      return itemId === selectedItemId;
    });
    
    if (!selectedItem) {
      alert('Selected item not found');
      return;
    }

    // Validate: new values cannot exceed original values
    const originalRejected = selectedItem.rejected || 0;
    const originalShort = selectedItem.short || 0;
    
    if (editFormData.rejected > originalRejected || editFormData.short > originalShort) {
      alert(`Updated rejected/short values cannot exceed the original values (Rejected: ${originalRejected}, Short: ${originalShort})`);
      return;
    }

    // Validate: at least one value should be changed
    if (editFormData.rejected === originalRejected && editFormData.short === originalShort) {
      alert('No changes detected. Please update at least one value.');
      return;
    }

    // Validate: itemId must be valid (not 0, which is a fallback)
    if (selectedItemId === 0) {
      alert('Cannot update: Item details not available. Please refresh and try again.');
      return;
    }

    try {
      setUpdating(true);
      await inventoryService.updateRejectedShort(editingRecord.id, {
        itemId: selectedItemId,
        rejected: editFormData.rejected,
        short: editFormData.short,
        invoiceNumber: editFormData.invoiceNumber || undefined,
        invoiceDate: editFormData.invoiceDate || undefined,
      });

      // Reload records
      await loadIncomingRecords();
      setEditModalOpen(false);
      setEditingRecord(null);
      setEditingItems([]);
      setSelectedItemId(null);
      alert('Rejected/Short quantities updated successfully. Stock has been adjusted.');
    } catch (error: any) {
      console.error('Error updating rejected/short:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to update rejected/short');
    } finally {
      setUpdating(false);
    }
  };

  const handleItemsUpdate = async (recordId?: number) => {
    // Refresh items for a specific record if provided
    if (recordId) {
      try {
        const response = await inventoryService.getIncomingItems(recordId);
        if (response.success && response.data) {
          setIncomingRecordItems(prev => ({
            ...prev,
            [recordId]: response.data
          }));
        }
      } catch (error) {
        console.error('Error refreshing items:', error);
      }
    }
    
    // Also refresh items for editingRecord if it exists
    if (editingRecord) {
      const response = await inventoryService.getIncomingById(editingRecord.id);
      if (response.success && response.data.items) {
        setIncomingRecordItems(prev => ({
          ...prev,
          [editingRecord.id]: response.data.items
        }));
      }
    }
    
    // Refresh the records list to get updated rejected/short values
    await loadIncomingRecords();
  };

  // Rejected items handlers
  const toggleRejectedDropdown = (reportId: number) => {
    setOpenRejectedDropdownId(openRejectedDropdownId === reportId ? null : reportId);
  };

  const getDefaultFormData = (): ActionFormData => ({
    quantity: 0,
    remarks: '',
    vendorId: '',
    brandId: '',
    date: new Date().toISOString().split('T')[0],
    docketTracking: '',
    transporter: '',
    reason: '',
    condition: 'replaced',
    invoiceChallan: '',
    addToStock: true,
    scrapReason: 'beyond-repair',
    scrapReasonOther: '',
    approvedBy: '',
    unitPrice: undefined,
    shortItem: undefined,
  });

  const resetFormData = () => {
    setActionFormData(getDefaultFormData());
  };

  const handleSendToVendor = async (report: RejectedItemReport) => {
    setOpenRejectedDropdownId(null);
    const availableQty = report.quantity - (report.sentToVendor || 0) - (report.receivedBack || 0) - (report.scrapped || 0);
    
    let defaultUnitPrice: number | undefined = undefined;
    try {
      const skuResponse = await skuService.getById(report.skuId);
      if (skuResponse?.success && skuResponse.data?.unitPrice) {
        defaultUnitPrice = skuResponse.data.unitPrice;
      }
    } catch (error) {
      console.warn('Could not fetch SKU unit price for default:', error);
    }
    
    setActionFormData({
      ...getDefaultFormData(),
      quantity: Math.max(0, availableQty),
      vendorId: report.vendorId || '',
      brandId: report.brandId || '',
      unitPrice: defaultUnitPrice,
    });
    setSendToVendorModal(report);
  };

  const handleReceiveFromVendor = (report: RejectedItemReport) => {
    setOpenRejectedDropdownId(null);
    const availableQty = report.sentToVendor || 0;
    setActionFormData({
      ...getDefaultFormData(),
      quantity: Math.max(0, availableQty),
      vendorId: report.vendorId || '',
      brandId: report.brandId || '',
      addToStock: true,
    });
    setReceiveFromVendorModal(report);
  };

  const handleScrap = (report: RejectedItemReport) => {
    setOpenRejectedDropdownId(null);
    const availableQty = report.quantity - (report.sentToVendor || 0) - (report.receivedBack || 0) - (report.scrapped || 0);
    setActionFormData({
      ...getDefaultFormData(),
      quantity: Math.max(0, availableQty),
    });
    setScrapModal(report);
  };

  const handleViewHistory = (report: RejectedItemReport) => {
    setOpenRejectedDropdownId(null);
    setHistoryModal(report);
  };

  const handleFormChange = (data: Partial<ActionFormData>) => {
    setActionFormData(prev => ({ ...prev, ...data }));
  };

  const handleSendToVendorSubmit = async () => {
    if (!sendToVendorModal) return;
    
    if (!actionFormData.vendorId) {
      alert('Please select a vendor');
      return;
    }
    if (!actionFormData.brandId) {
      alert('Please select a brand');
      return;
    }
    if (!actionFormData.reason) {
      alert('Please enter a reason');
      return;
    }
    if (!actionFormData.date) {
      alert('Please select a date');
      return;
    }
    if (actionFormData.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    if (actionFormData.quantity > (sendToVendorModal.quantity - (sendToVendorModal.sentToVendor || 0) - (sendToVendorModal.receivedBack || 0) - (sendToVendorModal.scrapped || 0))) {
      alert('Quantity exceeds available rejected quantity');
      return;
    }
    if (actionFormData.unitPrice === undefined || actionFormData.unitPrice === null || actionFormData.unitPrice < 0) {
      alert('Please enter a valid unit price (must be 0 or greater)');
      return;
    }

    try {
      setProcessing(true);
      
      const reportNumber = sendToVendorModal.reportNumber || `REJ-${sendToVendorModal.originalInvoiceNumber}-${Date.now()}`;
      const unitPrice = actionFormData.unitPrice > 0 ? actionFormData.unitPrice : 0.01;
      
      const outgoingData = {
        documentType: 'delivery_challan',
        documentSubType: 'replacement',
        deliveryChallanSubType: 'to_vendor',
        invoiceChallanDate: actionFormData.date,
        invoiceChallanNumber: reportNumber,
        docketNumber: actionFormData.docketTracking || '',
        transportorName: actionFormData.transporter || '',
        destinationType: 'vendor',
        destinationId: parseInt(actionFormData.vendorId),
        remarks: actionFormData.remarks || `Rejected items sent to vendor. Reason: ${actionFormData.reason}`,
        status: 'completed',
        items: [
          {
            skuId: sendToVendorModal.skuId,
            outgoingQuantity: actionFormData.quantity,
            unitPrice: unitPrice,
            totalValue: unitPrice * actionFormData.quantity,
          }
        ]
      };
      
      await inventoryService.addOutgoing(outgoingData);
      
      const newSentToVendor = (sendToVendorModal.sentToVendor || 0) + actionFormData.quantity;
      const newNetRejected = Math.max(0, sendToVendorModal.quantity - newSentToVendor - (sendToVendorModal.receivedBack || 0) - (sendToVendorModal.scrapped || 0));
      
      await inventoryService.updateRejectedItemReport(sendToVendorModal.id, {
        sentToVendor: newSentToVendor,
        netRejected: newNetRejected,
      });

      await loadRejectedItemReports();
      setSendToVendorModal(null);
      resetFormData();
      alert(`Items sent to vendor successfully. Report Number: ${reportNumber}`);
    } catch (error: any) {
      console.error('Error sending to vendor:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to send items to vendor');
    } finally {
      setProcessing(false);
    }
  };

  const handleReceiveFromVendorSubmit = async () => {
    if (!receiveFromVendorModal) return;
    
    if (!actionFormData.vendorId) {
      alert('Please select a vendor');
      return;
    }
    if (!actionFormData.brandId) {
      alert('Please select a brand');
      return;
    }
    if (!actionFormData.date) {
      alert('Please select a date');
      return;
    }
    if (actionFormData.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    if (actionFormData.quantity > (receiveFromVendorModal.sentToVendor || 0)) {
      alert('Quantity exceeds sent to vendor quantity');
      return;
    }
    if (actionFormData.shortItem !== undefined && actionFormData.shortItem > actionFormData.quantity) {
      alert('Short item quantity cannot exceed receive quantity');
      return;
    }

    try {
      setProcessing(true);
      const newReceivedBack = (receiveFromVendorModal.receivedBack || 0) + actionFormData.quantity;
      const newSentToVendor = Math.max(0, (receiveFromVendorModal.sentToVendor || 0) - actionFormData.quantity);
      const newNetRejected = Math.max(0, receiveFromVendorModal.quantity - newSentToVendor - newReceivedBack - (receiveFromVendorModal.scrapped || 0));
      
      await inventoryService.updateRejectedItemReport(receiveFromVendorModal.id, {
        sentToVendor: newSentToVendor,
        receivedBack: newReceivedBack,
        netRejected: newNetRejected,
      });

      const shortQty = actionFormData.shortItem || 0;
      const receivedQty = actionFormData.quantity - shortQty;
      const totalQty = actionFormData.quantity;
      
      const invoiceNumber = actionFormData.invoiceChallan || `RECV-${receiveFromVendorModal.reportNumber}-${Date.now()}`;
      
      let unitPrice = 0.01;
      try {
        const skuResponse = await skuService.getById(receiveFromVendorModal.skuId);
        if (skuResponse?.success && skuResponse.data?.unitPrice) {
          unitPrice = skuResponse.data.unitPrice > 0 ? skuResponse.data.unitPrice : 0.01;
        }
      } catch (skuError) {
        console.warn('Could not fetch SKU unit price, using 0.01:', skuError);
      }
      
      const incomingData = {
        invoiceDate: actionFormData.date,
        invoiceNumber: invoiceNumber,
        receivingDate: actionFormData.date,
        vendorId: parseInt(actionFormData.vendorId),
        brandId: parseInt(actionFormData.brandId),
        documentType: 'bill',
        status: 'completed',
        remarks: actionFormData.remarks || `Items received from vendor. Condition: ${actionFormData.condition}. ${receiveFromVendorModal.reportNumber ? `Report: ${receiveFromVendorModal.reportNumber}` : ''}`,
        items: [
          {
            skuId: receiveFromVendorModal.skuId,
            received: receivedQty,
            short: shortQty,
            totalQuantity: totalQty,
            unitPrice: unitPrice,
            totalValue: totalQty * unitPrice,
          }
        ]
      };
      
      await inventoryService.addIncoming(incomingData);

      await loadRejectedItemReports();
      await loadShortItemReports();
      setReceiveFromVendorModal(null);
      resetFormData();
      
      const messages = ['added to available stock'];
      if (shortQty > 0) {
        messages.push('short item recorded');
      }
      
      alert(`Items received from vendor successfully and ${messages.join(', ')}`);
    } catch (error: any) {
      console.error('Error receiving from vendor:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to receive items from vendor');
    } finally {
      setProcessing(false);
    }
  };

  const handleScrapSubmit = async () => {
    if (!scrapModal) return;
    
    if (!actionFormData.date) {
      alert('Please select a date');
      return;
    }
    if (actionFormData.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    if (actionFormData.quantity > (scrapModal.quantity - (scrapModal.sentToVendor || 0) - (scrapModal.receivedBack || 0) - (scrapModal.scrapped || 0))) {
      alert('Quantity exceeds available rejected quantity');
      return;
    }
    if (actionFormData.scrapReason === 'other' && !actionFormData.scrapReasonOther.trim()) {
      alert('Please specify the reason for scrapping');
      return;
    }
    if (!actionFormData.approvedBy) {
      alert('Please select who approved this scrap action');
      return;
    }

    try {
      setProcessing(true);
      const newScrapped = (scrapModal.scrapped || 0) + actionFormData.quantity;
      const newNetRejected = Math.max(0, scrapModal.quantity - (scrapModal.sentToVendor || 0) - (scrapModal.receivedBack || 0) - newScrapped);
      
      await inventoryService.updateRejectedItemReport(scrapModal.id, {
        scrapped: newScrapped,
        netRejected: newNetRejected,
      });

      await loadRejectedItemReports();
      setScrapModal(null);
      resetFormData();
      alert('Items marked as scrapped successfully');
    } catch (error: any) {
      console.error('Error scrapping items:', error);
      alert(error.response?.data?.error || 'Failed to scrap items');
    } finally {
      setProcessing(false);
    }
  };

  // Short items handlers
  const toggleShortDropdown = (reportId: number) => {
    setOpenShortDropdownId(openShortDropdownId === reportId ? null : reportId);
  };

  const getDefaultShortItemFormData = (): ShortItemActionFormData => ({
    quantity: 0,
    remarks: '',
    vendorId: '',
    brandId: '',
    date: new Date().toISOString().split('T')[0],
    docketTracking: '',
    transporter: '',
    reason: '',
    condition: 'replaced',
    invoiceChallan: '',
    addToStock: true,
    receivedBy: '',
  });

  const resetShortItemFormData = () => {
    setShortItemFormData(getDefaultShortItemFormData());
  };

  const handleShortReceiveBack = (report: ShortItemReport) => {
    setOpenShortDropdownId(null);
    const availableQty = report.shortQuantity - (report.receivedBack || 0);
    setShortItemFormData({
      ...getDefaultShortItemFormData(),
      quantity: Math.max(0, availableQty),
      vendorId: report.vendorId || '',
      brandId: report.brandId || '',
    });
    setReceiveBackModal(report);
  };

  const handleShortReceiveBackSubmit = async () => {
    if (!receiveBackModal) return;
    
    if (!shortItemFormData.vendorId) {
      alert('Please select a vendor');
      return;
    }
    if (!shortItemFormData.brandId) {
      alert('Please select a brand');
      return;
    }
    if (!shortItemFormData.date) {
      alert('Please select a date');
      return;
    }
    if (!shortItemFormData.invoiceChallan) {
      alert('Please enter invoice number');
      return;
    }
    if (!shortItemFormData.receivedBy) {
      alert('Please select received by');
      return;
    }
    if (shortItemFormData.quantity <= 0) {
      alert('Quantity must be greater than 0');
      return;
    }
    const availableQty = receiveBackModal.shortQuantity - (receiveBackModal.receivedBack || 0);
    if (shortItemFormData.quantity > availableQty) {
      alert('Quantity exceeds available short quantity');
      return;
    }

    try {
      setProcessing(true);
      
      let unitPrice = 0.01;
      try {
        const skuResponse = await skuService.getById(receiveBackModal.skuId);
        if (skuResponse?.success && skuResponse.data?.unitPrice) {
          unitPrice = skuResponse.data.unitPrice > 0 ? skuResponse.data.unitPrice : 0.01;
        }
      } catch (skuError) {
        console.warn('Could not fetch SKU unit price, using 0.01:', skuError);
      }
      
      const incomingData = {
        invoiceDate: shortItemFormData.date,
        invoiceNumber: shortItemFormData.invoiceChallan,
        receivingDate: shortItemFormData.date,
        vendorId: parseInt(shortItemFormData.vendorId),
        brandId: parseInt(shortItemFormData.brandId),
        receivedBy: parseInt(shortItemFormData.receivedBy),
        documentType: 'bill',
        status: 'completed',
        remarks: shortItemFormData.remarks || `Short items received back. Original invoice: ${receiveBackModal.invoiceNumber}`,
        items: [
          {
            skuId: receiveBackModal.skuId,
            received: shortItemFormData.quantity,
            short: 0,
            totalQuantity: shortItemFormData.quantity,
            unitPrice: unitPrice,
            totalValue: shortItemFormData.quantity * unitPrice,
          }
        ]
      };
      
      await inventoryService.addIncoming(incomingData);
      
      const newShortQuantity = receiveBackModal.shortQuantity - shortItemFormData.quantity;
      await inventoryService.updateShortItem(
        receiveBackModal.incomingInventoryId,
        {
          itemId: receiveBackModal.incomingInventoryItemId,
          short: Math.max(0, newShortQuantity),
        }
      );
      
      await loadShortItemReports();
      setReceiveBackModal(null);
      resetShortItemFormData();
      alert(`Short items received back successfully and added to stock`);
    } catch (error: any) {
      console.error('Error receiving back short items:', error);
      alert(error.response?.data?.error || error.response?.data?.message || 'Failed to receive back short items');
    } finally {
      setProcessing(false);
    }
  };

  const handleShortViewHistory = (report: ShortItemReport) => {
    setOpenShortDropdownId(null);
    alert('History view functionality to be implemented');
  };

  const handleExportPDF = async () => {
    setShowExportDropdown(false);
    try {
      const headers = ['SKU ID', 'Product Category', 'Item Category', 'Sub Category', 'Item Name', 'Brand', 'Vendor', 'Model Number', 'HSN Code', 'Current Stock'];
      const rows = inventory.map((item) => [
        item.skuId || '-',
        item.productCategory || '-',
        item.itemCategory || '-',
        item.subCategory || '-',
        item.itemName || '-',
        item.brand || '-',
        item.vendor || '-',
        item.model || '-',
        item.hsnSacCode || '-',
        formatNumber(item.currentStock || 0),
      ]);

      const dateRange = datePreset ? getDateRange(datePreset) : null;
      const dateRangeStr = dateRange 
        ? `Date Range: ${formatDate(dateRange.dateFrom)} to ${formatDate(dateRange.dateTo)}`
        : '';

      await exportToPDF({
        headers,
        rows,
        title: 'Inventory Report',
        dateRange: dateRangeStr,
      });
    } catch (error: any) {
      console.error('Error exporting PDF:', error);
      alert('Failed to export PDF');
    }
  };

  const handleExportExcel = async () => {
    setShowExportDropdown(false);
    try {
      const headers = ['SKU ID', 'Product Category', 'Item Category', 'Sub Category', 'Item Name', 'Brand', 'Vendor', 'Model Number', 'HSN Code', 'Current Stock'];
      const rows = inventory.map((item) => [
        item.skuId || '-',
        item.productCategory || '-',
        item.itemCategory || '-',
        item.subCategory || '-',
        item.itemName || '-',
        item.brand || '-',
        item.vendor || '-',
        item.model || '-',
        item.hsnSacCode || '-',
        formatNumber(item.currentStock || 0),
      ]);

      const dateRange = datePreset ? getDateRange(datePreset) : null;
      const dateRangeStr = dateRange 
        ? `Date Range: ${formatDate(dateRange.dateFrom)} to ${formatDate(dateRange.dateTo)}`
        : '';

      await exportToExcel({
        headers,
        rows,
        title: 'Inventory Report',
        dateRange: dateRangeStr,
      });
    } catch (error: any) {
      console.error('Error exporting Excel:', error);
      alert('Failed to export Excel');
    }
  };

  const handleExportCSV = async () => {
    setShowExportDropdown(false);
    try {
      const headers = ['SKU ID', 'Product Category', 'Item Category', 'Sub Category', 'Item Name', 'Brand', 'Vendor', 'Model Number', 'HSN Code', 'Current Stock'];
      const rows = inventory.map((item) => [
        item.skuId || '-',
        item.productCategory || '-',
        item.itemCategory || '-',
        item.subCategory || '-',
        item.itemName || '-',
        item.brand || '-',
        item.vendor || '-',
        item.model || '-',
        item.hsnSacCode || '-',
        formatNumber(item.currentStock || 0),
      ]);

      // Create CSV content
      const csvContent = [
        ['Inventory Report'],
        datePreset ? [getDateRange(datePreset) ? `Date Range: ${formatDate(getDateRange(datePreset)!.dateFrom)} to ${formatDate(getDateRange(datePreset)!.dateTo)}` : ''] : [],
        [],
        headers,
        ...rows
      ].map(row => row.map(cell => `"${cell}"`).join(',')).join('\n');

      // Download CSV
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `Inventory_Report_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error: any) {
      console.error('Error exporting CSV:', error);
      alert('Failed to export CSV');
    }
  };

  return (
    <div className="p-4 space-y-3 w-full animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <div className="space-y-0.5">
          <h1 className="text-[21.6px] font-semibold leading-[1.2] tracking-[-0.01em] text-slate-900">Inventory</h1>
          <p className="text-[12.6px] font-normal leading-[1.5] text-slate-500">Comprehensive inventory tracking and management system.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="bg-white rounded-[1.875rem] border border-slate-100 shadow-sm p-[6px]">
        <nav className="flex space-x-[6px]">
          <button
            onClick={() => setActiveTab('all')}
            className={`px-[18px] py-[9px] rounded-xl font-black text-[11.7px] uppercase tracking-wider transition-all ${
              activeTab === 'all'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            All Inventory
          </button>
          <button
            onClick={() => setActiveTab('incoming')}
            className={`px-[18px] py-[9px] rounded-xl font-black text-[11.7px] uppercase tracking-wider transition-all ${
              activeTab === 'incoming'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Incoming Records
          </button>
          <button
            onClick={() => setActiveTab('outgoing')}
            className={`px-[18px] py-[9px] rounded-xl font-black text-[11.7px] uppercase tracking-wider transition-all ${
              activeTab === 'outgoing'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Outgoing Records
          </button>
          <button
            onClick={() => setActiveTab('rejected')}
            className={`px-[18px] py-[9px] rounded-xl font-black text-[11.7px] uppercase tracking-wider transition-all ${
              activeTab === 'rejected'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Rejected Items
          </button>
          <button
            onClick={() => setActiveTab('short')}
            className={`px-[18px] py-[9px] rounded-xl font-black text-[11.7px] uppercase tracking-wider transition-all ${
              activeTab === 'short'
                ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-600/20'
                : 'text-slate-500 hover:bg-slate-50'
            }`}
          >
            Short Items
          </button>
        </nav>
      </div>

      {activeTab === 'all' && (
        <>
          <InventoryFilters
            search={search}
            productCategory={productCategory}
            itemCategory={itemCategory}
            subCategory={subCategory}
            brand={brand}
            stockStatus={stockStatus}
            datePreset={datePreset}
            customDateFrom={customDateFrom}
            customDateTo={customDateTo}
            showCustomDatePicker={showCustomDatePicker}
            productCategories={productCategories}
            itemCategories={itemCategories}
            subCategories={subCategories}
            brands={brands}
            onSearchChange={setSearch}
            onProductCategoryChange={setProductCategory}
            onItemCategoryChange={setItemCategory}
            onSubCategoryChange={setSubCategory}
            onBrandChange={setBrand}
            onStockStatusChange={setStockStatus}
            onDatePresetChange={handleDatePresetChange}
            onCustomDateFromChange={setCustomDateFrom}
            onCustomDateToChange={setCustomDateTo}
            onClearDateFilter={() => {
                        setDatePreset('');
                        setCustomDateFrom('');
                        setCustomDateTo('');
                        setShowCustomDatePicker(false);
                      }}
            showExportDropdown={showExportDropdown}
            onExportDropdownToggle={() => setShowExportDropdown(!showExportDropdown)}
            onExportPDF={handleExportPDF}
            onExportExcel={handleExportExcel}
            onExportCSV={handleExportCSV}
            exportDropdownRef={exportDropdownRef}
            loading={loading}
          />

          <InventoryTable
            inventory={inventory}
            loading={loading}
            expandedRows={expandedRows}
            onToggleRow={toggleRow}
            sortBy={sortBy}
            sortOrder={sortOrder}
            onSort={handleSort}
            SortIcon={SortIcon}
          />
        </>
      )}

      {activeTab === 'incoming' && (
        <>
          <IncomingRecordsFilters
            search={incomingSearch}
            vendor={incomingFilterVendor}
            status={incomingFilterStatus}
            datePreset={incomingDatePreset}
            customDateFrom={incomingCustomDateFrom}
            customDateTo={incomingCustomDateTo}
            showCustomDatePicker={incomingShowCustomDatePicker}
            vendors={vendors}
            onSearchChange={setIncomingSearch}
            onVendorChange={setIncomingFilterVendor}
            onStatusChange={setIncomingFilterStatus}
            onDatePresetChange={handleIncomingDatePresetChange}
            onCustomDateFromChange={setIncomingCustomDateFrom}
            onCustomDateToChange={setIncomingCustomDateTo}
            onClearDateFilter={() => {
                        setIncomingDatePreset('');
                        setIncomingCustomDateFrom('');
                        setIncomingCustomDateTo('');
                        setIncomingShowCustomDatePicker(false);
                      }}
          />

          <IncomingRecordsTable
            records={incomingRecords}
            loading={loading}
            expandedRows={expandedIncomingRows}
            recordItems={incomingRecordItems}
            onToggleRow={toggleIncomingRow}
            onEditRejectedShort={handleEditRejectedShort}
            onItemsUpdate={handleItemsUpdate}
            sortBy={incomingSortBy}
            sortOrder={incomingSortOrder}
            onSort={handleIncomingSort}
            SortIcon={IncomingSortIcon}
            search={incomingSearch}
          />
        </>
      )}

      {activeTab === 'outgoing' && (
        <>
          <OutgoingRecordsFilters
            destination={outgoingFilterDestination}
            status={outgoingFilterStatus}
            datePreset={outgoingDatePreset}
            customDateFrom={outgoingCustomDateFrom}
            customDateTo={outgoingCustomDateTo}
            showCustomDatePicker={outgoingShowCustomDatePicker}
            customers={customers}
            vendors={vendors}
            onDestinationChange={setOutgoingFilterDestination}
            onStatusChange={setOutgoingFilterStatus}
            onDatePresetChange={handleOutgoingDatePresetChange}
            onCustomDateFromChange={setOutgoingCustomDateFrom}
            onCustomDateToChange={setOutgoingCustomDateTo}
            onClearDateFilter={() => {
              setOutgoingDatePreset('');
              setOutgoingCustomDateFrom('');
              setOutgoingCustomDateTo('');
              setOutgoingShowCustomDatePicker(false);
            }}
          />

          <OutgoingRecordsTable
            records={outgoingRecords}
            loading={loading}
            expandedRows={expandedOutgoingRows}
            recordItems={outgoingRecordItems}
            onToggleRow={toggleOutgoingRow}
          />
        </>
      )}

      {activeTab === 'rejected' && (
        <>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="text"
                placeholder="Search by report number, SKU, item name, or invoice number..."
                value={rejectedSearch}
                onChange={(e) => setRejectedSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={rejectedDateFrom}
                onChange={(e) => setRejectedDateFrom(e.target.value)}
                placeholder="From Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={rejectedDateTo}
                onChange={(e) => setRejectedDateTo(e.target.value)}
                placeholder="To Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <RejectedItemReportTable
            reports={filteredRejectedReports}
            loading={rejectedLoading}
            openDropdownId={openRejectedDropdownId}
            dropdownRefs={rejectedDropdownRefs}
            onToggleDropdown={toggleRejectedDropdown}
            onSendToVendor={handleSendToVendor}
            onReceiveFromVendor={handleReceiveFromVendor}
            onScrap={handleScrap}
            onViewHistory={handleViewHistory}
          />
        </>
      )}

      {activeTab === 'short' && (
        <>
          <div className="bg-white rounded-lg shadow p-3">
            <div className="flex items-center gap-3 mb-2">
              <input
                type="text"
                placeholder="Search by invoice number, SKU, or item name..."
                value={shortSearch}
                onChange={(e) => setShortSearch(e.target.value)}
                className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={shortDateFrom}
                onChange={(e) => setShortDateFrom(e.target.value)}
                placeholder="From Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
              <input
                type="date"
                value={shortDateTo}
                onChange={(e) => setShortDateTo(e.target.value)}
                placeholder="To Date"
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          <ShortItemReportTable
            reports={filteredShortReports}
            loading={shortLoading}
            openDropdownId={openShortDropdownId}
            dropdownRefs={shortDropdownRefs}
            onToggleDropdown={toggleShortDropdown}
            onReceiveBack={handleShortReceiveBack}
            onViewHistory={handleShortViewHistory}
          />
        </>
      )}

      {/* Rejected Items Modals */}
      {sendToVendorModal && (
        <SendToVendorModal
          report={sendToVendorModal}
          formData={actionFormData}
          vendors={vendors}
          brands={brands}
          processing={processing}
          onClose={() => {
            setSendToVendorModal(null);
            resetFormData();
          }}
          onFormChange={handleFormChange}
          onSubmit={handleSendToVendorSubmit}
        />
      )}

      {receiveFromVendorModal && (
        <ReceiveFromVendorModal
          report={receiveFromVendorModal}
          formData={actionFormData}
          vendors={vendors}
          brands={brands}
          processing={processing}
          onClose={() => {
            setReceiveFromVendorModal(null);
            resetFormData();
          }}
          onFormChange={handleFormChange}
          onSubmit={handleReceiveFromVendorSubmit}
        />
      )}

      {scrapModal && (
        <ScrapModal
          report={scrapModal}
          formData={actionFormData}
          teams={teams}
          processing={processing}
          onClose={() => {
            setScrapModal(null);
            resetFormData();
          }}
          onFormChange={handleFormChange}
          onSubmit={handleScrapSubmit}
        />
      )}

      {historyModal && (
        <HistoryModal
          report={historyModal}
          onClose={() => setHistoryModal(null)}
        />
      )}

      {/* Short Items Modal */}
      {receiveBackModal && (
        <ReceiveBackModal
          report={receiveBackModal}
          formData={shortItemFormData}
          vendors={vendors}
          brands={brands}
          teams={teams}
          processing={processing}
          onClose={() => {
            setReceiveBackModal(null);
            resetShortItemFormData();
          }}
          onFormChange={(data) => setShortItemFormData(prev => ({ ...prev, ...data }))}
          onSubmit={handleShortReceiveBackSubmit}
        />
      )}

      <EditRejectedShortModal
        isOpen={editModalOpen}
        record={editingRecord}
        items={editingItems}
        selectedItemId={selectedItemId}
        formData={editFormData}
        updating={updating}
        onClose={() => {
                  setEditModalOpen(false);
                  setEditingRecord(null);
                  setEditingItems([]);
                  setSelectedItemId(null);
                }}
        onItemSelect={(itemId) => {
                      setSelectedItemId(itemId);
          const item = editingItems.find(i => {
            const id = i.itemId || i.item_id || i.id;
            return id === itemId;
          });
                      if (item) {
                        setEditFormData(prev => ({
                          ...prev,
                          rejected: item.rejected || 0,
                          short: item.short || 0,
                        }));
                      }
                    }}
        onFormDataChange={(data) => {
          setEditFormData(prev => ({ ...prev, ...data }));
        }}
        onUpdate={handleUpdateRejectedShort}
      />
    </div>
  );
};

export default InventoryPage;
