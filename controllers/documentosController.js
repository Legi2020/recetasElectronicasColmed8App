const crypto = require('crypto');
const tx = require('ethereumjs-tx');
const lightwallet = require('eth-lightwallet');
const txutils = lightwallet.txutils;
const path = require("path");
require('dotenv').config({ path: 'variables-sql-server.env' });
// Modelo de la BD
const Documentos = require('../models/Documentos.js');
const Medicos = require('../models/Medicos.js');
// Conexión con la Blockchain
const { iniciarConexionBlockchain } = require('../config/bc.js');
const { web3, contrato } = iniciarConexionBlockchain();
const abiContrato = require('../abi/contrato.json');
const QRCode = require('qrcode');
const pdf = require('html-pdf');
const merge = require('easy-pdf-merge');
const fs = require('fs');
const http = require('http');


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
            // Modifico la extensión si es un .docx o .xlsx
            if (archivo.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document') {
                extension = 'docx';
            } else if (archivo.mimetype === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet') {
                extension = 'xlsx';
            }
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
                    const { medicoMatricula, url, nombre } = await Documentos.findOne({ where: { hash: hashDocumento } });
                    const medicoBD = await Medicos.findOne({ where: { matricula: medicoMatricula } });
                    req.flash('alert-success', 'Documento ya registrado.  Diríjase hacia el final de la página.');
                    respuesta = {
                        mensaje: 'Documento ya registrado.',
                        hash: hashDocumento,
                        matricula: medicoMatricula,
                        nombre: medicoBD.nombre,
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
                        matricula: null,
                        timestamp: fechaEncontrado,
                        nombre: null,
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
                const documentoRegistradoEnBD = await Documentos.create({ hash: hashDocumento, medicoMatricula: res.locals.usuario.matricula, fecha: null, url: urlDocumento });
                // Consulto hasta que el documento se registro
                let respuestaEncontrado = await encontrarEnBlockchain(hashDocumento);
                while (parseInt(respuestaEncontrado.bloque) === 0) {
                    respuestaEncontrado = await encontrarEnBlockchain(hashDocumento);
                    await sleep(3000);
                }
                const fechaRegistrado = convertirTimestampAFechaHora(respuestaEncontrado.timestamp);
                try {
                    documentoRegistradoEnBD.fecha = fechaRegistrado;
                    documentoRegistradoEnBD.save();
                } catch (err) { console.log('Error al actualizar la fecha en la BD'); }
                req.flash('alert-success', 'Documento registrado con éxito. Diríjase hacia el final de la página.');
                respuesta = {
                    mensaje: 'Documento registrado con éxito',
                    hash: hashDocumento,
                    matricula: res.locals.usuario.matricula,
                    nombre: res.locals.usuario.nombre,
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
            matricula: null,
            nombre: null,
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
        const medicoBD = await Medicos.findOne({ where: { matricula: documentoBD.medicoMatricula } });
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
            matricula: documentoBD.medicoMatricula,
            nombre: medicoBD.nombre,
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
            matricula: null,
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

// Formulario documentos registrados por el usuario
const documentosRegistrados = async(req, res) => {
    const documentosRegistrados = await Documentos.findAll({
        where: { medicoMatricula: res.locals.usuario.matricula },
        order: [
            ['fecha', 'DESC']
        ]
    });
    res.render('documentosRegistrados', {
        logueado: true,
        nombrePagina: 'Documentos registrados',
        documentos: documentosRegistrados
    });
};


// Comprueba documento por url
const comprobarPorUrl = async(req, res) => {
    let respuesta;
    const { hash } = req.params;
    if (hash.length !== 66) {
        return res.redirect('/');
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
                nombrePagina: 'Comprobar documento'
            });
        }
        const fecha = convertirTimestampAFechaHora(timestamp);
        const encontrado = await Documentos.findOne({ where: { hash } });
        const medicoBD = await Medicos.findOne({ where: { matricula: encontrado.medicoMatricula } });
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
            matricula: encontrado.medicoMatricula,
            nombre: medicoBD.nombre,
            bloque,
            url: `/documento/imagen/${encontrado .url}`,
            existe: true,
            qr: qrCode

        };
        return res.render('comprobarPorUrl', {
            ventana: true,
            respuesta,
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

    if (fs.existsSync(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_FIRMADOS}${hashOriginal}`))) {
        console.log('pase')
        return res.json({ url: `/generar-pdf/${hashOriginal}` });
    }

    pdf.create(contenido).toFile(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`), function(err, res) {
        if (err) {
            console.log(err);
            return;
        }
    });

    const pdfOriginal = path.join(__dirname, `${process.env.DIR_IMAGENES}${hashOriginal}`);

    while (!fs.existsSync(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`))) {
        console.log('Todavia no está');
        await sleep(1000);
    }


    merge([pdfOriginal, path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`)], path.join(__dirname, `${process.env.DIR_DOCUMENTOS_FIRMADOS}${hashOriginal}`), function(err) {
        if (err) {
            return console.log(err)
        }
    });

    while (!fs.existsSync(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_FIRMADOS}${hashOriginal}`))) {
        console.log('Todavia no está');
        await sleep(1000);
    }

    fs.unlinkSync(path.join(__dirname, `${process.env.DIR_DOCUMENTOS_INFO}${'info-'+hashOriginal}`));

    return res.json({ url: `/generar-pdf/${hashOriginal}` });

};

/**
 * 
 * FUNCIONES LOCALES
 * 
 */

const registrarEnBlockchain = async(hash) => {
    const { timestamp, bloque } = await encontrarEnBlockchain(hash);
    // Se verifica si ya existe en la blockchain
    if (parseInt(bloque) !== 0 || bloque === null) {
        return obj = {
            hash,
            timestamp,
            bloque,
            existe: true
        };
    }
    await contrato.methods.agregarDocHash(hash).call();
    const resultado = await web3.eth.getTransactionCount(process.env.BC_DIR_CUENTA);
    console.log(await web3.eth.getBlockTransactionCount('pending'))
        /*   web3.eth.getTransaction('pending').then(console.log); */
    let txOptions = {
        nonce: web3.utils.toHex(resultado),
        gasLimit: web3.utils.toHex(800000),
        gasPrice: web3.utils.toHex(20000000000),
        to: process.env.BC_DIR_CONTRATO,
    };
    const rawTx = txutils.functionTx(abiContrato, "agregarDocHash", [hash], txOptions);
    try {
        await sendRaw(rawTx);
        return obj = {
            hash: hash,
            timestamp: 0,
            bloque: 0,
            existe: false
        };
    } catch (err) {
        return obj = {
            hash: hash,
            timestamp: null,
            bloque: null,
            existe: false
        };
    }

};

// Crea la transaccion para luego ser enviada
const sendRaw = (rawTx) => {
    return new Promise((resolve, reject) => {
        const privateKey = new Buffer.from(process.env.BC_KEY_CUENTA, "hex"); //keys.privKey es el archivo json y llama de keys la parte priv
        const transaction = new tx(rawTx);
        transaction.sign(privateKey);
        const serializedTx = transaction.serialize().toString("hex");
        web3.eth.sendSignedTransaction("0x" + serializedTx, function(error, result) {
            if (error) return reject(error);
            resolve(result);
        });
    })
};

// Busca un documento en la blockchain
const encontrarEnBlockchain = (hash) => {
    return new Promise((resolve, reject) => {
        contrato.methods.encontrarDocHash(hash).call((err, res) => {
            if (err) return reject(err);
            resolve({
                timestamp: res[0],
                bloque: res[1]
            });
        })
    })
};

const convertirTimestampAFechaHora = (timestamp) => {
    const fechaArg = new Date(timestamp * 1000).toLocaleDateString("es-AR");
    const horaArg = new Date(timestamp * 1000).toLocaleTimeString("es-AR");
    const fechaSplit = fechaArg.split('/');
    const anio = fechaSplit[2];
    let mes;
    let dia;
    if (fechaSplit[1].length === 1) {
        mes = `0${fechaSplit[1]}`
    } else {
        mes = fechaSplit[1]
    }
    if (fechaSplit[0].length === 1) {
        dia = `0${fechaSplit[0]}`
    } else {
        dia = fechaSplit[0]
    }
    const fechaFinal = `${anio}-${mes}-${dia} ${horaArg}`;
    return fechaFinal;
};

function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
};

module.exports = {
    registrarDocumento,
    encontrarDocumento,
    obtenerImagenDocumento,
    comprobarPorUrl,
    documentosRegistrados,
    generarPDF,
    obtenerPDF
}