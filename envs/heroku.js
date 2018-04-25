module.exports = {
    port: process.env.PORT,
    redis:{
        host: process.env.REDIS_HOST,
        port: process.env.REDIS_PORT,
        password: process.env.REDIS_PWD
    },
    jsonrpc:{
        authorization: process.env.JSONRPC_AUTH_TOKEN,
        hasAuthorization: function( request ){ return request.headers.authorization === this.config.authorization; }
    },
    secret: process.env.SECRET_HASH_KEY,
    services:{
        box:{
            api_key: process.env.BOX_API_KEY
        },
        twic_api: {
            port: process.env.TWIC_API_PORT,
            protocol: process.env.TWIC_API_PROTOCOL,
            host: process.env.TWIC_API_HOST,
            headers:{
                'x-auth-token': process.env.TWIC_API_X_AUTH_TOKEN
            }
        }
    }
};
