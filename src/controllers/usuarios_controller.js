const conexion_pg = require('../dbs/postgresql');
const passport = require('passport'); //Controla la autentificacion de los usuarios
const jwt = require('jsonwebtoken'); //Para generar un token
const bcrypt = require('bcrypt') //Importación de la liberia de encriptacion
const { EnviarCorreoVerificacion, EnviarCorreoRecuperacion } = require('./verificacion_email')
const path = require('path');
const usuarios_controller = {};

const { ObtenerPublicaciones } = require('../controllers/publicaciones_controller')

//FUNCION PARA ENCRYPTAR LA CONSTRASEÑA 
usuarios_controller.encryptPassword = (password) => {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10)); //Recibe la parametro a encryptar y la cantidad de veces que se realizara la encriptacion 
}

usuarios_controller.ModificarContra = async (req, res) => {
    var { id_user, password } = req.body
    password = usuarios_controller.encryptPassword(password);
    var values = [password, id_user];
    try {
        var usuarioRegistrado = await conexion_pg.query("UPDATE usuarios SET password = $1 WHERE id_user = $2;", values);
        //console.log(usuarioRegistrado.rowCount)
        if (usuarioRegistrado) {
            console.log('Usuario registrado exitosamente')
            return res.json({
                result: true
            });
        } else {
            console.log("Usuario no registrado");
            return res.json({
                result: false
            });
        }

        //conexion_pg.end()


    } catch (error) {
        console.log("Error en función Modificar Contraseña: " + error)
    }

}

usuarios_controller.InactivarCuenta = async (req, res) => {
    var { id_user } = req.body
    var values = ["INACTIVA", id_user];
    try {
        var cuentaInactica = await conexion_pg.query("UPDATE cuenta SET estado_cuenta = $1 WHERE id_user = $2;", values);
        if (cuentaInactica) {
            console.log('Usuario registrado exitosamente')
            return res.json({
                result: true
            });
        } else {
            console.log("Usuario no registrado");
            return res.json({
                result: false
            });
        }

    } catch (error) {
        console.log("Error en función Modificar Contraseña: " + error)
    }

}

usuarios_controller.registrarUsuario = async (req, res) => {

    //console.log(req.body)
    /*Obtenemos los datos que son pasados en la peticion POST*/
    var { user_gender, user_birth, nombres, apellidos, usuario, password, correo, telefono, id_ciudad, trabajo, estudio, biografia } = req.body
    console.log(user_gender, user_birth, nombres, apellidos, usuario, password, correo, telefono, id_ciudad, trabajo, estudio, biografia)
    // birthday, sexo,
    /*ar nombres_apellidos = nombres + " " + apellidos
    return res.json({
        result: true, //Confirmar usuario y cuenta registrado en la BD
        id_user: 45,
        codigo: 'dasdz'
    });*/
    var nombres_apellidos = nombres + " " + apellidos
    /*
    var { data } = req.body;
    data = Desencriptar(data);
    var password = EncryptPassword(data.password);
    var nombres_apellidos = data.nombres + " " + data.apellidos
    var usuario = data.usuario;
    var codigo_activacion = '';
    var values = [data.nombres, data.apellidos, usuario, password, data.correo, data.telefono, data.id_ciudad];
    */

    password = usuarios_controller.encryptPassword(password);
    //trabajo, estudio, biografia, user_gender, user_birth
    var values = [nombres, apellidos, usuario, password, correo, id_ciudad, telefono, biografia, trabajo, user_birth, estudio];

    try {
        var usuarioRegistrado = await conexion_pg.query("INSERT INTO usuarios(nombres, apellidos, usuario, password, correo, id_ciudad, telefono, biografia, trabajo, fecha_nacim, estudio) VALUES ($1, $2, $3, $4,$5, $6, $7, $8,$9, $10,$11);", values);
        //console.log(usuarioRegistrado.rowCount)


        if (usuarioRegistrado) {
            console.log('Usuario registrado exitosamente')

            registrarCuenta(correo).then(resultado => {

                if (resultado === true) {

                    console.log('Cuenta registrada exitosamente')

                    /*Una vez que registe el usuario y su cuenta se enviará al usuario (correo) un codigo de verificación
                    que debe ser ingresado para activar su cuenta. Además, enviamos al frontend el código para 
                    que este pueda ser comparado con el que el usuario ingresará.*/

                    EnviarCorreoVerificacion(nombres_apellidos, correo).then(async codigo_activacion => {

                        if (codigo_activacion !== '' || codigo_activacion !== null) {

                            var id_user = await conexion_pg.query("SELECT id_user from usuarios where correo = $1 and usuario=$2; ", [correo, usuario]);
                            console.log(id_user)
                            console.log(id_user.rows.id_user)
                            if (id_user.rowCount === 1) {
                                return res.json({
                                    result: true, //Confirmar usuario y cuenta registrado en la BD
                                    id_user: id_user.rows[0].id_user,
                                    codigo: codigo_activacion
                                });
                            } else {
                                return res.json({
                                    result: false
                                });
                            }


                        } else {
                            console.log("Codigo de verificacion no generado");
                            return res.json({
                                result: false
                            });
                        }
                    });

                } else {
                    console.log("Cuenta no registrada");
                    return res.json({
                        result: false
                    });
                }
            });


        } else {
            console.log("Usuario no registrado");
            return res.json({
                result: false
            });
        }

        //conexion_pg.end()


    } catch (error) {
        console.log("Error en función registrar usuario: " + error)
    }


};


