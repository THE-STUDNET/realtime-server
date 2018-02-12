module.exports = function( app, socket ){

    var server = app.websocketServer,
        redisDB = app.redisDB,
        statusExpirationDelay = app.configuration.expiration_delay || (5*60*1000); // default 5mn

    // Listen to events.
    socket.on('watch_user_status', watch );
    socket.on('unwatch_user_status', unwatch );
    socket.on('disconnect', onDisconnect );
    socket.on('status', updateStatus );

    // Notify user connections that user is now connected.
    server.to('user.'+socket.user.id+'.state').emit('user_status_change',{connected:[socket.user.id]});
    // Update user status
    updateStatus();

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
    // On disconnect -> If it's last user session delete status & notify people.
    function onDisconnect(){
        redisDB.get('user.'+socket.user.id+'.state').then(function(key){
            var status = JSON.parse(key);
            delete( status[socket.user.connection_token] );
            // Update in redis user status
            redisDB.set('user.'+socket.user.id+'.state', JSON.stringify(status));
            // Notify people about user disconnection if no session remains.
            if( !Object.keys(status).length ){
                server.to('user.'+socket.user.id+'.state').emit('user_status_change',{disconnected:[socket.user.id]});
            }
        });
    }
    // Stop watching for users status.
    function unwatch( data ){
        if( data &&  data.users && data.users.length ){
            data.users.forEach(function(user_id){
                socket.leave('user.'+user_id+'.state');
            });
        }
    }
    // Start watching for users status.
    function watch( data ){
        if( data.users && data.users.length ){
            var pipeline = redisDB.pipeline(), n;

            data.users.forEach(function(user_id){
                channel = 'user.'+user_id+'.state';
                socket.join(channel);
                pipeline.get(channel);
            });

            pipeline.exec(function(err, results){
                if( !err ){
                    var statuses = {
                            connected:[],
                            disconnected: []
                        },
                        t=(new Date()).getTime();

                    results.forEach(function(r, i){
                        if( !r[0] ){
                            var status = JSON.parse(r[1])||{}, keys = Object.keys(status);
                            if( keys.length
                                && keys.some(function(k){ return status[k]>t; }) ){
                                statuses.connected.push( parseInt(data.users[i]) );
                            }
                            else{
                                statuses.disconnected.push( parseInt(data.users[i]) );
                            }
                        }
                    });

                    socket.emit('user_status_change', statuses );
                }
            });
        }
    }
};
