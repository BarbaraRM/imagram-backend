const { Router } = require('express');
const router = Router();
const { Seguir_a, SolicitudSeguimiento, Sugerencias } = require('../controllers/friends_controller')




/*Registra Usuario - Sguir*/
router.route('/followto')
    .post(Seguir_a);
/*-----------------------------------*/


router.route('/solicitud')
    .post(SolicitudSeguimiento);

router.route('/sugerencias/:id')
    .get(Sugerencias);


module.exports = router;