registrarCuenta = async (correo) => {
    try {
        /*Obtenemos el id del usuario*/
        var usuario = await conexion_pg.query("SELECT id_user from usuarios where correo = $1;", [correo]);

        var id_user = usuario.rows[0].id_user;
        var priv_cuenta = 'PRIVADA' //PRIVADA - PUBLICA
        var estado_cuenta = 'ACTIVA' //ACTIVA - SUSPENDIDA - CERRADA

        var values = [id_user, priv_cuenta, estado_cuenta]
        var cuentaRegistrada = await conexion_pg.query("INSERT INTO cuenta(id_user, priv_cuenta, estado_cuenta) VALUES ($1, $2, $3);", values);
        //console.log(cuentaRegistrada.rowCount)

        if (cuentaRegistrada) {
            return true;
        } else {
            return false;
        }

    } catch (error) {
        console.log('Error en la función registrar cuenta: ' + error)
    }
}


/*Esta función se usará en caso de que el usuario omita la activacion de su cuenta al momento de registrarse,
e intenta validarla luego cuando ya tiene acceso a la aplicación
*/


usuarios_controller.EnviarCodigoVerificacionCuenta = async (req, res) => {

    var { nombres_apellidos, correo } = req.body
    /*
    var { data } = req.body;
    data = Desencriptar(data);
    var nombres_apellidos = data.nombres + " " + data.apellidos
    var correo = data.correo;
    */

    try {
        EnviarCorreoVerificacion(nombres_apellidos, correo).then(codigo_activacion => {

            if (codigo_activacion !== '' || codigo_activacion !== null) {
                return res.json({
                    codigo: codigo_activacion
                });

            } else {
                console.log("Codigo de verificacion no generado");
                return res.json({
                    codigo: ''
                });
            }
        });

    } catch (error) {
        console.log('Error en la función enviar codigo verticacion cuenta: ' + error)
    }

}

usuarios_controller.correoExiste = async (req, res) => {
    var { correo } = req.body
    try {
        /*Obtenemos el id del usuario*/
        var usuario = await conexion_pg.query("SELECT id_user from usuarios where correo = $1;", [correo]);
        if (usuario.rowCount !== 0) {
            return res.json({
                id: usuario.rows[0].id_user,
                result: 'true'
            });
        } else {
            return res.json({
                result: 'false'
            });
        }
    } catch (error) {
        return res.json({
            result: 'false'
        });
    }
}

