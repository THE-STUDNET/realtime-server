module.exports = function( app ){
    return {
        parameters: {
            value:{
                version:{value:'string', optional:true}
            }
        },
        method: function(params, next){
            // Send via redis & websocket 'platforme.update' event.
            app.websocketServer.emit('platform.update', params.version);
            // Return...
            next(null,true);
        }
    };
};
