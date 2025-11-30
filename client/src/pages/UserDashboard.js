import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Link } from 'react-router-dom';

const UserDashboard = () => {
    const [exams, setExams] = useState([]);
    const [myResults, setMyResults] = useState([]);

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const examRes = await axios.get('http://localhost:5000/user/exams', config);
                setExams(examRes.data);
                const resultRes = await axios.get('http://localhost:5000/user/my-results', config);
                setMyResults(resultRes.data);
            } catch (err) {
                console.error(err);
            }
        };
        fetchData();
    }, []);

    return (
        <div>
            <h2>Student Dashboard</h2>
            <div className="row mt-4">
                <div className="col-md-8">
                    <h3>Available Exams</h3>
                    <div className="row">
                        {exams.map(exam => (
                            <div key={exam.id} className="col-md-6 mb-3">
                                <div className="card">
                                    <div className="card-body">
                                        <h5 className="card-title">{exam.title}</h5>
                                        <p className="card-text">Duration: {exam.duration} mins <br /> Questions: {exam.questionCount}</p>
                                        <Link to={`/exam/${exam.id}`} className="btn btn-primary">Take Exam</Link>
                                    </div>
                                </div>
                            </div>
                        ))}
                        {exams.length === 0 && <p>No exams available currently.</p>}
                    </div>
                </div>
                <div className="col-md-4">
                    <h3>Recent Results</h3>
                    <ul className="list-group">
                        {myResults.map(r => (
                            <li key={r.id} className="list-group-item">
                                <strong>{r.Exam?.title}</strong>: {r.score}/{r.totalQuestions}
                                <br />
                                <small>{new Date(r.createdAt).toLocaleDateString()}</small>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </div>
    );
};

export default UserDashboard;
