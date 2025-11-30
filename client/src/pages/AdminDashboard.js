import React, { useState, useEffect } from 'react';
import axios from 'axios';

const AdminDashboard = () => {
    const [activeTab, setActiveTab] = useState('exams');
    const [exams, setExams] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [questions, setQuestions] = useState([]);
    const [results, setResults] = useState([]);
    const [newExam, setNewExam] = useState({ title: '', duration: 30, questionCount: 10 });
    const [newSubject, setNewSubject] = useState('');
    const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOption: 0, difficulty: 'medium', SubjectId: '' });

    const token = localStorage.getItem('token');
    const config = { headers: { Authorization: `Bearer ${token}` } };

    useEffect(() => {
        fetchData();
    }, [activeTab]);

    const fetchData = async () => {
        try {
            if (activeTab === 'exams') {
                const res = await axios.get('http://localhost:5000/admin/exams', config);
                setExams(res.data);
            } else if (activeTab === 'subjects') {
                const res = await axios.get('http://localhost:5000/admin/subjects', config);
                setSubjects(res.data);
            } else if (activeTab === 'questions') {
                const res = await axios.get('http://localhost:5000/admin/questions', config);
                const subRes = await axios.get('http://localhost:5000/admin/subjects', config);
                setQuestions(res.data);
                setSubjects(subRes.data);
            } else if (activeTab === 'results') {
                const res = await axios.get('http://localhost:5000/admin/results', config);
                setResults(res.data);
            }
        } catch (err) {
            console.error(err);
        }
    };

    const handleCreateExam = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost:5000/admin/exams', newExam, config);
        fetchData();
        setNewExam({ title: '', duration: 30, questionCount: 10 });
    };

    const handleCreateSubject = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost:5000/admin/subjects', { name: newSubject }, config);
        fetchData();
        setNewSubject('');
    };

    const [questionMode, setQuestionMode] = useState('manual'); // manual, pdf, bulk
    const [file, setFile] = useState(null);
    const [bulkText, setBulkText] = useState('');
    const [importSubjectId, setImportSubjectId] = useState('');

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        await axios.post('http://localhost:5000/admin/questions', newQuestion, config);
        fetchData();
        setNewQuestion({ text: '', options: ['', '', '', ''], correctOption: 0, difficulty: 'medium', SubjectId: '' });
    };

    const handleFileUpload = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        formData.append('file', file);
        formData.append('subjectId', importSubjectId);

        try {
            await axios.post('http://localhost:5000/admin/upload-questions', formData, {
                headers: { ...config.headers, 'Content-Type': 'multipart/form-data' }
            });
            alert('Questions imported successfully!');
            fetchData();
            setFile(null);
        } catch (err) {
            alert(err.response?.data?.error || 'Upload failed');
        }
    };

    const handleBulkPaste = async (e) => {
        e.preventDefault();
        try {
            await axios.post('http://localhost:5000/admin/bulk-questions', { text: bulkText, subjectId: importSubjectId }, config);
            alert('Questions imported successfully!');
            fetchData();
            setBulkText('');
        } catch (err) {
            alert(err.response?.data?.error || 'Import failed');
        }
    };

    const [filterDifficulty, setFilterDifficulty] = useState('All');

    const filteredQuestions = questions.filter(q =>
        filterDifficulty === 'All' ? true : q.difficulty === filterDifficulty
    );

    const handleDownload = () => {
        const headers = "Question,Option 1,Option 2,Option 3,Option 4,Correct Answer,Difficulty,Subject\n";
        const csvContent = filteredQuestions.map(q => {
            const options = JSON.parse(q.options);
            // Escape quotes in text
            const safeText = `"${q.text.replace(/"/g, '""')}"`;
            const safeOpts = options.map(o => `"${o.replace(/"/g, '""')}"`).join(",");
            const subject = q.Subject ? q.Subject.name : '';
            return `${safeText},${safeOpts},${q.correctOption},${q.difficulty},${subject}`;
        }).join("\n");

        const blob = new Blob([headers + csvContent], { type: 'text/csv;charset=utf-8;' });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "questions.csv";
        link.click();
    };

    const handlePrint = () => {
        window.print();
    };

    return (
        <div>
            <style>
                {`
                    @media print {
                        .no-print { display: none !important; }
                        .print-only { display: block !important; }
                        .card, .nav, .btn { display: none !important; }
                        .list-group-item { border: 1px solid #ddd; margin-bottom: 5px; page-break-inside: avoid; }
                    }
                `}
            </style>
            <h2 className="no-print">Admin Dashboard</h2>
            <ul className="nav nav-tabs mb-4 no-print">
                <li className="nav-item"><button className={`nav-link ${activeTab === 'exams' ? 'active' : ''}`} onClick={() => setActiveTab('exams')}>Exams</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'subjects' ? 'active' : ''}`} onClick={() => setActiveTab('subjects')}>Subjects</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'questions' ? 'active' : ''}`} onClick={() => setActiveTab('questions')}>Questions</button></li>
                <li className="nav-item"><button className={`nav-link ${activeTab === 'results' ? 'active' : ''}`} onClick={() => setActiveTab('results')}>Results</button></li>
            </ul>

            {activeTab === 'exams' && (
                <div className="no-print">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h5>Create Exam</h5>
                            <form onSubmit={handleCreateExam} className="row g-3">
                                <div className="col-md-4"><input className="form-control" placeholder="Title" value={newExam.title} onChange={e => setNewExam({ ...newExam, title: e.target.value })} required /></div>
                                <div className="col-md-3"><input type="number" className="form-control" placeholder="Duration (mins)" value={newExam.duration} onChange={e => setNewExam({ ...newExam, duration: e.target.value })} required /></div>
                                <div className="col-md-3"><input type="number" className="form-control" placeholder="Q Count" value={newExam.questionCount} onChange={e => setNewExam({ ...newExam, questionCount: e.target.value })} required /></div>
                                <div className="col-md-2"><button className="btn btn-success w-100">Add</button></div>
                            </form>
                        </div>
                    </div>
                    <ul className="list-group">
                        {exams.map(e => (
                            <li key={e.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {e.title} ({e.duration} mins, {e.questionCount} Qs)
                                <button className="btn btn-danger btn-sm" onClick={async () => { await axios.delete(`http://localhost:5000/admin/exams/${e.id}`, config); fetchData(); }}>Delete</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'subjects' && (
                <div className="no-print">
                    <div className="card mb-4">
                        <div className="card-body">
                            <h5>Add Subject</h5>
                            <form onSubmit={handleCreateSubject} className="row g-3">
                                <div className="col-md-8"><input className="form-control" placeholder="Name" value={newSubject} onChange={e => setNewSubject(e.target.value)} required /></div>
                                <div className="col-md-4"><button className="btn btn-success w-100">Add</button></div>
                            </form>
                        </div>
                    </div>
                    <ul className="list-group">
                        {subjects.map(s => (
                            <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center">
                                {s.name}
                                <button className="btn btn-danger btn-sm" onClick={async () => { await axios.delete(`http://localhost:5000/admin/subjects/${s.id}`, config); fetchData(); }}>Delete</button>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'questions' && (
                <div>
                    <div className="card mb-4 no-print">
                        <div className="card-header">
                            <ul className="nav nav-tabs card-header-tabs">
                                <li className="nav-item">
                                    <button className={`nav-link ${questionMode === 'manual' ? 'active' : ''}`} onClick={() => setQuestionMode('manual')}>Manual Entry</button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${questionMode === 'pdf' ? 'active' : ''}`} onClick={() => setQuestionMode('pdf')}>Upload PDF</button>
                                </li>
                                <li className="nav-item">
                                    <button className={`nav-link ${questionMode === 'bulk' ? 'active' : ''}`} onClick={() => setQuestionMode('bulk')}>Bulk Paste</button>
                                </li>
                            </ul>
                        </div>
                        <div className="card-body">
                            {questionMode === 'manual' && (
                                <form onSubmit={handleCreateQuestion}>
                                    <div className="row mb-2">
                                        <div className="col-md-6">
                                            <select className="form-control" value={newQuestion.SubjectId} onChange={e => setNewQuestion({ ...newQuestion, SubjectId: e.target.value })} required>
                                                <option value="">Select Subject</option>
                                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                            </select>
                                        </div>
                                        <div className="col-md-6">
                                            <select className="form-control" value={newQuestion.difficulty} onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}>
                                                <option value="easy">Easy</option>
                                                <option value="medium">Medium</option>
                                                <option value="hard">Hard</option>
                                            </select>
                                        </div>
                                    </div>
                                    <div className="mb-2"><input className="form-control" placeholder="Question Text" value={newQuestion.text} onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })} required /></div>
                                    {newQuestion.options.map((opt, i) => (
                                        <div key={i} className="mb-2"><input className="form-control" placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                                            const newOpts = [...newQuestion.options]; newOpts[i] = e.target.value; setNewQuestion({ ...newQuestion, options: newOpts });
                                        }} required /></div>
                                    ))}
                                    <div className="mb-2">
                                        <label>Correct Option (0-3)</label>
                                        <input type="number" min="0" max="3" className="form-control" value={newQuestion.correctOption} onChange={e => setNewQuestion({ ...newQuestion, correctOption: parseInt(e.target.value) })} required />
                                    </div>
                                    <button className="btn btn-success w-100">Add Question</button>
                                </form>
                            )}

                            {questionMode === 'pdf' && (
                                <form onSubmit={handleFileUpload}>
                                    <h5>Upload Questions via PDF</h5>
                                    <p className="text-muted small">Format: Q. Question... A) Opt1... Answer: A</p>
                                    <div className="mb-3">
                                        <select className="form-control" value={importSubjectId} onChange={e => setImportSubjectId(e.target.value)} required>
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <input type="file" className="form-control" accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
                                    </div>
                                    <button className="btn btn-primary w-100">Upload & Import</button>
                                </form>
                            )}

                            {questionMode === 'bulk' && (
                                <form onSubmit={handleBulkPaste}>
                                    <h5>Bulk Paste Questions</h5>
                                    <p className="text-muted small">Format: Q. Question... A) Opt1... Answer: A</p>
                                    <div className="mb-3">
                                        <select className="form-control" value={importSubjectId} onChange={e => setImportSubjectId(e.target.value)} required>
                                            <option value="">Select Subject</option>
                                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                        </select>
                                    </div>
                                    <div className="mb-3">
                                        <textarea className="form-control" rows="10" placeholder="Paste questions here..." value={bulkText} onChange={e => setBulkText(e.target.value)} required></textarea>
                                    </div>
                                    <button className="btn btn-primary w-100">Import Questions</button>
                                </form>
                            )}
                        </div>
                    </div>

                    <div className="d-flex justify-content-between align-items-center mb-3 no-print">
                        <div className="d-flex align-items-center">
                            <label className="me-2">Filter Difficulty:</label>
                            <select className="form-select w-auto" value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                                <option value="All">All</option>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <div>
                            <button className="btn btn-outline-primary me-2" onClick={handleDownload}>Download CSV</button>
                            <button className="btn btn-outline-secondary" onClick={handlePrint}>Print List</button>
                        </div>
                    </div>

                    <ul className="list-group">
                        {filteredQuestions.map(q => (
                            <li key={q.id} className="list-group-item">
                                <strong>{q.text}</strong>
                                <br />
                                <small>Subject: {q.Subject?.name} | Diff: <span className={`badge bg-${q.difficulty === 'easy' ? 'success' : q.difficulty === 'medium' ? 'warning' : 'danger'}`}>{q.difficulty}</span></small>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            {activeTab === 'results' && (
                <table className="table no-print">
                    <thead><tr><th>User</th><th>Exam</th><th>Score</th><th>Date</th></tr></thead>
                    <tbody>
                        {results.map(r => (
                            <tr key={r.id}>
                                <td>{r.User?.username}</td>
                                <td>{r.Exam?.title}</td>
                                <td>{r.score}/{r.totalQuestions}</td>
                                <td>{new Date(r.createdAt).toLocaleDateString()}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            )}
        </div>
    );
};

export default AdminDashboard;
