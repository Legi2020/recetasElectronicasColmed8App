const tx = require('ethereumjs-tx');
const lightwallet = require('eth-lightwallet');
const txutils = lightwallet.txutils;
// Conexión con la Blockchain
const { iniciarConexionBlockchain } = require('../config/bc.js');
const { web3, contrato } = iniciarConexionBlockchain();
const abiContrato = require('../abi/contrato.json');

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

const verificarContador = (contador) => {
    return contador > 10;
};

module.exports = {
    registrarEnBlockchain,
    sendRaw,
    encontrarEnBlockchain,
    convertirTimestampAFechaHora,
    sleep,
    verificarContador
}