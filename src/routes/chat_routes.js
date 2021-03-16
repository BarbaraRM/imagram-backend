const { Router } = require('express');
const router = Router();
const { RegistrarMensajeImagen } = require('../controllers/chat_controllers')
const upload_publicacion = require('../controllers/upload_chat_img_controller')

router.route('/enviarimagen/:id')
    .post(upload_publicacion.single('imagen-chat'), RegistrarMensajeImagen);

module.exports = router;
