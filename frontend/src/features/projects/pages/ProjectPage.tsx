import React from 'react';
import ProjectForm from '../components/ProjectForm';
import ProjectList from '../components/ProjectList';
import { useProjects } from '../hooks/useProjects';

export default function ProjectPage(): React.ReactElement {
  const project = useProjects();
  return (
    <>
      <h2 className="text-2xl font-bold text-[#3b0a84]">Manage Projects</h2>
      <ProjectForm
        projectInput={project.projectInput}
        setProjectInput={project.setProjectInput}
        editingProject={project.editingProject}
        setEditingProject={project.setEditingProject}
      />
      <ProjectList
        projects={project.projects}
        loading={project.loading}
        error={project.error}
        editProject={project.setEditingProject}
        setProjectInput={project.setProjectInput}
      />
    </>
  );
}
