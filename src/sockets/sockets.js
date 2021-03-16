//const { not } = require('sequelize/types/lib/operators')

module.exports = function (server, SessionMiddleware) {

    /*Importamos Controladores */
    const { Seguir_a, SolicitudSeguimiento } = require('../controllers/friends_controller')
    const { RegistrarNotificacion, EliminarNotificacion, ObtenerNotificaciones } = require('../controllers/notificaciones_controller')
    const { ReaccionarPublicacion, ComentarPublicacion, ObtenerPublicaciones, ReaccionarComentario, GuardarPublicacion, ObtenerUnaPublicacion } = require('../controllers/publicaciones_controller')
    const { RegistrarMensaje, ObtenerMensajes, BandejaEntrada } = require('../controllers/chat_controllers')
    const { ObtenerHistorias, ObtenerMisHistorias, RegistrarVista } = require('../controllers/historias_controller')

    /*Importamos Socket IO y configuramos las sessiones en el*/
    const SocketIO = require('socket.io')
    const io = SocketIO(server)
    io.use((socket, next) => {
        SessionMiddleware(socket.request, socket.request.res, next);
    });

    /*Name Spaces Socket IO */
    const chat = io.of('/chat');
    const mesg = io.of('/mensajes');
    const notif = io.of('/notificaciones');

    /*DESCRIPCIONES Y TIPOS DE NOTIFICACIONES*/
    const descripciones = {
        seguir: 'ha solicitado seguirte',
        solicitud_seguimiento: 'tu solicitud de seguimiento',
        reaccion: 'ha reaccionado a tu publicación',
        reaccion_comentario: 'ha reaccionado a tu comentario',
        comentario: 'ha comentado tu publicación'
    };

    const tipo_notificacion = {
        seguir: 'SEGUIR_A',
        confirmacion_solicitud: 'CONF_SOLICITUD',
        reaccion_com: {
            gusta: 'REACCION_ME_GUSTA',
            encanta: 'REACCION_ME_ENCANTA',
            divierte: 'REACCION_ME_DIVIERTE',
            sorprende: 'REACCION_ME_SORPRENDE',
            enfada: 'REACCION_ME_ENFADA',
            entristece: 'REACCION_ME_ENTRISTECE'
        },

        reaccion_pub: {
            gusta: 'P_REACCION_ME_GUSTA',
            encanta: 'P_REACCION_ME_ENCANTA',
            divierte: 'P_REACCION_ME_DIVIERTE',
            sorprende: 'P_REACCION_ME_SORPRENDE',
            enfada: 'P_REACCION_ME_ENFADA',
            entristece: 'P_REACCION_ME_ENTRISTECE'
        },
        comentario: 'COMENTARIO'
    };

    io.on('connection', async (socket) => {
    });

    /*Se define un lista para los usuarios en linea */
    let users = {};
    let users_id = {};
    var mensajes = [];

    notif.on('connection', async (socket, id) => {
        var so = socket.id

        socket.on('nuevo_usuario_online', (data, cb) => {


            /*Comprueba si el usuario existe en la lista*/
            if (data in users) {
                cb(false);
            } else {
                /*Si no existe le envia un true al socket que emitió*/
                cb(true);
                console.log('0. Nuevo Usuario conectado ' + socket.id)

                socket.id_user = data.id_user;
                socket.username = data.usuario;
                socket.nombres = data.nombres + ' ' + data.apellidos;
                socket.foto = data.url_foto_perfil;
                users_id[socket.id_user] = socket
                console.log('0.1. En el socket' + users_id[socket.id_user].id)

                users[socket.username] = socket; //agrega a la lista de usuarios, especificamente en un determinado usuario toda la informacion del socket
                var to_socket = socket.id

                actualizarListaUsuarios();

                //console.log(users[socket.username])
                notif.to(socket).emit('new message', mensajes);
            }
        });


        socket.on('disconnect', () => {
            console.log('Se deconecto el usuario: ' + socket.id)
            delete users[socket.username];
            console.log(Object.keys(users))
            actualizarListaUsuarios()

        })
        function actualizarListaUsuarios() {
            if (Object.keys(users).length === 0) {
                mensajes = ''
            }
            var usuarios_contectados = [];
            var resul = Object.values(users);

            for (let index = 0; index < resul.length; index++) {
                usuarios_contectados[index] =
                {
                    id_user: resul[index].id_user,
                    usuario: resul[index].username,
                    nombres: resul[index].nombres,
                    foto: resul[index].foto
                }
            }
            console.log(usuarios_contectados)
            //notif.to(to_socket).emit('usernames', usuarios_contectados);
            notif.emit('usernames', usuarios_contectados);
            //io.sockets.emit('usernames', Object.keys(users));
        }

        socket.on('ObtenerPublicaciones', (id_user) => {
            ObtenerPublicaciones(id_user).then(respuesta => {
                if (respuesta.result === true) {
                    notif.to(so).emit('CargarPublicaciones', respuesta.data)
                }
            })
        })

        // AQUI EMPIEZAN LAS HISTORIAS
        socket.on('ObtenerHistorias', (id_user) => {
            ObtenerHistorias(id_user).then(respuesta => {
                if (respuesta.result === true) {
                    //console.log(respuesta.data)
                    notif.to(so).emit('CargarHistorias', respuesta.data)
                }
            })
        })

        socket.on('ObtenerMisHistorias', (id_user) => {
            ObtenerMisHistorias(id_user).then(respuesta => {
                if (respuesta.result === true) {
                    //console.log('mishistroias', respuesta.data)
                    notif.to(so).emit('CargarMisHistorias', respuesta.data)
                }
            })
        })

        socket.on('RegistrarVista', (id_historia, id_user) => {
            RegistrarVista(id_historia, id_user).then(respuesta => {
                if (respuesta.result === true) {
                    console.log('Registrado', respuesta.data)
                    notif.to(so).emit('Registrado', respuesta.data)
                }
            })
        })

        socket.on('SeguirA', (id_user, id_usuarioaseguir, fecha, cb) => {

            //console.log(id_user + " " + id_usuarioaseguir)
            var to_socket = socket.id;
            Seguir_a(id_user, id_usuarioaseguir).then(respuesta => {
                if (respuesta.result === true) {
                    //CREAR UNA NOTIFICACION Y LA GUARDAR EN LA BASE DE DATOS Y LUEGO EMITIRLA AL USUARIO CORRESPONDIENTE (id_usuarioaseguir)
                    RegistrarNotificacion(null, id_user, respuesta.id_usuarioaseguir, descripciones.seguir, tipo_notificacion.seguir, false, fecha).then(resultado => {

                        if (resultado === true) {
                            console.log('llego a la funcion reg')
                            CargarNotificaciones(respuesta.id_usuarioaseguir, to_socket);
                            cb(true) //Si la respsuesta es True el boton "Seguir" debe cambiar a "Pendiente"
                        }
                    });
                }

                if (respuesta === false || respuesta === 'USUARIO_NO_ENCONTRADO') {
                    cb(false) //Si la respsuesta es False emitirá una notificación push
                }
            });
        });

        socket.on('SolicitudSeguimiento', (id_user_solicita, id_usuarioaseguir, solicitud, fecha, cb) => {

            var to_socket = socket.id;

            SolicitudSeguimiento(id_user_solicita, id_usuarioaseguir, solicitud).then(respuesta => {

                if (respuesta.result === true) {

                    if (respuesta.data.estado === 'ACEPTADO') {
                        //console.log(respuesta.data.mensaje)
                        cb(true) //recarga el perfil
                    }

                    if (respuesta.data.estado === 'RECHAZADO') {
                        //console.log(respuesta.data.mensaje)
                        cb(false) //cambia nuevaente a seguir
                    }
                    EliminarNotificacion(id_user_solicita, id_usuarioaseguir, tipo_notificacion.seguir);
                    CargarNotificaciones(id_usuarioaseguir, to_socket);
                    RegistrarNotificacion(null, id_usuarioaseguir, id_user_solicita, respuesta.data.mensaje, tipo_notificacion.confirmacion_solicitud, false, fecha).then(resultado => {
                        if (resultado === true) {
                            //console.log('llego a la funcion reg')
                            CargarNotificaciones(respuesta.data.id_user_solicita, to_socket);
                            //cb(true) //Si la respsuesta es True el boton "Seguir" debe cambiar a "Pendiente"
                        }
                    });

                    // CargarNotificaciones(respuesta.data.id_user_solicita)

                } else {
                    cb('ERROR')
                    //console.log('algo a ocurrido')
                }

            })
        });

        socket.on('CargarNotificaciones', id_usuario => {
            //console.log('Llego a la funcion con el id: ' + id_usuario)
            console.log('1.2 El socket que solicita es el' + so)
            CargarNotificaciones(id_usuario, so)
        });

        socket.on('ReaccionarPublicacion', (id_publicacion, id_user, fecha_creacion, tipo_reaccion, cb) => {
            ReaccionarPublicacion(id_publicacion, id_user, fecha_creacion, tipo_reaccion).then(respuesta => {

                if (respuesta.result === true) {
                    cb(true);
                    var tipo_notif;
                    if (tipo_reaccion === 'ME_GUSTA') { tipo_notif = tipo_notificacion.reaccion_pub.gusta; }
                    if (tipo_reaccion === 'ME_ENCANTA') { tipo_notif = tipo_notificacion.reaccion_pub.encanta; }
                    if (tipo_reaccion === 'ME_ENFADA') { tipo_notif = tipo_notificacion.reaccion_pub.enfada; }
                    if (tipo_reaccion === 'ME_SORPRENDE') { tipo_notif = tipo_notificacion.reaccion_pub.sorprende; }
                    if (tipo_reaccion === 'ME_DIVIERTE') { tipo_notif = tipo_notificacion.reaccion_pub.divierte; }
                    if (tipo_reaccion === 'ME_ENTRISTECE') { tipo_notif = tipo_notificacion.reaccion_pub.entristece; }

                    var to_socket = users_id[respuesta.id_user].id
                    console.log('1. La notificacion de reaccion se ira para: ' + users_id[respuesta.id_user].id)
                    //console.log('llego a la funcion reaccionar: ' + tipo_reaccion)

                    RegistrarNotificacion(id_publicacion, id_user, respuesta.id_user, descripciones.reaccion, tipo_notif, false, fecha_creacion).then(valor => {
                        if (valor === true) {
                            CargarNotificaciones(respuesta.id_user, to_socket);
                        }
                    })

                } else {
                    cb(false);
                }
                //obtener el dueño de la publicacion para notificarle
            });
        });

        socket.on('ComentarPublicacion', (id_publicacion, id_user, fecha_comentario, texto_comentario, cb) => {
            //var to_socket = socket.id;
            ComentarPublicacion(id_publicacion, id_user, fecha_comentario, texto_comentario).then(respuesta => {
                if (respuesta.result === true) {
                    //console.log('se registro el comentario')
                    cb(true)
                    var to_socket = users_id[respuesta.id_user].id
                    console.log('1. La notificacion de reaccion se ira para: ' + users_id[respuesta.id_user].id)
                    RegistrarNotificacion(id_publicacion, id_user, respuesta.id_user, descripciones.comentario, tipo_notificacion.comentario, false, fecha_comentario).then(valor => {
                        if (valor === true) {
                            CargarNotificaciones(respuesta.id_user, to_socket);
                        }
                    })
                } else {
                    console.log('no se registro el comentario')
                    cb(true)
                }
            })

        });

        socket.on('ReaccionarComentario', (id_comentario, id_user, fecha_creacion, tipo_reaccion, cb) => {
            console.log('llego a la funcion reaccionar comentario: ' + tipo_reaccion)

            ReaccionarComentario(id_comentario, id_user, fecha_creacion, tipo_reaccion).then(respuesta => {

                if (respuesta.result === true) {
                    var tipo_notif;
                    if (tipo_reaccion === 'ME_GUSTA') { tipo_notif = tipo_notificacion.reaccion_com.gusta; }
                    if (tipo_reaccion === 'ME_ENCANTA') { tipo_notif = tipo_notificacion.reaccion_com.encanta; }
                    if (tipo_reaccion === 'ME_ENFADA') { tipo_notif = tipo_notificacion.reaccion_com.enfada; }
                    if (tipo_reaccion === 'ME_SORPRENDE') { tipo_notif = tipo_notificacion.reaccion_com.sorprende; }
                    if (tipo_reaccion === 'ME_DIVIERTE') { tipo_notif = tipo_notificacion.reaccion_com.divierte; }
                    if (tipo_reaccion === 'ME_ENTRISTECE') { tipo_notif = tipo_notificacion.reaccion_com.entristece; }

                    var to_socket = users_id[respuesta.id_user].id
                    console.log('1. La notificacion de reaccion se ira para: ' + users_id[respuesta.id_user].id)

                    RegistrarNotificacion(id_comentario, id_user, respuesta.id_user, descripciones.reaccion_comentario, tipo_notif, false, fecha_creacion).then(valor => {
                        if (valor === true) {
                            CargarNotificaciones(respuesta.id_user, to_socket);
                        }
                    })
                    cb(true);
                } else {
                    cb(false);
                }
                //obtener el dueño de la publicacion para notificarle
            });
        });

        socket.on('send message', (data, cb) => {

            //console.log(data)
            var to_socket_me = socket.id;
            var to_socket_user = users[data.user].id
            console.log('el mensaje se dirige al socket: ' + to_socket_user)

            RegistrarMensaje(data.from_usuario, data.mensaje, data.to_usuario, data.fecha).then(respuesta => {
                if (respuesta.result === true) {
                    ObtenerListaMensajes(data.from_usuario, data.to_usuario, to_socket_me, to_socket_user);
                    cb(true);
                } else {
                    console.log('No se guardo el mensaje')
                    notif.to(to_socket).emit('cargarmensajes', ({ result: false, info: 'No se pudo enviar tu mensaje' }));
                }
            })

        });

        socket.on('EnviarImagen', data => {

            console.log(data.fileName)
            var to_socket = socket.id;

            /*RegistrarMensaje(data.from_usuario, data.mensaje, data.to_usuario, data.fecha).then(respuesta => {
                if (respuesta.result === true) {
                    ObtenerListaMensajes(data.from_usuario, data.to_usuario);
                } else {
                    console.log('No se guardo el mensaje')
                    notif.to(to_socket).emit('cargarmensajes', ({ result: false, info: 'No se pudo enviar tu mensaje' }));
                }
            })*/

        })

        socket.on('ObtenerBandejaEntrada', (id_user, usuario) => {
            //var to_socket = socket.id;
            var to_socket = users[usuario].id
            //var to_socket = users_id[id_user].id
            console.log('Recargar la bandejea para el usuario: ' + usuario)
            console.log('Recargar la bandejea para el id_usuario: ' + id_user)
            console.log('Recargar la bandejea para el socket: ' + to_socket)

            BandejaEntrada(id_user).then(respuesta => {
                if (respuesta.result === true) {
                    notif.to(to_socket).emit('BandejaEntrada', ({ result: true, info: respuesta.data }));
                } else {
                    notif.to(to_socket).emit('BandejaEntrada', ({ result: false, info: 'No tienes mensajes aún, inicia una conversación' }));
                }
            });
        });

        socket.on('ObtenerMensajes', (from_usuario, to_usuario, user) => {
            //console.log('el usuario ' + user)
            var to_socket_me = socket.id;
            var to_socket_user = users[user].id
            ObtenerListaMensajes(from_usuario, to_usuario, to_socket_me, to_socket_user)
        })

        socket.on('ObtenerMensajes2', (from_usuario, to_usuario) => {
            //console.log('el usuario ' + user)
            var to_socket_me = socket.id;
            //var to_socket_user = users[user].id
            ObtenerListaMensajes(from_usuario, to_usuario, to_socket_me, '')
        })

        socket.on('GuardarPublicacion', (id_publicacion, id_user, cb) => {
            GuardarPublicacion(id_publicacion, id_user).then(respuesta => {
                if (respuesta.result === true) {
                    cb(true)
                } else {
                    cb(false)
                }
            })
        })

        socket.on('ObtenerUnaPublicacion', (id_publicacion, id_user) => {
            var to_socket = socket.id
            ObtenerUnaPublicacion(id_user, id_publicacion).then(respuesta => {
                if (respuesta.result === true) {
                    notif.to(to_socket).emit('CargarUnaPublicacion', respuesta.data)
                }
            })
        })


        ObtenerListaMensajes = async (from_usuario, to_usuario, to_socket_me, to_socket_user) => {
            ObtenerMensajes(from_usuario, to_usuario).then(respuesta => {
                //console.log(list)
                if (respuesta.result === true) {
                    //console.log('Se enviara el mensaje para ' + to_socket)
                    notif.to(to_socket_me).emit('cargarmensajes', ({ result: true, info: respuesta.data }));
                    notif.to(to_socket_user).emit('cargarmensajes', ({ result: true, info: respuesta.data }));
                } else {
                    notif.to(to_socket_me).emit('cargarmensajes', ({ result: false, info: 'No tienes mensajes aún, inicia una conversación' }));
                    notif.to(to_socket_user).emit('cargarmensajes', ({ result: false, info: 'No tienes mensajes aún, inicia una conversación' }));
                }
            })
        }


        CargarNotificaciones = async (id_usuario, to_socket) => {

            ObtenerNotificaciones(id_usuario).then(respuesta => {
                if (respuesta.result === true) {
                    //console.log('la variable so' + so)
                    //console.log(respuesta.data)
                    console.log('2. Notificacion enviada para: ' + to_socket)
                    notif.to(to_socket).emit('RecibirNotificacion', respuesta.data);
                    //return true;
                } else {
                    console.log('ocurrio un error para el ' + so)
                    notif.to(to_socket).emit('RecibirNotificacion', ({ result: 'EMPTY', info: id_usuario }));
                    //return false;
                    //notif.to('/notificaciones#' + socket_usuario).emit('RecibirNotificacion', "No tienes notificaciones");
                    // console.log('No tiene Notificaciones')
                }
            })


        }

    });





}