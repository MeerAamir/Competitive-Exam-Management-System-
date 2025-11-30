const { Subject, Question, Exam, Result, User, AdminAction } = require('../models');
const { Op } = require('sequelize');
const bcrypt = require('bcrypt');
const pdfParse = require('pdf-parse');
const { Parser } = require('json2csv');
const XLSX = require('xlsx');
const PDFDocument = require('pdfkit');
const { Document, Packer, Paragraph, Table, TableRow, TableCell, WidthType, BorderStyle, TextRun } = require('docx');

// Subjects
exports.getSubjects = async (req, res) => {
    try {
        const subjects = await Subject.findAll();
        res.json(subjects);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createSubject = async (req, res) => {
    try {
        const subject = await Subject.create(req.body);
        res.json(subject);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteSubject = async (req, res) => {
    try {
        await Subject.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Subject deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Questions with Search, Sort, Pagination
exports.getQuestions = async (req, res) => {
    try {
        const { search, subjectId, difficulty, sort, page = 1, limit = 20 } = req.query;
        const offset = (page - 1) * limit;

        const where = {};
        if (search) {
            where.text = { [Op.like]: `%${search}%` };
        }
        if (subjectId) {
            where.SubjectId = subjectId;
        }
        if (difficulty) {
            where.difficulty = difficulty;
        }

        let order = [['createdAt', 'DESC']]; // Default newest first
        if (sort === 'oldest') order = [['createdAt', 'ASC']];
        if (sort === 'difficulty') order = [['difficulty', 'ASC']];
        if (sort === 'subject') order = [[Subject, 'name', 'ASC']];

        const { count, rows } = await Question.findAndCountAll({
            where,
            include: Subject,
            order,
            limit: parseInt(limit),
            offset: parseInt(offset)
        });

        res.json({
            total: count,
            totalPages: Math.ceil(count / limit),
            currentPage: parseInt(page),
            questions: rows
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createQuestion = async (req, res) => {
    try {
        // Ensure options are stringified if sent as array
        const data = { ...req.body };
        if (Array.isArray(data.options)) {
            data.options = JSON.stringify(data.options);
        }

        // Handle Custom Subject
        if (data.customSubject) {
            const [subject] = await Subject.findOrCreate({ where: { name: data.customSubject } });
            data.SubjectId = subject.id;
        }

        const question = await Question.create(data);
        res.json(question);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteQuestion = async (req, res) => {
    try {
        const question = await Question.findByPk(req.params.id);
        if (question) {
            await AdminAction.create({
                action: 'DELETE_QUESTION',
                details: `Deleted question ID ${question.id}: ${question.text.substring(0, 50)}...`,
                adminId: req.user ? req.user.id : null
            });
            await question.destroy();
        }
        res.json({ message: 'Question deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateQuestion = async (req, res) => {
    try {
        const { id } = req.params;
        const { SubjectId, customSubject } = req.body;

        const question = await Question.findByPk(id);
        if (!question) return res.status(404).json({ error: 'Question not found' });

        let newSubjectId = SubjectId;
        if (customSubject) {
            const [subject] = await Subject.findOrCreate({ where: { name: customSubject } });
            newSubjectId = subject.id;
        }

        if (newSubjectId && newSubjectId !== question.SubjectId) {
            await AdminAction.create({
                action: 'MOVE_QUESTION',
                details: `Moved question ID ${question.id} from Subject ${question.SubjectId} to ${newSubjectId}`,
                adminId: req.user ? req.user.id : null
            });
            question.SubjectId = newSubjectId;
        } else if (SubjectId) {
            question.SubjectId = SubjectId;
        }

        await question.save();
        res.json({ message: 'Question updated', question });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.bulkMoveQuestions = async (req, res) => {
    try {
        const { ids, subjectId, customSubject } = req.body;
        let targetSubjectId = subjectId;

        if (customSubject) {
            const [subject] = await Subject.findOrCreate({ where: { name: customSubject } });
            targetSubjectId = subject.id;
        }

        if (!targetSubjectId) return res.status(400).json({ error: 'Target subject required' });

        await Question.update({ SubjectId: targetSubjectId }, {
            where: { id: { [Op.in]: ids } }
        });

        await AdminAction.create({
            action: 'BULK_MOVE',
            details: `Moved ${ids.length} questions to Subject ${targetSubjectId}`,
            adminId: req.user ? req.user.id : null
        });

        res.json({ message: `Moved ${ids.length} questions successfully` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.exportQuestions = async (req, res) => {
    console.log('Export request received:', req.query);
    try {
        const { subjectId, difficulty, startDate, endDate, format = 'json', ids, includeAnswers } = req.query;
        const where = {};

        if (ids) {
            const idList = typeof ids === 'string' ? ids.split(',') : ids;
            where.id = { [Op.in]: idList };
        } else {
            if (subjectId) where.SubjectId = subjectId;
            if (difficulty) where.difficulty = difficulty;
            if (startDate && endDate) {
                where.createdAt = {
                    [Op.between]: [new Date(startDate), new Date(endDate)]
                };
            }
        }

        const questions = await Question.findAll({
            where,
            include: [{ model: Subject, attributes: ['name'] }],
            order: [['createdAt', 'DESC']]
        });
        console.log(`Found ${questions.length} questions`);

        const data = questions.map(q => ({
            id: q.id,
            text: q.text,
            subject: q.Subject?.name,
            difficulty: q.difficulty,
            options: typeof q.options === 'string' ? JSON.parse(q.options) : q.options,
            correctOption: ['A', 'B', 'C', 'D'][q.correctOption - 1],
            createdAt: q.createdAt
        }));

        const filename = `questions_${subjectId ? 'subject_' + subjectId : 'all'}_${new Date().toISOString().split('T')[0]}`;

        if (format === 'csv') {
            console.log('Generating CSV...');
            const json2csvParser = new Parser({ withBOM: true });
            const csv = json2csvParser.parse(data.map(d => ({ ...d, options: JSON.stringify(d.options) })));
            res.header('Content-Type', 'text/csv');
            res.attachment(`${filename}.csv`);
            return res.send(csv);
        }

        if (format === 'xlsx') {
            console.log('Generating XLSX...');
            const wb = XLSX.utils.book_new();
            const ws = XLSX.utils.json_to_sheet(data.map(d => ({ ...d, options: JSON.stringify(d.options) })));
            XLSX.utils.book_append_sheet(wb, ws, 'Questions');
            const buffer = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });
            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.attachment(`${filename}.xlsx`);
            return res.send(buffer);
        }

        if (format === 'pdf') {
            console.log('Generating PDF...');
            const doc = new PDFDocument();
            res.header('Content-Type', 'application/pdf');
            res.attachment(`${filename}.pdf`);
            doc.pipe(res);

            doc.fontSize(18).text('Question Bank Export', { align: 'center' });
            doc.moveDown();

            data.forEach((q, i) => {
                doc.fontSize(12).font('Helvetica-Bold').text(`${i + 1}. ${q.text} (${q.difficulty})`);
                doc.font('Helvetica');
                q.options.forEach((opt, idx) => {
                    doc.fontSize(10).text(`   ${['A', 'B', 'C', 'D'][idx]}) ${opt}`);
                });
                if (includeAnswers === 'true') {
                    doc.fontSize(10).fillColor('green').text(`   Correct: ${['A', 'B', 'C', 'D'][q.correctOption - 1]}`);
                    doc.fillColor('black');
                }
                doc.moveDown();
            });

            doc.end();
            return;
        }

        if (format === 'docx') {
            console.log('Generating DOCX...');
            const children = [
                new Paragraph({ text: "Question Bank Export", heading: "Heading1", alignment: "center" }),
                new Paragraph({ text: "" }), // Spacer
            ];

            data.forEach((q, i) => {
                children.push(new Paragraph({
                    children: [
                        new TextRun({ text: `${i + 1}. ${q.text}`, bold: true, size: 24 }),
                        new TextRun({ text: ` (${q.difficulty})`, italics: true, size: 20 })
                    ]
                }));

                q.options.forEach((opt, idx) => {
                    children.push(new Paragraph({
                        text: `   ${['A', 'B', 'C', 'D'][idx]}) ${opt}`,
                        indent: { left: 720 } // 0.5 inch
                    }));
                });

                if (includeAnswers === 'true') {
                    children.push(new Paragraph({
                        children: [
                            new TextRun({ text: `   Correct: ${['A', 'B', 'C', 'D'][q.correctOption - 1]}`, color: "008000", bold: true })
                        ]
                    }));
                }
                children.push(new Paragraph({ text: "" })); // Spacer
            });

            const doc = new Document({
                sections: [{
                    children: children,
                }],
            });

            const buffer = await Packer.toBuffer(doc);
            res.header('Content-Type', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document');
            res.attachment(`${filename}.docx`);
            return res.send(buffer);
        }

        // Default JSON
        console.log('Returning JSON...');
        res.json(data);
    } catch (error) {
        console.error('Export Error:', error);
        res.status(500).json({ error: error.message, stack: error.stack });
    }
};

// Exams
exports.getExams = async (req, res) => {
    try {
        const exams = await Exam.findAll({ order: [['createdAt', 'DESC']] });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createExam = async (req, res) => {
    try {
        const exam = await Exam.create(req.body);
        res.json(exam);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.deleteExam = async (req, res) => {
    try {
        await Exam.destroy({ where: { id: req.params.id } });
        res.json({ message: 'Exam deleted' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// Results
exports.getAllResults = async (req, res) => {
    try {
        const results = await Result.findAll({
            include: [
                { model: User, attributes: ['email', 'username'] },
                { model: Exam, attributes: ['title'] }
            ],
            order: [['createdAt', 'DESC']]
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

// User Management
exports.getUsers = async (req, res) => {
    try {
        const { role, search } = req.query;
        const where = {};
        if (role) where.role = role;
        if (search) {
            where[Op.or] = [
                { username: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }

        const users = await User.findAll({
            where,
            attributes: { exclude: ['password'] },
            order: [['createdAt', 'DESC']]
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.updateUser = async (req, res) => {
    try {
        const { id } = req.params;
        const { role, password, action } = req.body;
        const user = await User.findByPk(id);

        if (!user) return res.status(404).json({ error: 'User not found' });

        if (action === 'promote') user.role = 'admin';
        if (action === 'demote') user.role = 'student';
        if (action === 'reset_password' && password) {
            user.password = await bcrypt.hash(password, 10);
        }

        await user.save();
        res.json({ message: 'User updated successfully' });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.createUser = async (req, res) => {
    try {
        const { username, email, password, role } = req.body;
        const hashedPassword = await bcrypt.hash(password, 10);
        const user = await User.create({
            username, email, password: hashedPassword, role
        });
        res.json({ message: 'User created', user: { id: user.id, username, email, role } });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Import Helper & Preview
const parseQuestionsFromText = (text, subjectId) => {
    const questions = [];
    const lines = text.split('\n').map(l => l.trim()).filter(l => l);

    let currentQ = null;

    // Regex for different formats
    const numberedQRegex = /^(Q\d*\.|Q\.|Question\s\d+[:.]|\d+\.)\s*(.*)/i;
    const optionRegex = /^([A-D]|[a-d])[).]\s*(.*)/;
    const answerRegex = /^Answer:\s*([A-D]|[a-d])/i;
    const csvRegex = /^([^,]+),([^,]+),([^,]+),([^,]+),([^,]+),([A-D]|[a-d])/; // Simple CSV: Q,A,B,C,D,Ans

    lines.forEach(line => {
        // 1. Try CSV/Tab separated first if line contains delimiters
        if (line.includes(',') || line.includes('\t')) {
            const parts = line.includes('\t') ? line.split('\t') : line.split(',');
            if (parts.length >= 6) {
                // Assume Q, OptA, OptB, OptC, OptD, Ans
                const ansChar = parts[parts.length - 1].trim().toLowerCase();
                const ansMap = { 'a': 1, 'b': 2, 'c': 3, 'd': 4, '1': 1, '2': 2, '3': 3, '4': 4 };

                if (ansMap[ansChar] !== undefined) {
                    questions.push({
                        text: parts[0].trim(),
                        options: parts.slice(1, 5).map(o => o.trim()),
                        correctOption: ansMap[ansChar],
                        SubjectId: subjectId
                    });
                    return; // Skip other checks
                }
            }
        }

        // 2. Standard Numbered Format
        const qMatch = line.match(numberedQRegex);
        if (qMatch) {
            if (currentQ) questions.push(currentQ);
            currentQ = {
                text: qMatch[2],
                options: [],
                correctOption: 0,
                SubjectId: subjectId
            };
        } else if (currentQ) {
            const optionMatch = line.match(optionRegex);
            if (optionMatch) {
                currentQ.options.push(optionMatch[2]);
            } else {
                const ansMatch = line.match(answerRegex);
                if (ansMatch) {
                    const ansMap = { 'a': 1, 'b': 2, 'c': 3, 'd': 4 };
                    currentQ.correctOption = ansMap[ansMatch[1].toLowerCase()];
                } else if (currentQ.options.length === 0) {
                    // Append to question text if no options yet
                    currentQ.text += ' ' + line;
                }
            }
        }
    });
    if (currentQ) questions.push(currentQ);

    // Validate questions
    return questions.filter(q => q.options.length >= 2);
};

exports.previewImport = async (req, res) => {
    try {
        let text = req.body.text || '';
        let subjectId = req.body.subjectId;
        const customSubject = req.body.customSubject;

        // Handle Custom Subject
        if (customSubject) {
            const [subject] = await Subject.findOrCreate({ where: { name: customSubject } });
            subjectId = subject.id;
        }

        if (req.file) {
            const data = await pdfParse(req.file.buffer);
            text = data.text;
        }

        const questions = parseQuestionsFromText(text, subjectId);

        // Add error flags
        const questionsWithFlags = questions.map((q, i) => {
            const errors = [];
            if (q.options.length < 2) errors.push('Fewer than 2 options');
            if (q.correctOption === undefined || q.correctOption === null) errors.push('Missing answer');
            return { ...q, errors, isValid: errors.length === 0, id: i }; // Temp ID for frontend
        });

        res.json({ count: questionsWithFlags.length, questions: questionsWithFlags });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.confirmImport = async (req, res) => {
    try {
        const { questions } = req.body; // Expects array of parsed questions

        // Stringify options for DB
        // Stringify options for DB
        const questionsToCreate = questions.map(q => {
            if (!q.SubjectId) throw new Error(`Subject is required for question: ${q.text}`);
            return {
                text: q.text,
                options: JSON.stringify(q.options),
                correctOption: q.correctOption,
                SubjectId: q.SubjectId,
                difficulty: q.difficulty || 'medium'
            };
        });

        await Question.bulkCreate(questionsToCreate);

        await AdminAction.create({
            action: 'IMPORT_QUESTIONS',
            details: `Imported ${questionsToCreate.length} questions into Subject ${questionsToCreate[0]?.SubjectId}`,
            adminId: req.user ? req.user.id : null
        });

        res.json({ message: `Successfully imported ${questionsToCreate.length} questions` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};


// Legacy Import Handlers (Restored to prevent crash)
exports.uploadQuestions = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
        const data = await pdfParse(req.file.buffer);
        const questions = parseQuestionsFromText(data.text, req.body.subjectId);

        // Direct create for legacy
        const questionsToCreate = questions.map(q => ({
            ...q,
            options: JSON.stringify(q.options)
        }));
        await Question.bulkCreate(questionsToCreate);
        res.json({ message: `Imported ${questionsToCreate.length} questions` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.bulkCreateQuestions = async (req, res) => {
    try {
        const questions = parseQuestionsFromText(req.body.text, req.body.subjectId);
        const questionsToCreate = questions.map(q => ({
            ...q,
            options: JSON.stringify(q.options)
        }));
        await Question.bulkCreate(questionsToCreate);
        res.json({ message: `Imported ${questionsToCreate.length} questions` });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