usuarios_controller.EnviarCodigoRecuperacionCuenta = async (req, res) => {

    var { correo } = req.body
    try {

        EnviarCorreoRecuperacion(correo).then(codigo_activacion => {
            if (codigo_activacion !== '' || codigo_activacion !== null) {
                return res.json({
                    codigo: codigo_activacion,
                    result: true
                });
            } else {
                console.log("Codigo de verificacion no generado");
                return res.json({
                    codigo: '',
                    result: false
                });
            }
        });
    } catch (error) {
        console.log('Error en la función enviar codigo recuperacion cuenta: ' + error)
    }
}


usuarios_controller.ValidarCuenta = async (req, res) => {

    try {

        var { id_user } = req.body

        /*
        var { data } = req.body;
        data = Desencriptar(data);
        var id_user = data.id_user;
        */

        var usuarioRegistrado = await conexion_pg.query("UPDATE cuenta SET validacion = $1 WHERE id_user = $2;", [true, id_user]);

        if (usuarioRegistrado) {
            console.log('Validacion de la cuenta realizada con exito')
            res.json({
                validacion: true
            })
        } else {
            console.log('No se logró realizar la validacion de la cuenta.')
            res.json({
                valicacion: false
            })
        }

    } catch (error) {
        console.log('Error en la función validar cuenta: ' + error)

    }
}

usuarios_controller.Login = async (req, res, next) => {
    console.log('ID Session User: ' + req.sessionID)

    passport.authenticate('local-login', (err, usuario, info) => {


        try {

            if (err) {
                next(err);
            }

            if (!usuario) {
                return res.json({ result: false })
                //return res.status(400).send('Usuario o Contraseña no válidos')
            }

            req.logIn(usuario, (err) => {
                if (err) {
                    next(err);
                }


                //More info: https://medium.com/front-end-weekly/learn-using-jwt-with-passport-authentication-9761539c4314
                //https://es.stackoverflow.com/questions/251293/redireccionar-al-login-en-react

                const token = jwt.sign(usuario.id_user, 'clavegatovolador');
                console.log(token)
                req.session.id_usuario = usuario.id_user
                //console.log('ID Session User: ' + req.sessionID)
                console.log('Se ha almacenado la sesion del usuario: ' + req.session.id_usuario)
                //console.log('Datos de usuario en req')
                console.log(req.user)
                user = req.user;
                res.json({ result: true, user, token })

            })

        } catch (error) {
            console.log("este es el error: " + error)
        }


    })(req, res);
};

usuarios_controller.Logout = async (req, res) => {
    res.clearCookie('sessionID')

    req.session.destroy(err => {

        if (err) {
            console.log('ha ocurrido un error')
        }

    })

    //console.log(req.session)

    req.logout();

    console.log('ID Session User TERMINADA: ' + req.sessionID)
    res.send('Sesion Terminada')
}

