import React from 'react';
import { useLocation, Link } from 'react-router-dom';
import styles from './Student/Student.module.css';

const Results = () => {
    const location = useLocation();
    const resultData = location.state?.result;

    if (!resultData) {
        return (
            <div className={styles.container} style={{ textAlign: 'center', marginTop: '4rem' }}>
                <h3 className={styles.title}>No result to display.</h3>
                <Link to="/dashboard" className={`${styles.btn} ${styles.btnPrimary}`} style={{ maxWidth: '200px' }}>Go to Dashboard</Link>
            </div>
        );
    }

    const { score, total, details } = resultData;
    const percentage = ((score / total) * 100).toFixed(2);

    return (
        <div className={styles.container}>
            <div className={styles.card} style={{ textAlign: 'center', marginBottom: '2rem' }}>
                <h2 className={styles.cardTitle}>Exam Result</h2>
                <h1 style={{ fontSize: '4rem', color: '#6a3dfd', margin: '1rem 0' }}>{score} / {total}</h1>
                <h4 style={{ color: '#a0aec0', marginBottom: '2rem' }}>{percentage}%</h4>
                <Link to="/dashboard" className={`${styles.btn} ${styles.btnPrimary}`} style={{ maxWidth: '200px', margin: '0 auto' }}>Back to Dashboard</Link>
            </div>

            <h3 className={styles.title}>Detailed Feedback</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {details.map((d, i) => (
                    <div key={i} className={styles.card} style={{ borderLeft: `4px solid ${d.isCorrect ? '#48bb78' : '#f56565'}` }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
                            <h5 className={styles.cardTitle} style={{ fontSize: '1.1rem' }}>Q{i + 1}: {d.text}</h5>
                            <span style={{ color: d.isCorrect ? '#48bb78' : '#f56565', fontWeight: 'bold' }}>
                                {d.isCorrect ? 'Correct' : 'Incorrect'}
                            </span>
                        </div>
                        <p style={{ color: '#a0aec0', marginBottom: '0.5rem' }}>
                            Your Answer: <strong style={{ color: '#fff' }}>{d.selected !== undefined ? ['A', 'B', 'C', 'D'][d.selected - 1] : '(Skipped)'}</strong>
                        </p>
                        {!d.isCorrect && (
                            <div style={{ marginTop: '0.5rem' }}>
                                <strong style={{ color: '#48bb78' }}>Correct Answer: Option {['A', 'B', 'C', 'D'][d.correct - 1]}</strong>
                            </div>
                        )}
                    </div>
                ))}
            </div>
        </div>
    );
};

export default Results;
