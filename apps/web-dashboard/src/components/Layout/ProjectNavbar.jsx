import { NavLink, useParams, Link } from 'react-router-dom';
import {
    LayoutDashboard, Database, Shield, HardDrive, Settings, BarChart2,
    ArrowLeft
} from 'lucide-react';

const projectNavItems = [
    { label: 'Overview', to: (projectId) => `/project/${projectId}`, icon: LayoutDashboard, end: true },
    { label: 'Database', to: (projectId) => `/project/${projectId}/database`, icon: Database },
    { label: 'Auth', to: (projectId) => `/project/${projectId}/auth`, icon: Shield },
    { label: 'Storage', to: (projectId) => `/project/${projectId}/storage`, icon: HardDrive },
    { label: 'Analytics', to: (projectId) => `/project/${projectId}/analytics`, icon: BarChart2 },
    { label: 'Settings', to: (projectId) => `/project/${projectId}/settings`, icon: Settings },
];

function ProjectNavbar() {
    const { projectId } = useParams();

    if (!projectId) return null;

    return (
        <div className="project-navbar">
            <div className="nav-left">
                <Link to="/dashboard" className="nav-back-btn" title="Back to dashboard" aria-label="Back to dashboard">
                    <ArrowLeft size={18} />
                    <span>Back</span>
                </Link>
                <div className="nav-divider"></div>
            </div>

            <nav className="nav-links" aria-label="Project navigation">
                {projectNavItems.map((item) => {
                    const Icon = item.icon;
                    return (
                        <NavLink
                            key={item.label}
                            to={item.to(projectId)}
                            end={item.end}
                            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                            title={item.label}
                            aria-label={item.label}
                        >
                            <Icon size={18} aria-hidden="true" />
                            <span>{item.label}</span>
                        </NavLink>
                    );
                })}
            </nav>
        </div>
    );
}

export default ProjectNavbar;
