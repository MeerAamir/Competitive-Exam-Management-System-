import React from 'react';
import styles from './Admin.module.css';

const Settings = () => {
    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>System Settings</h1>
            </div>

            <div className={styles.card}>
                <h3 className={styles.cardTitle}>Application Configuration</h3>
                <p style={{ color: '#a0aec0', marginBottom: '1rem' }}>
                    Manage global application settings and environment variables.
                </p>

                <div className={styles.grid}>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>API Base URL</label>
                        <input className={styles.input} value="http://localhost:5000" disabled />
                    </div>
                    <div>
                        <label style={{ display: 'block', marginBottom: '0.5rem', color: '#a0aec0' }}>Environment</label>
                        <input className={styles.input} value="Development" disabled />
                    </div>
                </div>

                <div style={{ marginTop: '2rem' }}>
                    <h4 className={styles.cardTitle} style={{ fontSize: '1.1rem' }}>Database Seeding</h4>
                    <p style={{ fontSize: '0.9rem', color: '#a0aec0', marginBottom: '1rem' }}>
                        To reset the database and seed initial data, run the following command in the server directory:
                    </p>
                    <div style={{ background: '#000', padding: '1rem', borderRadius: '6px', fontFamily: 'monospace', color: '#00f0ff' }}>
                        node seed.js
                    </div>
                </div>
            </div>
        </div>
    );
};

export default Settings;
