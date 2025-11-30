import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../../utils/api';
import styles from './Student.module.css';

const Dashboard = () => {
    const [exams, setExams] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchExams();
    }, []);

    const fetchExams = async () => {
        try {
            const res = await api.get('/user/exams');
            setExams(res.data);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Available Exams</h1>
                <p className={styles.subtitle}>Select an exam to start your assessment.</p>
            </div>

            {loading ? (
                <div style={{ color: '#a0aec0', padding: '2rem' }}>Loading exams...</div>
            ) : (
                <div className={styles.grid}>
                    {exams.map(exam => (
                        <div key={exam.id} className={styles.card} style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between' }}>
                            <div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '1rem' }}>
                                    <h3 className={styles.cardTitle} style={{ marginBottom: 0 }}>{exam.title}</h3>
                                    <span className={`${styles.badge} ${styles.badgeSuccess}`}>Active</span>
                                </div>
                                <div className={styles.cardMeta}>
                                    <p>⏱️ Duration: {exam.duration} mins</p>
                                    <p>📝 Questions: {exam.questionCount}</p>
                                </div>
                            </div>
                            <Link to={`/exam/${exam.id}`} className={`${styles.btn} ${styles.btnPrimary}`} style={{ textAlign: 'center', marginTop: '1rem' }}>
                                Start Exam
                            </Link>
                        </div>
                    ))}
                </div>
            )}

            {!loading && exams.length === 0 && (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#a0aec0', background: 'var(--panel-dark)', borderRadius: '12px' }}>
                    <h3>No exams available at the moment.</h3>
                    <p>Please check back later.</p>
                </div>
            )}
        </div>
    );
};

export default Dashboard;
