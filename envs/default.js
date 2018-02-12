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
    },
};
