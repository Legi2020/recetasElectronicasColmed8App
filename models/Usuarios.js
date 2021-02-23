const Sequelize = require('sequelize');
const db = require('../config/db');
const bcrypt = require('bcrypt-nodejs');

const Usuarios = db.define('usuarios', {
    usuario: {
        type: Sequelize.STRING(100),
        primaryKey: true,
        trim: true,
        onDelete: 'CASCADE'
    },
    nombre: {
        type: Sequelize.STRING(100),
        trim: true,
    },
    password: {
        type: Sequelize.STRING(100),
        allowNull: false,
        trim: true
    },
    estado: Sequelize.SMALLINT
}, {
    hooks: {
        beforeCreate(usuario) {
            usuario.password = bcrypt.hashSync(usuario.password, bcrypt.genSaltSync(10));
        }
    }
});

// Métodos personalizados
Usuarios.prototype.verficarPassword = (passwordIngresada, passwordLocal) => {
    return bcrypt.compareSync(passwordIngresada, passwordLocal);
};

module.exports = Usuarios;