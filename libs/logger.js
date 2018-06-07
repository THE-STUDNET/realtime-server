module.exports = function( app ){

    var fs = require('fs'),
        stdout = fs.createWriteStream( app.configuration.log_file_path || './stdout.log' ),
        stderr = fs.createWriteStream( app.configuration.error_file_path || './stderr.log' );

    //return new console.Console(stdout,stderr);
    return console;
};
