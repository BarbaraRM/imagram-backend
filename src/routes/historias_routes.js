const { Router } = require('express');
const router = Router();

const upload_historia = require('../controllers/upload_historias_controller');
const { PublicarHistoria, EliminarHistorias, ObtenerHistorias, RegistrarVista, ObtenerVistas } = require('../controllers/historias_controller');

//form_upload_publicacion --> representa la etiqueda del formdata con el que se ha enviado el archivo desde el frontend
//Esta función requiere un metodo post con dos parametros (file/multipart, descripcion)
router.route('/upload_historia/:id')
    .post(upload_historia.single('form_upload'), PublicarHistoria);

router.route('/obtener_historias')
    .post(ObtenerHistorias);
router.route('/eliminar_historias')
    .post(EliminarHistorias);

router.route('/registrar_vista')
    .post(RegistrarVista);

router.route('/obtener_vistas')
    .post(ObtenerVistas);


module.exports = router;