usuarios_controller.ObtenerInformacionUsuario = async (req, res) => {
    try {
        var { id } = req.params

        var sql =
            "SELECT us.id_user, (us.nombres || ' ' || us.apellidos) as nombre_completo,\
            us.usuario, us.correo, us.url_foto_perfil, us.url_foto_portada, us.biografia, us.trabajo, us.fecha_nacim, us.estudio,\
            (select ciu.nombre_ciudad || ', ' ||(select prov.nombre_provincia|| ', ' ||\
                                                (select pa.nombre_pais from pais pa where pa.id_pais = prov.id_pais)\
                                                from provincia prov where prov.id_provincia = ciu.id_provincia)\
            from ciudad ciu where ciu.id_ciudad = us.id_ciudad ) as ubicacion,\
            (select count(*) from seguidos s where s.id_user = us.id_user) as cant_seguidos,\
            (select count(*) from seguidores se where se.id_user = us.id_user) as cant_seguidores,\
            (select count(*) from publicaciones pu where pu.id_user = us.id_user) as cant_publicaciones\
            FROM usuarios us where us.id_user = $1";

        var info_usuario = await conexion_pg.query(sql, [id]);

        if (info_usuario.rowCount !== 0) {
            console.log(info_usuario.rows)
            return res.json({
                result: true,
                data: info_usuario.rows
            });
        } else {
            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función usuario_controllers.ObtenerInformacionUsuario: ' + error)
    }
}

usuarios_controller.ObtenerInformacionUsuario2 = async (req, res) => {
    try {
        var { usuario } = req.params

        var sql =
            "SELECT us.id_user, (us.nombres || ' ' || us.apellidos) as nombre_completo,\
            us.usuario, us.correo, us.url_foto_perfil, us.url_foto_portada, us.biografia, us.trabajo, us.fecha_nacim, us.estudio,\
            (select ciu.nombre_ciudad || ', ' ||(select prov.nombre_provincia|| ', ' ||\
                                                (select pa.nombre_pais from pais pa where pa.id_pais = prov.id_pais)\
                                                from provincia prov where prov.id_provincia = ciu.id_provincia)\
            from ciudad ciu where ciu.id_ciudad = us.id_ciudad ) as ubicacion,\
            (select count(*) from seguidos s where s.id_user = us.id_user) as cant_seguidos,\
            (select count(*) from seguidores se where se.id_user = us.id_user) as cant_seguidores,\
            (select count(*) from publicaciones pu where pu.id_user = us.id_user) as cant_publicaciones\
            FROM usuarios us where us.usuario LIKE $1";

        var info_usuario = await conexion_pg.query(sql, [usuario + "%"]);

        if (info_usuario.rowCount !== 0) {

            for (var index = 0; index < info_usuario.rowCount; index++) {

                var publicaciones = await ObtenerPublicaciones(info_usuario.rows[index].id_user);

                if (publicaciones.result === true) {
                    info_usuario.rows[index].publicaciones = publicaciones.data;
                } else {
                    info_usuario.rows[index].publicaciones = null;
                }
            }
            return res.json({
                result: true,
                data: info_usuario.rows
            });
        } else {


            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función usuario_controllers.ObtenerInformacionUsuario2: ' + error)
    }
}

usuarios_controller.ObtenerInformacionUsuario3 = async (req, res) => {
    try {
        var { usuario } = req.body

        var sql =
            "SELECT us.id_user, (us.nombres || ' ' || us.apellidos) as nombre_completo,\
            us.usuario, us.correo, us.url_foto_perfil, us.url_foto_portada, us.biografia, us.trabajo, us.fecha_nacim, us.estudio,\
            (select ciu.nombre_ciudad || ', ' ||(select prov.nombre_provincia|| ', ' ||\
                                                (select pa.nombre_pais from pais pa where pa.id_pais = prov.id_pais)\
                                                from provincia prov where prov.id_provincia = ciu.id_provincia)\
            from ciudad ciu where ciu.id_ciudad = us.id_ciudad ) as ubicacion,\
            (select count(*) from seguidos s where s.id_user = us.id_user) as cant_seguidos,\
            (select count(*) from seguidores se where se.id_user = us.id_user) as cant_seguidores,\
            (select count(*) from publicaciones pu where pu.id_user = us.id_user) as cant_publicaciones\
            FROM usuarios us where us.usuario LIKE $1 LIMIT  5;";

        var info_usuario = await conexion_pg.query(sql, [usuario + "%"]);

        if (info_usuario.rowCount !== 0) {
            return res.json({
                result: true,
                data: info_usuario.rows
            });
        } else {
            return res.json({
                result: false,
            });
        }

    } catch (error) {
        console.log('Error en la función usuario_controllers.ObtenerInformacionUsuario2: ' + error)
    }
}
usuarios_controller.ActualizarInformacionUsuario = async (req, res) => {

    try {

        var { id_user, nombres, apellidos, usuario, telefono, id_ciudad } = req.body;
        var values = [nombres, apellidos, usuario, telefono, id_ciudad, id_user];
        var usuarioActualizado = await conexion_pg.query("UPDATE usuarios SET nombres = $1, apellidos =$2, usuario=$3, telefono=$4, id_ciudad=$5 WHERE id_user = $6;", values);

        if (usuarioActualizado.rowCount === '1') {
            res.json({
                result: true,
            })
        } else {
            res.json({
                result: false,
            })
        }
    } catch (error) {
        console.log('Error en la función usuarios_controller.ActualizarInformaciónUsuario' + error);
    }

}

usuarios_controller.ObtenerListaSeguidos = async (req, res) => {
    try {

        var { id_user } = req.body;

        var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_user]);
        console.log('el usuario respondio a ' + us.rows[0].id_user)
        id_user = us.rows[0].id_user

        var sql = "select  s.follow_to, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil\
        from seguidos s, usuarios u where u.id_user = s.follow_to and s.id_user = $1;"
        var seguidos = await conexion_pg.query(sql, [id_user]);

        if (seguidos.rowCount !== 0) {
            res.json({
                result: true,
                data: seguidos.rows
            })
        } else {
            res.json({
                result: false,
            })
        }
    } catch (error) {
        console.log('Error en la función usuarios_controller.ActualizarInformaciónUsuario' + error);
    }
}

