// instalamos: npm install passport passport-local
// importamos los modulos
import passport from "passport";
import local, { Strategy } from "passport-local";
// Traemos UserModel y las funciones de Bcrypt:
import UserModel from "../models/user.model.js";
import { createHash, isValidPassword } from "../utils/bcrypt.js";
// Trabajamos con GitHub
import GitHubStrategy from "passport-github2";
// Nueva estrategia con google
import GoogleStrategy from "passport-google-oauth20";

const LocalStrategy = local.Strategy;

const initializePassport = () => {
    passport.use("register", new LocalStrategy({
        // Le digo que quiero tener acceso al objeto request
        passReqToCallback: true,
        usernameField: "email"
    }, async(req, username, password, done) =>{
        const { first_name, last_name, email, age } = req.body;
        try {
            // Verificamos que ya existe un registro con ese email
            let user = await UserModel.findOne({ email });
            if(user) return done(null, false);

            // Pero si no existe, voy a crear un registro de usuario nuevo
            let newUser = {
                first_name,
                last_name,
                email,
                age,
                password: createHash(password)
            };

            let result = await UserModel.create(newUser);
            // Si todo resulta bien, mandamos done con el usuario generado
            return done(null, result);
        } catch (error) {
            return done(error);
        }
    }));

    // agregamos otra estrategia mas, ahora para el login
    passport.use("login", new LocalStrategy(
        { usernameField: "email" },
        async (email, password, done) => {
            try {
                const usuario = await UserModel.findOne({ email });
                if (!usuario) {
                    return done(null, false, { message: "Usuario no encontrado" });
                }
    
                if (!isValidPassword(password, usuario.password)) {
                    return done(null, false, { message: "Contraseña incorrecta" });
                }
    
                return done(null, usuario);
            } catch (error) {
                return done(error);
            }
        }
    ));
    
    passport.serializeUser((user, done) => {
        done(null, user._id);
    });

    passport.deserializeUser( async(id, done) => {
        let user = await UserModel.findById({ _id: id })
        done(null, user);
    });

    // Aca desarrollamos la nueva estrategia con github
    passport.use("github", new GitHubStrategy({
        clientID: "Iv23lizQhc9o6sNhaDyO",
        clientSecret: "fe905388e30465a56e4fe04cded279269167ad7a",
        callbackURL: "http://localhost:8080/api/sessions/githubcallback"
    }, async (accessToken, refreshToken, profile, done) => {
        // Recomendado! Mostrar el perfil por consola para conocer los datos que me llegan.
        console.log("Profile", profile);
        try {
            let user = await UserModel.findOne({ email: profile._json.email });
            if(!user) {
                let newUser = {
                    first_name: profile._json.name,
                    last_name: "",
                    age: 37,
                    email: profile._json.email,
                    password: ""
                }
                let result = await UserModel.create(newUser);
                done(null, result);
            } else {
                done(null, user);
            }
        } catch (error) {
            done(error);
        }
    }));

    // Nueva estrategia con google
    passport.use("google", new GoogleStrategy({
        clientID: "203335197884-9dcsf4oaabrrfaf3ks1ar95fb43tbd4e.apps.googleusercontent.com",
        clientSecret: "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",
        callbackURL: "http://localhost:8080/api/sessions/googlecallback"
    }, async(accessToken, refreshToken, profile, done) => {
        // Recomendado! Mostrar el perfil por consola para conocer los datos que me llegan.
        console.log("Profile Google:", profile);
        try {
            let user = await UserModel.findOne({ email: profile._json.email });
            if(!user) {
                let newUser = {
                    first_name: profile._json.given_name,
                    last_name: profile._json.family_name,
                    age: 37,
                    email: profile._json.email,
                    password: ""
                }
                let result = await UserModel.create(newUser);
                done(null, result);
            } else {
                done(null, user);
            }
        } catch (error) {
            done(error);
        }
    }));
};

export default initializePassport;