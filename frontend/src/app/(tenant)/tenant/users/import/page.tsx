import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Metadata } from 'next';
import Link from 'next/link';
import { useState } from 'react';

export const metadata: Metadata = {
  title: 'Bulk Import Users | Tenant Admin',
  description: 'Import multiple users at once',
};

// Define navigation items for tenant admin
const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Users', href: '/tenant/users' },
  { title: 'Teams', href: '/tenant/teams' },
  { title: 'Roles', href: '/tenant/roles' },
  { title: 'Modules', href: '/tenant/modules' },
  { title: 'Settings', href: '/tenant/settings' },
  { title: 'Billing', href: '/tenant/billing' },
];

// Sample CSV template
const csvTemplate = `firstName,lastName,email,role
John,Doe,john.doe@example.com,TENANT_USER
Jane,Smith,jane.smith@example.com,TENANT_USER
Robert,Johnson,robert.johnson@example.com,TENANT_ADMIN`;

export default function BulkImportUsersPage() {
  // In a real app, this would be fetched from the API
  const tenantName = "Example Company";
  
  // Upload states
  const [file, setFile] = useState<File | null>(null);
  const [previewData, setPreviewData] = useState<string[][]>([]);
  const [importStatus, setImportStatus] = useState<'idle' | 'previewing' | 'importing' | 'success' | 'error'>('idle');
  const [error, setError] = useState<string | null>(null);
  const [importResults, setImportResults] = useState<{
    total: number;
    imported: number;
    skipped: number;
    errors: number;
  } | null>(null);
  
  // Handle file selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    
    if (selectedFile) {
      setFile(selectedFile);
      
      // Reset states
      setPreviewData([]);
      setImportStatus('idle');
      setError(null);
      
      // Preview CSV file
      const reader = new FileReader();
      
      reader.onload = (event) => {
        try {
          const csvContent = event.target?.result as string;
          
          // Parse CSV (simple implementation, a real app would use a library)
          const rows = csvContent.split('\\n').map(row => row.split(','));
          
          if (rows.length < 2) {
            throw new Error('CSV file must contain a header row and at least one data row');
          }
          
          // Validate headers
          const requiredHeaders = ['firstName', 'lastName', 'email', 'role'];
          const headers = rows[0].map(h => h.trim().toLowerCase());
          
          const missingHeaders = requiredHeaders.filter(h => !headers.includes(h));
          if (missingHeaders.length > 0) {
            throw new Error(`Missing required headers: ${missingHeaders.join(', ')}`);
          }
          
          setPreviewData(rows.slice(0, 6)); // Preview first 5 rows + header
          setImportStatus('previewing');
        } catch (err) {
          setError((err as Error).message);
          setImportStatus('error');
        }
      };
      
      reader.onerror = () => {
        setError('Error reading file');
        setImportStatus('error');
      };
      
      reader.readAsText(selectedFile);
    }
  };
  
  // Download CSV template
  const handleDownloadTemplate = () => {
    const element = document.createElement('a');
    const file = new Blob([csvTemplate], { type: 'text/csv' });
    element.href = URL.createObjectURL(file);
    element.download = 'user_import_template.csv';
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };
  
  // Import users
  const handleImport = () => {
    if (!file) return;
    
    setImportStatus('importing');
    
    // Simulating API call
    setTimeout(() => {
      // Mock successful import
      setImportResults({
        total: 25,
        imported: 23,
        skipped: 1,
        errors: 1,
      });
      setImportStatus('success');
    }, 2000);
    
    // In a real app, you would:
    // 1. Upload the file to the server or
    // 2. Parse it client-side and send the data as JSON
    // 3. Handle the response and show results
  };
  
  // Render import status/results
  const renderImportStatus = () => {
    switch (importStatus) {
      case 'importing':
        return (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mb-4"></div>
            <p>Importing users, please wait...</p>
          </div>
        );
        
      case 'success':
        return (
          <div className="bg-green-50 border border-green-200 rounded-md p-4 my-4">
            <div className="flex items-start">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-green-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-green-800">Import successful</h3>
                <div className="mt-2 text-sm text-green-700">
                  <p>Total records: {importResults?.total}</p>
                  <p>Successfully imported: {importResults?.imported}</p>
                  <p>Skipped (already exist): {importResults?.skipped}</p>
                  <p>Errors: {importResults?.errors}</p>
                </div>
                <div className="mt-4">
                  <Link href="/tenant/users">
                    <Button variant="outline" size="sm">
                      View Users
                    </Button>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        );
        
      case 'error':
        return (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 my-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg className="h-5 w-5 text-red-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-red-800">Import failed</h3>
                <div className="mt-2 text-sm text-red-700">
                  <p>{error}</p>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  // Render CSV preview
  const renderPreview = () => {
    if (previewData.length === 0) return null;
    
    return (
      <div className="my-4">
        <h3 className="text-md font-medium mb-2">Preview</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                {previewData[0].map((header, index) => (
                  <th
                    key={index}
                    scope="col"
                    className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                  >
                    {header}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {previewData.slice(1).map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((cell, cellIndex) => (
                    <td
                      key={cellIndex}
                      className="px-3 py-2 whitespace-nowrap text-sm text-gray-500"
                    >
                      {cell}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {previewData.length > 6 && (
          <p className="text-sm text-gray-500 mt-2">
            Showing first 5 rows of {previewData.length - 1} total rows
          </p>
        )}
      </div>
    );
  };
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Bulk Import Users</h1>
        <Link href="/tenant/users">
          <Button variant="outline">Cancel</Button>
        </Link>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Import Users via CSV</CardTitle>
          <CardDescription>
            Upload a CSV file containing user information to bulk import multiple users
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            {importStatus !== 'success' && (
              <>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                  <svg className="mx-auto h-12 w-12 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                  </svg>
                  
                  {file ? (
                    <div className="mt-2">
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">
                        {(file.size / 1024).toFixed(2)} KB
                      </p>
                      <Button
                        variant="outline"
                        className="mt-2"
                        onClick={() => {
                          setFile(null);
                          setPreviewData([]);
                          setImportStatus('idle');
                        }}
                      >
                        Remove
                      </Button>
                    </div>
                  ) : (
                    <>
                      <p className="mt-1 text-sm text-gray-600">
                        Drag and drop your CSV file here, or click to browse
                      </p>
                      <div className="mt-4">
                        <input
                          id="file-upload"
                          name="file-upload"
                          type="file"
                          accept=".csv"
                          className="sr-only"
                          onChange={handleFileChange}
                        />
                        <label
                          htmlFor="file-upload"
                          className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 cursor-pointer"
                        >
                          Select CSV File
                        </label>
                      </div>
                    </>
                  )}
                </div>
                
                <div className="bg-gray-50 p-4 rounded-md">
                  <h3 className="text-md font-medium mb-2">CSV Format Requirements</h3>
                  <ul className="list-disc pl-5 space-y-1 text-sm">
                    <li>File must be in CSV format</li>
                    <li>First row must contain headers</li>
                    <li>Required columns: firstName, lastName, email, role</li>
                    <li>Valid roles: TENANT_ADMIN, TENANT_USER</li>
                    <li>Email addresses must be unique</li>
                  </ul>
                  <div className="mt-4">
                    <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                      Download Template
                    </Button>
                  </div>
                </div>
                
                {renderPreview()}
                
                {renderImportStatus()}
                
                {importStatus === 'previewing' && (
                  <div className="flex justify-end">
                    <Button onClick={handleImport}>
                      Import Users
                    </Button>
                  </div>
                )}
              </>
            )}
            
            {importStatus === 'success' && renderImportStatus()}
          </div>
        </CardContent>
      </Card>
    </DashboardLayout>
  );
}
