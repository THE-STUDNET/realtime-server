module.exports = {
    use_node_https: false,
    //node_https_cert: 'cert.pem file path',
    //node_https_key: 'key.pem file path',
    api_methods:[
        'platform.update',
        'user.isConnected',
        'message.publish',
        'submission.changed',
        'notification.publish',
        'notification.register',
        'notification.unregister'
    ],
    secret: 'APP_SECRET_KEY', // App key to authenticate websocket users.
    port: 8080, // App listening port
    engine:{
        pingTimeout:60000,
        pingInterval:25000
        // See https://github.com/socketio/socket.io/blob/master/docs/API.md for options
        // maxHttpBufferSize: SIZE,
        // allowRequest: (fn),
        // transports: ['polling','websocket']
        // allowUpgrades: true,
        // perMessageDeflate: true,
        // httpCompression: true,
        // cookie: 'io'
    },
    redis:{
        host:'localhost',
        port:6379
        // password: 'REDIS_PASSWORD'
        // More configuration options here: https://github.com/luin/ioredis/blob/master/API.md#new_Redis
    },
    jsonrpc:{
        // JSONRPC Server options here: https://github.com/gmasmejean/node-jsonrpc2
        // hasAuthorization: functionToCheckUserAuthorization
    },
    notification_manager:{
        request:{
            // API Request options. See https://nodejs.org/api/http.html#http_http_request_options_callback
            protocol: 'https:',
            host: 'API_DOMAIN',
            port: 443,
            path: '/notify',
            method: 'POST',
        }
    },
    log_file_path:'', // PATH TO LOG FILE. IF NOT DEFINED CREATE A FILE stdout.log in current folder.
    error_file_path:''  // PATH TO ERROR LOG FILE. IF NOT DEFINED CREATE A FILE stderr.log in current folder.
};
