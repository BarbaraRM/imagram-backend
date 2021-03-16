const { Router } = require('express');
const router = Router();

const upload_perfil = require('../controllers/upload_perfil_controller')
const upload_portada = require('../controllers/upload_portada_controller')

const { EstaAutenticado } = require('../controllers/validaciones')
//const { registrarUsuario, ModificarContra, InactivarCuenta, DesbloquearCuenta, BloquearCuenta, ObtenerInformacionUsuario, ObtenerInformacionUsuario2, EnviarCodigoVerificacionCuenta, EnviarCodigoRecuperacionCuenta, Login, Logout, ValidarCuenta, ActualizarInformacionUsuario, ObtenerListaSeguidos, ObtenerListaSeguidores } = require('../controllers/usuarios_controller')



const {
    registrarUsuario,
    ReactivarCuenta,
    EnviarCodigoVerificacionCuenta,
    Login,
    Logout,
    ValidarCuenta,
    ActualizarInformacionUsuario,
    ObtenerListaSeguidos,
    ObtenerListaSeguidores,
    ValidarEstadoCuenta,
    EnviarCodigoRecuperacionCuenta,
    ObtenerInformacionUsuario,
    ObtenerInformacionUsuario2,
    ObtenerInformacionUsuario3,
    correoExiste,
    ModificarContra,
    DesbloquearCuenta,
    BloquearCuenta,
    InactivarCuenta,
    ComprobarSigoUsuario, ObtenerBloqueados, UploadPerfil, UploadPortada
} = require('../controllers/usuarios_controller')


/*Registrar Información del Usuario*/
router.route('/registrar')
    .post(registrarUsuario);
router.route('/ModiContra')
    .post(ModificarContra);

router.route('/validarcuenta')
    .post(ValidarCuenta);
/*-----------------------------------*/



/*Sesion del Usuario*/
router.route('/login')
    .post(Login);

router.route('/logout')
    .get(EstaAutenticado, Logout);
/*-----------------------------------*/


router.route('/emailcodigocuenta')
    .post(EnviarCodigoVerificacionCuenta);
router.route('/validarcorreo')
    .post(correoExiste);
router.route('/inactivarcuenta')
    .post(InactivarCuenta);

router.route('/emailrecuperacuenta')
    .post(EnviarCodigoRecuperacionCuenta);

router.route('/obtener_infouser/:id')
    .get(ObtenerInformacionUsuario);

router.route('/bloquearcuenta')
    .post(BloquearCuenta);

router.route('/desbloquearcuenta')
    .post(DesbloquearCuenta);

router.route('/obtener_infouseru/:usuario')
    .get(ObtenerInformacionUsuario2);
router.route('/obtener_infouseru3')
    .post(ObtenerInformacionUsuario3);

router.route('/actualizar_info')
    .post(ActualizarInformacionUsuario);


router.route('/getlistaseguidos')
    .post(ObtenerListaSeguidos);

router.route('/getlistaseguidores')
    .post(ObtenerListaSeguidores);

router.route('/validarestadocuenta/:id')
    .get(ValidarEstadoCuenta);

router.route('/reactivarcuenta/:id')
    .get(ReactivarCuenta);

router.route('/comprobarsigousuario')
    .post(ComprobarSigoUsuario);


router.route('/bloqueados')
    .post(ObtenerBloqueados);



router.route('/upload_perfil/:id')
    .post(upload_perfil.single('upload_perfil'), UploadPerfil);

router.route('/upload_portada/:id')
    .post(upload_portada.single('upload_portada'), UploadPortada);

module.exports = router;