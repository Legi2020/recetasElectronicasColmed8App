const Web3 = require('web3');
const abiContrato = require('../abi/contrato.json');
require('dotenv').config({ path: 'variables-rink.env' });


const iniciarConexionBlockchain = () => {
    /* const provider = new Web3.providers.HttpProvider(`https://rinkeby.infura.io/v3/${process.env.BC_INFURA_KEY}`); */
    const provider = new Web3.providers.HttpProvider(process.env.BC_DIR_URL);
    const web3 = new Web3(provider);
    const contrato = new web3.eth.Contract(abiContrato, process.env.BC_DIR_CONTRATO);
    return {
        web3,
        contrato
    }
};

module.exports = { iniciarConexionBlockchain };