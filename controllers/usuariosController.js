const home = (req, res) => {
    res.redirect('/registrar');
}

const formularioRegistrar = (req, res) => {
    res.render('registrar', {
        logueado: true,
        nombrePagina: 'Registrar documento'
    });
};

const formComprobarDocumento = (req, res) => {
    res.render('comprobar', {
        logueado: true,
        nombrePagina: 'Comprobar documento'
    });
};

const formIniciarSesion = (req, res) => {
    res.render('./auth/login', {
        nombrePagina: 'Iniciar Sesión'
    });
};

const formularioInstruccionesDeUso = async(req, res) => {
    res.render('instrucciones-uso', {
        nombrePagina: 'Instrucciones de Uso',
        logueado: true
    });
};

module.exports = {
    home,
    formIniciarSesion,
    formComprobarDocumento,
    formularioRegistrar,
    formularioInstruccionesDeUso
};