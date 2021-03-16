const conexion_pg = require('../dbs/postgresql');
const historias = {};
const path = require('path')
require('dotenv').config() //Configuracion de la vairable de entorno



historias.PublicarHistoria = async(req, res) => {
    var ides = req.params.id.split('.')
    var id_user = ides[0];
    var descripcion = ides[2];
    console.log(ides)
    var file = req.file;

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
                var url = host + ':' + port + '/public/historias/videos/' + file_name;
            }

            if (file_type === '.jpg' || file_type === '.png' || file_type === '.jpeg') {
                var url = '' + host + ':' + port + '/public/historias/imagenes/' + file_name;
            }

            var f = new Date();
            const fecha_subida = (f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate() + ' ' + f.getHours() + ':' + f.getMinutes() + ':' + f.getSeconds());

            console.log('Historia guardada en: ' + url)

            //var values = [req.body.id_user, req.body.fecha_subida, req.body.descripcion, url];

            var values = [id_user, fecha_subida, descripcion, url];
            var historia = await conexion_pg.query("INSERT INTO historias (id_user, fecha_pub, descripcion, url_historia) VALUES ($1, $2, $3, $4);", values);
            if (historia.rowCount === 1) {
                res.json({
                    result: true
                })
            } else {
                res.json({
                    result: false
                })
            }
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.UploadHistoria ' + error)
    }



}

historias.EliminarHistorias = async(req, res) => {
    var { id_historia, id_user } = req.body;
    console.log(id_historia, id_user)
    var comentario = await conexion_pg.query("DELETE FROM historias WHERE id_historia=$1 and id_user=$2;", [id_historia, id_user]);
    if (comentario) {
        return res.json({
            result: true
        });
    } else {
        return res.json({
            result: false,
        });
    }
}

historias.ObtenerHistorias = async(id_user) => {
    try {
        //console.log(id_user);
        var sql = "SELECT h.*, us.usuario as publicada_por, us.url_foto_perfil, \
                ((extract (epoch from(current_timestamp::timestamp - h.fecha_pub::timestamp))))::integer/60 as minutos,\
                (SELECT count(vh.id_view) FROM views_historias vh WHERE vh.id_historia = h.id_historia AND vh.id_user = $1) AS visto \
                FROM historias h, usuarios us \
                WHERE  us.id_user = h.id_user AND h.id_user IN(SELECT s.follow_to FROM seguidos s WHERE s.id_user = $1) ORDER BY h.id_user, h.fecha_pub;";
        var historias = await conexion_pg.query(sql, [id_user]);
        if (historias.rowCount !== 0) {

            return ({ result: true, data: historias.rows })
        } else {
            return ({ result: false })
        }
    } catch (error) {
        console.log('Error en la función historias_controller.ObtenerHistorias' + error)
    }
}

historias.ObtenerMisHistorias = async(id_user) => {
    try {
        var sql = "SELECT h.*, us.usuario as publicada_por, us.url_foto_perfil, \
       (date_part('day' ,now()-h.fecha_pub)*1440 + date_part('hours' ,now()-h.fecha_pub)*60) as minutos,\
       (SELECT count(vh.id_user) FROM views_historias vh WHERE vh.id_historia = h.id_historia) AS cantVistas\
       FROM historias h, usuarios us \
       WHERE  h.id_user = us.id_user AND h.id_user = $1 ORDER BY h.id_historia;";
        var historias = await conexion_pg.query(sql, [id_user]);
        if (historias.rowCount !== 0) {
            return ({ result: true, data: historias.rows })
        } else {
            return ({ result: false })
        }
    } catch (error) {
        console.log('Error en la función historias_controller.ObtenerMisHistorias' + error)
    }
}

//socket
historias.RegistrarVista = async(id_historia, id_user) => {
    try {
        //var { id_historia, id_user } = req.body;
        var historia = await conexion_pg.query("SELECT id_historia, id_user from historias where id_historia = $1;", [id_historia]);
        if (historia.rowCount === 1) {
            var vista = await conexion_pg.query("INSERT INTO views_historias (id_user, id_historia, fecha_vista) VALUES ($1, $2, now());", [id_user, id_historia]);
            if (vista.rowCount === 1) {
                return ({ result: true })
            } else {
                return ({ result: false })
            }

        } else {
            return res.json({ result: false, info: "La publicación ya no existe" })
                //return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.VistaHistoria' + error)
    }

}

historias.ObtenerVistas = async(req, res) => {

    try {
        var { id_historia } = req.body;
        var historia = await conexion_pg.query("SELECT id_historia from historias where id_historia = $1;", [id_historia]);
        if (historia.rowCount === 1) {
            var sql = "SELECT vh.id_view, vh.id_user, vh.id_historia, vh.fecha_vista, us.usuario, us.url_foto_perfil\
            FROM views_historias vh, usuarios us\
            where vh.id_user = us.id_user and vh.id_historia = $1;";

            var vista = await conexion_pg.query(sql, [id_historia]);

            if (vista.rowCount !== 0) {

                return res.json({
                    result: true,
                    data: vista.rows
                });

                //return ({ result: true, id_user: publicacion.rows[0].id_user });

            } else {
                return res.json({
                    result: false,
                });

                //return ({ result: false });
            }

        } else {
            return res.json({ result: false, info: "La publicación ya no existe" })
                //return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.VistaHistoria' + error)
    }
}


module.exports = historias;