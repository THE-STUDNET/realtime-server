module.exports = function( app ){

    const webpush = require('web-push');

    webpush.setVapidDetails(
        app.configuration.webpush.mailto,
        app.configuration.webpush.publicKey,
        app.configuration.webpush.privateKey
    );

    function sendWebPushToUser( user_id, data ){

        return app.redisDB.get('user.'+user_id+'.webpush').then(function(datum){
            let subscriptions = JSON.parse( datum ) || [],
                error = false,
                promises = [];

            if( subscriptions.length ){

                subscriptions.forEach( subscription => {

                    let promise = webpush.sendNotification( subscription, data ).catch( err => {
                        console.log('ERROR SENDING WEBPUSH', err );
                        subscriptions.splice( 1, subscriptions.indexOf( subscription ) );
                        error = true;
                    });

                    promises.push( promise );
                });

                return Promise.all(promises).then( ()=>{
                    if( error ){
                        return app.redisDB.set('user.'+params.user+'.webpush', JSON.stringify( subscriptions ));
                    }
                });
            }
        });
    }

    return sendWebPushToUser;
};
