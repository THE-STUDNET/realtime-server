module.exports = function api( app ){

    var handler = app.jsonrpcHandler,
        exposed_methods = app.configuration.api_methods;

    if( handler && Array.isArray( exposed_methods ) && exposed_methods.length ){
        var exposeArgs;
        exposed_methods.forEach(function( method ){
            // Getting method function & method required arguments structure.
            exposeArgs = require('./methods/'+method.replace(/\./g,'_').toLowerCase())(app);
            if( exposeArgs.method && exposeArgs.parameters ){
                handler.exposeMethod(method, exposeArgs.method, exposeArgs.parameters );
            }
        });
    }
};
