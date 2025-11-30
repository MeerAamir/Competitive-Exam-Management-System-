import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Admin.module.css';

const Users = () => {
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [roleFilter, setRoleFilter] = useState('');

    // Modals
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [showResetModal, setShowResetModal] = useState(false);
    const [selectedUser, setSelectedUser] = useState(null);

    // Forms
    const [newUser, setNewUser] = useState({ username: '', email: '', password: '', role: 'student' });
    const [resetPassword, setResetPassword] = useState('');

    useEffect(() => {
        fetchUsers();
    }, [search, roleFilter]);

    const fetchUsers = async () => {
        setLoading(true);
        try {
            const res = await api.get('/admin/users', {
                params: { search, role: roleFilter }
            });
            setUsers(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateUser = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/users', newUser);
            alert('User created successfully');
            setShowCreateModal(false);
            setNewUser({ username: '', email: '', password: '', role: 'student' });
            fetchUsers();
        } catch (err) {
            alert(err.response?.data?.error || 'Failed to create user');
        }
    };

    const handleUpdateUser = async (id, action, password = null) => {
        if (action === 'reset_password' && !password) return;

        if (action !== 'reset_password' && !window.confirm(`Are you sure you want to ${action} this user?`)) return;

        try {
            await api.put(`/admin/users/${id}`, { action, password });
            alert('User updated successfully');
            if (action === 'reset_password') {
                setShowResetModal(false);
                setResetPassword('');
                setSelectedUser(null);
            }
            fetchUsers();
        } catch (err) {
            alert('Failed to update user');
        }
    };

    const handleExportCSV = () => {
        const headers = ['ID,Username,Email,Role,Created At'];
        const rows = users.map(u => `${u.id},${u.username},${u.email},${u.role},${new Date(u.createdAt).toLocaleDateString()}`);
        const csvContent = headers.concat(rows).join('\n');
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'users_export.csv';
        a.click();
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>User Management</h1>
                <div style={{ display: 'flex', gap: '1rem' }}>
                    <button className={styles.btn} onClick={handleExportCSV}>Export CSV</button>
                    <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => setShowCreateModal(true)}>+ Create User</button>
                </div>
            </div>

            {/* Filters */}
            <div className={styles.card} style={{ marginBottom: '1rem', padding: '1rem' }}>
                <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                    <input
                        className={styles.input}
                        placeholder="Search by username or email..."
                        value={search}
                        onChange={e => setSearch(e.target.value)}
                    />
                    <select className={styles.input} value={roleFilter} onChange={e => setRoleFilter(e.target.value)}>
                        <option value="">All Roles</option>
                        <option value="student">Student</option>
                        <option value="admin">Admin</option>
                    </select>
                </div>
            </div>

            {/* Stats */}
            <div className={styles.grid} style={{ marginBottom: '1rem', gridTemplateColumns: 'repeat(3, 1fr)' }}>
                <div className={styles.card} style={{ textAlign: 'center', padding: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: 'var(--accent-primary)' }}>{users.length}</h3>
                    <p style={{ margin: 0, color: '#a0aec0' }}>Total Users</p>
                </div>
                <div className={styles.card} style={{ textAlign: 'center', padding: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: 'var(--accent-secondary)' }}>{users.filter(u => u.role === 'student').length}</h3>
                    <p style={{ margin: 0, color: '#a0aec0' }}>Students</p>
                </div>
                <div className={styles.card} style={{ textAlign: 'center', padding: '1rem' }}>
                    <h3 style={{ margin: 0, fontSize: '2rem', color: 'var(--accent-pink)' }}>{users.filter(u => u.role === 'admin').length}</h3>
                    <p style={{ margin: 0, color: '#a0aec0' }}>Admins</p>
                </div>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Username</th>
                            <th>Email</th>
                            <th>Role</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {users.map(user => (
                            <tr key={user.id}>
                                <td>{user.username}</td>
                                <td>{user.email}</td>
                                <td>
                                    <span className={`${styles.badge} ${user.role === 'admin' ? styles.badgeSuccess : styles.badgeWarning}`}>
                                        {user.role}
                                    </span>
                                </td>
                                <td>
                                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                                        {user.role === 'student' ? (
                                            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleUpdateUser(user.id, 'promote')}>Make Admin</button>
                                        ) : (
                                            <button className={`${styles.btn} ${styles.btnDanger}`} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem' }} onClick={() => handleUpdateUser(user.id, 'demote')}>Demote</button>
                                        )}
                                        <button className={styles.btn} style={{ padding: '0.25rem 0.5rem', fontSize: '0.8rem', background: '#4a5568' }} onClick={() => { setSelectedUser(user); setShowResetModal(true); }}>Reset Pwd</button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Create User Modal */}
            {showCreateModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={styles.card} style={{ width: '400px' }}>
                        <h3 className={styles.cardTitle}>Create New User</h3>
                        <form onSubmit={handleCreateUser}>
                            <input className={styles.input} style={{ marginBottom: '1rem' }} placeholder="Username" value={newUser.username} onChange={e => setNewUser({ ...newUser, username: e.target.value })} required />
                            <input className={styles.input} style={{ marginBottom: '1rem' }} type="email" placeholder="Email" value={newUser.email} onChange={e => setNewUser({ ...newUser, email: e.target.value })} required />
                            <input className={styles.input} style={{ marginBottom: '1rem' }} type="password" placeholder="Password" value={newUser.password} onChange={e => setNewUser({ ...newUser, password: e.target.value })} required />
                            <select className={styles.input} style={{ marginBottom: '1rem' }} value={newUser.role} onChange={e => setNewUser({ ...newUser, role: e.target.value })}>
                                <option value="student">Student</option>
                                <option value="admin">Admin</option>
                            </select>
                            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                                <button type="button" className={styles.btn} onClick={() => setShowCreateModal(false)} style={{ background: '#e53e3e' }}>Cancel</button>
                                <button type="submit" className={`${styles.btn} ${styles.btnPrimary}`}>Create</button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && selectedUser && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={styles.card} style={{ width: '400px' }}>
                        <h3 className={styles.cardTitle}>Reset Password for {selectedUser.username}</h3>
                        <input className={styles.input} style={{ marginBottom: '1rem' }} type="password" placeholder="New Password" value={resetPassword} onChange={e => setResetPassword(e.target.value)} required />
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className={styles.btn} onClick={() => { setShowResetModal(false); setResetPassword(''); setSelectedUser(null); }} style={{ background: '#e53e3e' }}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={() => handleUpdateUser(selectedUser.id, 'reset_password', resetPassword)}>Update Password</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Users;
