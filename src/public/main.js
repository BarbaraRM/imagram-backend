const socket = io('/notificaciones');
const btn_seguir_a = document.getElementById('btn_seguir');



/*Se llama al cargar la página, ponerla de preferencia 
en el componente barra de navegacion y se envia el id del usuario en sesion
*/
socket.emit('CargarNotificaciones', 45);

socket.on('RecibirNotificacion', (data) => {
    if (data.result === 'EMPTY') {
        /*Muestra en el area de notificaciones un mensaje que indica que no tiene notificaciones*/
        console.log(data.info + ' No tienes Notificaciones')
    } else {
        /*Muestra en el area de notificaciones la lista*/
        console.log(data)
    }
});



/*Click en boton Seguir en el perfil de un usuario*/
function SeguirA(id_user, id_usuarioaseguir) {
    socket.emit('SeguirA', id_user, id_usuarioaseguir, '2020-11-11 22:00:00', function (salida) {
        if (salida === true) {
            //Si la respsuesta es True el boton "Seguir" debe cambiar a "Pendiente"
            alert('Pendiente')
        } else {
            //Si la respuesta es False emitirá una notificación push donde solicitará actualizar la página
            alert('vuelve a intentarlo')
        }
    })
}


/*Click en boton Aceptar o Rechazar en la notificacion de solicitud de seguimiento*/
function SolicitudSeguimiento(id_user_solicita, id_usuarioaseguir, solicitud) {
    socket.emit('SolicitudSeguimiento', id_user_solicita, id_usuarioaseguir, solicitud, '2020-11-11 22:00:00', function (salida) {
        if (salida === 'ERROR') {
            alert('Ha ocurrdio un error recarga la pagina')
        }
    })
}


function Reaccionar(id_publicacion, id_user, fecha_creacion, tipo_reaccion) {

    socket.emit('ReaccionarPublicacion', id_publicacion, id_user, fecha_creacion, tipo_reaccion, (salida) => {
        if (salida === true) {
            /*Si la salida es true el boton reaccion debe cambiar con el icono y nombre de la reaccion selecionada*/
            /*Llamar el api para recargar las publicaciones */
            alert('se guardo la reaccion')
        } else {
            /*Notificacion push "Ha ocurrido un error"*/
            alert('NO guardo la reaccion')
        }
    });
}


function Comentar(id_publicacion, id_user, texto_comentario) {

    var fecha_comentario = '2020-11-12 15:00:00';
    socket.emit('ComentarPublicacion', id_publicacion, id_user, fecha_comentario, texto_comentario, (salida) => {
        if (salida === true) {
            //Llamar el api para recargar publicaciones
            alert('se guardó el comentario')
        } else {
            //Notificación push de que no se pudo guardar le mensaje
        }
    });

}
const removeAccents = (str) => {
    return str.normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}

function ObtenerHastag() {
    var descripcion = document.getElementById('hastag').value

    alert(removeAccents(descripcion));

    descripcion = descripcion + ' ';
    var lista_hashtag = []

    var new_descripcion = '';
    for (var i = 0; i < descripcion.length; i++) {

        if (descripcion.charAt(i) !== '#') {
            new_descripcion = new_descripcion + descripcion.charAt(i)
        }

        if (descripcion.charAt(i) === "#") {
            var hastag = ''
            new_descripcion = new_descripcion + '-'

            for (var j = i; j < descripcion.length; j++) {
                if ((descripcion.charAt(j) !== "#")) {
                    new_descripcion = new_descripcion + descripcion.charAt(j)
                }

                if (descripcion.charAt(j) !== " ") {
                    hastag = hastag + descripcion.charAt(j + 1);

                } else {
                    lista_hashtag.push(hastag)
                    i = j
                    break;
                }
            }
        }
    }

    console.log('DESCRIPCION: ' + new_descripcion)
    var hashtags = ''
    for (var i = 0; i < lista_hashtag.length; i++) {
        hashtags = hashtags + lista_hashtag[i]
    }


    var lista_hash = hashtags.split(' ');
    for (var i = 0; i < lista_hash.length; i++) {
        if (lista_hash[i] !== "") {
            console.log('Este se ba a guardar: ' + lista_hash[i])
        }
    }

}
