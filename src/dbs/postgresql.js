require('dotenv').config() //Permite obtener datos de variables de entorno .env

const { Pool, Connection } = require('pg')

/*Todos los datos referentes a la Base de Datos estan en la variable de entorno .env */
const config = {
    user: process.env.USER_PG,
    password: process.env.PASSWORD_PG,
    database: process.env.DATABASE_PG,
    host: process.env.HOST_PG,
    port: process.env.PORT_PG,
    ssl: true
};

const conexion_pg = new Pool(config);

conexion_pg.connect()
    .then(db_pg => console.log('Conexión exitosa con base de datos PostgreSQL'))
    .catch(err => console.log('Error al conectar con base de datos PostgreSQL ' + err));

module.exports = conexion_pg;