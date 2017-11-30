module.exports = function( app ){
    return {
        parameters: {
            value:{
                notification:{value:'object'},
                users:{value:'array'},
                type:{value:'string'}
            }
        },
        method: function(params, next){
            if( params.type === 'user' && params.users.length ){
                // If type = user && having users => Send to each 'notification' event.
                params.users.forEach(function(user_id){
                    app.websocketServer.to('user.'+user_id).emit('notification', params.notification );
                });
                // Return OK.
                next(null,true);
            }else if( params.type === 'global' ){
                // Send 'notification' event to everybody connected on the platform.
                app.websocketServer.emit('notification', params.notification);
                // Return OK.
                next(null,true);
            }else{
                // Return invalid params error.
                next(app.jsonrpcHandler.errors.INVALID_PARAMS,null);
            }
        }
    };
};
