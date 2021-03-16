//"use strict";
const nodemailer = require("nodemailer");
require('dotenv').config() //Permite obtener datos de variables de entorno .env
const verificacion_email = {};


// async..await is not allowed in global scope, must use a wrapper
verificacion_email.EnviarCorreoVerificacion = async (usuario, email) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        //port: 587,
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_SERVER,//'imagram.inc@gmail.com',// testAccount.user, // generated ethereal user
            pass: process.env.PASS_SERVER//'imagraminc98',//testAccount.pass, // generated ethereal password
        },
    });
    //en caso de que se vuelva a bloquear el correo
    //https://support.google.com/mail/answer/7126229?p=BadCredentials&visit_id=637401456524516004-1730768068&rd=2&authuser=0


    //var usuario = 'Donnis'
    var code = verificacion_email.GenerarCodigoVerificacion()

    var body = ` \
    <div>\
        <b> Bienvenido a Imagram</b>  \
        <p>Quienes formamos el equipo de Imagram te damos la bienvenida ${usuario}</p> \
        <p>Para poder comenzar a utilizar todas funciones de Imagram debes activar tu cuenta, para ello debes ingresar el siguiente código: <b>${code}</b></p> \
    </div >`

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'imagram.inc@gmail.com', // sender address
        to: email, // list of receivers
        subject: "Hello ✔", // Subject line
        //text: "Hello world?", // plain text body
        html: body, // html body
    });


    if (info) {
        console.log("Message sent: %s", info.messageId);
        return code;
    } else {
        onsole.log("Message not sent");
        return '';
    }

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}


verificacion_email.EnviarCorreoRecuperacion = async (email) => {

    // create reusable transporter object using the default SMTP transport
    let transporter = nodemailer.createTransport({
        host: "smtp.gmail.com",
        //port: 587,
        port: 465,
        secure: true, // true for 465, false for other ports
        auth: {
            user: process.env.EMAIL_SERVER,//'imagram.inc@gmail.com',// testAccount.user, // generated ethereal user
            pass: process.env.PASS_SERVER//'imagraminc98',//testAccount.pass, // generated ethereal password
        },
    });
    
    var code = verificacion_email.GenerarCodigoVerificacion()

    var body = ` \
    <div>\
        <b> Bienvenido a Imagram</b>  \
        <p>Quienes formamos el equipo de Imagram te damos un saludo</p> \
        <p>Para recuperar tu cuenta de Imagram debes ingresar el siguiente código: <b>${code}</b></p> \
    </div >`

    // send mail with defined transport object
    let info = await transporter.sendMail({
        from: 'imagram.inc@gmail.com', // sender address
        to: email, // list of receivers
        subject: "Recupera ✔", // Subject line
        //text: "Hello world?", // plain text body
        html: body, // html body
    });


    if (info) {
        console.log("Mensaje enviado %s", info.messageId);
        return code;
    } else {
        onsole.log("Mensaje no enviado");
        return '';
    }

    // Message sent: <b658f8ca-6296-ccf4-8306-87d57a0b4321@example.com>

    // Preview only available when sending through an Ethereal account
    //console.log("Preview URL: %s", nodemailer.getTestMessageUrl(info));
    // Preview URL: https://ethereal.email/message/WaQKMgKddxQDoou...
}


verificacion_email.GenerarCodigoVerificacion = () => {

    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var lon = 5//20;
    code = "";

    for (x = 0; x < lon; x++) {
        rand = Math.floor(Math.random() * chars.length);
        code += chars.substr(rand, 1);
    }

    return code;
    //res.send(code);
}

module.exports = verificacion_email;