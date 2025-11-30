const { Sequelize } = require('sequelize');
const path = require('path');

// Default to SQLite, but allow env var override
// Usage for MySQL: DB_DIALECT=mysql DB_NAME=examdb DB_USER=root DB_PASS=pass DB_HOST=localhost
const sequelize = new Sequelize(
    process.env.DB_NAME || 'examdb',
    process.env.DB_USER || 'user',
    process.env.DB_PASS || 'pass',
    {
        dialect: process.env.DB_DIALECT || 'sqlite',
        storage: process.env.NODE_ENV === 'test' ? ':memory:' : (process.env.DB_STORAGE || path.join(__dirname, '..', 'database.sqlite')),
        host: process.env.DB_HOST || 'localhost',
        logging: false,
    }
);

module.exports = { sequelize };
