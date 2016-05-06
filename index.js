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
var users = [];

// Check to see if the given user is connected.
function userIsConnected (user) {
	for(var i=0; i<users.length; i++) {
		if(users[i].user === user) return true;
	}
	return false;
}

// Return a connection by user name.
function getUserByName (user) {
	for(var i=0; i<users.length; i++) {
		if(users[i].user === user) return users[i];
	}
	return false;
}

// Return a connection by socket.
function getUserBySocket (socket) {
	for(var i=0; i<users.length; i++) {
		if(users[i].socket === socket) return users[i];
	}
	return false;
}

// Add a connection to the list of active connections.
function addUser (user, socket) {
	if(!userIsConnected(user)) {
		users.push({user: user, socket: socket });
		return true;
	} else {
		return false;
	}
}

// Remove a connection from the list of active connections.
function removeUser (user) {
	for(var i=0; i<users.length; i++) {
		if(users[i].user === user) {
			users.splice(i, 1);
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
		var connectSuccess = addUser(msg.user, socket);

		if(connectSuccess) {
			broadcast(socket, 'chat meta connect', msg);
			console.log('User ', msg.user, ' has successfully connected.');
		} else {
			console.log('User ', msg.user, ' had a problem connecting.');
		}
	});

	socket.on('disconnect', function () {
		var user = getUserBySocket(socket);
		console.log(user.user + ' has disconnected');
		removeUser(user.user);
		broadcast(socket, 'chat meta disconnect', {user: user.user});
	});
});