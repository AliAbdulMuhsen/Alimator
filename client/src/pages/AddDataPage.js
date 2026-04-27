import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages/AddDataPage.css';
import axios from 'axios';

function AddDataPage({ user, onLogout }) {
  const [activeTab, setActiveTab] = useState('import'); // 'import' or 'manual'
  const [projects, setProjects] = useState([]);
  const [selectedProject, setSelectedProject] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  // Import state
  const [file, setFile] = useState(null);
  const [previewData, setPreviewData] = useState(null);
  const [importing, setImporting] = useState(false);

  // Manual entry state
  const [formData, setFormData] = useState({
    description: '',
    unit: '',
    quantity: '',
    unit_price: ''
  });
  const [items, setItems] = useState([]);

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await axios.get('/api/projects');
      setProjects(response.data || []);
      if (response.data && response.data.length > 0) {
        setSelectedProject(response.data[0].id);
      }
    } catch (err) {
      setError('Failed to load projects');
    }
  };

  // ============ IMPORT TAB ============
  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      setFile(selectedFile);
      setPreviewData(null);
      setError('');
    }
  };

  const handlePreview = async () => {
    if (!file) {
      setError('Please select a file');
      return;
    }

    const formDataToSend = new FormData();
    formDataToSend.append('file', file);

    try {
      setLoading(true);
      const response = await axios.post('/api/import/preview', formDataToSend, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setPreviewData(response.data.items);
      setError('');
    } catch (err) {
      setError(err.response?.data?.details ? err.response.data.details.join(', ') : 'Failed to preview file');
      setPreviewData(null);
    } finally {
      setLoading(false);
    }
  };

  const handleImport = async () => {
    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    try {
      setImporting(true);
      await axios.post('/api/import/execute', {
        projectId: parseInt(selectedProject),
        items: previewData
      });
      setSuccess(`Imported ${previewData.length} items successfully!`);
      setFile(null);
      setPreviewData(null);
      setError('');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Failed to import data');
    } finally {
      setImporting(false);
    }
  };

  const downloadTemplate = async () => {
    try {
      const response = await axios.get('/api/import/template', {
        responseType: 'blob'
      });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'BOQ_Template.xlsx');
      document.body.appendChild(link);
      link.click();
      link.parentChild.removeChild(link);
    } catch (err) {
      setError('Failed to download template');
    }
  };

  // ============ MANUAL ENTRY TAB ============
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleAddItem = (e) => {
    e.preventDefault();
    
    if (!formData.description.trim() || !formData.unit.trim() || !formData.quantity || !formData.unit_price) {
      setError('All fields are required');
      return;
    }

    const newItem = {
      ...formData,
      quantity: parseFloat(formData.quantity),
      unit_price: parseFloat(formData.unit_price),
      total_cost: parseFloat(formData.quantity) * parseFloat(formData.unit_price)
    };

    setItems([...items, newItem]);
    setFormData({
      description: '',
      unit: '',
      quantity: '',
      unit_price: ''
    });
    setError('');
  };

  const handleRemoveItem = (index) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const handleSaveItems = async () => {
    if (!selectedProject) {
      setError('Please select a project');
      return;
    }

    try {
      setImporting(true);
      await axios.post('/api/import/execute', {
        projectId: parseInt(selectedProject),
        items: items
      });
      setSuccess(`Saved ${items.length} items successfully!`);
      setItems([]);
      setError('');
      setTimeout(() => {
        navigate('/');
      }, 2000);
    } catch (err) {
      setError('Failed to save items');
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="add-data-page">
      <Header user={user} onLogout={onLogout} />
      
      <div className="add-data-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <h1>Add Data</h1>
        </div>

        {error && <div className="alert alert-error">{error}</div>}
        {success && <div className="alert alert-success">{success}</div>}

        <div className="project-selector">
          <label htmlFor="project">Select Project:</label>
          <select 
            id="project"
            value={selectedProject}
            onChange={(e) => setSelectedProject(e.target.value)}
            className="select-input"
          >
            <option value="">-- Select a project --</option>
            {projects.map(project => (
              <option key={project.id} value={project.id}>
                {project.name} ({project.date})
              </option>
            ))}
          </select>
        </div>

        <div className="tabs">
          <button 
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            <i className="fas fa-file-import"></i> Import from Excel
          </button>
          <button 
            className={`tab-btn ${activeTab === 'manual' ? 'active' : ''}`}
            onClick={() => setActiveTab('manual')}
          >
            <i className="fas fa-keyboard"></i> Manual Entry
          </button>
        </div>

        {activeTab === 'import' ? (
          <div className="tab-content import-content">
            <div className="import-section">
              <h2>Import from Excel</h2>
              
              <div className="template-section">
                <p>First time? Download our template:</p>
                <button 
                  className="btn btn-secondary"
                  onClick={downloadTemplate}
                  type="button"
                >
                  <i className="fas fa-download"></i> Download Template
                </button>
              </div>

              <div className="file-upload">
                <label htmlFor="file-input" className="file-label">
                  <i className="fas fa-cloud-upload-alt"></i>
                  <span>Click to select Excel file or drag and drop</span>
                  <input
                    type="file"
                    id="file-input"
                    accept=".xlsx,.xls"
                    onChange={handleFileChange}
                    disabled={loading}
                  />
                </label>
                {file && <p className="file-name">{file.name}</p>}
              </div>

              <button 
                className="btn btn-primary"
                onClick={handlePreview}
                disabled={!file || loading}
              >
                {loading ? 'Processing...' : 'Preview Data'}
              </button>
            </div>

            {previewData && (
              <div className="preview-section">
                <h3>Preview ({previewData.length} items)</h3>
                <div className="table-container">
                  <table className="preview-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Cost</th>
                      </tr>
                    </thead>
                    <tbody>
                      {previewData.slice(0, 10).map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.unit}</td>
                          <td>{item.quantity}</td>
                          <td>${item.unit_price.toFixed(2)}</td>
                          <td>${item.total_cost.toFixed(2)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                  {previewData.length > 10 && <p className="text-muted">... and {previewData.length - 10} more items</p>}
                </div>

                <div className="action-buttons">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => {
                      setPreviewData(null);
                      setFile(null);
                    }}
                  >
                    Back
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={handleImport}
                    disabled={importing}
                  >
                    {importing ? 'Importing...' : 'Import Data'}
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="tab-content manual-content">
            <div className="form-section">
              <h2>Add Item Manually</h2>
              <form onSubmit={handleAddItem}>
                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="description">Item Description *</label>
                    <input
                      type="text"
                      id="description"
                      name="description"
                      value={formData.description}
                      onChange={handleInputChange}
                      placeholder="e.g., Concrete Grade A"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="unit">Unit *</label>
                    <input
                      type="text"
                      id="unit"
                      name="unit"
                      value={formData.unit}
                      onChange={handleInputChange}
                      placeholder="e.g., m³, ton, pcs"
                    />
                  </div>
                </div>

                <div className="form-row">
                  <div className="form-group">
                    <label htmlFor="quantity">Quantity *</label>
                    <input
                      type="number"
                      id="quantity"
                      name="quantity"
                      value={formData.quantity}
                      onChange={handleInputChange}
                      placeholder="0"
                      step="0.01"
                    />
                  </div>

                  <div className="form-group">
                    <label htmlFor="unit_price">Unit Price *</label>
                    <input
                      type="number"
                      id="unit_price"
                      name="unit_price"
                      value={formData.unit_price}
                      onChange={handleInputChange}
                      placeholder="0.00"
                      step="0.01"
                    />
                  </div>
                </div>

                <button type="submit" className="btn btn-primary">
                  <i className="fas fa-plus"></i> Add Item
                </button>
              </form>
            </div>

            {items.length > 0 && (
              <div className="items-section">
                <h3>Items to Add ({items.length})</h3>
                <div className="table-container">
                  <table className="items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th>Unit</th>
                        <th>Quantity</th>
                        <th>Unit Price</th>
                        <th>Total Cost</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {items.map((item, index) => (
                        <tr key={index}>
                          <td>{item.description}</td>
                          <td>{item.unit}</td>
                          <td>{item.quantity}</td>
                          <td>${item.unit_price.toFixed(2)}</td>
                          <td>${item.total_cost.toFixed(2)}</td>
                          <td>
                            <button 
                              className="btn-icon delete"
                              onClick={() => handleRemoveItem(index)}
                              type="button"
                            >
                              <i className="fas fa-trash"></i>
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="summary">
                  <p>Total Items: {items.length}</p>
                  <p>Total Cost: ${items.reduce((sum, item) => sum + item.total_cost, 0).toFixed(2)}</p>
                </div>

                <div className="action-buttons">
                  <button 
                    className="btn btn-secondary"
                    onClick={() => setItems([])}
                    type="button"
                  >
                    Clear All
                  </button>
                  <button 
                    className="btn btn-success"
                    onClick={handleSaveItems}
                    disabled={importing}
                  >
                    {importing ? 'Saving...' : 'Save Items'}
                  </button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default AddDataPage;
