const { Router } = require('express');
const router = Router();

const upload_publicacion = require('../controllers/upload_files_controller')

const { UploadPublicacion, ObtenerPublicaciones, EditarDescripcionPublicacion, EliminarPublicacion,
    ReaccionarPublicacion, GuardarPublicacion, EliminarPublicacionGuardada, ObtenerPublicacionGuardadas,
    ObtenerPublicacionCreadas, ComentarPublicacion, EditarComentarioPublicacion,
    EliminarComentario, ReaccionarComentario, ObtenerHashtags, ObtenerPublicacionesHashtags, ObtenerPublicacionesHashtagsAleatorios, ObtenerUnaPublicacion } = require('../controllers/publicaciones_controller')


//form_upload_publicacion --> representa la etiqueda del formdata con el que se ha enviado el archivo desde el frontend
//Esta función requiere un metodo post con dos parametros (file/multipart, descripcion)
router.route('/upload_publicacion/:id')
    .post(upload_publicacion.single('form_upload'), UploadPublicacion);

router.route('/obtener_publicaciones')
    .post(ObtenerPublicaciones);

router.route('/editar_descripcion_publicacion')
    .post(EditarDescripcionPublicacion);

router.route('/eliminar_publicacion')
    .post(EliminarPublicacion);

router.route('/reaccionar_publicacion')
    .post(ReaccionarPublicacion);

router.route('/reaccionar_comentario')
    .post(ReaccionarComentario);

router.route('/comentar_publicacion')
    .post(ComentarPublicacion);

router.route('/editar_comentario')
    .post(EditarComentarioPublicacion);

/*router.route('/obtener_comentarios')
    .post(ObtenerComentarios);*/

router.route('/eliminar_comentario')
    .post(EliminarComentario);

router.route('/guardar_publicacion')
    .post(GuardarPublicacion);

router.route('/eliminar_publicacion_guardada')
    .post(EliminarPublicacionGuardada);

router.route('/obtener_publicaciones_guardadas')
    .post(ObtenerPublicacionGuardadas);

router.route('/obtener_publicaciones_creadas')
    .post(ObtenerPublicacionCreadas);

router.route('/hashtags')
    .get(ObtenerHashtags);

router.route('/hashtags/:id')
    .get(ObtenerPublicacionesHashtags);

router.route('/pubhashtags/')
    .get(ObtenerPublicacionesHashtagsAleatorios);

router.route('/unapublicacion')
    .post(ObtenerUnaPublicacion);


module.exports = router;    