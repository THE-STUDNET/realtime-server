module.exports = function( app ){
    return {
        parameters: {
            value:{
                date:{value: 'string'},
                uid:{value: 'string'},
                data:{value: 'object',optional:true}
            }
        },
        method: function(params, next){
            var date = new Date( params.date );
            if( isNaN( date.getTime() ) ){
                next(app.jsonrpcHandler.errors.INVALID_PARAMS,null);
            }else{
                app.ntfManager.register( params.uid, params.date, params.data );
                next(null, true);
            }
        }
    };
};
