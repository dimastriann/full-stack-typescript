import React from 'react';
import ProjectForm from '../components/ProjectForm';
import ProjectList from '../components/ProjectList';
import { ProjectProvider } from '../hooks/useProjects';

export default function ProjectPage(): React.ReactElement {
  return (
    <ProjectProvider>
      <h2 className="text-2xl font-bold text-[#3b0a84]">Manage Projects</h2>
      <ProjectForm />
      <ProjectList />
    </ProjectProvider>
  );
}
