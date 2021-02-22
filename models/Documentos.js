const Sequelize = require('sequelize');
const Usuarios = require('./Usuarios');
const db = require('../config/db');

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

Documentos.belongsTo(Usuarios, { onDelete: 'cascade' });

module.exports = Documentos;