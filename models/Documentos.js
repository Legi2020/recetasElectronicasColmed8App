const Sequelize = require('sequelize');
const db = require('../config/db');
const Medicos = require('./Medicos')

const Documentos = db.define('documento', {
    hash: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        trim: true
    },
    fecha: {
        type: Sequelize.DATE,
        trim: true,
        allowNull: true
    },
    url: {
        type: Sequelize.STRING(100),
        allowNull: false,
        trim: true
    },
});
Documentos.belongsTo(Medicos, { onDelete: 'cascade' });

module.exports = Documentos;