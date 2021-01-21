const emailConfig = require('../config/email');
const nodemailer = require('nodemailer');
const hbs = require('nodemailer-express-handlebars');
const util = require('util');

let transport = nodemailer.createTransport({
    host: emailConfig.host,
    port: emailConfig.port,
    auth: {
        user: emailConfig.user,
        pass: emailConfig.pass
    }
});

transport.use('compile', hbs({
    viewEngine: {
        extName: '.handlebars',
        partialsDir: __dirname + '/../views/emails',
        layoutsDir: __dirname + '/../views/emails',
        defaultLayout: 'reset.handlebars',
    },
    viewPath: __dirname + '/../views/emails',
    extName: '.handlebars'
}));

const enviar = async(opciones) => {
    const opcionesEmail = {
        from: 'Legitime <noreply@legitime.com',
        to: opciones.usuario.email,
        subject: opciones.subject,
        template: opciones.archivo,
        context: {
            resetUrl: opciones.resetUrl
        }
    };
    const sendEmail = util.promisify(transport.sendMail, transport);
    return sendEmail.call(transport, opcionesEmail);
};


module.exports = {
    enviar
}