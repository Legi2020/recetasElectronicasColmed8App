const Sequelize = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcrypt-nodejs');

const Medicos = db.define('medico', {
    matricula: {
        type: Sequelize.STRING(12),
        primaryKey: true,
        trim: true,
        onDelete: 'CASCADE',
    },
    nombre: {
        type: Sequelize.STRING(100),
        allowNull: false,
        trim: true
    },
    email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        trim: true
    },
    password: {
        type: Sequelize.STRING(100),
        allowNull: false,
        trim: true
    },
    estado: Sequelize.SMALLINT,
    intentos: Sequelize.INTEGER,
    bloqueo: Sequelize.BIGINT,
    token: Sequelize.STRING,
    expira: Sequelize.BIGINT
});

// Métodos personalizados
Medicos.prototype.verficarPassword = (passwordIngresada, passwordLocal) => {
    return bcrypt.compareSync(passwordIngresada, passwordLocal);
};

module.exports = Medicos;