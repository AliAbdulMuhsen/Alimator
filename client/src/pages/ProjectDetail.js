import React, { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import Header from '../components/Header';
import '../styles/pages/ProjectDetail.css';
import axios from 'axios';

function ProjectDetail({ user, onLogout }) {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    fetchProjectDetails();
  }, [id]);

  const fetchProjectDetails = async () => {
    try {
      const response = await axios.get(`/api/projects/${id}`);
      setProject(response.data);
      setError('');
    } catch (err) {
      setError('Failed to load project details');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="project-detail-page">
        <Header user={user} onLogout={onLogout} />
        <div className="loading">Loading project...</div>
      </div>
    );
  }

  if (error || !project) {
    return (
      <div className="project-detail-page">
        <Header user={user} onLogout={onLogout} />
        <div className="error-message">{error}</div>
        <button onClick={() => navigate('/')} className="btn btn-primary">
          Back to Projects
        </button>
      </div>
    );
  }

  const totalCost = project.items ? project.items.reduce((sum, item) => sum + item.total_cost, 0) : 0;

  return (
    <div className="project-detail-page">
      <Header user={user} onLogout={onLogout} />
      
      <div className="project-detail-container">
        <div className="page-header">
          <button className="back-btn" onClick={() => navigate('/')}>
            <i className="fas fa-arrow-left"></i> Back
          </button>
          <div>
            <h1>{project.name}</h1>
            <p className="project-meta">{project.date}</p>
          </div>
        </div>

        {project.description && (
          <div className="project-description">
            <p>{project.description}</p>
          </div>
        )}

        <div className="project-summary">
          <div className="summary-card">
            <h3>Items Count</h3>
            <p className="summary-value">{project.items ? project.items.length : 0}</p>
          </div>
          <div className="summary-card">
            <h3>Total Cost</h3>
            <p className="summary-value">${totalCost.toFixed(2)}</p>
          </div>
        </div>

        {project.items && project.items.length > 0 ? (
          <div className="items-section">
            <h2>Bill of Quantities</h2>
            <div className="table-container">
              <table className="items-table">
                <thead>
                  <tr>
                    <th>Item Description</th>
                    <th>Unit</th>
                    <th>Quantity</th>
                    <th>Unit Price</th>
                    <th>Total Cost</th>
                  </tr>
                </thead>
                <tbody>
                  {project.items.map((item) => (
                    <tr key={item.id}>
                      <td>{item.description}</td>
                      <td>{item.unit}</td>
                      <td>{item.quantity}</td>
                      <td>${item.unit_price.toFixed(2)}</td>
                      <td>${item.total_cost.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="empty-state">
            <i className="fas fa-inbox"></i>
            <p>No items in this project</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ProjectDetail;
