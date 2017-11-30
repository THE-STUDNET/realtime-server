module.exports = function( app ){
    return {
        parameters: {
            value:{
                users:{value:'array'},
                conversation_id:{value:'number'},
                id:{value:'number'},
                type:{value:'number'}
            }
        },
        method: function(params, next){
            // Check if users array is not empty
            if( params.users.length ){
                // For each user => send him the message
                params.users.forEach(function(user_id){
                    app.websocketServer.to('user.'+user_id).emit('ch.message', params );
                });
                // Return OK.
                next(null,true);
            }else{
                // Return invalid params error.
                next( app.jsonrpcHandler.errors.INVALID_PARAMS, null);
            }
        }
    };
};
