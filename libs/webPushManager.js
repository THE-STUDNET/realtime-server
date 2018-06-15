module.exports = function( app ){

    const webpush = require('web-push');

    webpush.setVapidDetails(
        app.configuration.webpush.mailto,
        app.configuration.webpush.public_key,
        app.configuration.webpush.private_key
    );

    function sendWebPushToUser( user_id, data ){

        return app.redisDB.get('user.'+user_id+'.webpush').then(function(datum){
            let subscriptions = JSON.parse( datum ) || [],
                error = false,
                promises = [];

            if( subscriptions.length ){

                subscriptions.forEach( subscription => {

                    let promise = webpush.sendNotification( subscription, JSON.stringify(data) ).catch( err => {
                        subscriptions.splice( subscriptions.indexOf( subscription ), 1 );
                        error = true;
                    });

                    promises.push( promise );
                });

                return Promise.all(promises).then( ()=>{
                    if( error ){
                        return app.redisDB.set('user.'+user_id+'.webpush', JSON.stringify( subscriptions ));
                    }
                });
            }
        });
    }

    return sendWebPushToUser;
};
