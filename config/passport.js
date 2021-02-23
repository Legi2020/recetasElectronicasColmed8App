const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Referencia al modelo
const Usuario = require('../models/Usuarios');

passport.use(
    new LocalStrategy({
            usernameField: 'usuario',
            passwordFiel: 'password'
        },
        async(usuario, password, done) => {
            try {
                const usuarioBD = await Usuario.findOne({ where: { usuario, estado: 1 } });

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
passport.serializeUser((usuario, callback) => {
    callback(null, usuario);
});

// Desserializar el objeto
passport.deserializeUser((usuario, callback) => {
    callback(null, usuario);
});

module.exports = passport;