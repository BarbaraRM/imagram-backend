const CryptoJS = require("crypto-js"); //Más información: https://www.npmjs.com/package/crypto-js
const bcrypt = require('bcrypt');//Encriptacion para contraseñas

const validaciones = {};

/*Encriptar Datos*/
validaciones.Encriptacion = (data) => {
    return CryptoJS.AES.encrypt(JSON.stringify(data), 'XC#bdsah#DAS1213*SASAQS-2233-*11').toString();
}


/*Esta función permite desencriptar los datos que proviene del servidor FrontEnd*/
validaciones.Desencriptar = (data) => {
    var bytes = CryptoJS.AES.decrypt(data, 'XC#bdsah#DAS1213*SASAQS-2233-*11');
    return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
}


/*Encriptar contraseñas*/
validaciones.EncryptPassword = (password) => {
    try {
        return bcrypt.hashSync(password, bcrypt.genSaltSync(10)); //Recibe la parametro a encryptar y la cantidad de veces que se realizara la encriptacion 
    } catch (error) {
        console.log('Error al encriptar contraseña: ' + error)
    }
}


/*Comparar contraseñas encriptadas*/
validaciones.CompararPassword = (passwordIngresada, passwordUsuario) => {
    try {
        return bcrypt.compareSync(passwordIngresada, passwordUsuario);
        //compara la contraseña ingresada por el formulario, con la que existe en a base de datos, la mismas que estarán encryptadas
        //retorna true si coinciden y false en caso de que no 
    } catch (error) {
        console.log('Error al comparar contraseñas encriptadas: ' + error)
    }
};


validaciones.EstaAutenticado = (req, res, next) => {
    if (req.isAuthenticated()) {
        return next();
    }
    res.status(401).send('No está auntenticado')
}


module.exports = validaciones;