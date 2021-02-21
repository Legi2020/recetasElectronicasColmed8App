const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Referencia al modelo
const Admin = require('../models/Admins');

passport.use(
    new LocalStrategy({
            usernameField: 'usuario',
            passwordFiel: 'password'
        },
        async(usuario, password, done) => {
            try {
                const usuarioBD = await Admin.findOne({ where: { usuario } });

                // El usuario existe, pero el password es incorrecto
                if (!usuarioBD.verficarPassword(password, usuarioBD.password)) {
                    return done(null, false, {
                        message: 'El usuario no existe o la contraseña es incorrecta.'
                    })
                };
                return done(null, usuarioBD);
            } catch (err) {
                // Ese usuario no existe
                return done(null, false, {
                    message: 'El usuario no existe o la contraseña es incorrecta.'
                })
            };
        }
    )
);

// Serializar el objeto
passport.serializeUser((admin, callback) => {
    callback(null, admin);
});

// Desserializar el objeto
passport.deserializeUser((admin, callback) => {
    callback(null, admin);
});

module.exports = passport;