usuarios_controller.ObtenerListaSeguidores = async (req, res) => {
    try {

        var { id_user } = req.body;
        /*var sql = "select  s.follow_me, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil\
        from seguidores s, usuarios u where u.id_user = s.follow_me and s.id_user = $1;"*/
        var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_user]);
        console.log('el usuario respondio a ' + us.rows[0].id_user)
        id_user = us.rows[0].id_user
        var sql = "select  s.follow_me, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil\
        ,(select sg.id_user from seguidos sg where sg.id_user = $1 and sg.follow_to =s.follow_me) as seguido\
        from seguidores s, usuarios u where u.id_user = s.follow_me and s.id_user = $1;";

        /*Si el seguidor aun no es seguido por el usuario en sesion le aparecerá el boton seguiar a */
        var seguidos = await conexion_pg.query(sql, [id_user]);

        if (seguidos.rowCount !== 0) {
            res.json({
                result: true,
                data: seguidos.rows
            })
        } else {
            res.json({
                result: false,
            })
        }
    } catch (error) {
        console.log('Error en la función usuarios_controller.ActualizarInformaciónUsuario' + error);
    }
}

usuarios_controller.ValidarEstadoCuenta = async (req, res) => {

    var id_user = req.params.id;
    try {

        var estado = await conexion_pg.query("select * from  cuenta where id_user = $1;", [id_user]);

        if (estado.rowCount != 0) {
            res.json({
                result: true,
                estado: estado.rows[0].estado_cuenta
            })
        } else {
            res.json({
                result: false
            })
        }

    } catch (error) {

    }
}

usuarios_controller.ReactivarCuenta = async (req, res) => {

    var id_user = req.params.id;
    try {

        var estado = await conexion_pg.query("update cuenta set estado_cuenta =$1 where id_user = $2;", ['ACTIVA', id_user]);

        console.log(estado)
        if (estado.rowCount != 0) {
            res.json({
                result: true,
            })
        } else {
            res.json({
                result: false
            })
        }

    } catch (error) {

    }
}

usuarios_controller.BloquearCuenta = async (req, res) => {

    var { id, id_follow } = req.body
    try {
        console.log('el usuario a bloquear es' + id_follow)
        var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_follow]);
        console.log('el usuario respondio a ' + us.rows[0].id_user)
        id_follow = us.rows[0].id_user


        var usuariobloqueado = await conexion_pg.query("UPDATE seguidores SET estado = $1 WHERE id_user = $2 and follow_me = $3;", ["BLOQUEADO", id_follow, id]);
        //console.log(usuariobloqueado.rowCount)
        if (usuariobloqueado.rowCount != 0) {
            var usuariob2 = await conexion_pg.query("UPDATE seguidos SET estado = $1 WHERE id_user = $2 and follow_to = $3;", ["BLOQUEADO", id, id_follow]);
            if (usuariob2.rowCount != 0) {
                res.json({
                    validacion: true
                })
            } else {
                res.json({
                    validacion: false
                })
            }
        } else {
            res.json({
                validacion: false
            })
        }
    } catch (error) {
        console.log('Error en la función validar cuenta: ' + error)
    }
}

