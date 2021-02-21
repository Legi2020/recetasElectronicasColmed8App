const passport = require('passport');

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


module.exports = {
    autenticarUsuario,
    usuarioAutenticado,
    cerrarSesion,
    validarInicioSesion
}