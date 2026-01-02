import React, { useState, useRef, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { Plus, Search, Edit, Trash2, X, Upload, Download } from 'lucide-react';
import { libraryService } from '../../services/libraryService';
import { validateRequired, validateEmail, validatePhone } from '../../utils/validators';
import * as XLSX from 'xlsx';

interface Team {
  id: number;
  name: string;
  firstName?: string;
  lastName?: string;
  contactNumber: string;
  emailId: string;
  department: string;
  designation: string;
  isActive?: boolean;
}

interface TeamsTabProps {
  teams: Team[];
  loading: boolean;
  onRefresh: () => void;
}

// Department and Designation mapping
const departmentDesignations: Record<string, string[]> = {
  'Engineering / Technology': ['Software Engineer', 'Engineering Manager'],
  'Product': ['Product Manager', 'Product Lead'],
  'Quality / Testing': ['QA Engineer', 'QA Manager'],
  'Data / Analytics': ['Data Analyst', 'Data Scientist'],
  'Sales': ['Sales Executive', 'Sales Manager'],
  'Marketing': ['Marketing Specialist', 'Marketing Manager'],
  'Customer Support / Success': ['Customer Support Executive', 'Customer Success Manager'],
  'Finance / Accounts': ['Accountant', 'Finance Manager'],
  'Human Resources (HR)': ['HR Executive', 'HR Manager'],
  'Operations': ['Operations Executive', 'Operations Manager'],
  'Legal / Compliance': ['Legal Officer', 'Compliance Manager'],
  'Administration': ['Admin Executive', 'Admin Manager'],
};

const departments = Object.keys(departmentDesignations);

const TeamsTab: React.FC<TeamsTabProps> = ({ teams, loading, onRefresh }) => {
  const [search, setSearch] = useState('');
  const [showDialog, setShowDialog] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Autocomplete states
  const [departmentInput, setDepartmentInput] = useState('');
  const [showDepartmentDropdown, setShowDepartmentDropdown] = useState(false);
  const [designationInput, setDesignationInput] = useState('');
  const [showDesignationDropdown, setShowDesignationDropdown] = useState(false);
  const departmentInputRef = useRef<HTMLDivElement>(null);
  const designationInputRef = useRef<HTMLDivElement>(null);
  const departmentInputElementRef = useRef<HTMLInputElement>(null);
  const designationInputElementRef = useRef<HTMLInputElement>(null);
  const [departmentDropdownPosition, setDepartmentDropdownPosition] = useState({ top: 0, left: 0, width: 0 });
  const [designationDropdownPosition, setDesignationDropdownPosition] = useState({ top: 0, left: 0, width: 0 });

  const [teamForm, setTeamForm] = useState<Partial<Team>>({
    firstName: '',
    lastName: '',
    contactNumber: '',
    emailId: '',
    department: '',
    designation: '',
    isActive: true,
  });

  const handleOpenDialog = (team?: Team) => {
    if (team) {
      setEditingTeam(team);
      // Split name into firstName and lastName
      const nameParts = team.name ? team.name.trim().split(/\s+/) : [];
      const firstName = nameParts[0] || '';
      const lastName = nameParts.slice(1).join(' ') || '';
      setTeamForm({
        ...team,
        firstName,
        lastName,
      });
      setDepartmentInput(team.department || '');
      setDesignationInput(team.designation || '');
    } else {
      setEditingTeam(null);
      setTeamForm({
        firstName: '',
        lastName: '',
        contactNumber: '',
        emailId: '',
        department: '',
        designation: '',
        isActive: true,
      });
      setDepartmentInput('');
      setDesignationInput('');
    }
    setShowDialog(true);
    setErrors({});
    setShowDepartmentDropdown(false);
    setShowDesignationDropdown(false);
  };

  const handleDepartmentChange = (department: string) => {
    setTeamForm({
      ...teamForm,
      department,
      designation: '', // Clear designation when department changes
    });
    setDepartmentInput(department);
    setDesignationInput(''); // Clear designation input
    setShowDepartmentDropdown(false);
    // Clear designation error when department changes
    if (errors.designation) {
      setErrors(prev => ({
        ...prev,
        designation: undefined,
      }));
    }
  };

  const handleDesignationChange = (designation: string) => {
    setTeamForm({
      ...teamForm,
      designation,
    });
    setDesignationInput(designation);
    setShowDesignationDropdown(false);
    // Clear designation error when designation is selected
    if (errors.designation) {
      setErrors(prev => ({
        ...prev,
        designation: undefined,
      }));
    }
  };

  // Get available designations for selected department
  const availableDesignations = teamForm.department 
    ? departmentDesignations[teamForm.department] || []
    : [];

  // Filter departments based on input
  const filteredDepartments = departments.filter(dept =>
    dept.toLowerCase().includes(departmentInput.toLowerCase())
  );

  // Filter designations based on input
  const filteredDesignations = availableDesignations.filter(des =>
    des.toLowerCase().includes(designationInput.toLowerCase())
  );

  // Calculate dropdown position
  const updateDepartmentDropdownPosition = () => {
    if (departmentInputElementRef.current) {
      const rect = departmentInputElementRef.current.getBoundingClientRect();
      setDepartmentDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  const updateDesignationDropdownPosition = () => {
    if (designationInputElementRef.current) {
      const rect = designationInputElementRef.current.getBoundingClientRect();
      setDesignationDropdownPosition({
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX,
        width: rect.width,
      });
    }
  };

  // Update dropdown positions when they open
  useEffect(() => {
    if (showDepartmentDropdown) {
      updateDepartmentDropdownPosition();
      const handleScroll = () => updateDepartmentDropdownPosition();
      const handleResize = () => updateDepartmentDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showDepartmentDropdown]);

  useEffect(() => {
    if (showDesignationDropdown) {
      updateDesignationDropdownPosition();
      const handleScroll = () => updateDesignationDropdownPosition();
      const handleResize = () => updateDesignationDropdownPosition();
      window.addEventListener('scroll', handleScroll, true);
      window.addEventListener('resize', handleResize);
      return () => {
        window.removeEventListener('scroll', handleScroll, true);
        window.removeEventListener('resize', handleResize);
      };
    }
  }, [showDesignationDropdown]);

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (departmentInputRef.current && !departmentInputRef.current.contains(event.target as Node)) {
        setShowDepartmentDropdown(false);
      }
      if (designationInputRef.current && !designationInputRef.current.contains(event.target as Node)) {
        setShowDesignationDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleFirstNameChange = (value: string) => {
    // Only allow letters, spaces, hyphens, apostrophes, and periods
    // Max 25 characters
    let filteredValue = value.replace(/[^A-Za-z\s\-'\.]/g, '');
    if (filteredValue.length > 25) {
      filteredValue = filteredValue.substring(0, 25);
    }
    setTeamForm({
      ...teamForm,
      firstName: filteredValue,
    });
    // Clear firstName error when user starts typing
    if (errors.firstName) {
      setErrors(prev => ({
        ...prev,
        firstName: undefined,
      }));
    }
  };

  const handleLastNameChange = (value: string) => {
    // Only allow letters, spaces, hyphens, apostrophes, and periods
    // Max 25 characters
    let filteredValue = value.replace(/[^A-Za-z\s\-'\.]/g, '');
    if (filteredValue.length > 25) {
      filteredValue = filteredValue.substring(0, 25);
    }
    setTeamForm({
      ...teamForm,
      lastName: filteredValue,
    });
    // Clear lastName error when user starts typing
    if (errors.lastName) {
      setErrors(prev => ({
        ...prev,
        lastName: undefined,
      }));
    }
  };

  const handleContactNumberChange = (value: string) => {
    // Only allow numbers, max 10 characters
    let filteredValue = value.replace(/[^0-9]/g, '');
    if (filteredValue.length > 10) {
      filteredValue = filteredValue.substring(0, 10);
    }
    setTeamForm({
      ...teamForm,
      contactNumber: filteredValue,
    });
    // Clear contact number error when user starts typing
    if (errors.contactNumber) {
      setErrors(prev => ({
        ...prev,
        contactNumber: undefined,
      }));
    }
  };

  const handleSave = async () => {
    const newErrors: Record<string, string> = {};
    
    if (!validateRequired(teamForm.firstName || '')) {
      newErrors.firstName = 'First Name is required';
    }
    // Last Name is optional - no validation needed
    if (!validateRequired(teamForm.contactNumber || '')) {
      newErrors.contactNumber = 'Contact Number is required';
    } else if (!validatePhone(teamForm.contactNumber || '')) {
      newErrors.contactNumber = 'Invalid phone number (10 digits)';
    }
    if (!validateRequired(teamForm.emailId || '')) {
      newErrors.emailId = 'Email ID is required';
    } else if (!validateEmail(teamForm.emailId || '')) {
      newErrors.emailId = 'Invalid email format';
    }
    if (!validateRequired(teamForm.department || '')) {
      newErrors.department = 'Department is required';
    }
    if (!validateRequired(teamForm.designation || '')) {
      newErrors.designation = 'Designation is required';
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      return;
    }

    try {
      setSaving(true);
      // Combine firstName and lastName into name for API
      const formData = {
        ...teamForm,
        name: `${teamForm.firstName || ''} ${teamForm.lastName || ''}`.trim(),
      };
      // Remove firstName and lastName from the payload
      delete formData.firstName;
      delete formData.lastName;
      
      if (editingTeam) {
        await libraryService.updateTeam(editingTeam.id, formData);
      } else {
        await libraryService.createTeam(formData);
      }
      setShowDialog(false);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to save team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) return;

    try {
      setSaving(true);
      await libraryService.deleteTeam(id);
      onRefresh();
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to delete team member');
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadTemplate = () => {
    const templateData = [
      {
        'First Name': '',
        'Last Name': '',
        'Contact Number': '',
        'Email ID': '',
        'Department': '',
        'Designation': '',
        'Is Active': 'true'
      }
    ];

    const wb = XLSX.utils.book_new();
    const ws = XLSX.utils.json_to_sheet(templateData);
    
    // Set column widths
    ws['!cols'] = [
      { wch: 15 }, // First Name
      { wch: 15 }, // Last Name
      { wch: 18 }, // Contact Number
      { wch: 25 }, // Email ID
      { wch: 20 }, // Department
      { wch: 20 }, // Designation
      { wch: 12 }, // Is Active
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'Teams Template');
    XLSX.writeFile(wb, 'Team_Upload_Template.xlsx');
  };

  const handleFileSelect = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = async (file: File | null) => {
    if (!file) return;

    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel',
      'text/csv',
    ];
    if (!validTypes.includes(file.type)) {
      alert('Please upload a valid Excel file (.xlsx, .xls) or CSV file');
      return;
    }

    try {
      setSaving(true);
      const result = await libraryService.uploadTeams(file);
      if (result.success) {
        alert(`${result.message}\nInserted: ${result.inserted}\nErrors: ${result.errors}`);
        onRefresh();
      }
    } catch (error: any) {
      alert(error.response?.data?.error || 'Failed to upload file');
    } finally {
      setSaving(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const filteredTeams = teams.filter((team) => {
    const nameLower = team.name?.toLowerCase() || '';
    const searchLower = search.toLowerCase();
    return (
      nameLower.includes(searchLower) ||
      team.contactNumber?.toLowerCase().includes(searchLower) ||
      team.emailId?.toLowerCase().includes(searchLower) ||
      team.department?.toLowerCase().includes(searchLower) ||
      team.designation?.toLowerCase().includes(searchLower)
    );
  });

  return (
    <>
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex-1 w-full sm:w-auto">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleOpenDialog()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
            >
              <Plus className="w-5 h-5" />
              Add Team
            </button>
            <button
              onClick={handleDownloadTemplate}
              className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 flex items-center gap-2"
              title="Download Excel template with required columns"
            >
              <Download className="w-5 h-5" />
              Download Template
            </button>
            <button
              onClick={handleFileSelect}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
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
            <div className="w-8 h-8 border-4 border-blue-600 border-t-transparent rounded-full animate-spin"></div>
          </div>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">First Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Last Name</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Contact Number</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Email ID</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Department</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Designation</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {filteredTeams.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="px-4 py-8 text-center text-gray-500">No team members found</td>
                    </tr>
                  ) : (
                    filteredTeams.map((team) => {
                      const nameParts = team.name ? team.name.trim().split(/\s+/) : [];
                      const firstName = nameParts[0] || '-';
                      const lastName = nameParts.slice(1).join(' ') || '-';
                      return (
                        <tr key={team.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{firstName}</td>
                          <td className="px-4 py-3 text-sm font-medium text-gray-900">{lastName}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{team.contactNumber || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{team.emailId || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{team.department || '-'}</td>
                          <td className="px-4 py-3 text-sm text-gray-700">{team.designation || '-'}</td>
                          <td className="px-4 py-3 text-sm">
                            <div className="flex items-center gap-2">
                              <button
                                onClick={() => handleOpenDialog(team)}
                                className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg"
                                title="Edit"
                              >
                                <Edit className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(team.id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Dialog */}
      {showDialog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-2xl font-bold text-gray-900">
                  {editingTeam ? 'Edit Team Member' : 'Add Team Member'}
                </h2>
                <button
                  onClick={() => setShowDialog(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <X className="w-6 h-6" />
                </button>
              </div>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      First Name <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={teamForm.firstName || ''}
                      onChange={(e) => handleFirstNameChange(e.target.value)}
                      maxLength={25}
                      pattern="[A-Za-z\s\-'\.]+"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.firstName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter first name"
                      title="First name should contain only letters, spaces, hyphens, and apostrophes (max 25 characters)"
                    />
                    {errors.firstName && <p className="text-red-500 text-xs mt-1">{errors.firstName}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Last Name
                    </label>
                    <input
                      type="text"
                      value={teamForm.lastName || ''}
                      onChange={(e) => handleLastNameChange(e.target.value)}
                      maxLength={25}
                      pattern="[A-Za-z\s\-'\.]+"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.lastName ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter last name (optional)"
                      title="Last name should contain only letters, spaces, hyphens, and apostrophes (max 25 characters)"
                    />
                    {errors.lastName && <p className="text-red-500 text-xs mt-1">{errors.lastName}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Contact Number <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      value={teamForm.contactNumber}
                      onChange={(e) => handleContactNumberChange(e.target.value)}
                      maxLength={10}
                      pattern="[0-9]{10}"
                      inputMode="numeric"
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.contactNumber ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter contact number"
                      title="Contact number should contain exactly 10 digits"
                    />
                    {errors.contactNumber && <p className="text-red-500 text-xs mt-1">{errors.contactNumber}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Email ID <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      value={teamForm.emailId}
                      onChange={(e) => setTeamForm({ ...teamForm, emailId: e.target.value })}
                      className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 ${
                        errors.emailId ? 'border-red-500' : 'border-gray-300'
                      }`}
                      placeholder="Enter email ID"
                    />
                    {errors.emailId && <p className="text-red-500 text-xs mt-1">{errors.emailId}</p>}
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div ref={departmentInputRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Department <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={departmentInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDepartmentInput(value);
                          setTeamForm({ ...teamForm, department: value });
                          setShowDepartmentDropdown(true);
                          // Clear error when typing
                          if (errors.department) {
                            setErrors(prev => ({ ...prev, department: undefined }));
                          }
                        }}
                        onFocus={() => {
                          setShowDepartmentDropdown(true);
                          updateDepartmentDropdownPosition();
                        }}
                        placeholder="Type or select department"
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${
                          errors.department ? 'border-red-500' : 'border-gray-300'
                        }`}
                        ref={departmentInputElementRef}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showDepartmentDropdown && filteredDepartments.length > 0 && createPortal(
                        <div
                          style={{
                            position: 'fixed',
                            top: `${departmentDropdownPosition.top}px`,
                            left: `${departmentDropdownPosition.left}px`,
                            width: `${departmentDropdownPosition.width}px`,
                            zIndex: 9999,
                          }}
                          className="mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                        >
                          {filteredDepartments.map((dept) => (
                            <div
                              key={dept}
                              onClick={() => handleDepartmentChange(dept)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                            >
                              {dept}
                            </div>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>
                    {errors.department && <p className="text-red-500 text-xs mt-1">{errors.department}</p>}
                  </div>
                  <div ref={designationInputRef} className="relative">
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Designation <span className="text-red-500">*</span>
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        value={designationInput}
                        onChange={(e) => {
                          const value = e.target.value;
                          setDesignationInput(value);
                          setTeamForm({ ...teamForm, designation: value });
                          setShowDesignationDropdown(true);
                          // Clear error when typing
                          if (errors.designation) {
                            setErrors(prev => ({ ...prev, designation: undefined }));
                          }
                        }}
                        onFocus={() => {
                          if (teamForm.department) {
                            setShowDesignationDropdown(true);
                            updateDesignationDropdownPosition();
                          }
                        }}
                        disabled={!teamForm.department}
                        placeholder={teamForm.department ? "Type or select designation" : "Select Department first"}
                        className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${
                          errors.designation ? 'border-red-500' : 'border-gray-300'
                        } ${!teamForm.department ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                        ref={designationInputElementRef}
                      />
                      <div className="absolute right-3 top-1/2 transform -translate-y-1/2 pointer-events-none">
                        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                      {showDesignationDropdown && teamForm.department && filteredDesignations.length > 0 && createPortal(
                        <div
                          style={{
                            position: 'fixed',
                            top: `${designationDropdownPosition.top}px`,
                            left: `${designationDropdownPosition.left}px`,
                            width: `${designationDropdownPosition.width}px`,
                            zIndex: 9999,
                          }}
                          className="mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-60 overflow-auto"
                        >
                          {filteredDesignations.map((designation) => (
                            <div
                              key={designation}
                              onClick={() => handleDesignationChange(designation)}
                              className="px-4 py-2 hover:bg-blue-50 cursor-pointer text-sm"
                            >
                              {designation}
                            </div>
                          ))}
                        </div>,
                        document.body
                      )}
                    </div>
                    {errors.designation && <p className="text-red-500 text-xs mt-1">{errors.designation}</p>}
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-4 mt-6">
                <button
                  onClick={() => setShowDialog(false)}
                  className="px-6 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
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
      )}
    </>
  );
};

export default TeamsTab;

