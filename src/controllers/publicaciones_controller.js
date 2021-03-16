require('dotenv').config() //Configuracion de la vairable de entorno
var fs = require('fs'); //Eliminar Archivos

const conexion_pg = require('../dbs/postgresql');
const path = require('path')

const publicaciones = {};

const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

publicaciones.UploadPublicacion = async (req, res) => {

    /*
    Luego de que el archivo se almacene en el servidor mediante en el middleware (upload_pub_img) el archivo (file) llegará a
    esta función, donde en caso de que sea "undefined" significará que el usuario ingresó un archivo con formato no válido o 
    que ha excedido el tamaño permitido, esto tambien indica que el archivo no se almacenó y por lo tanto se aborta esta función
    dando como respuestas "false".
    Si el archivo NO es undefined, se procede a extraer el nombre y su extensión (.jpg .mp4) esta ultima permitirá conocer la ruta
    donde se encuentra almacenado en el servidor y también junto a otros parámetros definirán la ruta a almacenarse en la BD. Si 
    el registro es exitoso el servidor dará como respuesta "true".
    */

    var ides = req.params.id.split('.')
    var id_user = ides[0];
    var descripcion = ides[2];
    var hashtags = ides[1];
    console.log('los ides son ' + ides)
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
                var url = host + ':' + port + '/public/videos/' + file_name;
            }

            if (file_type === '.jpg' || file_type === '.png' || file_type === '.jpeg') {
                var url = '' + host + ':' + port + '/public/imagenes/' + file_name;
            }

            var f = new Date();
            const fecha_subida = (f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate() + ' ' + f.getHours() + ':' + f.getMinutes() + ':' + f.getSeconds());

            console.log('Publicación guardada en: ' + url)
            var new_descripcion = ' ';
            for (var i = 0; i < descripcion.length; i++) {
                if (descripcion.charAt(i) !== '-') {
                    new_descripcion = new_descripcion + descripcion.charAt(i)
                } else {
                    new_descripcion = new_descripcion + '#'
                }
            }
            //console.log('la nueva descripcion: ' + new_descripcion)
            descripcion = new_descripcion;

            var values = [id_user, fecha_subida, descripcion, url];
            var publicacion = await conexion_pg.query("INSERT INTO publicaciones (id_user, fecha_pub, descripcion, url_pub_fv) VALUES ($1, $2, $3, $4);", values);

            /*AQUI ESTRAEMOS LOS HASHTAGS*/
            var pubg = await conexion_pg.query("SELECT id_publicacion FROM publicaciones  WHERE id_user=$1 AND fecha_pub=$2;", [id_user, fecha_subida]);
            var lista_hash = hashtags.split(' ');

            for (var i = 0; i < lista_hash.length; i++) {
                if (lista_hash[i] !== "") {
                    var hashtag = await conexion_pg.query("INSERT INTO hashtags (id_publicacion, hashtag) VALUES ($1, $2);", [pubg.rows[0].id_publicacion, removeAccents(lista_hash[i])]);
                }
            }

            if (publicacion.rowCount === 1) {
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
        console.log('Error en la función publicaciones_controller.UploadPublicacion' + error)
    }
}

