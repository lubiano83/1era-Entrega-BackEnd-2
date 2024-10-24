import UserService from "../services/user.service.js";
import { createHash } from "../utils/bcrypt.js";
import UserDTO from "../dto/user.dto.js";

const userService = new UserService();

class UserController {

    registerUser = async(req, res) => {
        const { firstName, lastName, email, age, password } = req.body;

        try {
            if(!firstName || !lastName || !email || !age || !password) {
                return res.status(400).json({ message: "Todos los campos son requeridos.." });
            }

            const updatedData = {
                firstName,
                lastName,
                email,
                age,
                password: createHash(password),
            };

            await userService.registerUser(updatedData);
            res.redirect("/");
        } catch (error) {
            respuesta(res, 500, "Error al registrar un usuario..");
        }
    };

    loginUser = async(req, res) => {
        const { email, password } = req.body;

        try {
            if (!email || !password) {
                return res.status(400).json({ message: "Todos los campos son necesarios." });
            }

            const token = await userService.loginUser({ email, password });

            res.cookie("coderCookieToken", token, { maxAge: 3600000, httpOnly: true });
            res.redirect("/api/sessions/current");
        } catch (error) {
            respuesta(res, 500, "Error al hacer login de usuario..");
        }
    };

    logoutUser = async(req, res) => {
        res.clearCookie("coderCookieToken");
        res.redirect("/");
    };

    currentUser = (req, res) => {
        if(req.user) {
            const user = req.user;
            const userDto = new UserDTO(user);
            res.render("home", { usuario: userDto });
        } else {
            res.send("No autorizado..");
        }
    };

    renderLogin = (req, res) => {
        if (req.cookies.coderCookieToken) {
            return res.redirect("/api/sessions/current");
        }
        res.render("login");
    };

    renderRegister = (req, res) => {
        if (req.cookies.coderCookieToken) {
            return res.redirect("/api/sessions/current");
        }
        res.render("register");
    };

    renderProfile = (req, res) => {
        const user = req.user;
        const userDto = new UserDTO(user);
        res.render("profile", { user, usuario: userDto });
    };
}

export default UserController;