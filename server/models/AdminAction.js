const { DataTypes } = require('sequelize');
const { sequelize } = require('../db/database');

const AdminAction = sequelize.define('AdminAction', {
    action: {
        type: DataTypes.STRING,
        allowNull: false
    },
    details: {
        type: DataTypes.TEXT,
        allowNull: true
    },
    adminId: {
        type: DataTypes.INTEGER,
        allowNull: true
    },
    createdAt: {
        type: DataTypes.DATE,
        defaultValue: DataTypes.NOW
    }
});

module.exports = AdminAction;