publicaciones.EditarDescripcionPublicacion = async (req, res) => {
    //publicaciones.EditarDescripcionPublicacion = async (id_publicacion, id_user, descripcion) => {

    try {
        var { descripcion, id_user, id_publicacion } = req.body;
        console.log(id_user + ' ' + id_publicacion)
        var publicacion = await conexion_pg.query("SELECT * from publicaciones where id_user = $1 and id_publicacion = $2;", [id_user, id_publicacion]);
        console.log(publicacion.rowCount)

        if (publicacion.rowCount === 1) {

            var publicacion_editada = await conexion_pg.query("UPDATE publicaciones SET descripcion = $1 where id_user = $2 and id_publicacion = $3;", [descripcion, id_user, id_publicacion]);


            if (publicacion_editada.rowCount === 1) {
                return res.json({
                    result: true,
                });
                //return true;
            } else {
                return res.json({
                    result: false,
                });
                //return false;
            }

        } else {
            return res.json({ result: false, info: "La publicación ya no existe" })
            //return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.EditarDescripcionPublicacion')
    }
}

publicaciones.ObtenerPublicaciones = async (id_user) => {
    //publicaciones.ObtenerPublicaciones = async (req, res) => {
    try {
        //var { id_user } = req.body;
        var lista_publicaciones = [];
        /*La siguiente consulta obtendrá: 
            1. ID de la publicacion guardada
            2. El usuario que la publicó
            3. La foto de perfil del usuario que la publicó
            4. La descripción de la publicación
            5. La fecha en que se subió la publicacion
            6. La url de la publicacion (foto/video)
            7. Cantidad de Reacciones (Todas)
            8. Cantidad de Comentarios
            9. Reacción utilizada
            10. Lista de Comentarios
        */
        var sql = "select p.id_publicacion, p.id_user, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por,\
        (select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,\
        (select count(c.id_comentario) from comentarios c where c.id_publicacion = p.id_publicacion) as cant_comentarios,\
        (select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user = $1) as reaccion_usada,\
        (select count(g.id_publicacion) as guardada from pub_guardadas g where g.id_publicacion = p.id_publicacion)\
        from publicaciones p where p.id_user in(select s.follow_to from seguidos s where s.id_user = $1 ) or p.id_user = $1  order by p.fecha_pub desc; ";

        var publicaciones = await conexion_pg.query(sql, [id_user]);


        if (publicaciones.rowCount !== 0) {

            /*Se obtiene los comentarios x cada publicacion en caso de tenerlos */
            for (var index = 0; index < publicaciones.rows.length; index++) {
                var comentarios = await ObtenerComentarios(publicaciones.rows[index].id_publicacion, id_user);

                if (comentarios.result === true) {
                    publicaciones.rows[index].comentarios = comentarios.data;
                } else {
                    publicaciones.rows[index].comentarios = null;
                }
            }

            /*return res.json({
                result: true,
                data: publicaciones.rows
            })*/

            return ({ result: true, data: publicaciones.rows })

        } else {
            //return res.json({ result: false })
            return ({ result: false })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ObtenerPublicaciones' + error)
    }
}

publicaciones.EliminarPublicacion = async (req, res) => {
    try {
        var { id_user, id_publicacion } = req.body;
        //console.log(id_user + ' ' + id_publicacion)
        var publicacion = await conexion_pg.query("SELECT id_publicacion, url_pub_fv, id_user from publicaciones where id_user = $1 and id_publicacion = $2;", [id_user, id_publicacion]);
        //console.log(publicacion.rowCount)

        if (publicacion.rowCount === 1) {

            var comentarios_publicacion = await conexion_pg.query("SELECT id_comentario, id_publicacion, id_user from comentarios WHERE id_publicacion = $1;", [id_publicacion]);

            //console.log(comentarios_publicacion.rows)
            //console.log(comentarios_publicacion.rowCount)

            if (comentarios_publicacion.rowCount !== 0) {

                for (let index = 0; index < comentarios_publicacion.rowCount; index++) {
                    //console.log('Comentario: ' + comentarios_publicacion.rows[index].id_comentario)
                    var reaccion_comentario = await conexion_pg.query("DELETE FROM reacciones_comentarios WHERE id_comentario =$1", [comentarios_publicacion.rows[index].id_comentario]);
                }
                var comentario = await conexion_pg.query("DELETE FROM comentarios WHERE id_publicacion=$1;", [id_publicacion]);
                console.log('Eliminar Comentarios: ' + comentario.rowCount)
            }
            var hashtag = await conexion_pg.query("DELETE FROM hashtags where id_publicacion = $1;", [id_publicacion]);
            var publicacion_guardada_eliminada = await conexion_pg.query("DELETE FROM pub_guardadas where id_publicacion = $1;", [id_publicacion]);
            var reacciones_publicacion = await conexion_pg.query("DELETE FROM reacciones where id_publicacion = $1;", [id_publicacion]);
            var publicacion_eliminada = await conexion_pg.query("DELETE FROM publicaciones where id_user = $1 and id_publicacion = $2;", [id_user, id_publicacion]);

            console.log('Eliminar Publicacion: ' + publicacion_eliminada.rowCount)

            if (publicacion_eliminada.rowCount === 1) {

                var url = publicacion.rows[0].url_pub_fv;
                var path_publicacion = url.split("/public/")
                url = process.env.PATH_PUBLICACIONES + path_publicacion[1]
                console.log('la ruta donde lo eliminara es: ' + url)

                fs.unlink(url, (err) => {
                    if (err === null) {
                        console.log('Archivo eliminado correctamente');
                        return res.json({
                            result: true
                        });
                    } else {
                        console.log('El archivo no se pudo eliminar')
                        return res.json({
                            result: false,
                            info: 'Ha ocurrido un error al eliminar el archivo'
                        });
                    }
                });

            } else {
                return res.json({
                    result: false,
                });
            }

        } else {
            return res.json({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.EliminarPublicacion' + error)
        //console.log(error)

    }


}

//publicaciones.ReaccionarPublicacion = async (req, res) => {
publicaciones.ReaccionarPublicacion = async (id_publicacion, id_user, fecha_reaccion, tipo_reaccion) => {
    try {
        //var { id_publicacion, id_user, fecha_reaccion, tipo_reaccion } = req.body;
        var publicacion = await conexion_pg.query("SELECT id_publicacion, id_user from publicaciones where id_publicacion = $1;", [id_publicacion]);
        var reaccion;
        if (publicacion.rowCount === 1) {

            var reaccion_previa = await conexion_pg.query("SELECT id_reaccion, tipo_reaccion from reacciones where id_publicacion = $1 and id_user = $2;", [id_publicacion, id_user]);

            if (reaccion_previa.rowCount === 1) {

                if (reaccion_previa.rows[0].tipo_reaccion === tipo_reaccion) {
                    var id_reaccion = reaccion_previa.rows[0].id_reaccion;
                    reaccion = await conexion_pg.query("DELETE FROM reacciones where id_user = $1 and id_publicacion = $2 and id_reaccion = $3;", [id_user, id_publicacion, id_reaccion]);
                } else {
                    reaccion = await conexion_pg.query("UPDATE reacciones SET fecha_reaccion = $1, tipo_reaccion = $2 where id_user = $3 and id_publicacion = $4;", [fecha_reaccion, tipo_reaccion, id_user, id_publicacion]);
                }

            } else {
                reaccion = await conexion_pg.query("INSERT INTO reacciones (id_publicacion, id_user, fecha_reaccion, tipo_reaccion) VALUES ($1, $2, $3, $4);", [id_publicacion, id_user, fecha_reaccion, tipo_reaccion]);
            }


            if (reaccion.rowCount === 1) {

                /*return res.json({
                    result: true
                });*/

                return ({ result: true, id_user: publicacion.rows[0].id_user });

            } else {
                /*return res.json({
                    result: false,
                });*/

                return ({ result: false });
            }

        } else {
            //return res.json({ result: false, info: "La publicación ya no existe" })
            return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ReaccionarPublicacion' + error)
    }
}

//publicaciones.ComentarPublicacion = async (req, res) => {
publicaciones.ComentarPublicacion = async (id_publicacion, id_user, fecha_comentario, texto_comentario) => {
    try {
        //var { id_publicacion, id_user, fecha_comentario, texto_comentario } = req.body;
        var publicacion = await conexion_pg.query("SELECT id_publicacion, id_user from publicaciones where id_publicacion = $1;", [id_publicacion]);

        if (publicacion.rowCount === 1) {
            comentario = await conexion_pg.query("INSERT INTO comentarios (id_publicacion, id_user, fecha_comentario, texto_comentario) VALUES ($1, $2, $3, $4);", [id_publicacion, id_user, fecha_comentario, texto_comentario]);

            if (comentario.rowCount === 1) {

                /*return res.json({
                    result: true
                });*/

                return ({ result: true, id_user: publicacion.rows[0].id_user });

            } else {
                /*return res.json({
                    result: false,
                });*/

                return ({ result: false });
            }

        } else {
            //return res.json({ result: false, info: "La publicación ya no existe" })
            return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ComentarPublicacion' + error)
    }
}

publicaciones.EditarComentarioPublicacion = async (req, res) => {
    //publicaciones.EditarComentarioPublicacion = async (id_comentario, id_user, fecha_comentario, texto_comentario) => {
    try {
        var { id_comentario, id_user, fecha_comentario, texto_comentario } = req.body;
        var prev_comentario = await conexion_pg.query("SELECT id_comentario, id_user from comentarios WHERE id_comentario = $1;", [id_comentario]);

        if (prev_comentario.rowCount === 1) {
            comentario = await conexion_pg.query("UPDATE comentarios SET fecha_comentario=$3, texto_comentario=$4 WHERE id_comentario =$1 and id_user=$2;", [id_comentario, id_user, fecha_comentario, texto_comentario]);

            if (comentario.rowCount === 1) {

                return res.json({
                    result: true
                });

                //return ({ result: true, id_user: publicacion.rows[0].id_user });

            } else {
                return res.json({
                    result: false,
                });

                //return ({ result: false });
            }

        } else {
            //return res.json({ result: false, info: "La publicación ya no existe" })
            return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ComentarPublicacion' + error)
    }
}

async function ObtenerComentarios(id_publicacion, id_user) {
    //publicaciones.ObtenerComentarios = async (req, res) => {
    try {
        //var { id_publicacion } = req.body;
        var sql = "SELECT c.*, u.usuario,\
        (select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_GUSTA') as cant_megusta,\
        (select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,\
        (select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,\
        (select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,\
        (select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,\
        (select count(rc.id_reaccion_comentario) from reacciones_comentarios rc where rc.id_comentario = c.id_comentario and rc.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,\
        (select rc.tipo_reaccion from reacciones_comentarios rc where c.id_comentario = rc.id_comentario and rc.id_user = $2) as reaccion_usada\
         FROM comentarios c, usuarios u WHERE c.id_user= u.id_user and c.id_publicacion = $1;";

        //
        var publicacion = await conexion_pg.query("SELECT id_publicacion from publicaciones where id_publicacion = $1;", [id_publicacion]);

        if (publicacion.rowCount === 1) {
            //"SELECT c.*, u.usuario FROM comentarios c, usuarios u WHERE c.id_user= u.id_user and id_publicacion = $1;"
            comentario = await conexion_pg.query(sql, [id_publicacion, id_user]);

            if (comentario.rowCount !== 0) {

                /*return res.json({
                    result: true,
                    data: comentario.rows
                })*/

                return ({ result: true, data: comentario.rows });

            } else {
                /*return res.json({
                    result: false,
                });*/

                return ({ result: false });
            }

        } else {
            //return res.json({ result: false, info: "La publicación ya no existe" })
            return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ObtenerComentarios' + error)
    }
}

publicaciones.EliminarComentario = async (req, res) => {
    //publicaciones.EliminarComentario = async (id_comentario, id_user) => {
    try {
        var { id_comentario, id_publicacion } = req.body;
        var prev_comentario = await conexion_pg.query("SELECT id_comentario, id_publicacion, id_user from comentarios WHERE id_comentario = $1 and id_publicacion = $2;", [id_comentario, id_publicacion]);

        if (prev_comentario.rowCount === 1) {
            reaccion_comentario = await conexion_pg.query("DELETE FROM reacciones_comentarios WHERE id_comentario =$1 and id_user=$2; ", [id_comentario, prev_comentario.rows[0].id_user]);
            comentario = await conexion_pg.query("DELETE FROM comentarios WHERE id_comentario =$1 and id_publicacion=$2;", [id_comentario, id_publicacion]);

            if (comentario.rowCount === 1) {

                return res.json({
                    result: true
                });

                //return ({ result: true, id_user: publicacion.rows[0].id_user });

            } else {
                return res.json({
                    result: false,
                });

                //return ({ result: false });
            }

        } else {
            //return res.json({ result: false, info: "La publicación ya no existe" })
            return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ComentarPublicacion' + error)
    }
}

//publicaciones.ReaccionarComentario = async (req, res) => {
publicaciones.ReaccionarComentario = async (id_comentario, id_user, fecha_reaccion, tipo_reaccion) => {
    try {
        //var { id_comentario, id_user, fecha_reaccion, tipo_reaccion } = req.body;
        var comentario = await conexion_pg.query("SELECT id_comentario, id_user from comentarios where id_comentario = $1;", [id_comentario]);
        var reaccion;
        if (comentario.rowCount === 1) {

            var reaccion_previa = await conexion_pg.query("SELECT id_reaccion_comentario, tipo_reaccion from reacciones_comentarios where id_comentario = $1 and id_user = $2;", [id_comentario, id_user]);

            if (reaccion_previa.rowCount === 1) {

                if (reaccion_previa.rows[0].tipo_reaccion === tipo_reaccion) {
                    var id_reaccion_comentario = reaccion_previa.rows[0].id_reaccion_comentario;
                    reaccion = await conexion_pg.query("DELETE FROM reacciones_comentarios where id_user = $1 and id_comentario = $2 and id_reaccion_comentario = $3;", [id_user, id_comentario, id_reaccion_comentario]);
                } else {
                    reaccion = await conexion_pg.query("UPDATE reacciones_comentarios SET fecha_reaccion = $1, tipo_reaccion = $2 where id_user = $3 and id_comentario = $4;", [fecha_reaccion, tipo_reaccion, id_user, id_comentario]);
                }

            } else {
                reaccion = await conexion_pg.query("INSERT INTO reacciones_comentarios (id_comentario, id_user, fecha_reaccion, tipo_reaccion) VALUES ($1, $2, $3, $4);", [id_comentario, id_user, fecha_reaccion, tipo_reaccion]);
            }


            if (reaccion.rowCount === 1) {

                /*return res.json({
                    result: true
                });*/

                return ({ result: true, id_user: comentario.rows[0].id_user });

            } else {
                /*return res.json({
                    result: false,
                });*/

                return ({ result: false });
            }

        } else {
            //return res.json({ result: false, info: "La publicación ya no existe" })
            return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ReaccionarPublicacion' + error)
    }
}

//publicaciones.GuardarPublicacion = async (req, res) => {
publicaciones.GuardarPublicacion = async (id_publicacion, id_user) => {
    try {
        //var { id_publicacion, id_user } = req.body;
        var publicacion = await conexion_pg.query("SELECT id_publicacion from publicaciones where id_publicacion = $1;", [id_publicacion]);

        var guardada;
        if (publicacion.rowCount === 1) {

            var publicacion_guardada = await conexion_pg.query("SELECT id_publicacion from pub_guardadas where id_publicacion = $1 and id_user = $2;", [id_publicacion, id_user]);

            if (publicacion_guardada.rowCount === 1) {
                guardada = await conexion_pg.query("DELETE FROM pub_guardadas where id_user = $1 and id_publicacion = $2;", [id_user, id_publicacion]);
                return ({ result: false })
            } else {
                guardada = await conexion_pg.query("INSERT INTO pub_guardadas (id_publicacion, id_user) VALUES ($1, $2);", [id_publicacion, id_user]);
            }


            if (guardada.rowCount === 1) {

                /*return res.json({
                    result: true
                });*/

                return ({ result: true })

            } else {
                /*return res.json({
                    result: false,
                });*/
                return ({ result: false, info: "No se pudo guardar la publicacion   " })
            }

        } else {
            //return res.json({ result: false, info: "La publicación ya no existe" })
            return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ReaccionarPublicacion' + error)
    }
}

publicaciones.EliminarPublicacionGuardada = async (req, res) => {
    try {
        var { id_publicacion, id_user } = req.body;
        var publicacion = await conexion_pg.query("SELECT id_publicacion from publicaciones where id_publicacion = $1;", [id_publicacion]);

        if (publicacion.rowCount === 1) {
            var guardada = await conexion_pg.query("DELETE FROM pub_guardadas where id_user = $1 and id_publicacion = $2;", [id_user, id_publicacion]);

            if (guardada.rowCount === 1) {

                return res.json({
                    result: true
                });

                //return true;

            } else {
                return res.json({
                    result: false,
                });
                //return false;
            }

        } else {
            return res.json({ result: false, info: "La publicación ya no existe" })
            //return ({ result: false, info: "La publicación ya no existe" })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ReaccionarPublicacion' + error)
    }
}

publicaciones.ObtenerPublicacionGuardadas = async (req, res) => {

    try {
        var { id_user } = req.body;

        /*La siguiente consulta obtendrá: 
            1. ID de la publicacion guardada
            2. El usuario que la publicó
            3. La foto de perfil del usuario que la publicó
            4. La descripción de la publicación
            5. La fecha en que se subió la publicacion
            6. La url de la publicacion (foto/video)
            7. Cantidad de Reacciones (Todas)
            8. Cantidad de Comentarios
            9. Reacción utilizada
        */

        var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_user]);
        console.log('el usuario respondio a ' + us.rows[0].id_user)
        id_user = us.rows[0].id_user

        var sql = "select p.id_publicacion, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por,\
        (select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = g.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,\
        (select count(c.id_comentario) from comentarios c where c.id_publicacion = g.id_publicacion) as cant_comentarios,\
        (select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user = $1) as reaccion_usada\
        from publicaciones p, pub_guardadas g\
        where g.id_user = $1 and p.id_publicacion = g.id_publicacion;";

        var publicaciones_guardadas = await conexion_pg.query(sql, [id_user]);

        if (publicaciones_guardadas.rowCount !== 0) {

            return res.json({
                result: true,
                data: publicaciones_guardadas.rows
            });

        } else {
            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función publicaciones_controller.ReaccionarPublicacion' + error)
    }

}

publicaciones.ObtenerPublicacionCreadas = async (req, res) => {

    try {
        var { id_user } = req.body;

        /*La siguiente consulta obtendrá: 
            1. ID de la publicacion guardada
            2. El usuario que la publicó
            3. La foto de perfil del usuario que la publicó
            4. La descripción de la publicación
            5. La fecha en que se subió la publicacion
            6. La url de la publicacion (foto/video)
            7. Cantidad de Reacciones (Todas)
            8. Cantidad de Comentarios
            9. Reacción utilizada
        */

        var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_user]);
        console.log('el usuario respondio a ' + us.rows[0].id_user)
        id_user = us.rows[0].id_user
        var sql = "select p.id_publicacion, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por,\
        (select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,\
        (select count(c.id_comentario) from comentarios c where c.id_publicacion = p.id_publicacion) as cant_comentarios,\
        (select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user = $1) as reaccion_usada\
        from publicaciones p where p.id_user = $1;";

        var publicaciones_guardadas = await conexion_pg.query(sql, [id_user]);

        if (publicaciones_guardadas.rowCount !== 0) {

            return res.json({
                result: true,
                data: publicaciones_guardadas.rows
            });

        } else {
            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función publicaciones_controller.ReaccionarPublicacion' + error)
    }

}



publicaciones.ObtenerHashtags = async (req, res) => {

    try {

        var sql = "select lower(hashtag) as hashtag from hashtags group by lower(hashtag)";

        var hashtags = await conexion_pg.query(sql);

        console.log(hashtags.rows)
        if (hashtags.rowCount !== 0) {

            return res.json({
                result: true,
                data: hashtags.rows
            });

        } else {
            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función publicaciones_controller.ObtenerHashtags' + error)
    }

}


publicaciones.ObtenerPublicacionesHashtags = async (req, res) => {

    try {


        var hashtag = req.params.id

        var sql = "select p.id_publicacion, p.id_user, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por,\
        (select concat(us.nombres, ' ',us.apellidos) from usuarios us where id_user = p.id_user) as nombres,\
        (select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,\
        (select count(c.id_comentario) from comentarios c where c.id_publicacion = p.id_publicacion) as cant_comentarios,\
        (select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user = p.id_user) as reaccion_usada, h.hashtag\
        from publicaciones p, hashtags h where h.id_publicacion = p.id_publicacion and lower(h.hashtag) LIKE $1";

        var hashtags = await conexion_pg.query(sql, [hashtag]);

        console.log(hashtags.rows)
        if (hashtags.rowCount !== 0) {

            return res.json({
                result: true,
                data: hashtags.rows
            });

        } else {
            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función publicaciones_controller.ObtenerHashtags' + error)
    }

}


publicaciones.ObtenerPublicacionesHashtagsAleatorios = async (req, res) => {

    try {


        //var hashtag = req.params.id

        var sql = "select p.id_publicacion, p.id_user, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por,\
        (select concat(us.nombres, ' ',us.apellidos) from usuarios us where id_user = p.id_user) as nombres,\
        (select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,\
        (select count(c.id_comentario) from comentarios c where c.id_publicacion = p.id_publicacion) as cant_comentarios,\
        (select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user = p.id_user) as reaccion_usada, h.hashtag\
        from publicaciones p, hashtags h where h.id_publicacion = p.id_publicacion ORDER BY RANDOM();";

        var hashtags = await conexion_pg.query(sql);

        console.log(hashtags.rows)
        if (hashtags.rowCount !== 0) {

            return res.json({
                result: true,
                data: hashtags.rows
            });

        } else {
            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función publicaciones_controller.ObtenerHashtagsPublicacionesAleatorios' + error)
    }

}


publicaciones.ObtenerUnaPublicacion = async (id_user, publicacion) => {
    //publicaciones.ObtenerUnaPublicacion = async (req, res) => {
    try {
        //var { id_user, publicacion } = req.body;
        console.log(id_user, publicacion)

        var sql = "select p.id_publicacion, p.id_user, (select us.usuario from usuarios us where id_user = p.id_user) as publicada_por,\
        (select us.url_foto_perfil from usuarios us where id_user = p.id_user), p.descripcion, p.fecha_pub, p.url_pub_fv,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_GUSTA') as cant_megusta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENCANTA') as cant_meencanta,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENTRISTECE') as cant_meentristece,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_ENFADA') as cant_meenfada,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_DIVIERTE') as cant_medivierte,\
        (select count(r.id_reaccion) from reacciones r where r.id_publicacion = p.id_publicacion and r.tipo_reaccion = 'ME_SORPRENDE') as cant_mesorprende,\
        (select count(c.id_comentario) from comentarios c where c.id_publicacion = p.id_publicacion) as cant_comentarios,\
        (select re.tipo_reaccion from reacciones re where p.id_publicacion = re.id_publicacion and re.id_user = $2) as reaccion_usada,\
        (select count(g.id_publicacion) as guardada from pub_guardadas g where g.id_publicacion = p.id_publicacion)\
        from publicaciones p where p.id_publicacion = $1";


        var publicaciones = await conexion_pg.query(sql, [publicacion, id_user]);



        if (publicaciones.rowCount !== 0) {

            /*Se obtiene los comentarios x cada publicacion en caso de tenerlos */
            for (var index = 0; index < publicaciones.rows.length; index++) {
                var comentarios = await ObtenerComentarios(publicaciones.rows[index].id_publicacion, id_user);

                if (comentarios.result === true) {
                    publicaciones.rows[index].comentarios = comentarios.data;
                } else {
                    publicaciones.rows[index].comentarios = null;
                }
            }
            console.log(publicaciones.rows)

            /*return res.json({
                result: true,
                data: publicaciones.rows
            })*/

            return ({ result: true, data: publicaciones.rows })

        } else {
            //return res.json({ result: false })
            return ({ result: false })
        }
    } catch (error) {
        console.log('Error en la función publicaciones_controller.ObtenerUnaPublicacion' + error)
    }
}

module.exports = publicaciones;