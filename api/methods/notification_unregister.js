module.exports = function( app ){
    return {
        parameters: {
            value:{
                uid:{value: 'string'}
            }
        },
        method: function(params, next){
            app.ntfManager.unregister( params.uid );
            next(null, true);
        }
    };
};
