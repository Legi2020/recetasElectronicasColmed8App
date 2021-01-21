const passport = require('passport');
const LocalStrategy = require('passport-local').Strategy;

// Referencia al modelo
const Medicos = require('../models/Medicos');

passport.use(
    new LocalStrategy({
            usernameField: 'matricula',
            passwordFiel: 'password'
        },
        async(matricula, password, done) => {
            try {
                const medico = await Medicos.findOne({ where: { matricula, estado: 1 } });
                // El medico existe, pero el password es incorrecto
                if (!medico.verficarPassword(password, medico.password)) {
                    if (medico.intentos < 3) {
                        medico.intentos = medico.intentos + 1;
                        if (medico.intentos === 3) {
                            medico.bloqueo = Date.now() + 900000;
                            medico.save();
                            return done(null, false, {
                                message: 'Su cuenta fue bloqueada por 15 minutos por 3 reintentos de contraseña fallidos.'
                            });
                        } else {
                            medico.save();
                            return done(null, false, {
                                message: `Intento ${medico.intentos} de 3, al tercer intento su cuenta será bloqueada por 15 minutos. 
                                La contraseña es incorrecta o su cuenta esta deshabilitada. 
                                Comuníquese con su colegio de médicos por favor.`
                            });
                        }
                    } else {
                        return done(null, false, {
                            message: 'Su cuenta fue bloqueada por 15 minutos por 3 reintentos de contraseña fallidos.'
                        });
                    }
                } else {
                    if (medico.bloqueo > Date.now()) {
                        return done(null, false, {
                            message: 'Su cuenta fue bloqueada por 15 minutos por 3 reintentos de contraseña fallidos.'
                        })
                    } else {
                        medico.intentos = 0;
                        medico.bloqueo = null;
                        medico.save();
                        return done(null, medico);
                    }
                }
            } catch (err) {
                // Ese medico no existe
                return done(null, false, {
                    message: 'La matrícula ingresada no se encuentra registrada.'
                })
            };
        }
    )
);

// Serializar el objeto
passport.serializeUser((medico, callback) => {
    callback(null, medico);
});

// Desserializar el objeto
passport.deserializeUser((medico, callback) => {
    callback(null, medico);
});

module.exports = passport;