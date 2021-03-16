const conexion_pg = require('../dbs/postgresql');
const notificaciones = {};


//notificaciones.RegistrarNotificacion = async (req, res) => {
notificaciones.RegistrarNotificacion = async (id_publicacion, from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not) => {
    try {

        //var { id_publicacion, from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not } = req.body;
        var values;

        /*if (tipo_notificacion === 'SEGUIR_A') {
            console.log('llego aqui')

            sql = "INSERT INTO notificaciones (from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not) VALUES ($1, $2, $3, $4, $5, $6);";
            values = [from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not];
        } else {
            sql = "INSERT INTO notificaciones (id_publicacion, from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not) VALUES ($1, $2, $3, $4, $5, $6, $7);";
            values = [id_publicacion, from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not];
        }*/

        sql = "INSERT INTO notificaciones (id_publicacion, from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not) VALUES ($1, $2, $3, $4, $5, $6, $7);";
        values = [id_publicacion, from_usuario, to_usuario, descripcion, tipo_notificacion, estado, fecha_not];

        var notificacion = await conexion_pg.query(sql, values);

        if (notificacion.rowCount === 1) {

            /*return res.json({
                result: true,
            });*/

            return true;
        } else {
            /*return res.json({
                result: false
            });*/
            return false;
        }

    } catch (error) {
        console.log('Error en la función seguir a: ' + error)
    }
}

notificaciones.EliminarNotificacion = async (from_usuario, to_usuario, tipo_notificacion) => {
    try {
        var values;
        sql = "DELETE FROM notificaciones where from_usuario = $1 and to_usuario= $2 and tipo_notificacion = $3;";
        values = [from_usuario, to_usuario, tipo_notificacion];

        var notificacion = await conexion_pg.query(sql, values);

        if (notificacion.rowCount === 1) {

            /*return res.json({
                result: true,
            });*/

            return true;
        } else {
            /*return res.json({
                result: false
            });*/
            return false;
        }

    } catch (error) {
        console.log('Error en la función seguir a: ' + error)
    }
}

//notificaciones.ObtenerNotificaciones = async (req, res) => {
notificaciones.ObtenerNotificaciones = async (to_usuario) => {

    try {

        //var { to_usuario} = req.body;
        var values;

        sql = "SELECT n.*,\
        (SELECT  u.usuario from usuarios u where n.from_usuario = u.id_user) as name_from_usuario,\
        (SELECT  u.usuario from usuarios u where n.to_usuario = u.id_user) as name_to_usuario\
        from notificaciones n where n.to_usuario = $1 order by fecha_not DESC ;";

        values = [to_usuario];

        var notificacion = await conexion_pg.query(sql, values);

        if (notificacion.rowCount !== 0) {

            /*return res.json({
                result: true,
                data: notificacion.rows,
            });*/
            return ({
                result: true,
                data: notificacion.rows
            });
        } else {
            /*return res.json({
                result: false
            });*/
            console.log(notificacion)
            return ({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función Obtener Notificaciones: ' + error)
    }

}

module.exports = notificaciones;