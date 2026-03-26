import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

// This component takes other components as children
const ProtectedRoute = ({ children }) => {
    const { isAuthenticated, isLoading } = useAuth();

    if (isLoading) {
        return (
            <div style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                height: '100vh',
                backgroundColor: 'var(--color-bg-main)',
                color: 'var(--color-text-main)'
            }}>
                <div className="loader">Loading Session...</div>
            </div>
        );
    }

    // If not authenticated, redirect to login page
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // If authenticated, render the child component (e.g., the Dashboard)
    return children;
};

export default ProtectedRoute;