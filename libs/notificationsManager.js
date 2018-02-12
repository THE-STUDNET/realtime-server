var http = require('http'),
    https = require('https'),
    deepAssign = require('recursive-object-assign');

var manager = function( redisClient, options ){
    this.redisClient = redisClient;
    this.options = options;
}

manager.prototype.interval_time = 1000 * 60; // One minute

// Start checking notifications.
manager.prototype.start = function(){
    if( !this.intervalID ){
        this.intervalID = setInterval( this.onInterval.bind(this) , this.interval_time );
    }
};
// Stop checking notifiations.
manager.prototype.stop = function(){
    clearInterval( this.intervalID );
    delete( this.intervalID );
};
// Executed at regular interval
manager.prototype.onInterval = function(){
    var dateKey = this.getDateKey();

    this.redisClient.hgetall( dateKey ).then((data) => {
        let keys = Object.keys(data);

        // Delete hash !
        this.redisClient.del( dateKey );
        // If hash has fields/values -> Send notifications.
        if( keys.length ){
            // Build request body.
            let id = Date.now(),
                requestBody = [];

            keys.forEach( (uid) => {
                // Delete notification.
                this.redisClient.del('ntf.'+uid).then(function(){ console.log('DEL UID', uid); });
                // Populate request body.
                try{
                    let ntf = JSON.parse(data[uid]);
                    requestBody.push( ntf.data );
                }catch( e ){
                    console.log('Error parsing hash value', uid, dateKey);
                }
            });

            // Create request.
            let body = JSON.stringify( requestBody ),
                request = (this.options.request.protocol==='https:'?https:http).request( this.options.request, ( res )=>{
                    if( this.options.debug ){
                        res.setEncoding('utf8');
                        res.on('data', function( chunk ){
                            console.log('RESULT CHUNK', chunk );
                        });
                    }
                });

            //request.setHeader('x-auth-token',this.options.request.headers.Authorization );
            // Send request.
            request.setHeader('Content-Length', body.length );
            request.setHeader('Content-Type','application/json');
            request.write( body );
            request.end();
        }
    });
};
// Register a notification.
manager.prototype.register = function( uid, dateString, data ){
    var date = new Date(dateString);
        dateKey = this.getDateKey( date );

    this.redisClient.get( 'ntf.'+uid ).then(( oldhashkey ) => {
        var now = new Date();
        // If notification is planned in future => register notification.
        if( date > now ){
            this.redisClient.set('ntf.'+uid, dateKey ).then(function(){ console.log('SET UID', uid, dateKey); });
            this.redisClient.hset( dateKey, uid, JSON.stringify({date:date,data:data}) ).then(function(){ console.log('SET UID HASH', uid); });
        }
        if( oldhashkey ){
            this.redisClient.hdel( oldhashkey, uid ).then(function(){ console.log('DEL UID HASH', oldhashkey, uid); });
            // If date is in the past... remove notification... should not happen.
            if( date <= now ){
                this.redisClient.del('ntf.'+uid).then(function(){ console.log('DEL UID', uid); });
            }
        }
    });
};
// Unregister a notification.
manager.prototype.unregister = function( uid ){
    this.redisClient.get( 'ntf.'+uid ).then((oldHashKey) => {
        if( oldHashKey ){
            this.redisClient.del('ntf.'+uid).then(function(){ console.log('DEL UID', uid); });
            this.redisClient.hdel( oldHashKey, uid ).then(function(){ console.log('DEL UID HASH', oldHashKey, uid); });
        }
    });
};
// Build hash date key.
manager.prototype.getDateKey = function( date ){
    var d = date || new Date();
    if( typeof date === 'string' ){
        d = new Date( date );
    }
    return d.toISOString().slice(0,16);
};

module.exports = manager;
