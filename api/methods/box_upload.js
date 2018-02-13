var http = require('http'),
    https = require('https'),
    URL = require('url');

module.exports = function( app ){

    function sendBoxResult( err, file_id, box_id ){
        var api_conf = app.configuration.services.twic_api,
            body = JSON.stringify({err:err,id:file_id,box_id:box_id});

        var request = (api_conf.protocol==='https:'?https:http).request({
            protocol: api_conf.protocol,
            hostname: api_conf.host,
            method: api_conf.method,
            headers: Object.assign({
                'Content-Type':'text/plain',
                'Content-Length': body.length
            },api_conf.headers),
            path: api_conf.box_upload_path
        }/*function(r){
            var d='';
            r.on('data', c => d+=c );
            r.on('end', () => console.log('API OUTPUT', d) );
        }*/);

        request.on('error', err => {
            app.logger.error('TWIC API "'+api_conf.method+'" ERR', err.message );
        });
        request.write( body );
        request.end();
    }

    return {
        parameters: {
            value:{
                url:{value:'string'},
                name:{ value:'string'},
                id:{value:'number'}
            }
        },
        method: function(params, next){
            var url = URL.parse( params.url );

            (url.protocol === 'https:'?https:http).get( params.url, (result) => {
                if( result.statusCode === 200 ){
                    next( null, true );

                    var data,
                        infos = {name:params.name,parent:{id:'0'}},
                        delimiter = '-------------9846zadzapoihu',
                        bodyStart = '--'+delimiter+'\r\nContent-Disposition: form-data; name="attributes"\r\n\r\n'+JSON.stringify(infos)+'\r\n'+
                            '--'+delimiter+'\r\nContent-Disposition: form-data; name="file"; filename="file"\r\n\r\n',
                        bodyEnd = '\r\n--'+delimiter+'--\r\n',
                        options = {
                            hostname: app.configuration.services.box.host,
                            path: app.configuration.services.box.path,
                            headers:{
                                'Transfer-Encoding': 'chunked',
                                'Authorization': 'Bearer '+app.configuration.services.box.api_key,
                                'Content-Type':'multipart/form-data; boundary='+delimiter,
                                'Content-Length': result.headers['content-length'] + bodyStart.length + bodyEnd.length
                            },
                            method: 'POST',
                            rejectUnauthorized: false,
                        };
                    
                    var boxRequest = https.request(options, response => {
                        let d='';
                        response.on('data', chunk => d+=chunk );
                        response.on('end', ()=> {
                            try{
                                var data = JSON.parse(d);
                                if( data.entries && data.entries[0] && data.entries[0].id ){
                                    sendBoxResult(undefined, params.id, data.entries[0].id);
                                }
                            }catch( e ){
                                app.logger.error('BOX RESULT PARSE ERR', e.message );
                            }
                        });
                    }).on('error', e => {
                        app.logger.error('BOX UPLOAD ERR', e.message );
                        sendBoxResult(e.message);
                    });
                    // SEND BODY START
                    boxRequest.write( bodyStart );
                    // ON DATA -> SEND DATA TO BOX...
                    result.on('data', chunk => { 
                        boxRequest.write( chunk );
                    });
                    // ON END -> SEND REQUEST END TO BOX...
                    result.on('end', () => {
                        boxRequest.write( bodyEnd );
                        boxRequest.end();
                    });
                }else{
                    next( app.jsonrpcHandler.errors.INVALID_PARAMS, null);
                }
            }).on('error', () => {
                next( app.jsonrpcHandler.errors.INVALID_PARAMS, null);
            });
        }
    };
};
