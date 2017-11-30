module.exports = function( app ){
    return {
        parameters: {
            value:{
                user:{value:'number'}
            }
        },
        method: function(params, next){
            // Check user id != zero
            if( params.user ){
                // Get user state in redis database then return true if user is connected.
                app.redisDB.get('user.'+params.user+'.state').then(function(key){
                    var status = JSON.parse(key);
                    if( status && Object.keys(status).length )
                        next(null,true);
                    else
                        next(null,false);
                });
            }else{
                // If user id is incorrect => return invalid params error.
                next(app.jsonrpcHandler.errors.INVALID_PARAMS,null);
            }
        }
    };
};
