/*Inicializar Módulos*/
const { app, SessionMiddleware } = require('./server');
const http = require('http')
const server = http.Server(app);


async function main() {

    //INICIALIZACION DEL SERVIDOR
    //server.listen(5000, "0.0.0.0")

    server.listen(app.get('port'), "0.0.0.0", () => { //server.listen(4000, "0.0.0.0")
        console.log(`Server Imagram Backend on port ${app.get('port')}`);
    });



    /*Inicializar Sockets y envio de Sessiones al Frontend*/
    const sock = require('./sockets/sockets')
    sock(server, SessionMiddleware)

}

main();