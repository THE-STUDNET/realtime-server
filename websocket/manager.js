var crypto = require('crypto'),
    connections_service = require('./services/connections'),
    chat_service = require('./services/chat'),
    document_service = require('./services/document');

module.exports = function( app ){
    var server = app.websocketServer;
    // Define user connection handler.
    server.on('connection', onConnection );

    function onConnection( socket ){
        // Wait to authentify event.
        socket.on('authentify',function(data){
            // Check if user is correctly authenticated...
            if( userIsAuthenticated( data.id, data.authentification ) ){
                // Set socket user data
                socket.user = data;
                // Set websocket services.
                // => connections service.
                connections_service( app, socket );
                // => chat service.
                chat_service( app, socket );
                // => document service.
                document_service( app, socket );
                // Join user channel.
                socket.join('user.'+socket.user.id);
                // Send to user that he is authenticated.
                socket.emit('authenticated');
            }
        });
    }

    function userIsAuthenticated( id, token ){
        return token === crypto.createHash('sha1').update( app.configuration.secret + id ).digest('hex');
    }
};
