const { Exam, Question, Result, Subject } = require('../models');
const { sequelize } = require('../db/database');

exports.getAvailableExams = async (req, res) => {
    try {
        const exams = await Exam.findAll({ where: { isActive: true } });
        res.json(exams);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getExamQuestions = async (req, res) => {
    try {
        const exam = await Exam.findByPk(req.params.id);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        // Randomly select questions belonging to the exam's subject
        const questions = await Question.findAll({
            where: { SubjectId: exam.SubjectId },
            order: sequelize.random(),
            limit: exam.questionCount,
            attributes: { exclude: ['correctOption'] } // Hide correct answer
        });

        res.json({ exam, questions });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.submitExam = async (req, res) => {
    try {
        const { examId, answers } = req.body; // answers: { questionId: selectedOptionIndex }
        const userId = req.userId;

        const exam = await Exam.findByPk(examId);
        if (!exam) return res.status(404).json({ error: 'Exam not found' });

        let score = 0;
        let questionIds;
        if (req.body.questionOrder && Array.isArray(req.body.questionOrder)) {
            questionIds = req.body.questionOrder;
        } else {
            questionIds = Object.keys(answers);
        }

        // Fetch questions to check answers
        const questions = await Question.findAll({
            where: { id: questionIds }
        });

        const resultsDetails = [];

        // Sort questions based on the order sent by frontend (if available)
        // Sort questions based on the order sent by frontend (if available)
        if (req.body.questionOrder) {
            console.log('Received questionOrder:', req.body.questionOrder);
            const orderMap = new Map(req.body.questionOrder.map((id, index) => [id, index]));
            questions.sort((a, b) => {
                const indexA = orderMap.get(a.id);
                const indexB = orderMap.get(b.id);
                // Handle undefined indices (shouldn't happen if logic is correct)
                if (indexA === undefined) console.warn(`Question ID ${a.id} not found in orderMap`);
                if (indexB === undefined) console.warn(`Question ID ${b.id} not found in orderMap`);
                return (indexA ?? 0) - (indexB ?? 0);
            });
            console.log('Sorted questions IDs:', questions.map(q => q.id));
        }

        questions.forEach(q => {
            const selected = answers[q.id];
            const isCorrect = selected === q.correctOption;
            if (isCorrect) score++;

            resultsDetails.push({
                questionId: q.id,
                text: q.text,
                selected,
                correct: q.correctOption,
                isCorrect
            });
        });

        // Save Result
        await Result.create({
            score,
            totalQuestions: exam.questionCount, // or questions.length
            timeTaken: req.body.timeTaken || 0,
            UserId: userId,
            ExamId: examId
        });

        res.json({ score, total: exam.questionCount, details: resultsDetails });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

exports.getMyResults = async (req, res) => {
    try {
        const results = await Result.findAll({
            where: { UserId: req.userId },
            include: [{ model: Exam, attributes: ['title'] }],
            order: [['createdAt', 'DESC']]
        });
        res.json(results);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};
