const multer = require('multer')
const path = require('path');

//Permite la configuracion de la vairable de entorno
require('dotenv').config()

//Obtiene fecha de subida de la imagen
var f = new Date();
var file_fecha_subida = (f.getFullYear() + "_" + (f.getMonth() + 1) + "_" + f.getDate());



const storage_publicacion = multer.diskStorage({

    /*
    La publicación será almacenada en el servidor en la ubicación específicada para cada tipo (imagen|video).
    La carpetas deben ser creadas manualmente antes de subir la aplicación a producción
    */
    destination: function (req, file, cb) {
        var file_type = path.extname(file.originalname);

        if (file_type === '.mp4') {
            cb(null, process.env.HOME + '/publicaciones/chat/videos')
        }

        if (file_type === '.jpg' || file_type === '.png' || file_type === '.jpeg') {
            cb(null, process.env.HOME + '/publicaciones/chat/imagenes')
        }
    },

    /*
    El nombre que tedrá el archivo de la publicación estará determinado por: 
        1. Tipo de publicación (imagen|video) --> file_name
        2. ID del usuario --> file_userid
        3. Fecha de subida (año_mes_dia) --> file_fecha_subida
        4. Hora en Milisegundos --> Date.now()
        5. Extensión del archivo --> file_type
    */
    filename: function (req, file, cb) {
        console.log(req.params.id)
        var file_type = path.extname(file.originalname);
        var file_name;
        var ides = req.params.id.split('.')
        console.log(ides[0])
        var file_userid = ides[0] + '_';
        //var file_userid = req.params.id + '_';

        if (file_type === '.mp4') {
            file_type = '.mp4'
            file_name = 'vid_';
        }

        if (file_type === '.jpg' || file_type === '.png' || file_type === '.jpeg') {
            file_type = '.jpg'
            file_name = 'img_';
        }

        cb(null, file_name + file_userid + file_fecha_subida + '_' + Date.now() + file_type)
    }

})

//Configuración de preferencias para la subida de imagenes
const upload_publicacion = multer({
    storage: storage_publicacion,
    limits: { fileSize: 5000000 },
    fileFilter: (req, file, cb) => {
        const filetypes = /jpeg|jpg|png|mp4/
        const mimetype = filetypes.test(file.mimetype);
        const extension_file = filetypes.test(path.extname(file.originalname))
        //console.log('llego donde se sube')
        if (mimetype && extension_file) {
            return cb(null, true)
        }
        else {
            //console.log('FORMATO NO ADMITIDO')
            return cb(false)
        }
    }

})


module.exports = upload_publicacion;

