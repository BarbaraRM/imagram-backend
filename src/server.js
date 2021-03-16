/*Inicializar modulos*/
const express = require('express');
const path = require("path");
const app = express();
const bodyParser = require('body-parser')
const cors = require('cors'); //Importación de Middleware
const morgan = require('morgan'); //Importación de Middleware


/*Verificamos el estado de conexion de las base de datos*/
require('./dbs/postgresql')
require('dotenv').config()


/*Asignar puerto al servidor*/
const port = process.env.APP_PORT; //Obtenemos el puerto desde nuestra variable de entorno .env y en caso de que no exita usara el 5000
app.set('port', process.env.PROT || 5000);



/*Sessions*/
const passport = require('passport')//Para validar inicio de session con passport
require('./controllers/autentificacion')
const redis = require('redis')
const ExpressSession = require('express-session');
const usuarios_controller = require('./controllers/usuarios_controller');
const RedisStore = require('connect-redis')(ExpressSession) //Almacenar sesiones con en Redis


const redisClient = redis.createClient({
    host: process.env.REDIS_DB_HOST,
    port: process.env.REDIS_DB_PORT,
    password: process.env.REDIS_DB_PASS, //Nota: Configurar clave de servidor Redis
    db: process.env.REDIS_DB_NAME,
});


/*En SessionMiddleware se configura todo lo referente a la sesión del usuario.
Las sesiones se almacenarán en una Base de Datos Redis y además creará una cookie
que permitira la permanencia de la sesión durante un año, siempre y cuando el 
usuario no cierre sesión */

//var expiryDate = (60 * 60 * 1000); // 1 hour (2000 --> 2 horas)
//var expiryDate = (86400000); // 86400000 --> 24 Horas
var expiryDate = (3.154e+10); //3.154e+10 --> 1 año

const SessionMiddleware = ExpressSession({
    store: new RedisStore({ client: redisClient }), //Aqui se pone el hash de configuración, tal como puerto, contraseña, ip del servidor de redis...
    secret: "cambiarlaclaveaunamassegura",
    resave: false, //Si ponemos en true guarda demasiadas sessiones
    saveUninitialized: false,
    name: 'sessionID',
    cookie: {
        secure: false,
        expires: true,
        //domain: '192.168.100.5', //reemplazar por empleosexpress.com
        maxAge: expiryDate, // 86400000 --> 24 Horas //3.154e+10 --> 1 año
    }
})

app.use(SessionMiddleware)

/*--------------------------------------------------------------------------------------------------------------------*/




/*Middlewares*/
app.use(cors({ //Cors permite la comunicacion entre dos servidores
    origin: ['http://localhost:4200'], //frontend server
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true // true enable set cookie
}));
app.use(function (req, res, next) {
    res.header()
    res.header('Access-Control-Allow-Credentials', true);
    res.header('Access-Control-Allow-Methods', 'GET, PUT, POST, DELETE');
    res.header("Access-Control-Allow-Origin", 'http://localhost:4200'); //frontend server //antes estaba localhost en lugar de la IP http://localhost:4200
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization");
    res.header("Access-Control-Expose-Headers", "Authorization");
    next();
});

app.use(morgan('dev')); //Permite ver en consola el intercambio de datos mediante las peticiones http
app.use(express.json()); //Permite obtener datos en formato JSON desde el request.body de la peticion 
app.use(bodyParser.json()); //Para leer peticiones application/JSON
app.use(bodyParser.urlencoded({ extended: true })) //Para leer peticiones http (get/post)
app.use(passport.initialize()); //Inicializa la libreria passport
app.use(passport.session()); //Llama a la función session de passport

/*Routes*/
app.use('/api/usuarios', require('./routes/usuarios_routes'));
app.use('/api/friends', require('./routes/friends_routes'));
app.use('/api/publicaciones', require('./routes/publicaciones_routes'));
app.use('/api/notificaciones', require('./routes/notificaciones_routes'));
app.use('/api/historias', require('./routes/historias_routes'));
app.use('/api/chat', require('./routes/chat_routes'));
//const conexion_pg = require('./dbs/postgresql');

app.get('/api/select', async (req, res) => {
    try {
        var usuario = 'Donnis'

        /*Obtenemos el id del usuario*/
        var usuario = await conexion_pg.query("SELECT id_user from usuarios where usuario = $1;", [usuario]);

        var id_user = usuario.rows[0].id_user;
        var priv_cuenta = 'PRIVADA'
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
        console.log(error)
    }

});

app.get('/api/codigo', (req, res) => {

    //const {id} = req.params;

    /*const Hashids = require('hashids');
    const hashids = new Hashids('Donnis')
    res.send(hashids.encode(1,2,3))*/


    //function rand_code(chars, lon){
    //var chars = "0123456789abcdefABCDEF?¿¡!:;";
    var chars = "0123456789abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ";
    var lon = 5//20;
    code = "";
    for (x = 0; x < lon; x++) {
        rand = Math.floor(Math.random() * chars.length);
        code += chars.substr(rand, 1);
    }
    //return code;
    res.send(code);
    //dat.nombre







    //alert(rand_code(caracteres, longitud));
    //devuelve una cadena aleatoria de 20 caracteres
});




/*Archivos Estáticos*/
//app.use('/public', express.static(path.join(__dirname, 'public')));
//app.use('/public', express.static(`C:/Users/alber/publicaciones`));
app.use('/public', express.static(process.env.PATH_PUBLICACIONES));
app.use(express.static(path.join(__dirname, "./public")));
module.exports = { app, SessionMiddleware };
