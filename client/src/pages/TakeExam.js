import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useParams, useNavigate } from 'react-router-dom';
import styles from './Student/Student.module.css';

const TakeExam = () => {
    const { examId } = useParams();
    const navigate = useNavigate();
    const [exam, setExam] = useState(null);
    const [questions, setQuestions] = useState([]);
    const [currentQ, setCurrentQ] = useState(0);
    const [answers, setAnswers] = useState({}); // { questionId: optionIndex (1-based) }
    const [timeLeft, setTimeLeft] = useState(0);
    const [flagged, setFlagged] = useState({});
    const [showSubmitModal, setShowSubmitModal] = useState(false);
    const [filterFlagged, setFilterFlagged] = useState(false);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };
    const timerRef = useRef(null);

    // Load Exam & Restore State
    useEffect(() => {
        const fetchExam = async () => {
            try {
                const res = await axios.get(`http://localhost:5000/user/exam/${examId}/questions`, config);
                setExam(res.data.exam);
                setQuestions(res.data.questions);

                // Restore from localStorage
                const savedAnswers = JSON.parse(localStorage.getItem(`exam_${examId}_answers`));
                if (savedAnswers) setAnswers(savedAnswers);

                const savedTime = localStorage.getItem(`exam_${examId}_time`);
                if (savedTime) {
                    setTimeLeft(parseInt(savedTime));
                } else {
                    setTimeLeft(res.data.exam.duration * 60);
                }
            } catch (err) {
                console.error(err);
            }
        };
        fetchExam();
    }, [examId]);

    // Timer & Auto-save
    useEffect(() => {
        if (timeLeft > 0) {
            timerRef.current = setInterval(() => {
                setTimeLeft(t => {
                    const newTime = t - 1;
                    localStorage.setItem(`exam_${examId}_time`, newTime);
                    return newTime;
                });
            }, 1000);
        } else if (timeLeft === 0 && exam) {
            handleSubmit();
        }
        return () => clearInterval(timerRef.current);
    }, [timeLeft, exam, examId]);

    // Navigation Protection
    useEffect(() => {
        const handleBeforeUnload = (e) => {
            e.preventDefault();
            e.returnValue = '';
        };
        window.addEventListener('beforeunload', handleBeforeUnload);

        // Push state to prevent back button
        window.history.pushState(null, null, window.location.href);
        const handlePopState = () => {
            window.history.pushState(null, null, window.location.href);
            alert("You cannot go back during the exam.");
        };
        window.addEventListener('popstate', handlePopState);

        return () => {
            window.removeEventListener('beforeunload', handleBeforeUnload);
            window.removeEventListener('popstate', handlePopState);
        };
    }, []);

    const handleAnswer = (optionIndex) => {
        const newAnswers = { ...answers, [questions[currentQ].id]: optionIndex };
        setAnswers(newAnswers);
        localStorage.setItem(`exam_${examId}_answers`, JSON.stringify(newAnswers));
    };

    const toggleFlag = () => {
        setFlagged({ ...flagged, [questions[currentQ].id]: !flagged[questions[currentQ].id] });
    };

    const handleSubmit = async () => {
        clearInterval(timerRef.current);
        try {
            const res = await axios.post('http://localhost:5000/user/exam/submit', {
                examId,
                answers,
                questionOrder: questions.map(q => q.id),
                timeTaken: (exam.duration * 60) - timeLeft
            }, config);

            // Clear storage
            localStorage.removeItem(`exam_${examId}_answers`);
            localStorage.removeItem(`exam_${examId}_time`);

            navigate('/results', { state: { result: res.data } });
        } catch (err) {
            console.error(err);
            alert('Submission failed. Please try again.');
        }
    };

    const formatTime = (s) => {
        const m = Math.floor(s / 60);
        const sec = s % 60;
        return `${m}:${sec < 10 ? '0' : ''}${sec}`;
    };

    if (!exam || questions.length === 0) return <div className={styles.container} style={{ color: '#a0aec0', padding: '2rem' }}>Loading Exam...</div>;

    const q = questions[currentQ];

    return (
        <div className={styles.container}>
            {/* Sticky Header */}
            <div className={styles.header} style={{
                position: 'sticky', top: 0, zIndex: 100, background: 'rgba(11, 16, 32, 0.95)',
                backdropFilter: 'blur(10px)', borderBottom: '1px solid #2d3748',
                display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem'
            }}>
                <div>
                    <h3 className={styles.title} style={{ margin: 0, fontSize: '1.2rem' }}>{exam.title}</h3>
                    <span style={{ fontSize: '0.9rem', color: '#a0aec0' }}>{questions.length} Questions</span>
                </div>
                <div style={{
                    fontSize: '1.5rem', fontWeight: 'bold',
                    color: timeLeft < 60 ? '#f56565' : '#00f0ff',
                    background: 'rgba(0,0,0,0.3)', padding: '0.5rem 1rem', borderRadius: '8px'
                }}>
                    {formatTime(timeLeft)}
                </div>
            </div>

            <div className={styles.card} style={{ marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '1rem', borderBottom: '1px solid #2d3748', paddingBottom: '0.5rem' }}>
                    <span style={{ color: '#a0aec0' }}>Question {currentQ + 1}</span>
                    <button
                        onClick={toggleFlag}
                        style={{
                            background: 'none',
                            border: 'none',
                            color: flagged[q.id] ? '#ed8936' : '#a0aec0',
                            cursor: 'pointer',
                            display: 'flex', alignItems: 'center', gap: '0.5rem'
                        }}
                    >
                        {flagged[q.id] ? '🚩 Flagged' : '🏳️ Flag'}
                    </button>
                </div>

                <h5 style={{ fontSize: '1.2rem', marginBottom: '1.5rem', color: '#fff', lineHeight: '1.6' }}>{q.text}</h5>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem' }}>
                    {(typeof q.options === 'string' ? JSON.parse(q.options) : q.options).map((opt, i) => (
                        <button
                            key={i}
                            onClick={() => handleAnswer(i + 1)}
                            style={{
                                padding: '1rem',
                                textAlign: 'left',
                                borderRadius: '8px',
                                border: `1px solid ${answers[q.id] === i + 1 ? '#6a3dfd' : '#2d3748'}`,
                                backgroundColor: answers[q.id] === i + 1 ? 'rgba(106, 61, 253, 0.1)' : '#1a202c',
                                color: answers[q.id] === i + 1 ? '#fff' : '#a0aec0',
                                cursor: 'pointer',
                                transition: 'all 0.2s',
                                display: 'flex', alignItems: 'center'
                            }}
                        >
                            <span style={{
                                fontWeight: 'bold', marginRight: '1rem',
                                width: '24px', height: '24px', borderRadius: '50%',
                                border: `1px solid ${answers[q.id] === i + 1 ? '#6a3dfd' : '#4a5568'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                background: answers[q.id] === i + 1 ? '#6a3dfd' : 'transparent',
                                color: answers[q.id] === i + 1 ? '#fff' : '#a0aec0',
                                fontSize: '0.8rem'
                            }}>
                                {['A', 'B', 'C', 'D'][i]}
                            </span>
                            {opt}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
                    <button
                        className={styles.btn}
                        style={{ width: 'auto', background: '#2d3748' }}
                        disabled={currentQ === 0}
                        onClick={() => setCurrentQ(c => c - 1)}
                    >
                        Previous
                    </button>
                    {currentQ < questions.length - 1 ? (
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            style={{ width: 'auto' }}
                            onClick={() => setCurrentQ(c => c + 1)}
                        >
                            Next
                        </button>
                    ) : (
                        <button
                            className={`${styles.btn}`}
                            style={{ width: 'auto', backgroundColor: '#48bb78', color: 'white' }}
                            onClick={() => setShowSubmitModal(true)}
                        >
                            Submit Exam
                        </button>
                    )}
                </div>
            </div>

            {/* Question Palette */}
            <div style={{ marginTop: '2rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <h5 style={{ color: '#a0aec0', margin: 0 }}>Question Palette</h5>
                    <label style={{ color: '#a0aec0', fontSize: '0.9rem', cursor: 'pointer' }}>
                        <input type="checkbox" checked={filterFlagged} onChange={e => setFilterFlagged(e.target.checked)} style={{ marginRight: '0.5rem' }} />
                        Show Flagged Only
                    </label>
                </div>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {questions.map((qItem, i) => {
                        if (filterFlagged && !flagged[qItem.id]) return null;
                        return (
                            <button
                                key={i}
                                onClick={() => setCurrentQ(i)}
                                style={{
                                    width: '40px',
                                    height: '40px',
                                    borderRadius: '8px',
                                    border: 'none',
                                    backgroundColor: currentQ === i ? '#6a3dfd' : (answers[qItem.id] !== undefined ? '#48bb78' : (flagged[qItem.id] ? '#ed8936' : '#2d3748')),
                                    color: 'white',
                                    cursor: 'pointer',
                                    fontWeight: 'bold'
                                }}
                            >
                                {i + 1}
                            </button>
                        );
                    })}
                </div>
                <div style={{ marginTop: '1rem', display: 'flex', gap: '1rem', fontSize: '0.8rem', color: '#a0aec0' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '10px', height: '10px', background: '#48bb78', borderRadius: '50%' }}></span> Answered</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '10px', height: '10px', background: '#ed8936', borderRadius: '50%' }}></span> Flagged</span>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}><span style={{ width: '10px', height: '10px', background: '#2d3748', borderRadius: '50%' }}></span> Not Visited</span>
                </div>
            </div>

            {/* Submit Confirmation Modal */}
            {showSubmitModal && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={styles.card} style={{ width: '400px', textAlign: 'center' }}>
                        <h3 className={styles.cardTitle}>Submit Exam?</h3>
                        <p style={{ color: '#a0aec0', marginBottom: '1.5rem' }}>
                            You have answered {Object.keys(answers).length} out of {questions.length} questions.
                            <br />
                            Are you sure you want to finish?
                        </p>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
                            <button className={styles.btn} onClick={() => setShowSubmitModal(false)} style={{ background: '#e53e3e' }}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleSubmit}>Yes, Submit</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default TakeExam;
