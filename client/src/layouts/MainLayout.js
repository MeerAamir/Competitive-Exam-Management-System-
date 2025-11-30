import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import styles from './MainLayout.module.css';

const MainLayout = ({ children, user, onLogout }) => {
    const location = useLocation();
    const isAdmin = user?.role === 'admin';

    const adminLinks = [
        { path: '/admin', label: 'Dashboard', icon: '📊' },
        { path: '/admin/exams', label: 'Exams', icon: '📝' },
        { path: '/admin/questions', label: 'Question Bank', icon: '📚' },
        { path: '/admin/subjects', label: 'Subjects', icon: '🏷️' },
        { path: '/admin/users', label: 'Users', icon: '👥' },
        { path: '/admin/results', label: 'Results', icon: '🏆' },
        { path: '/admin/settings', label: 'Settings', icon: '⚙️' },
    ];

    const studentLinks = [
        { path: '/dashboard', label: 'Dashboard', icon: '🏠' },
        { path: '/history', label: 'My Results', icon: '📈' },
        { path: '/profile', label: 'Profile', icon: '👤' },
    ];

    const links = isAdmin ? adminLinks : studentLinks;

    return (
        <div className={styles.layoutContainer}>
            {/* Sidebar */}
            <aside className={styles.sidebar}>
                <div className={styles.brand}>
                    <span style={{ marginRight: '10px', fontSize: '1.5rem' }}>🎓</span>
                    Competitive Exam System
                </div>
                <nav className={styles.nav}>
                    {links.map((link) => (
                        <Link
                            key={link.path}
                            to={link.path}
                            className={`${styles.navItem} ${location.pathname === link.path ? styles.navItemActive : ''}`}
                        >
                            <span className={styles.navIcon}>{link.icon}</span>
                            {link.label}
                        </Link>
                    ))}
                </nav>
            </aside>

            {/* Main Content */}
            <main className={styles.mainContent}>
                {/* Header */}
                <header className={styles.header}>
                    <div className={styles.headerTitle}>
                        {links.find(l => l.path === location.pathname)?.label || 'Dashboard'}
                    </div>
                    <div className={styles.userMenu}>
                        <div className={styles.userInfo}>
                            <span className={styles.userName}>{user?.username || 'User'}</span>
                            <span className={styles.userRole}>{user?.role || 'Guest'}</span>
                        </div>
                        <button onClick={onLogout} className={styles.logoutBtn}>
                            Logout
                        </button>
                    </div>
                </header>

                {/* Page Content */}
                <div className={styles.pageContent}>
                    {children}
                </div>
            </main>
        </div>
    );
};

export default MainLayout;