usuarios_controller.DesbloquearCuenta = async (req, res) => {
    try {
        console.log('llega a la funcion')
        var { id, id_follow } = req.body
        var usuariobloqueado = await conexion_pg.query("UPDATE seguidores SET estado = $1 WHERE id_user = $2 and follow_me = $3;", ["ACEPTADO", id_follow, id]);
        if (usuariobloqueado) {
            var usuariob2 = await conexion_pg.query("UPDATE seguidos SET estado = $1 WHERE id_user = $2 and follow_to = $3;", ["ACEPTADO", id, id_follow]);
            if (usuariob2.rowCount !== 0) {
                res.json({
                    validacion: true
                })
            } else {
                res.json({
                    valicacion: false
                })
            }
        } else {
            res.json({
                valicacion: false
            })
        }
    } catch (error) {
        console.log('Error en la función validar cuenta: ' + error)
    }
}

usuarios_controller.ComprobarSigoUsuario = async (req, res) => {
    try {

        var { id_user, me } = req.body;
        /*var sql = "select  s.follow_me, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil\
        from seguidores s, usuarios u where u.id_user = s.follow_me and s.id_user = $1;"*/
        var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_user]);
        console.log('el usuario respondio a ' + us.rows[0].id_user)
        id_user = us.rows[0].id_user


        var sql = "select * from seguidos where id_user=$1 and follow_to = $2;";

        /*Si el seguidor aun no es seguido por el usuario en sesion le aparecerá el boton seguiar a */
        var seguidos = await conexion_pg.query(sql, [me, id_user]);

        if (seguidos.rowCount === 1) {
            res.json({
                result: true,
                data: seguidos.rows[0],
            })
        }

        if (seguidos.rowCount === 0) {
            res.json({
                result: false,
                data: id_user,
            })
        }

    } catch (error) {
        console.log('Error en la función usuarios_controller.ComprobarSigoUsuario ' + error);
    }
}

usuarios_controller.ObtenerBloqueados = async (req, res) => {

    try {

        var { id_user } = req.body;
        /*var sql = "select  s.follow_me, u.usuario, (u.nombres||' '||u.apellidos) as nombre_usuario, u.url_foto_perfil\
        from seguidores s, usuarios u where u.id_user = s.follow_me and s.id_user = $1;"*/
        //var us = await conexion_pg.query("select id_user from usuarios where usuario = $1", [id_user]);
        //console.log('el usuario respondio a ' + us.rows[0].id_user)
        //id_user = us.rows[0].id_user


        var sql = "select s.*, us.usuario, us.url_foto_perfil, concat(us.nombres, ' ', us.apellidos) as nombre_usuario from seguidos s, usuarios us where s.follow_to = us.id_user and s.estado = 'BLOQUEADO' and s.id_user = $1";

        var bloqueados = await conexion_pg.query(sql, [id_user]);

        console.log('cantidad de bloqueados: ' + bloqueados.rowCount)
        console.log(bloqueados.rows)
        if (bloqueados.rowCount !== 0) {
            res.json({
                result: true,
                data: bloqueados.rows
            })
        } else {
            res.json({
                result: false,
            })
        }

    } catch (error) {
        console.log('Error en la función usuarios_controller.ObtenerBloqueados ' + error);
    }


}

