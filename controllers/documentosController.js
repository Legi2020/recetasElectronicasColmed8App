const crypto = require('crypto');
const path = require("path");
const { Op } = require("sequelize");
require('dotenv').config({ path: 'variables-sql-server.env' });
// Modelo de la BD
const Documentos = require('../models/Documentos.js');
const QRCode = require('qrcode');
const pdf = require('html-pdf');
const merge = require('easy-pdf-merge');
const fs = require('fs');
const moment = require('moment');

const {
    registrarEnBlockchain,
    encontrarEnBlockchain,
    convertirTimestampAFechaHora,
    sleep,
    verificarContador,
    fechaArgentina
} = require('../helpers/funciones');

// Se ejecuta en /documento -> Registrar documento en la blockchain y la BD
const registrarDocumento = async(req, res) => {
    let hashDocumento;
    let urlDocumento;
    // *Subir archivo
    if (req.files) {
        const archivo = req.files.imagen;
        let extension = archivo.mimetype.split('/')[1];
        if ((archivo.mimetype === 'application/pdf') && archivo.size <= 10000000) {
            // *Calculo del hash del archivo
            const cripto = crypto.createHash('sha256');
            cripto.update(archivo.data);
            hashDocumento = `0x${cripto.digest('hex')}`;

            urlDocumento = `${hashDocumento}.${extension}`;
            // *Verifica si existe el archivo previamente
            const { timestamp, bloque } = await registrarEnBlockchain(hashDocumento);
            if (timestamp === null) {
                req.flash('alert-danger', 'Ocurrio un error, intenta de nuevo por favor');
                return res.render('registrar', {
                    mensajes: req.flash(),
                    logueado: true,
                    nombrePagina: 'Registrar documento'
                });
            }
            const fechaEncontrado = convertirTimestampAFechaHora(timestamp);
            // Genero QR
            const qrCode = await QRCode.toDataURL(`http://${req.headers.host}/comprobar/${hashDocumento}`);
            // *Si ya existe muestro los datos del documento registrado
            if (bloque != 0) {
                // Trato el error de que este en la blockchain pero no en la Base de datos
                try {
                    const { url } = await Documentos.findOne({ where: { hash: hashDocumento } });

                    req.flash('alert-success', 'Documento ya registrado.  Diríjase hacia el final de la página.');
                    respuesta = {
                        mensaje: 'Documento ya registrado.',
                        hash: hashDocumento,
                        timestamp: fechaEncontrado,
                        bloque,
                        url: `/documento/imagen/${url}`,
                        existe: true,
                        nombrePagina: 'Registrar documento',
                        qr: qrCode
                    };
                    return res.render('registrar', {
                        ventana: true,
                        respuesta,
                        logueado: true,
                        btnCerrar: true,
                        nombrePagina: 'Registrar documento',
                        mensajes: req.flash()
                    });
                } catch (err) {
                    req.flash('alert-success', 'Documento ya registrado.  Diríjase hacia el final de la página.');
                    respuesta = {
                        mensaje: 'Documento ya registrado',
                        hash: hashDocumento,
                        timestamp: fechaEncontrado,
                        bloque,
                        url: null,
                        existe: true,
                        nombrePagina: 'Registrar documento',
                        qr: null
                    };
                    return res.render('registrar', {
                        ventana: true,
                        respuesta,
                        logueado: true,
                        btnCerrar: true,
                        nombrePagina: 'Registrar documento',
                        mensajes: req.flash()
                    });
                }

            } else {
                // *Si no existe lo registro
                archivo.mv(path.join(__dirname, `${process.env.DIR_IMAGENES}${urlDocumento}`));
                // Registro documento con fecha null, porque no esta en la blockchain todavia.
                const documentoRegistradoEnBD = await Documentos.create({ hash: hashDocumento, fecha: null, url: urlDocumento });
                // Consulto hasta que el documento se registro
                let respuestaEncontrado = await encontrarEnBlockchain(hashDocumento);
                while (parseInt(respuestaEncontrado.bloque) === 0) {
                    respuestaEncontrado = await encontrarEnBlockchain(hashDocumento);
                    await sleep(3000);
                }
                moment.locale('es');
                const fechaRegistrado = moment(convertirTimestampAFechaHora(respuestaEncontrado.timestamp));

                try {

                    documentoRegistradoEnBD.fecha = fechaRegistrado;
                    documentoRegistradoEnBD.save();

                } catch (err) { console.log('Error al actualizar la fecha en la BD'); }
                req.flash('alert-success', 'Documento registrado con éxito. Diríjase hacia el final de la página.');
                respuesta = {
                    mensaje: 'Documento registrado con éxito',
                    hash: hashDocumento,
                    timestamp: fechaRegistrado,
                    bloque: respuestaEncontrado.bloque,
                    url: `/documento/imagen/${urlDocumento}`,
                    existe: false,
                    qr: qrCode
                };
                return res.render('registrar', {
                    ventana: true,
                    respuesta,
                    logueado: true,
                    btnCerrar: true,
                    nombrePagina: 'Registrar documento',
                    mensajes: req.flash()
                });
            }

        } else {
            req.flash('alert-danger', 'Solo se admiten archivos .jpg, .png, .pdf, .doc, .docx, .xlsx de máximo 10 MB');
            res.render('registrar', {
                mensajes: req.flash(),
                logueado: true,
                btnCerrar: true,
                nombrePagina: 'Registrar documento'
            });
        }
    } else {
        req.flash('alert-danger', 'Ingrese un archivo a registrar');
        res.render('registrar', {
            mensajes: req.flash(),
            logueado: true,
            btnCerrar: true,
            nombrePagina: 'Registrar documento'
        });
    }
};

