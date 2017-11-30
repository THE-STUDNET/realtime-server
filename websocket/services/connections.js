module.exports = function( app, socket ){

    var server = app.websocketServer,
        redisDB = app.redisDB,
        statusExpirationDelay = app.configuration.expiration_delay || 36000;

    // Listen to events
    socket.on('setContacts', onNewContacts );
    socket.on('removeContacts', onRemovedContacts );
    socket.on('status', updateStatus );
    socket.on('disconnect', onDisconnect );
    // Notify user connections that user is now connected.
    server.to('user.'+socket.user.id+'.state').emit('user.connected',[socket.user.id]);
    // Update user status
    updateStatus();

    // On disconnect -> If it's last user session delete status & notify people.
    function onDisconnect(){
        redisDB.get('user.'+socket.user.id+'.state').then(function(key){
            var status = JSON.parse(key);
            delete( status[socket.user.connection_token] );
            // Update in redis user status
            redisDB.set('user.'+socket.user.id+'.state', JSON.stringify(status));
            // Notify people about user disconnection if no session remains.
            if( !Object.keys(status).length ){
                server.to('user.'+socket.user.id+'.state').emit('user.disconnected',[socket.user.id]);
            }
        });
    }
    // Refresh user status
    function updateStatus(){
        redisDB.get('user.'+socket.user.id+'.state').then(function(key){
            var status = JSON.parse(key)||{}, t = (new Date()).getTime();

            Object.keys( status ).forEach( function(k){
                if( status[k] < t ){
                    delete(status[k]);
                }
            });

            status[socket.user.connection_token] = (new Date()).getTime() + statusExpirationDelay;
            redisDB.set('user.'+socket.user.id+'.state', JSON.stringify(status) );
        });
    }
    // Unsubscribe from removed contacts channels.
    function onRemovedContacts( data ){
        data.contacts.forEach(function(user_id){
            socket.leave('user.'+user_id+'.state');
        });
    }
    // Subscribe to new connections channels && notify user about their statuses.
    function onNewContacts( data ){
        var pipeline = redisDB.pipeline(), n;

        data.contacts.forEach(function(user_id){
            channel = 'user.'+user_id+'.state';
            socket.join(channel);
            pipeline.get(channel);
        });

        pipeline.exec(function(err, results){
            if( !err ){
                var connected = [],
                    disconnected = [],
                    t=(new Date()).getTime();

                results.forEach(function(r, i){
                    if( !r[0] ){
                        var status = JSON.parse(r[1])||{}, keys = Object.keys(status);
                        if( keys.length
                            && keys.some(function(k){ return status[k]>t; }) ){
                            connected.push( parseInt(data.contacts[i]) );
                        }
                        else{
                            disconnected.push( parseInt(data.contacts[i]) );
                        }
                    }
                });

                socket.emit('user.connected', connected);
                socket.emit('user.disconnected', disconnected);
            }
        });
    }
};
