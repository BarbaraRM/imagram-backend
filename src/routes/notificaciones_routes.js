const { Router } = require('express');
const router = Router();

const { RegistrarNotificacion, ObtenerNotificaciones } = require('../controllers/notificaciones_controller')

router.route('/registrar')
    .post(RegistrarNotificacion);

router.route('/obtener')
    .post(ObtenerNotificaciones);
module.exports = router;