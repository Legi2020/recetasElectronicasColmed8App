const express = require('express');
const { router } = require('./routes');
const db = require('./config/db.js');
const bodyParser = require('body-parser');
const flash = require('connect-flash');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const passport = require('./config/passport');
const exphbs = require('express-handlebars');
const fileUpload = require('express-fileupload');
const expressValidator = require('express-validator');
const createError = require('http-errors');
const path = require('path');

/** Importante sino la fecha se guarda con 1 dia menos en la BD */
const moment = require('moment-timezone');
moment.tz.setDefault('UTC');
moment.locale('es');

const app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json());

// Habilito el file upload
app.use(fileUpload());

// Habilito la validacion de campos
app.use(expressValidator());

// Archivos publicos
app.use(express.static('public'));

// Habilitar el motor de plantillas
app.engine('handlebars', exphbs({
    defaultLayout: 'layout',
    helpers: require('./helpers/handlebars'),
    partialsDir: path.join(app.get('views'), 'partials')
}));
app.set('view engine', 'handlebars');

// Sesiones nos permiten navegar entre distintas paginas sin volvernos a autenticar
app.use(session({
    secret: 'supersecreto',
    resave: false,
    saveUninitialized: false
}));

// Conexión con la BD
require('./models/Admins');
require('./models/Documentos');
db.sync()
    .then(() => console.log('Base de datos conectada.'))
    .catch(error => console.log(error));


app.use(cookieParser());

// Passport
app.use(passport.initialize());
app.use(passport.session());

// Habilito el flash message
app.use(flash());
// Variables locales
app.use((req, res, next) => {
    res.locals.mensajes = req.flash();
    res.locals.usuario = {...req.user } || null;
    next();
});

// Rutas
app.use('/', router);

// Error 404 pagina no encontrada
app.use((req, res, next) => {
    next(createError(404, 'No encontrado'));
});

// Administración de los errores
app.use((error, req, res, next) => {
    const status = error.status || 500;
    res.locals.mensaje = error.message;
    res.locals.status = status;
    res.status(status);
    res.render('error');
});

const puerto = process.env.PORT || 3200;

app.listen(puerto, () => { console.log(`Aplicacion corriendo en puerto ${puerto}.`) });