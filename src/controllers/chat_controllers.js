const conexion_pg = require('../dbs/postgresql');
const path = require('path')
const chat = {};

chat.RegistrarMensaje = async (from_usuario, mensaje, to_usuario, fecha) => {


    try {
        var mensaje_r = await conexion_pg.query("INSERT INTO chat (from_usuario, mensaje, to_usuario, fecha, envio, tipo) VALUES ($1, $2, $3, $4, $5, $6);", [from_usuario, mensaje, to_usuario, fecha, from_usuario, 'TEXTO']);
        if (mensaje_r.rowCount === 1) {
            return { result: true };
        } else {
            return { result: false };
        }

    } catch (error) {
        console.log('Error en la funcion RegistrarMensaje')
    }

}


chat.RegistrarMensajeImagen = async (req, res) => {

    var ides = req.params.id.split('.')
    var from_usuario = ides[1];
    var to_usuario = ides[2];
    var f = new Date();
    var fecha = (f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate() + ' ' + f.getHours() + ':' + f.getMinutes() + ':' + f.getSeconds());
    var file = req.file

    try {

        if (file === undefined) {
            res.json({
                result: false
            })
        } else {
            const host = process.env.APP_HOST;
            const port = process.env.APP_PORT;

            var file_name = file.filename
            var file_type = path.extname(file.originalname);


            if (file_type === '.mp4') {
                var url = host + ':' + port + '/public/chat/videos/' + file_name;
                var tipo = 'VIDEO'
            }

            if (file_type === '.jpg' || file_type === '.png' || file_type === '.jpeg') {
                var url = '' + host + ':' + port + '/public/chat/imagenes/' + file_name;
                var tipo = 'IMAGEN'
            }

            console.log('Publicación guardada en: ' + url)

            var mensaje = url;

            var mensaje_r = await conexion_pg.query("INSERT INTO chat (from_usuario, mensaje, to_usuario, fecha, envio, tipo) VALUES ($1, $2, $3, $4, $5, $6);", [from_usuario, mensaje, to_usuario, fecha, from_usuario, tipo]);
            if (mensaje_r.rowCount === 1) {
                return res.json({ result: true });
            } else {
                return res.json({ result: false });
            }
        }
    } catch (error) {
        console.log('Error en la funcion EnviarMensajeImagen' + error)
    }

}



chat.ObtenerMensajes = async (from_usuario, to_usuario) => {

    try {
        var mensajes = await conexion_pg.query("SELECT * FROM chat WHERE (from_usuario  = $1 AND to_usuario = $2) OR (to_usuario = $1 and from_usuario=$2) order by fecha ASC", [from_usuario, to_usuario]);
        console.log(mensajes.rows[0])
        if (mensajes.rowCount !== 0) {
            return { result: true, data: mensajes.rows };
        } else {
            return { result: false };
        }

    } catch (error) {
        console.log('Error en la funcion ObtenerMensaje')
    }

}


chat.BandejaEntrada = async (id_user) => {

    try {
        console.log('Este es el usuario que llega ' + id_user)
        var sql = "select c.from_usuario, u.usuario, concat(u.nombres,' ', u.apellidos) as nombres, u.url_foto_perfil from chat c, usuarios u where c.to_usuario = $1  and u.id_user = c.from_usuario group by c.from_usuario, u.usuario, u.nombres, u.apellidos, u.url_foto_perfil;";
        var bandeja = await conexion_pg.query(sql, [id_user]);
        console.log('bandeja', bandeja.rows)
        if (bandeja.rowCount !== 0) {
            return { result: true, data: bandeja.rows };
        } else {
            return { result: false };
        }

    } catch (error) {
        console.log('Error en la funcion bandeja de entrada' + error)
    }
}

module.exports = chat;