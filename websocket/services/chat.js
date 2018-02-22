module.exports = function( app, socket ){
    var server = app.websocketServer;

    // Listen to chat events
    socket.on('ch.writing', _sendWriting );
    socket.on('ch.read', _sendRead );

    function _sendRead( data ){
        if( data.users && data.id ){
            data.users.forEach( user_id => {
                server.to('user.'+user_id).emit('ch.read', { id:data.id, user_id: socket.user.id });
            });
        }
    }

    function _sendWriting( data ){
        if( data.users && data.id ){
            data.users.forEach( user_id => {
                server.to('user.'+user_id).emit('ch.writing', { id:data.id, user_id: socket.user.id });
            });
        }
    }
};