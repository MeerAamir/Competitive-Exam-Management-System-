const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const User = sequelize.define('User', {
    username: { type: DataTypes.STRING, allowNull: false },
    email: { type: DataTypes.STRING, allowNull: false, unique: true },
    password: { type: DataTypes.STRING, allowNull: false },
    role: { type: DataTypes.ENUM('admin', 'student'), defaultValue: 'student' }
});

const Subject = sequelize.define('Subject', {
    name: { type: DataTypes.STRING, allowNull: false, unique: true }
});

const Question = sequelize.define('Question', {
    text: { type: DataTypes.TEXT, allowNull: false },
    options: { type: DataTypes.JSON, allowNull: false }, // Store as ["A", "B", "C", "D"]
    correctOption: { type: DataTypes.INTEGER, allowNull: false }, // Index 0-3
    difficulty: { type: DataTypes.ENUM('easy', 'medium', 'hard'), defaultValue: 'medium' }
});

const Exam = sequelize.define('Exam', {
    title: { type: DataTypes.STRING, allowNull: false },
    duration: { type: DataTypes.INTEGER, allowNull: false }, // in minutes
    questionCount: { type: DataTypes.INTEGER, defaultValue: 10 },
    isActive: { type: DataTypes.BOOLEAN, defaultValue: true }
});

const Result = sequelize.define('Result', {
    score: { type: DataTypes.INTEGER, allowNull: false },
    totalQuestions: { type: DataTypes.INTEGER, allowNull: false },
    timeTaken: { type: DataTypes.INTEGER }, // in seconds
    completedAt: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
});

const AdminAction = require('./AdminAction');

// Associations
Subject.hasMany(Question);
Question.belongsTo(Subject, { foreignKey: { allowNull: false } });

User.hasMany(Result);
Result.belongsTo(User);

Exam.hasMany(Result);
Result.belongsTo(Exam);

Subject.hasMany(Exam);
Exam.belongsTo(Subject);

module.exports = { User, Subject, Question, Exam, Result, AdminAction };
