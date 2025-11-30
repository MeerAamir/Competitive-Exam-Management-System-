import React from 'react';
import styles from './Student.module.css';

const Profile = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Profile</h1>
            </div>

            <div className={styles.card}>
                <h3 className={styles.cardTitle}>Account Settings</h3>
                <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
                    Manage your account details and preferences.
                </p>

                <form>
                    <div className={styles.grid}>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>Username</label>
                            <input className={styles.input} value={localStorage.getItem('username') || ''} disabled />
                        </div>
                        <div>
                            <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>Role</label>
                            <input className={styles.input} value={localStorage.getItem('role') || ''} disabled />
                        </div>
                    </div>

                    <div style={{ marginTop: '1.5rem' }}>
                        <h4 className={styles.cardTitle} style={{ fontSize: '1.1rem' }}>Change Password</h4>
                        <p style={{ fontSize: '0.9rem', color: '#a0aec0', marginBottom: '1rem' }}>
                            Password change functionality is currently disabled by the administrator.
                        </p>
                        <div className={styles.grid}>
                            <input type="password" className={styles.input} placeholder="Current Password" disabled />
                            <input type="password" className={styles.input} placeholder="New Password" disabled />
                        </div>
                        <button className={`${styles.btn} ${styles.btnPrimary}`} disabled style={{ opacity: 0.5, cursor: 'not-allowed' }}>
                            Update Password
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
};

export default Profile;
