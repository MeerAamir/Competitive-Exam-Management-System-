import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Admin.module.css';

const Results = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await api.get('/admin/results');
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Exam Results</h1>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>User</th>
                            <th>Exam</th>
                            <th>Score</th>
                            <th>Date</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(r => (
                            <tr key={r.id}>
                                <td>{r.User?.username}</td>
                                <td>{r.Exam?.title}</td>
                                <td>{r.score} / {r.totalQuestions}</td>
                                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                        {results.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center' }}>No results found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default Results;
