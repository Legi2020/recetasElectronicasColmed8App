const Medicos = require('../models/Medicos');


const home = (req, res) => {
    res.redirect('/registrar');
}

const formularioRegistrar = (req, res) => {
    res.render('registrar', {
        matriculaUsuario: res.locals.usuario.id,
        logueado: true,
        nombrePagina: 'Registrar documento'
    });
};

const formComprobarDocumento = (req, res) => {
    res.render('comprobar', {
        matriculaUsuario: res.locals.usuario.id,
        logueado: true,
        nombrePagina: 'Comprobar documento'
    });
};

const formIniciarSesion = (req, res) => {
    res.render('./auth/login', {
        nombrePagina: 'Iniciar Sesión'
    });
};

const formularioDatosMatriculado = async(req, res) => {
    const matricula = await Medicos.findOne({ where: { matricula: res.locals.usuario.matricula } });
    res.render('datosMatriculado', {
        nombrePagina: 'Datos matriculado',
        logueado: true,
        matricula: matricula.matricula,
        email: matricula.email,
        nombre: matricula.nombre
    })
};

module.exports = {
    home,
    formIniciarSesion,
    formComprobarDocumento,
    formularioRegistrar,
    formularioDatosMatriculado
};