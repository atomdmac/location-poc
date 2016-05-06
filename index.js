// Required modules.
var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

// The directory that the server is running in.
var cwd = path.resolve('.');

// Broadcast a message to all connected clients.
function broadcast (socket, channel, msg) {
	console.log('broadcasting: ', msg);
	socket.broadcast.emit(channel, msg);
}

// A list of all current connections.
var connections = [];

// Check to see if the given user is connected.
function userIsConnected (user) {
	for(var i=0; i<connections.length; i++) {
		if(connections[i].user === user) return true;
	}
	return false;
}

// Return a connection by user name.
function getConnectionByUser (user) {
	for(var i=0; i<connections.length; i++) {
		if(connections[i].user === user) return connections[i];
	}
	return false;
}

// Return a connection by socket.
function getConnectionBySocket (socket) {
	for(var i=0; i<connections.length; i++) {
		if(connections[i].socket === socket) return connections[i];
	}
	return false;
}

// Add a connection to the list of active connections.
function addConnection (user, socket) {
	if(!userIsConnected(user)) {
		connections.push({user: user, socket: socket });
		return true;
	} else {
		return false;
	}
}

// Remove a connection from the list of active connections.
function removeConnection (user) {
	for(var i=0; i<connections.length; i++) {
		if(connections[i].user === user) {
			connections.splice(i, 1);
			return true;
		}
	}
	return false;
}

// Webserver for the UI.
app.get('/', function (req, res) {
	res.sendFile(cwd + '/index.html');
});

http.listen(3000, function () {
	console.log('Example app listening on port 3000');
});

// Listen for new WebSocket connection requests.
io.on('connection', function (socket) {
	console.log('A user connected.');

	socket.on('chat message', function (msg) {
		broadcast(socket, 'chat message', msg);
	});

	socket.on('chat meta connect', function (msg) {
		var connectSuccess = addConnection(msg.user, socket);

		if(connectSuccess) {
			broadcast(socket, 'chat meta connect', msg);
			console.log('User ', msg.user, ' has successfully connected.');
		} else {
			console.log('User ', msg.user, ' had a problem connecting.');
		}
	});

	socket.on('disconnect', function () {
		var connection = getConnectionBySocket(socket);
		console.log(connection.user + ' has disconnected');
		removeConnection(connection.user);
		broadcast(socket, 'chat meta disconnect', {user: connection.user});
	});
});