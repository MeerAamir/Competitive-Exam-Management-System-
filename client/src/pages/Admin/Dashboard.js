import React, { useState, useEffect } from 'react';
import api from '../../utils/api';
import styles from './Admin.module.css';

const Dashboard = () => {
    const [stats, setStats] = useState({
        totalExams: 0,
        totalQuestions: 0,
        totalResults: 0,
        avgScore: 0
    });
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            // Fetch all data to calculate stats client-side
            const [examsRes, questionsRes, resultsRes] = await Promise.all([
                api.get('/admin/exams'),
                api.get('/admin/questions'),
                api.get('/admin/results')
            ]);

            const results = resultsRes.data;
            const avg = results.length > 0
                ? results.reduce((acc, curr) => acc + (curr.score / curr.totalQuestions) * 100, 0) / results.length
                : 0;

            setStats({
                totalExams: examsRes.data.length,
                totalQuestions: questionsRes.data.length,
                totalResults: results.length,
                avgScore: Math.round(avg)
            });
        } catch (err) {
            console.error("Failed to fetch stats", err);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Loading stats...</div>;

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Dashboard Overview</h1>
            </div>

            <div className={styles.grid}>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Total Exams</div>
                    <div className={styles.statValue}>{stats.totalExams}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Questions in Bank</div>
                    <div className={styles.statValue}>{stats.totalQuestions}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Total Attempts</div>
                    <div className={styles.statValue}>{stats.totalResults}</div>
                </div>
                <div className={styles.card}>
                    <div className={styles.cardTitle}>Average Score</div>
                    <div className={styles.statValue}>{stats.avgScore}%</div>
                </div>
            </div>

            {/* Placeholder for recent activity or charts */}
            <div className={styles.card}>
                <div className={styles.cardTitle}>System Status</div>
                <p>System is running smoothly. Database connected.</p>
            </div>
        </div>
    );
};

export default Dashboard;
