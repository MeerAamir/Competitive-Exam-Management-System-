import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Admin.module.css';

const Subjects = () => {
    const [subjects, setSubjects] = useState([]);
    const [newSubject, setNewSubject] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchSubjects();
    }, []);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/admin/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        try {
            await api.post('/admin/subjects', { name: newSubject });
            fetchSubjects();
            setNewSubject('');
        } catch (err) {
            alert('Failed to create subject');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Are you sure? This will delete all questions in this subject.')) {
            try {
                await api.delete(`/admin/subjects/${id}`);
                fetchSubjects();
            } catch (err) {
                alert('Failed to delete subject');
            }
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Manage Subjects</h1>
            </div>

            <div className={styles.card}>
                <div className={styles.cardTitle}>Add New Subject</div>
                <form onSubmit={handleCreateSubject} style={{ display: 'flex', gap: '1rem' }}>
                    <input
                        className={styles.input}
                        placeholder="Subject Name"
                        value={newSubject}
                        onChange={e => setNewSubject(e.target.value)}
                        required
                        style={{ flex: 1 }}
                    />
                    <button className={`${styles.btn} ${styles.btnPrimary}`}>Add Subject</button>
                </form>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>ID</th>
                            <th>Name</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {subjects.map(subject => (
                            <tr key={subject.id}>
                                <td>{subject.id}</td>
                                <td>{subject.name}</td>
                                <td>
                                    <button
                                        className={`${styles.btn} ${styles.btnDanger}`}
                                        onClick={() => handleDelete(subject.id)}
                                    >
                                        Delete
                                    </button>
                                </td>
                            </tr>
                        ))}
                        {subjects.length === 0 && !loading && (
                            <tr>
                                <td colSpan="3" style={{ textAlign: 'center' }}>No subjects found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Subjects;
