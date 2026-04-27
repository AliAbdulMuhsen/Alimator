import React from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/components/ProjectList.css';

function ProjectList({ projects }) {
  const navigate = useNavigate();

  return (
    <div className="projects-grid">
      {projects.map((project) => (
        <div key={project.id} className="project-card" onClick={() => navigate(`/project/${project.id}`)}>
          <div className="project-card-header">
            <h3>{project.name}</h3>
            <span className="project-date">{project.date}</span>
          </div>
          {project.description && (
            <p className="project-description">{project.description}</p>
          )}
          <div className="project-card-footer">
            <span className="view-link">View Details <i className="fas fa-arrow-right"></i></span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default ProjectList;
