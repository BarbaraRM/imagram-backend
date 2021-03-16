const conexion_pg = require('../dbs/postgresql');
const { Encriptacion, Desencriptar, EncryptPassword, CompararPassword } = require('./validaciones')

const seguidores = {};

/*Cuando un usuario quiere seguir a otro, tiene que pasar dos id, el uno es del usuario
en sesión, y el otro el usuario a seguir, ademas se tendra un estado por defecto ¨PENDIENTE¨
hasta que el usuario a seguir le acepte la solicitud de seguimiento*/


//seguidores.Seguir_a = async (req, res) => {
seguidores.Seguir_a = async (id_user, id_usuarioaseguir) => {
    try {

        //var { id_user, id_usuarioaseguir } = req.body;

        var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_usuarioaseguir]);
        console.log('el usuario respondio a ' + us.rows[0].id_user)
        id_usuarioaseguir = us.rows[0].id_user

        /*Comprobamos si el usuario a seguir existe*/
        var usuarioaseguir = await conexion_pg.query("SELECT id_user from usuarios where id_user = $1;", [id_usuarioaseguir]);

        if (usuarioaseguir.rowCount === 1) {
            console.log("El usuario a seguir si existe");

            /*Si el usuario a seguir exite registramos en la tabla Seguidos a este nuevo usuario,
            pero con un estado de Pendiente, hasta que el usuario a seguir acepte la solicitud */
            var values = [id_user, id_usuarioaseguir, 'PENDIENTE'];
            var registrarUsuarioSeguir = await conexion_pg.query("INSERT INTO seguidos (id_user, follow_to, estado) VALUES ($1, $2, $3);", values);

            if (registrarUsuarioSeguir.rowCount === 1) {

                /*Buscamos los datos de los Usuarios */
                var usuario = await conexion_pg.query("SELECT nombres, apellidos from usuarios where id_user = $1;", [id_user]);
                var usuario_a_seguir = await conexion_pg.query("SELECT nombres, apellidos from usuarios where id_user = $1;", [id_usuarioaseguir]);

                var name_usuario = usuario.rows[0].nombres + ' ' + usuario.rows[0].apellidos;
                var name_usuarioseguir = usuario_a_seguir.rows[0].nombres + ' ' + usuario_a_seguir.rows[0].apellidos;
                console.log(name_usuario + '//' + name_usuarioseguir);

                /*return res.json({
                    result: true,
                    data: {
                        id_user: id_user,
                        id_usuarioaseguir: id_usuarioaseguir,
                        name_usuario: name_usuario,
                        name_usuarioseguir: name_usuarioseguir,
                        estado: 'PENDIENTE',
                    }
                });*/

                return ({ result: true, id_usuarioaseguir: id_usuarioaseguir });

            } else {
                /*return res.json({
                    result: false
                });*/
                return ({ result: false })
            }

        } else {
            res.send('USUARIO_NO_ENCONTRADO')
            //return { result: 'USUARIO_NO_ENCONTRADO' };
        }


    } catch (error) {
        console.log('Error en la función seguir a: ' + error)
    }

}

//seguidores.SolicitudSeguimiento = async (req, res) => {
seguidores.SolicitudSeguimiento = async (id_user_solicita, id_usuarioaseguir, solicitud) => {

    //var { id_user_solicita, id_usuarioaseguir, solicitud } = req.body;
    var actualizarUsuarioSeguir, respuesta, msg;

    try {


        if (solicitud === true) {
            actualizarUsuarioSeguir = await conexion_pg.query("UPDATE seguidos SET estado = $1 WHERE id_user = $2 and follow_to = $3;", ['ACEPTADO', id_user_solicita, id_usuarioaseguir]);
            msg = 'ha aceptado tu solicitud de seguimiento';
            respuesta = 'ACEPTADO'

            /*Como el usuario a seguir (id_usuarioaseguir) aceptó la solicitud,
             el usuario que la envió (id_user) se convierte en un seguidor.*/
            var values = [id_usuarioaseguir, id_user_solicita, 'ACEPTADO'];
            var registrarSeguidor = await conexion_pg.query("INSERT INTO seguidores (id_user, follow_me, estado) VALUES ($1, $2, $3);", values);

            if (actualizarUsuarioSeguir.rowCount === 1) {
                console.log('Seguido actualizado')
            }

            if (registrarSeguidor.rowCount === 1) {
                console.log('Seguidor registrado')
            }
        }

        if (solicitud === false) {
            actualizarUsuarioSeguir = await conexion_pg.query("DELETE FROM seguidos WHERE id_user = $1 and follow_to =$2;", [id_user_solicita, id_usuarioaseguir]);
            msg = 'ha rechazado tu solicitud de seguimiento';
            respuesta = 'RECHAZADO'
            //console.log('funcion eleiminar de seguidos' + actualizarUsuarioSeguir.rowCount)
        }

        //console.log('funcion eleiminar de seguidos' + actualizarUsuarioSeguir.rowCount)
        //if (actualizarUsuarioSeguir.rowCount === 1 && registrarSeguidor.rowCount === 1) {
        if (actualizarUsuarioSeguir.rowCount === 1) {
            console.log(msg);
            /*Buscamos los datos de los Usuarios */
            var usuario = await conexion_pg.query("SELECT nombres, apellidos from usuarios where id_user = $1;", [id_user_solicita]);
            var usuario_a_seguir = await conexion_pg.query("SELECT nombres, apellidos from usuarios where id_user = $1;", [id_usuarioaseguir]);

            var name_usuario_solicita = usuario.rows[0].nombres + ' ' + usuario.rows[0].apellidos;
            var name_usuario_seguir = usuario_a_seguir.rows[0].nombres + ' ' + usuario_a_seguir.rows[0].apellidos;
            //console.log(name_usuario_solicita + '//' + name_usuario_seguir);

            /*return res.json({
                result: true,
                data: {
                    id_user_solicita: id_user_solicita,
                    id_usuarioaseguir: id_usuarioaseguir,
                    name_usuario_solicita: name_usuario_solicita,
                    name_usuario_seguir: name_usuario_seguir,
                    estado: respuesta,
                    mensaje: msg
                }
            });*/


            return ({
                result: true,
                data: {
                    id_user_solicita: id_user_solicita,
                    id_usuarioaseguir: id_usuarioaseguir,
                    name_usuario_solicita: name_usuario_solicita,
                    name_usuario_seguir: name_usuario_seguir,
                    estado: respuesta,
                    mensaje: msg
                }
            });

        } else {
            /*return res.json({
                result: false,
                data: {
                    estado: 'ERROR',
                }
            });*/

            return ({
                result: false,
                data: {
                    estado: 'ERROR',
                }
            });
        }

    } catch (error) {
        console.log('Error en la función friends_controller.SolicitudSeguimiento: ' + error);
    }

}


seguidores.Sugerencias = async (req, res) => {
    try {

        //var { id_user } = req.body;
        var id_user = req.params.id;

        var ciudad = await conexion_pg.query("SELECT id_ciudad from usuarios where id_user = $1;", [id_user]);
        var suge = await conexion_pg.query("select concat(nombres,' ',apellidos) as nombres, usuario, url_foto_perfil from usuarios where id_ciudad = $1;", [ciudad.rows[0].id_ciudad]);
        console.log('sugerencias', suge.rows)

        if (suge.rowCount !== 0) {
            return ({
                result: true,
                data: suge.rows
            });

        } else {
            return ({
                result: false,
                data: 'No hay sugerencias en este momento'
            });
        }

    } catch (error) {

    }

}
module.exports = seguidores;