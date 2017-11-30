module.exports = function( app ){
    return {
        parameters: {
            value:{
                item_id:{value:'number'},
                users:{value:'array'}
            }
        },
        method: function(params, next){
            // For each users => send via websocket 'submission.changed' event.
            params.users.forEach(function(user_id){
                app.websocketServer.to('user.'+user_id).emit('submission.changed', params.item_id );
            });
            // Return OK.
            next(null,true);
        }
    };
};
