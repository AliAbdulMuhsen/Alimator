import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProjectList from '../components/ProjectList';
import '../styles/pages/MainPage.css';
import axios from 'axios';

function MainPage({ user, onLogout }) {
  const [showModal, setShowModal] = useState(false);
  const [projects, setProjects] = useState([]);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    date: new Date().toISOString().split('T')[0]
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      setLoading(true);
      const response = await axios.get('/api/projects');
      setProjects(response.data || []);
      setError('');
    } catch (err) {
      setError('Failed to load projects');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleCreateProject = async (e) => {
    e.preventDefault();
    if (!formData.name.trim()) {
      setError('Project name is required');
      return;
    }
    if (!formData.date) {
      setError('Project date is required');
      return;
    }

    try {
      await axios.post('/api/projects', formData);
      setFormData({
        name: '',
        description: '',
        date: new Date().toISOString().split('T')[0]
      });
      setShowModal(false);
      setError('');
      fetchProjects();
    } catch (err) {
      setError('Failed to create project');
      console.error(err);
    }
  };

  return (
    <div className="main-page">
      <Header user={user} onLogout={onLogout} />
      
      <div className="main-container">
        <div className="main-header">
          <h1>Main Page</h1>
          <p>Select an action below</p>
        </div>

        <div className="action-buttons">
          <button 
            className="action-btn add-data-btn"
            onClick={() => navigate('/add-data')}
          >
            <i className="fas fa-plus-circle"></i>
            <span>Add Data</span>
            <p>Import from Excel or add manually</p>
          </button>
          
          <button 
            className="action-btn search-btn"
            onClick={() => navigate('/search')}
          >
            <i className="fas fa-search"></i>
            <span>Search</span>
            <p>Find items and view price history</p>
          </button>
        </div>

        <div className="projects-section">
          <div className="section-header">
            <h2>Your Projects</h2>
            <button 
              className="btn btn-primary"
              onClick={() => setShowModal(true)}
            >
              <i className="fas fa-plus"></i> New Project
            </button>
          </div>

          {error && <div className="alert alert-error">{error}</div>}
          {loading ? (
            <div className="loading">Loading projects...</div>
          ) : projects.length > 0 ? (
            <ProjectList projects={projects} />
          ) : (
            <div className="empty-state">
              <i className="fas fa-inbox"></i>
              <p>No projects yet. Create your first project!</p>
            </div>
          )}
        </div>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h2>Create New Project</h2>
              <button className="close-btn" onClick={() => setShowModal(false)}>
                <i className="fas fa-times"></i>
              </button>
            </div>
            
            <form onSubmit={handleCreateProject} className="modal-body">
              <div className="form-group">
                <label htmlFor="name">Project Name *</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleInputChange}
                  placeholder="e.g., Building A Construction"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="date">Project Date *</label>
                <input
                  type="date"
                  id="date"
                  name="date"
                  value={formData.date}
                  onChange={handleInputChange}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="description">Description</label>
                <textarea
                  id="description"
                  name="description"
                  value={formData.description}
                  onChange={handleInputChange}
                  placeholder="Add project details..."
                  rows="3"
                />
              </div>

              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Create Project
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default MainPage;