// Se ejecuta en /documento/:hash -> Comprobar un documento en la blockchain
const encontrarDocumento = async(req, res) => {
    let respuesta;
    if (!req.files) {
        req.flash('alert-danger', 'Ingrese un archivo a comprobar');
        return res.render('comprobar', {
            mensajes: req.flash(),
            logueado: true,
            btnCerrar: true,
            nombrePagina: 'Comprobar documento'
        });
    }
    const archivo = req.files.imagen;
    if (!((archivo.mimetype === 'image/jpeg' || archivo.mimetype === 'image/png' || archivo.mimetype === 'application/pdf' || archivo.mimetype === 'application/msword') && archivo.size <= 10000000)) {
        req.flash('alert-danger', 'Solo se admiten archivos .jpg, .png, .pdf, .doc de máximo 10 MB');
        return res.render('comprobar', {
            mensajes: req.flash(),
            logueado: true,
            btnCerrar: true,
            nombrePagina: 'Comprobar documento'
        });
    }
    const cripto = crypto.createHash('sha256');
    cripto.update(archivo.data);
    hashDocumento = `0x${cripto.digest('hex')}`;
    const { timestamp, bloque } = await encontrarEnBlockchain(hashDocumento);
    const fechaDeTimestamp = convertirTimestampAFechaHora(timestamp);

    if (parseInt(bloque) === 0) {
        req.flash('alert-danger', 'No se pudo encontrar el documento');
        respuesta = {
            mensaje: 'No se pudo encontrar el documento',
            hash: hashDocumento,
            timestamp: null,
            bloque: null,
            url: null,
            existe: false
        }
        return res.render('comprobar', {
            ventana: true,
            respuesta,
            logueado: true,
            nombrePagina: 'Comprobar documento',
            btnCerrar: true,
            mensajes: req.flash()
        });
    }
    try { // Registro documento con fecha null, porque no esta en la blockchain todavia.
        const documentoBD = await Documentos.findOne({ where: { hash: hashDocumento } });

        // Si quedo con fecha null por un error, pero quedo minado
        if (documentoBD.fecha === null) {
            documentoBD.fecha = fechaDeTimestamp;
            documentoBD.save();
        }
        // Genero QR
        const qrCode = await QRCode.toDataURL(`http://${req.headers.host}/comprobar/${hashDocumento}`);
        req.flash('alert-success', 'Documento encontrado con éxito. Diríjase hacia el final de la página.');
        respuesta = {
            mensaje: 'Documento encontrado con éxito',
            hash: hashDocumento,
            timestamp: fechaDeTimestamp,
            bloque,
            url: `/documento/imagen/${documentoBD.url}`,
            existe: true,
            qr: qrCode
        };
        return res.render('comprobar', {
            ventana: true,
            respuesta,
            logueado: true,
            btnCerrar: true,
            nombrePagina: 'Comprobar documento',
            mensajes: req.flash()
        });
    } catch (err) {
        req.flash('alert-success', 'Documento encontrado con éxito');
        respuesta = {
            mensaje: 'Documento encontrado con éxito',
            hash: hashDocumento,
            timestamp: fechaDeTimestamp,
            bloque,
            url: null,
            existe: true,
            nombrePagina: 'Registrar documento',
            qr: null
        };
        return res.render('comprobar', {
            ventana: true,
            respuesta,
            logueado: true,
            btnCerrar: true,
            nombrePagina: 'Registrar documento',
            mensajes: req.flash()
        });
    }
};

// Obtiene la imagen del documento
const obtenerImagenDocumento = (req, res) => {
    const { url } = req.params;
    res.sendFile(path.join(__dirname, `${process.env.DIR_IMAGENES}${url}`));
};

