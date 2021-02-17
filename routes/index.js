const express = require('express');
const {
    registrarDocumento,
    encontrarDocumento,
    obtenerImagenDocumento,
    comprobarPorUrl,
    documentosRegistrados,
    generarPDF,
    obtenerPDF
} = require('../controllers/documentosController.js');
const {
    autenticarUsuario,
    cerrarSesion,
    usuarioAutenticado,
    validarInicioSesion,
    formularioPasswordOlvidada,
    enviarToken,
    reestablecerPassword,
    reestablecerPasswordToken
} = require('../controllers/authController.js');
const {
    home,
    formIniciarSesion,
    formularioRegistrar,
    formComprobarDocumento,
    formularioDatosMatriculado,
    formularioInstruccionesDeUso
} = require('../controllers/usuariosController.js');



const router = express.Router();

// Home
router.get('/', home);
// Formulario iniciar sesion
router.get('/iniciar-sesion', formIniciarSesion);
// Envio de datos a iniciar sesión
router.post('/iniciar-sesion', validarInicioSesion, autenticarUsuario);
// Cerrar sesión
router.get('/cerrar-sesion', usuarioAutenticado, cerrarSesion);
// Formulario registrar
router.get('/registrar', usuarioAutenticado, formularioRegistrar);
// Registrar un documento
router.post('/registrar', usuarioAutenticado, registrarDocumento);
// Formulario comprobar documento
router.get('/comprobar', usuarioAutenticado, formComprobarDocumento);
// Comprobar un documento
router.post('/comprobar', usuarioAutenticado, encontrarDocumento);
// Obtener imagen del documento
router.get('/documento/imagen/:url', obtenerImagenDocumento);
// Comprobar documento por url
router.get('/comprobar/:hash', comprobarPorUrl);
// Formulario documentos registrados
router.get('/documento/registrados', usuarioAutenticado, documentosRegistrados);
// Formulario reestablecer password
router.get('/password-olvidada', formularioPasswordOlvidada);
// Envio de datos resetar password
router.post('/password-olvidada', enviarToken);
// Reestablecer password en la BD
router.get('/reestablecer-password/:token', reestablecerPassword);
// Reestablecer password token
router.post('/reestablecer-password/:token', reestablecerPasswordToken);
// Datos cuenta usuario
router.get('/datos-matriculado', usuarioAutenticado, formularioDatosMatriculado);
// Instrucciones de uso
router.get('/instrucciones', usuarioAutenticado, formularioInstruccionesDeUso);
// Obtener PDF firmado
router.get('/generar-pdf/:url', usuarioAutenticado, obtenerPDF);
// Generar PDF
router.post('/generar-pdf', usuarioAutenticado, generarPDF);


module.exports = { router };