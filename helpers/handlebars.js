const moment = require('moment');
module.exports = {
    mostrarAlertas: (errores = {}, alertas) => {
        const categoria = Object.keys(errores);
        let html = '';
        if (categoria.length) {
            errores[categoria].forEach(error => {
                html += `<div class="alert ${categoria} mb-0 mt-1 text-center" role="alert">${error}</div>`
            })
        }
        return alertas.fn().html = html;
    },
    mostrarFecha: (fechaEntrada, fechaSalida) => {
        moment.locale('es');
        fechaSalida = moment(fechaEntrada).format('LLLL');
        return fechaSalida;
    },
    mostrarFechaAgo: (fechaEntrada, fechaSalida) => {
        moment.locale('es');
        fechaSalida = moment(fechaEntrada).fromNow();
        return fechaSalida;
    },
    mostrarFechaSinDia: (fechaEntrada, fechaSalida) => {
        moment.locale('es');
        fechaSalida = moment(fechaEntrada).format('l') + ' ' + moment(fechaEntrada).format('LT');
        return fechaSalida;
    },
    mostrarIndice: (index) => {
        return index + 1;
    },
    mostrarFirmante: (firmante) => {
        if (firmante === 'presidente') {
            return 'Dr. Eduardo Diaz Mena<br> Presidente<br>'
        } else if (firmante === 'secretaria') {
            return 'Dra. Graciela Susana Ridao<br> Secretaria<br>'
        } else {
            return 'Dr. Eduardo Diaz Mena - Presidente<br>Dra. Graciela Susana Ridao - Secretaria<br>'
        }
    }
};