// Obtiene el pdf firmado del
const obtenerPDF = (req, res) => {
    const { url } = req.params;
    res.sendFile(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_FIRMADOS}${url}`));
};

const formularioDocumentosRegistrados = (req, res) => {
    res.render('documentosRegistrados', {
        logueado: true,
        nombrePagina: 'Documentos registrados',
    });
};

// Formulario documentos registrados por el usuario
const documentosRegistrados = async(req, res) => {
    const fechaDesde = req.body.fechaDesde;
    const fechaHasta = req.body.fechaHasta;
    let documentosRegistradosBD;

    if (fechaDesde === '' || fechaHasta === '') {
        req.flash('alert-danger', 'Ambas fechas son obligatorias');
        return res.render('documentosRegistrados', {
            mensajes: req.flash(),
            logueado: true,
            nombrePagina: 'Documentos registrados'
        });
    }

    if (fechaDesde === fechaHasta) {

        documentosRegistradosBD = await Documentos.findAll({
            where: {
                fecha: {
                    [Op.startsWith]: fechaDesde
                }
            },
            order: [
                ['fecha', 'DESC']
            ]
        });

    } else {
        documentosRegistradosBD = await Documentos.findAll({
            where: {
                fecha: {
                    [Op.between]: [fechaDesde, fechaHasta]
                }
            },
            order: [
                ['fecha', 'DESC']
            ]
        });
    }

    res.render('documentosRegistrados', {
        logueado: true,
        busqueda: true,
        fechaDesde,
        fechaHasta,
        nombrePagina: 'Documentos registrados',
        documentos: documentosRegistradosBD
    });
};


// Comprueba documento por url
const comprobarPorUrl = async(req, res) => {
    let respuesta;
    let logueado = false;
    const { hash } = req.params;
    if (hash.length !== 66) {
        return res.redirect('/');
    }

    if (res.locals.usuario.usuario) {
        logueado = true;
    }

    try {
        const { timestamp, bloque } = await encontrarEnBlockchain(hash);
        if (parseInt(bloque) === 0) {
            respuesta = {
                mensaje: 'No se pudo encontrar el documento',
                hash,
                timestamp: null,
                matricula: null,
                nombre: null,
                bloque: null,
                url: null,
                existe: false
            }
            return res.render('comprobarPorUrl', {
                ventana: true,
                respuesta,
                logueado,
                nombrePagina: 'Comprobar documento'
            });
        }
        const fecha = convertirTimestampAFechaHora(timestamp);
        const encontrado = await Documentos.findOne({ where: { hash } });

        if (encontrado.fecha === null) {
            encontrado.fecha = fecha;
            encontrado.save();
        }
        // Genero QR
        const qrCode = await QRCode.toDataURL(`http://${req.headers.host}/comprobar/${hash}`);
        respuesta = {
            mensaje: 'Documento encontrado con éxito',
            hash,
            timestamp: fecha,
            bloque,
            url: `/documento/imagen/${encontrado .url}`,
            existe: true,
            qr: qrCode

        };
        return res.render('comprobarPorUrl', {
            ventana: true,
            respuesta,
            logueado,
            nombrePagina: 'Comprobar documento'
        });
    } catch {
        res.status(400).render('error', {
            status: 400,
            mensaje: 'Página no encontrada'
        });
    }
};

const generarPDF = async(req, res) => {
    const contenido = req.body.contenido.toString();
    const hashOriginal = req.body.hashDocOriginal;
    let cont = 0;

    if (fs.existsSync(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_FIRMADOS}${hashOriginal}`))) {
        return res.json({ url: `/generar-pdf/${hashOriginal}` });
    }

    pdf.create(contenido).toFile(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`), function(err, res) {
        if (err) {
            console.log(err);
            return res.status(500).json({ error: 'No se pudo crear el archivo con la información' });
        }
    });

    const pdfOriginal = path.join(__dirname, `${process.env.DIR_IMAGENES}${hashOriginal}`);

    if (!fs.existsSync(pdfOriginal)) {
        return res.status(500).json({ error: 'No se encontró el archivo original' });
    }

    while (!fs.existsSync(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`)) || cont > 10) {
        cont++;
        await sleep(1000);
    }

    if (verificarContador(cont)) {
        return res.status(500).json({ error: 'No se encontró el con la información' });
    }

    merge([pdfOriginal, path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`)], path.join(__dirname, `${process.env.DIR_DOCUMENTOS_FIRMADOS}${hashOriginal}`), function(err) {
        if (err) {
            return res.status(500).json({ error: 'No se pudo generar el documento firmado' });
        }
    });

    cont = 0;
    while (!fs.existsSync(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_FIRMADOS}${hashOriginal}`)) || cont > 10) {
        cont++;
        await sleep(1000);
    }

    if (verificarContador(cont)) {
        return res.status(500).json({ error: 'No se encontró el documento firmado' });
    }

    fs.unlink(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`), function(err) {

    });

    return res.json({ url: `/generar-pdf/${hashOriginal}` });

};


module.exports = {
    registrarDocumento,
    encontrarDocumento,
    obtenerImagenDocumento,
    comprobarPorUrl,
    formularioDocumentosRegistrados,
    documentosRegistrados,
    generarPDF,
    obtenerPDF
}