usuarios_controller.UploadPerfil = async (req, res) => {

    /*
    Luego de que el archivo se almacene en el servidor mediante en el middleware (upload_) el archivo (file) llegará a
    esta función, donde en caso de que sea "undefined" significará que el usuario ingresó un archivo con formato no válido o 
    que ha excedido el tamaño permitido, esto tambien indica que el archivo no se almacenó y por lo tanto se aborta esta función
    dando como respuestas "false".
    Si el archivo NO es undefined, se procede a extraer el nombre y su extensión (.jpg .mp4) esta ultima permitirá conocer la ruta
    donde se encuentra almacenado en el servidor y también junto a otros parámetros definirán la ruta a almacenarse en la BD. Si 
    el registro es exitoso el servidor dará como respuesta "true".
    */

    var ides = req.params.id.split('.')
    var id_user = ides[0];
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
                var url = host + ':' + port + '/public/perfil/videos/' + file_name;
            }

            if (file_type === '.jpg' || file_type === '.png' || file_type === '.jpeg') {
                var url = '' + host + ':' + port + '/public/perfil/' + file_name;
            }

            var f = new Date();
            const fecha_subida = (f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate() + ' ' + f.getHours() + ':' + f.getMinutes() + ':' + f.getSeconds());

            console.log('Foto de perfil guardada en: ' + url)
            //var values = [req.body.id_user, req.body.fecha_subida, req.body.descripcion, url];

            var values = [url, id_user];
            var publicacion = await conexion_pg.query("UPDATE usuarios SET url_foto_perfil = $1 where id_user=$2", values);
            var usuario = await conexion_pg.query("SELECT usuario FROM usuarios where id_user=$1", [id_user]);

            if (publicacion.rowCount === 1) {
                res.json({
                    result: true,
                    usuario: usuario.rows[0].usuario
                })
            } else {
                res.json({
                    result: false
                })
            }

            res.json({
                result: true
            })

        }
    } catch (error) {
        console.log('Error en la función UploadPerfil' + error)
    }
}


usuarios_controller.UploadPortada = async (req, res) => {

    /*
    Luego de que el archivo se almacene en el servidor mediante en el middleware (upload_) el archivo (file) llegará a
    esta función, donde en caso de que sea "undefined" significará que el usuario ingresó un archivo con formato no válido o 
    que ha excedido el tamaño permitido, esto tambien indica que el archivo no se almacenó y por lo tanto se aborta esta función
    dando como respuestas "false".
    Si el archivo NO es undefined, se procede a extraer el nombre y su extensión (.jpg .mp4) esta ultima permitirá conocer la ruta
    donde se encuentra almacenado en el servidor y también junto a otros parámetros definirán la ruta a almacenarse en la BD. Si 
    el registro es exitoso el servidor dará como respuesta "true".
    */

    var ides = req.params.id.split('.')
    var id_user = ides[0];
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
                var url = host + ':' + port + '/public/portada/videos/' + file_name;
            }

            if (file_type === '.jpg' || file_type === '.png' || file_type === '.jpeg') {
                var url = '' + host + ':' + port + '/public/portada/' + file_name;
            }

            var f = new Date();
            const fecha_subida = (f.getFullYear() + "-" + (f.getMonth() + 1) + "-" + f.getDate() + ' ' + f.getHours() + ':' + f.getMinutes() + ':' + f.getSeconds());

            console.log('Foto de portada esta guardada en: ' + url)
            //var values = [req.body.id_user, req.body.fecha_subida, req.body.descripcion, url];

            var values = [url, id_user];
            var publicacion = await conexion_pg.query("UPDATE usuarios SET url_foto_portada = $1 where id_user=$2", values);
            var usuario = await conexion_pg.query("SELECT usuario FROM usuarios where id_user=$1", [id_user]);

            if (publicacion.rowCount === 1) {
                res.json({
                    result: true,
                    usuario: usuario.rows[0].usuario
                })
            } else {
                res.json({
                    result: false
                })
            }

            res.json({
                result: true
            })

        }
    } catch (error) {
        console.log('Error en la función UploadPerfil' + error)
    }
}


module.exports = usuarios_controller;