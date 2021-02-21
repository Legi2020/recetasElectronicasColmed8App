const Sequelize = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcrypt-nodejs');

const Admin = db.define('admin', {
    usuario: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        trim: true
    },
    password: {
        type: Sequelize.STRING(100),
        allowNull: false,
        trim: true
    }
});

// Métodos personalizados
Admin.prototype.verficarPassword = (passwordIngresada, passwordLocal) => {
    return bcrypt.compareSync(passwordIngresada, passwordLocal);
};

module.exports = Admin;