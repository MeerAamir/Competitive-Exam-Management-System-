import React, { useState, useEffect, useRef } from 'react';
import api from '../../utils/api';
import styles from './Admin.module.css';

const Questions = () => {
    const [questions, setQuestions] = useState([]);
    const [subjects, setSubjects] = useState([]);
    const [loading, setLoading] = useState(true);
    const [mode, setMode] = useState('manual'); // manual, pdf, bulk

    // Filters & Pagination
    const [search, setSearch] = useState('');
    const [filterSubject, setFilterSubject] = useState('');
    const [filterDifficulty, setFilterDifficulty] = useState('');
    const [sort, setSort] = useState('newest');
    const [page, setPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalQuestions, setTotalQuestions] = useState(0);

    // Selection & Marking
    const [selectedQuestions, setSelectedQuestions] = useState([]);
    const [markedQuestions, setMarkedQuestions] = useState([]);

    // Actions Dropdown
    const [showActionsMenu, setShowActionsMenu] = useState(false);
    const actionsRef = useRef(null);

    // Form States
    const [newQuestion, setNewQuestion] = useState({ text: '', options: ['', '', '', ''], correctOption: 1, difficulty: 'medium', SubjectId: '' });
    const [manualCustomSubject, setManualCustomSubject] = useState('');
    const [file, setFile] = useState(null);
    const [bulkText, setBulkText] = useState('');
    const [importSubjectId, setImportSubjectId] = useState('');
    const [importCustomSubject, setImportCustomSubject] = useState('');

    // Preview Modal State
    const [showPreview, setShowPreview] = useState(false);
    const [previewData, setPreviewData] = useState(null); // { count, questions: [{ text, options, correctOption, errors: [], isValid }] }
    const [excludedRows, setExcludedRows] = useState({}); // { index: true }

    // Export Modal State
    const [showExportModal, setShowExportModal] = useState(false);
    const [exportType, setExportType] = useState('current'); // current, selected, marked
    const [exportFilters, setExportFilters] = useState({
        subjectId: '',
        difficulty: '',
        startDate: '',
        endDate: '',
        format: 'json',
        includeAnswers: false
    });
    const [lastExportFormat, setLastExportFormat] = useState('json');

    // Move Modal State
    const [showMoveModal, setShowMoveModal] = useState(false);
    const [moveType, setMoveType] = useState('single'); // single, bulk
    const [moveQuestionId, setMoveQuestionId] = useState(null);
    const [moveSubjectId, setMoveSubjectId] = useState('');
    const [moveCustomSubject, setMoveCustomSubject] = useState('');

    useEffect(() => {
        fetchSubjects();
        // Click outside to close actions menu
        const handleClickOutside = (event) => {
            if (actionsRef.current && !actionsRef.current.contains(event.target)) {
                setShowActionsMenu(false);
            }
        };
        document.addEventListener('mousedown', handleClickOutside);
        return () => document.removeEventListener('mousedown', handleClickOutside);
    }, []);

    useEffect(() => {
        fetchQuestions();
    }, [page, search, filterSubject, filterDifficulty, sort]);

    const fetchSubjects = async () => {
        try {
            const res = await api.get('/admin/subjects');
            setSubjects(res.data);
        } catch (err) {
            console.error(err);
        }
    };

    const fetchQuestions = async () => {
        setLoading(true);
        try {
            const params = {
                page,
                limit: 20,
                search,
                subjectId: filterSubject,
                difficulty: filterDifficulty,
                sort
            };
            const res = await api.get('/admin/questions', { params });
            setQuestions(res.data.questions);
            setTotalPages(res.data.totalPages);
            setTotalQuestions(res.data.total);
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const visibleIds = questions.map(q => q.id);
            setSelectedQuestions(prev => [...new Set([...prev, ...visibleIds])]);
        } else {
            const visibleIds = questions.map(q => q.id);
            setSelectedQuestions(prev => prev.filter(id => !visibleIds.includes(id)));
        }
    };

    const handleSelectOne = (id) => {
        setSelectedQuestions(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const toggleMark = (id) => {
        setMarkedQuestions(prev =>
            prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]
        );
    };

    const handleCreateQuestion = async (e) => {
        e.preventDefault();
        try {
            const payload = { ...newQuestion };
            if (newQuestion.SubjectId === 'other') {
                payload.customSubject = manualCustomSubject;
            }
            await api.post('/admin/questions', payload);
            fetchQuestions();
            fetchSubjects();
            setNewQuestion({ text: '', options: ['', '', '', ''], correctOption: 1, difficulty: 'medium', SubjectId: '' });
            setManualCustomSubject('');
            alert('Question added!');
        } catch (err) {
            alert('Failed to add question');
        }
    };

    const handlePreview = async (e) => {
        e.preventDefault();
        const formData = new FormData();
        if (mode === 'pdf') {
            formData.append('file', file);
        } else {
            formData.append('text', bulkText);
        }

        if (importSubjectId === 'other') {
            formData.append('customSubject', importCustomSubject);
        } else {
            formData.append('subjectId', importSubjectId);
        }

        try {
            const res = await api.post('/admin/import/preview', formData, {
                headers: mode === 'pdf' ? { 'Content-Type': 'multipart/form-data' } : {}
            });
            setPreviewData(res.data);
            setExcludedRows({});
            setShowPreview(true);
        } catch (err) {
            alert(err.response?.data?.error || 'Preview failed');
        }
    };

    const handlePreviewChange = (index, field, value) => {
        const newQuestions = [...previewData.questions];
        const question = { ...newQuestions[index] };

        if (field === 'text') question.text = value;
        if (field === 'correctOption') question.correctOption = parseInt(value);
        if (field.startsWith('option-')) {
            const optIndex = parseInt(field.split('-')[1]);
            const newOptions = [...question.options];
            newOptions[optIndex] = value;
            question.options = newOptions;
        }

        // Re-validate
        const errors = [];
        if (question.options.length < 2) errors.push('Fewer than 2 options');
        if (question.correctOption === undefined || question.correctOption === null || isNaN(question.correctOption)) errors.push('Missing answer');

        question.isValid = errors.length === 0;
        question.errors = errors;
        newQuestions[index] = question;
        setPreviewData({ ...previewData, questions: newQuestions });
    };

    const handleConfirmImport = async () => {
        try {
            const validQuestions = previewData.questions.filter((q, i) => !excludedRows[i] && q.isValid);
            if (validQuestions.length === 0) {
                alert('No valid questions to import');
                return;
            }
            await api.post('/admin/import/confirm', { questions: validQuestions });
            alert(`Successfully imported ${validQuestions.length} questions!`);
            setShowPreview(false);
            setPreviewData(null);
            setFile(null);
            setBulkText('');
            setImportSubjectId('');
            setImportCustomSubject('');
            fetchQuestions();
            fetchSubjects();
        } catch (err) {
            alert('Import failed');
        }
    };

    const handleDelete = async (id) => {
        if (window.confirm('Delete this question?')) {
            try {
                await api.delete(`/admin/questions/${id}`);
                fetchQuestions();
                setSelectedQuestions(prev => prev.filter(pid => pid !== id));
                setMarkedQuestions(prev => prev.filter(pid => pid !== id));
            } catch (err) {
                alert('Failed to delete');
            }
        }
    };

    // Export Logic
    const triggerExport = async () => {
        try {
            const params = { ...exportFilters };

            if (exportType === 'selected') {
                if (selectedQuestions.length === 0) {
                    alert('No questions selected.');
                    return;
                }
                params.ids = selectedQuestions.join(',');
                // Clear other filters to ensure we get exactly these IDs
                delete params.subjectId;
                delete params.difficulty;
                delete params.startDate;
                delete params.endDate;
            } else if (exportType === 'marked') {
                if (markedQuestions.length === 0) {
                    alert('No questions marked.');
                    return;
                }
                params.ids = markedQuestions.join(',');
                delete params.subjectId;
                delete params.difficulty;
                delete params.startDate;
                delete params.endDate;
            }
            // If 'current', we use the filters in exportFilters which are pre-filled

            const res = await api.get('/admin/questions/export', {
                params,
                responseType: 'blob'
            });

            const extension = exportFilters.format === 'json' ? 'json' : exportFilters.format === 'csv' ? 'csv' : exportFilters.format === 'xlsx' ? 'xlsx' : exportFilters.format === 'pdf' ? 'pdf' : 'docx';
            const blob = new Blob([res.data]);
            const url = URL.createObjectURL(blob);
            const link = document.createElement('a');
            link.href = url;
            link.download = `questions_${exportType}_${new Date().toISOString().split('T')[0]}.${extension}`;
            link.click();

            setLastExportFormat(exportFilters.format);
            setShowExportModal(false);
            setShowActionsMenu(false);
        } catch (err) {
            console.error(err);
            alert('Export failed');
        }
    };

    const openExportModal = (type) => {
        setExportType(type);
        if (type === 'current') {
            setExportFilters({
                subjectId: filterSubject,
                difficulty: filterDifficulty,
                startDate: '',
                endDate: '',
                format: lastExportFormat,
                includeAnswers: false
            });
        } else {
            // For selected/marked, we reset filters but keep format
            setExportFilters({
                subjectId: '',
                difficulty: '',
                startDate: '',
                endDate: '',
                format: lastExportFormat,
                includeAnswers: false
            });
        }
        setShowExportModal(true);
        setShowActionsMenu(false);
    };

    // Move Logic
    const openMoveModal = (id = null) => {
        if (id) {
            setMoveType('single');
            setMoveQuestionId(id);
        } else {
            // Bulk move: can be selected or marked? Requirement says "Move Selected".
            // Let's support moving selected for now as per previous implementation.
            if (selectedQuestions.length === 0) {
                alert('No questions selected.');
                return;
            }
            setMoveType('bulk');
        }
        setShowMoveModal(true);
        setShowActionsMenu(false);
    };

    const handleMove = async () => {
        try {
            const payload = { subjectId: moveSubjectId };
            if (moveSubjectId === 'other') {
                payload.customSubject = moveCustomSubject;
            }

            if (moveType === 'single') {
                await api.put(`/admin/questions/${moveQuestionId}`, { SubjectId: moveSubjectId, customSubject: moveCustomSubject });
            } else {
                payload.ids = selectedQuestions;
                await api.put('/admin/questions/bulk-move', payload);
                setSelectedQuestions([]);
            }

            fetchQuestions();
            fetchSubjects();
            setShowMoveModal(false);
            setMoveQuestionId(null);
            setMoveSubjectId('');
            setMoveCustomSubject('');
            alert('Questions moved!');
        } catch (err) {
            alert('Failed to move questions');
        }
    };

    return (
        <div className={styles.container}>
            <div className={styles.header}>
                <h1 className={styles.title}>Question Bank</h1>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    {(selectedQuestions.length > 0 || markedQuestions.length > 0) && (
                        <span style={{ color: '#a0aec0', fontSize: '0.9rem' }}>
                            {selectedQuestions.length} selected, {markedQuestions.length} marked
                        </span>
                    )}
                    <div className={styles.dropdown} ref={actionsRef} style={{ position: 'relative', display: 'inline-block' }}>
                        <button
                            className={`${styles.btn} ${styles.btnPrimary}`}
                            onClick={() => setShowActionsMenu(!showActionsMenu)}
                        >
                            Actions ▼
                        </button>
                        {showActionsMenu && (
                            <div className={styles.dropdownContent} style={{ position: 'absolute', right: 0, top: '100%', background: '#2d3748', border: '1px solid #4a5568', borderRadius: '4px', minWidth: '180px', zIndex: 10, boxShadow: '0 4px 6px rgba(0,0,0,0.3)' }}>
                                <button onClick={() => openExportModal('current')} style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #4a5568' }}>Export Current View</button>
                                <button onClick={() => openExportModal('selected')} style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #4a5568' }}>Export Selected ({selectedQuestions.length})</button>
                                <button onClick={() => openExportModal('marked')} style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: '#fff', cursor: 'pointer', borderBottom: '1px solid #4a5568' }}>Export Marked ({markedQuestions.length})</button>
                                <button onClick={() => openMoveModal()} style={{ display: 'block', width: '100%', padding: '0.75rem 1rem', textAlign: 'left', background: 'none', border: 'none', color: '#fff', cursor: 'pointer' }}>Move Selected</button>
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* Tabs */}
            <div style={{ marginBottom: '1.5rem', borderBottom: '1px solid #2d3748' }}>
                {['manual', 'pdf', 'bulk'].map(m => (
                    <button
                        key={m}
                        onClick={() => setMode(m)}
                        style={{
                            padding: '0.75rem 1.5rem',
                            background: mode === m ? '#2d3748' : 'transparent',
                            color: mode === m ? '#fff' : '#a0aec0',
                            border: 'none',
                            borderTopLeftRadius: '8px',
                            borderTopRightRadius: '8px',
                            cursor: 'pointer',
                            fontWeight: 500
                        }}
                    >
                        {m === 'manual' ? 'Manual Entry' : m === 'pdf' ? 'Upload PDF' : 'Bulk Paste'}
                    </button>
                ))}
            </div>

            <div className={styles.card}>
                {mode === 'manual' && (
                    <form onSubmit={handleCreateQuestion}>
                        <div className={styles.grid}>
                            <select className={styles.input} value={newQuestion.SubjectId} onChange={e => setNewQuestion({ ...newQuestion, SubjectId: e.target.value })} required>
                                <option value="">Select Subject</option>
                                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                <option value="other">Other (Custom Subject)</option>
                            </select>
                            {newQuestion.SubjectId === 'other' && (
                                <input
                                    className={styles.input}
                                    placeholder="Enter custom subject"
                                    value={manualCustomSubject}
                                    onChange={e => setManualCustomSubject(e.target.value)}
                                    required
                                />
                            )}
                            <select className={styles.input} value={newQuestion.difficulty} onChange={e => setNewQuestion({ ...newQuestion, difficulty: e.target.value })}>
                                <option value="easy">Easy</option>
                                <option value="medium">Medium</option>
                                <option value="hard">Hard</option>
                            </select>
                        </div>
                        <input className={styles.input} style={{ marginBottom: '1rem' }} placeholder="Question Text" value={newQuestion.text} onChange={e => setNewQuestion({ ...newQuestion, text: e.target.value })} required />
                        <div className={styles.grid}>
                            {newQuestion.options.map((opt, i) => (
                                <input key={i} className={styles.input} placeholder={`Option ${i + 1}`} value={opt} onChange={e => {
                                    const newOpts = [...newQuestion.options]; newOpts[i] = e.target.value; setNewQuestion({ ...newQuestion, options: newOpts });
                                }} required />
                            ))}
                        </div>
                        <div style={{ marginTop: '1rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                            <label style={{ color: '#a0aec0' }}>Correct Answer:</label>
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                {[0, 1, 2, 3].map(i => (
                                    <label key={i} style={{ cursor: 'pointer', color: '#fff' }}>
                                        <input
                                            type="radio"
                                            name="correctOption"
                                            checked={newQuestion.correctOption === i + 1}
                                            onChange={() => setNewQuestion({ ...newQuestion, correctOption: i + 1 })}
                                            style={{ marginRight: '5px' }}
                                        />
                                        {i + 1}
                                    </label>
                                ))}
                            </div>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} style={{ flex: 1, marginLeft: '2rem' }}>Add Question</button>
                        </div>
                    </form>
                )}

                {(mode === 'pdf' || mode === 'bulk') && (
                    <form onSubmit={handlePreview}>
                        <h4 className={styles.cardTitle}>{mode === 'pdf' ? 'Upload PDF' : 'Bulk Paste'}</h4>
                        <p style={{ color: '#a0aec0', fontSize: '0.9rem', marginBottom: '1rem' }}>
                            Format: <code>Q. Question... A) Opt1... Answer: A</code> OR CSV: <code>Question,Opt1,Opt2,Opt3,Opt4,AnswerChar</code>
                            <br />
                            <a href="#" onClick={(e) => { e.preventDefault(); alert("Examples:\n1. Numbered:\n1. What is 2+2?\nA) 3\nB) 4\nC) 5\nD) 6\nAnswer: B\n\n2. CSV:\nWhat is 2+2?,3,4,5,6,B"); }} style={{ color: '#4299e1', marginLeft: '10px' }}>View Sample Formats</a>
                        </p>

                        <select className={styles.input} style={{ marginBottom: '1rem' }} value={importSubjectId} onChange={e => setImportSubjectId(e.target.value)} required>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            <option value="other">Other (Custom Subject)</option>
                        </select>
                        {importSubjectId === 'other' && (
                            <input
                                className={styles.input}
                                style={{ marginBottom: '1rem' }}
                                placeholder="Enter custom subject"
                                value={importCustomSubject}
                                onChange={e => setImportCustomSubject(e.target.value)}
                                required
                            />
                        )}

                        {mode === 'pdf' ? (
                            <input type="file" className={styles.input} style={{ marginBottom: '1rem' }} accept=".pdf" onChange={e => setFile(e.target.files[0])} required />
                        ) : (
                            <textarea className={styles.input} style={{ minHeight: '200px', marginBottom: '1rem' }} placeholder="Paste questions here..." value={bulkText} onChange={e => setBulkText(e.target.value)} required></textarea>
                        )}

                        <button className={`${styles.btn} ${styles.btnPrimary}`}>Preview Import</button>
                    </form>
                )}
            </div>

            {/* Preview Modal */}
            {showPreview && previewData && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000
                }}>
                    <div className={styles.card} style={{ width: '90%', maxHeight: '90vh', overflowY: 'auto' }}>
                        <h3 className={styles.cardTitle}>Preview Import ({previewData.count} questions)</h3>
                        <div className={styles.tableContainer} style={{ maxHeight: '500px', overflowY: 'auto', margin: '1rem 0' }}>
                            <table className={styles.table}>
                                <thead>
                                    <tr>
                                        <th>Include</th>
                                        <th>Question</th>
                                        <th>Options</th>
                                        <th>Correct</th>
                                        <th>Status</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {previewData.questions.map((q, i) => (
                                        <tr key={i} style={{ opacity: excludedRows[i] ? 0.5 : 1 }}>
                                            <td>
                                                <input
                                                    type="checkbox"
                                                    checked={!excludedRows[i]}
                                                    onChange={() => setExcludedRows(prev => ({ ...prev, [i]: !prev[i] }))}
                                                />
                                            </td>
                                            <td>
                                                <input
                                                    className={styles.input}
                                                    value={q.text}
                                                    onChange={e => handlePreviewChange(i, 'text', e.target.value)}
                                                    style={{ width: '100%' }}
                                                />
                                            </td>
                                            <td>
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '5px' }}>
                                                    {q.options.map((opt, optIdx) => (
                                                        <input
                                                            key={optIdx}
                                                            className={styles.input}
                                                            value={opt}
                                                            onChange={e => handlePreviewChange(i, `option-${optIdx}`, e.target.value)}
                                                            placeholder={`Option ${optIdx + 1}`}
                                                            style={{ padding: '4px' }}
                                                        />
                                                    ))}
                                                </div>
                                            </td>
                                            <td>
                                                <select
                                                    className={styles.input}
                                                    value={q.correctOption}
                                                    onChange={e => handlePreviewChange(i, 'correctOption', e.target.value)}
                                                    style={{ padding: '4px' }}
                                                >
                                                    {q.options.map((_, idx) => (
                                                        <option key={idx} value={idx + 1}>{['A', 'B', 'C', 'D'][idx]}</option>
                                                    ))}
                                                </select>
                                            </td>
                                            <td>
                                                {q.isValid ? (
                                                    <span style={{ color: '#48bb78' }}>Valid</span>
                                                ) : (
                                                    <span style={{ color: '#f56565' }}>{q.errors.join(', ')}</span>
                                                )}
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className={styles.btn} onClick={() => setShowPreview(false)} style={{ background: '#e53e3e' }}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleConfirmImport}>Confirm Import</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Filters */}
            <div className={styles.card} style={{ marginTop: '2rem', padding: '1rem' }}>
                <div className={styles.grid} style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem' }}>
                    <input className={styles.input} placeholder="Search questions..." value={search} onChange={e => setSearch(e.target.value)} />
                    <select className={styles.input} value={filterSubject} onChange={e => setFilterSubject(e.target.value)}>
                        <option value="">All Subjects</option>
                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                    </select>
                    <select className={styles.input} value={filterDifficulty} onChange={e => setFilterDifficulty(e.target.value)}>
                        <option value="">All Difficulties</option>
                        <option value="easy">Easy</option>
                        <option value="medium">Medium</option>
                        <option value="hard">Hard</option>
                    </select>
                    <select className={styles.input} value={sort} onChange={e => setSort(e.target.value)}>
                        <option value="newest">Newest First</option>
                        <option value="oldest">Oldest First</option>
                        <option value="difficulty">Difficulty</option>
                        <option value="subject">Subject</option>
                    </select>
                </div>
            </div>

            <div className={styles.tableContainer} style={{ marginTop: '1rem' }}>
                <table className={styles.table}>
                    <thead>
                        <tr>
                            <th style={{ width: '40px' }}>
                                <input
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={questions.length > 0 && questions.every(q => selectedQuestions.includes(q.id))}
                                />
                            </th>
                            <th>Question</th>
                            <th>Subject</th>
                            <th>Difficulty</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {questions.map(q => (
                            <tr key={q.id}>
                                <td>
                                    <input
                                        type="checkbox"
                                        checked={selectedQuestions.includes(q.id)}
                                        onChange={() => handleSelectOne(q.id)}
                                    />
                                </td>
                                <td>{q.text}</td>
                                <td>{q.Subject?.name}</td>
                                <td>
                                    <span className={`${styles.badge} ${q.difficulty === 'easy' ? styles.badgeSuccess : q.difficulty === 'medium' ? styles.badgeWarning : styles.badgeDanger}`}>
                                        {q.difficulty}
                                    </span>
                                </td>
                                <td>
                                    <button
                                        className={styles.btn}
                                        onClick={() => toggleMark(q.id)}
                                        style={{ marginRight: '0.5rem', background: markedQuestions.includes(q.id) ? '#ed8936' : '#4a5568' }}
                                    >
                                        {markedQuestions.includes(q.id) ? 'Unmark' : 'Mark'}
                                    </button>
                                    <button className={`${styles.btn} ${styles.btnDanger}`} onClick={() => handleDelete(q.id)} style={{ marginRight: '0.5rem' }}>Delete</button>
                                    <button className={styles.btn} onClick={() => openMoveModal(q.id)} style={{ background: '#4299e1' }}>Move</button>
                                </td>
                            </tr>
                        ))}
                        {questions.length === 0 && !loading && (
                            <tr><td colSpan="5" style={{ textAlign: 'center' }}>No questions found.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Pagination */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '1rem' }}>
                <button
                    className={styles.btn}
                    style={{ width: 'auto', background: '#2d3748' }}
                    disabled={page === 1}
                    onClick={() => setPage(p => p - 1)}
                >
                    Previous
                </button>
                <span style={{ display: 'flex', alignItems: 'center', color: '#a0aec0' }}>
                    Page {page} of {totalPages}
                </span>
                <button
                    className={styles.btn}
                    style={{ width: 'auto', background: '#2d3748' }}
                    disabled={page === totalPages}
                    onClick={() => setPage(p => p + 1)}
                >
                    Next
                </button>
            </div>

            {/* Export Modal */}
            {showExportModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className={styles.card} style={{ width: '500px' }}>
                        <h3 className={styles.cardTitle}>Export {exportType === 'selected' ? 'Selected' : exportType === 'marked' ? 'Marked' : 'All'} Questions</h3>

                        {exportType === 'current' && (
                            <div style={{ marginBottom: '1rem', padding: '1rem', background: '#2d3748', borderRadius: '8px' }}>
                                <p style={{ color: '#a0aec0', marginBottom: '0.5rem' }}>Filters Applied:</p>
                                <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: 0 }}>
                                    <select className={styles.input} value={exportFilters.subjectId} onChange={e => setExportFilters({ ...exportFilters, subjectId: e.target.value })}>
                                        <option value="">All Subjects</option>
                                        {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                                    </select>
                                    <select className={styles.input} value={exportFilters.difficulty} onChange={e => setExportFilters({ ...exportFilters, difficulty: e.target.value })}>
                                        <option value="">All Difficulties</option>
                                        <option value="easy">Easy</option>
                                        <option value="medium">Medium</option>
                                        <option value="hard">Hard</option>
                                    </select>
                                </div>
                                <div className={styles.grid} style={{ gridTemplateColumns: '1fr 1fr', gap: '1rem', marginTop: '1rem', marginBottom: 0 }}>
                                    <div>
                                        <label style={{ color: '#a0aec0', fontSize: '0.8rem' }}>Start Date</label>
                                        <input type="date" className={styles.input} value={exportFilters.startDate} onChange={e => setExportFilters({ ...exportFilters, startDate: e.target.value })} />
                                    </div>
                                    <div>
                                        <label style={{ color: '#a0aec0', fontSize: '0.8rem' }}>End Date</label>
                                        <input type="date" className={styles.input} value={exportFilters.endDate} onChange={e => setExportFilters({ ...exportFilters, endDate: e.target.value })} />
                                    </div>
                                </div>
                            </div>
                        )}

                        {(exportType === 'selected' || exportType === 'marked') && (
                            <p style={{ color: '#a0aec0', marginBottom: '1rem' }}>
                                {exportType === 'selected' ? selectedQuestions.length : markedQuestions.length} questions will be exported.
                            </p>
                        )}

                        <div style={{ marginBottom: '1rem' }}>
                            <label style={{ color: '#a0aec0', display: 'block', marginBottom: '0.5rem' }}>Format:</label>
                            <select className={styles.input} value={exportFilters.format} onChange={e => setExportFilters({ ...exportFilters, format: e.target.value })}>
                                <option value="json">JSON</option>
                                <option value="csv">CSV</option>
                                <option value="xlsx">Excel (.xlsx)</option>
                                <option value="pdf">PDF</option>
                                <option value="docx">Word (.docx)</option>
                            </select>
                        </div>

                        {(exportFilters.format === 'pdf' || exportFilters.format === 'docx') && (
                            <div style={{ marginBottom: '1rem' }}>
                                <label style={{ color: '#fff', display: 'flex', alignItems: 'center', cursor: 'pointer' }}>
                                    <input
                                        type="checkbox"
                                        checked={exportFilters.includeAnswers}
                                        onChange={e => setExportFilters({ ...exportFilters, includeAnswers: e.target.checked })}
                                        style={{ marginRight: '0.5rem' }}
                                    />
                                    Include Correct Answers
                                </label>
                            </div>
                        )}


                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className={styles.btn} onClick={() => setShowExportModal(false)} style={{ background: '#e53e3e' }}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={triggerExport}>Export</button>
                        </div>
                    </div>
                </div>
            )}

            {/* Move Modal */}
            {showMoveModal && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000 }}>
                    <div className={styles.card} style={{ width: '400px' }}>
                        <h3 className={styles.cardTitle}>Move {moveType === 'bulk' ? `${selectedQuestions.length} Questions` : 'Question'}</h3>
                        <p style={{ marginBottom: '1rem', color: '#a0aec0' }}>Select new subject:</p>
                        <select className={styles.input} style={{ marginBottom: '1rem' }} value={moveSubjectId} onChange={e => setMoveSubjectId(e.target.value)}>
                            <option value="">Select Subject</option>
                            {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
                            <option value="other">Other (Custom Subject)</option>
                        </select>
                        {moveSubjectId === 'other' && (
                            <input
                                className={styles.input}
                                style={{ marginBottom: '1rem' }}
                                placeholder="Enter custom subject"
                                value={moveCustomSubject}
                                onChange={e => setMoveCustomSubject(e.target.value)}
                            />
                        )}
                        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
                            <button className={styles.btn} onClick={() => setShowMoveModal(false)} style={{ background: '#e53e3e' }}>Cancel</button>
                            <button className={`${styles.btn} ${styles.btnPrimary}`} onClick={handleMove}>Move</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Questions;
