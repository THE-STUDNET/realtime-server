console.log('LAUNCHING APP');
console.error('LAUNCHING APP2');

var app = {},
    // REQUIRE GLOBAL MODULES
    argv = require('yargs').argv,
    fs = require('fs'),
    // REQUIRE NODE MODULES
    deepAssign = require('recursive-object-assign'),
    io = require('socket.io'),
    ioAdapter = require('socket.io-redis'),
    redis = require('ioredis'),
    jsonrpcHandler = require('node-jsonrpc2');
    // REQUIRE LIBS
    notificationsManager = require('./libs/notificationsManager');

// --- DEFINE APP CONFIGURATION --- //
app.configuration = require('./configuration.js');
if( argv.env ){
    app.configuration = deepAssign(app.configuration, require('./envs/'+argv.env) );
}

// --- SET APP LOGGER --- //
app.logger = require('./libs/logger')(app);

// --- SET REDIS DB CLIENTS --- //
var pubClient = new redis( app.configuration.redis ),
    subClient = new redis( app.configuration.redis );
// Listen to clients errors.
pubClient.on('error', function(){
    app.logger.error('Redis pubClient ERROR:', arguments, (new Date()).toISOString() );
});
subClient.on('error', function(){
    app.logger.error('Redis subClient ERROR:', arguments, (new Date()).toISOString() );
});
// Set app redis client.
app.redisDB = pubClient;

// --- SET WEBSOCKET SERVER --- //
app.websocketServer = io( app.configuration.engine );
app.websocketServer.adapter(ioAdapter({pubClient: pubClient,subClient: subClient}));
app.websocketServer.of('/').adapter.on('error', function(){
    app.logger.error('socket.io adapter error', arguments, (new Date()).toISOString() );
});

// --- SET NOTIFICATION MANAGER --- //
var options = {
    request:{
        port: app.configuration.services.twic_api.port,
        protocol: app.configuration.services.twic_api.protocol,
        host: app.configuration.services.twic_api.host,
        method: app.configuration.services.twic_api.method,
        path: app.configuration.services.twic_api.notify_path,
        headers: app.configuration.services.twic_api.headers
    }
}
app.ntfManager = new notificationsManager( pubClient, options );
app.ntfManager.start();

// Listen to websocket user events.
require('./websocket/manager')(app);

// --- SET APP JSONRPC HANDLER --- //
app.jsonrpcHandler = new jsonrpcHandler( app.configuration.jsonrpc );
// --- EXPOSE API --- //
require('./api/api')(app);

// OPEN HTTP SERVER, SET JSONRPC HANDLER, LISTEN, SET WEBSOCKET HANDLER.
// --- GET HTTP OR HTTPS SERVER ---//
var webserver;
if( app.configuration.use_node_https && fs.existsSync(app.configuration.node_https_cert) &&
    fs.existsSync(app.configuration.node_https_key) ){
    webserver = require('https').createServer({ key:fs.readFileSync(app.configuration.node_https_key), cert: fs.readFileSync(app.configuration.node_https_cert) },app.jsonrpcHandler.handle );
}else{
    webserver = require('http').createServer( app.jsonrpcHandler.handle );
}

app.websocketServer.attach(
    webserver.listen( app.configuration.port ) );
