import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Student.module.css';

const History = () => {
    const [results, setResults] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchResults();
    }, []);

    const fetchResults = async () => {
        try {
            const res = await api.get('/user/my-results');
            setResults(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const getScoreClass = (score, total) => {
        const percentage = (score / total) * 100;
        if (percentage >= 80) return styles.scoreHigh;
        if (percentage >= 50) return styles.scoreMed;
        return styles.scoreLow;
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>My Results</h1>
                <p className={styles.subtitle}>History of your past exam attempts.</p>
            </div>

            <div className={styles.tableContainer}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th>Exam Title</th>
                            <th>Date Taken</th>
                            <th>Score</th>
                            <th>Percentage</th>
                        </tr>
                    </thead>
                    <tbody>
                        {results.map(r => (
                            <tr key={r.id}>
                                <td>{r.Exam?.title}</td>
                                <td>{new Date(r.createdAt).toLocaleDateString()} {new Date(r.createdAt).toLocaleTimeString()}</td>
                                <td className={getScoreClass(r.score, r.totalQuestions)}>
                                    {r.score} / {r.totalQuestions}
                                </td>
                                <td>
                                    {((r.score / r.totalQuestions) * 100).toFixed(1)}%
                                </td>
                            </tr>
                        ))}
                        {results.length === 0 && !loading && (
                            <tr>
                                <td colSpan="4" style={{ textAlign: 'center' }}>No past attempts found.</td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

export default History;
