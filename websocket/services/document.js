module.exports = function( app, socket ){
    var disconnectionHandlers = {};

    // --- Listen to document related events --- //
    // Item submission document update.
    socket.on('submission.update_document', onDocumentUpdated );
    // When joining a shared document.
    socket.on('yjs_joinroom', onJoiningSharedDocument );
    // When leaving a shared document.
    socket.on('yjs_leaveroom', onLeavingSharedDocument );
    // On shared document update message.
    socket.on('yjs_message', onSharedDocumentMessage );
    // On shared document selection.
    socket.on('yjs_selection', onSharedDocumentSelection );

    // --- Handlers functions --- //
    function onDocumentUpdated(data){
        data.users.forEach(function( uid ){
            socket.to('user.'+uid).emit('submission.update_document', {item_id:data.item_id,library_id:data.library_id});
        });
    }
    function onJoiningSharedDocument(data){
        // Join document room.
        socket.join( data.room );
        // Notify room members that user join.
        socket.to( data.room ).emit('yjs_'+data.room+'_newpeer', {peer_id: socket.client.id});
        // Notify user that he has joined & give him his own document peer id.
        server.sockets.adapter.clients([data.room], function(err, clients){
            if( !err ){
                socket.emit('yjs_'+data.room+'_joined', {peer_id: socket.client.id, peers:clients });
            }else{
                app.logger.error('LmsRT: Can\'t get room clients.', err );
            }
        });
        // Adding disconnect handler for this document.
        disconnectionHandlers[data.room] = function(){
            socket.leave( data.room );
            server.to( data.room ).emit('yjs_'+data.room+'_oldpeer', {peer_id: socket.client.id} );
        };
        // Bind disconnect handler.
        socket.on('disconnect',disconnectionHandlers[data.room]);
    }
    function onLeavingSharedDocument(data){
        // Leave shared document room.
        socket.leave( data.room );
        // Notify room users that you leave.
        server.to( data.room ).emit('yjs_'+data.room+'_oldpeer', {peer_id: socket.client.id} );
        // Remove & Unbind disconnect handler for this document.
        if( disconnectionHandlers[data.room] ){
            socket.removeListener('disconnect', disconnectionHandlers[data.room] );
            delete( disconnectionHandlers[data.room] );
        }
    }
    function onSharedDocumentMessage(data){
        if( data.to ){
            // Send message to specific user.
            socket.to( data.to ).emit('yjs_'+data.room+'_message',{ id: data.id, need_confirm:data.need_confirm, type: data.type, payload: data.payload, peer_id: socket.client.id });
        }else{
            // Broadcast update message.
            socket.to( data.room ).emit('yjs_'+data.room+'_message',{ id: data.id, need_confirm:data.need_confirm, type: data.type, payload: data.payload, peer_id: socket.client.id });
        }
    }
    function onSharedDocumentSelection( data ){
        if( data.to ){
            // Send selection to specifiv user.
            socket.to( data.to ).emit('yjs_'+data.room+'_selection',{range:data.range,user_id:data.user_id,user_name:data.user_name,id:socket.client.id});
        }else{
            // Broadcast user selection.
            socket.to( data.room ).emit('yjs_'+data.room+'_selection',{range:data.range,user_id:data.user_id,user_name:data.user_name,id:socket.client.id});
        }
    }
};
