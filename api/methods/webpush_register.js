module.exports = function( app ){
    return {
        parameters: {
            value:{
                user:{value:'number'},
                subscription:{
                    value:{
                        endpoint:{value:'string'},
                        keys:{value:'object'}
                    }
                }
            }
        },
        method: function(params, next){

            app.redisDB.get('user.'+params.user+'.webpush').then(function(datum){
                let subscriptions = JSON.parse( datum ) || [];
                
                if( !subscriptions.length || 
                    !subscriptions.some( function(sub){
                        if( sub.endpoint === params.subscription.endpoint 
                            && sub.keys.auth === params.subscription.keys.auth 
                            && sub.keys.p256dh === params.subscription.keys.p256dh ){
                            return true;
                        }
                    }) ){
                    subscriptions.push( params.subscription );
                }

                app.redisDB.set('user.'+params.user+'.webpush', JSON.stringify( subscriptions ));

                next( null, true );
            });

        }
    };
};
