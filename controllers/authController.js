const { param } = require('express-validator/check');
const passport = require('passport');
const crypto = require('crypto');
const bcrypt = require('bcrypt-nodejs');
const { enviar } = require('../handlers/email');
const Medicos = require('../models/Medicos');

// Función para autenticar usuario
const autenticarUsuario = passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/iniciar-sesion',
    failureFlash: true,
    badRequestMessage: 'Ambos Campos son Obligatorios'
});

// Función para revisar si el usuario esta logueado
const usuarioAutenticado = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.redirect('/iniciar-sesion');
};

// Función para cerrar sesión
const cerrarSesion = (req, res) => {
    req.session.destroy(() => {
        return res.redirect('iniciar-sesion')
    });
};

const validarInicioSesion = (req, res, next) => {
    // Sanitizar campos
    req.checkBody('matricula').escape();
    req.checkBody('password').escape();
    // Verificar si los campos estan vacios
    req.checkBody('matricula', 'Ingrese un número de matrícula').notEmpty();
    req.checkBody('password', 'Ingrese una contraseña').notEmpty();

    const errores = req.validationErrors();
    if (errores) {
        req.flash('alert-danger', errores.map(error => error.msg))
        res.render('auth/login', {
            nombrePagina: 'Iniciar Sesión',
            mensajes: req.flash()
        });
        return;
    }
    next();
};

const formularioPasswordOlvidada = (req, res) => {
    res.render('passwordOlvidada', {
        nombrePagina: 'Reestablecer Contraseña'
    });
};

const enviarToken = async(req, res) => {
    const usuario = await Medicos.findOne({ where: { matricula: req.body.matricula, email: req.body.email } });
    if (!usuario) {
        req.flash('alert-danger', 'No existe esa cuenta');
        return res.redirect('/iniciar-sesion');
    }
    usuario.token = crypto.randomBytes(20).toString('hex');
    usuario.expira = Date.now() + 1800000;
    await usuario.save();
    const resetUrl = `http://${req.headers.host}/reestablecer-password/${usuario.token}`;
    await enviar({
        usuario,
        subject: 'Password Reset',
        resetUrl,
        archivo: 'reset'
    });
    req.flash('alert-success', 'Te hemos enviado un correo a tu dirección de correo');
    res.redirect('/iniciar-sesion');
};

const reestablecerPassword = async(req, res) => {

    const usuario = await Medicos.findOne({
        where: {
            token: req.params.token
        }
    });
    if (!usuario || (usuario.expira < Date.now())) {
        req.flash('alert-danger', 'El formulario ya no es válido');
        return res.redirect('/password-olvidada');
    }
    res.render('nuevoPassword', {
        nombrePagina: 'Nuevo password'
    });
};

const reestablecerPasswordToken = async(req, res) => {
    const usuario = await Medicos.findOne({
        where: {
            token: req.params.token
        }
    });
    if (!usuario || (usuario.expira < Date.now())) {
        req.flash('alert-danger', 'El formulario ya no es válido');
        return res.redirect('/password-olvidada');
    }
    usuario.password = bcrypt.hashSync(req.body.password, bcrypt.genSaltSync(10));
    usuario.token = null;
    usuario.expira = null;
    usuario.fallidos = null;
    usuario.bloqueo = null;
    await usuario.save();
    req.flash('alert-success', 'Password modificado correctamente');
    res.redirect('/iniciar-sesion');
};

module.exports = {
    autenticarUsuario,
    usuarioAutenticado,
    cerrarSesion,
    validarInicioSesion,
    formularioPasswordOlvidada,
    enviarToken,
    reestablecerPassword,
    reestablecerPasswordToken
}