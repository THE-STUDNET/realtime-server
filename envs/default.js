module.exports = {
    use_node_https: false, // Use node.js https if true.
    port: 8080, // Listening port.
    secret: 'MY_SECRET_KEY', // Secret key to check user identity.
    redis:{
        host:'localhost',
        port:6379
    },
    notification_manager:{
        debug: true, // Log notifications for debugging.
        request:{ // Configure request to the API. See https://nodejs.org/api/http.html#http_http_request_options_callback
            protocol: 'http:',
            host: 'your.api.domain',
            port: 80,
            path: '/api_notification_path',
            method: 'POST',
            headers:{}
        }
    },
};
