var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var fs = require('fs');
var path = require('path');

var cwd = path.resolve('.');


// respond with 'hello world' when a GET request is made to the homepage.
// app.get('/', function(req, res, next) {
// 	res.send('GET request to homepage.  Using middleware.');
// 	next();
// });

function middle1 (req, res, next) {
	console.log('middle1');
	next();
}

function middle2 (req, res, next) {
	console.log('middle2');
	next();
}

function middle3 (req, res, next) {
	console.log('middle3');
	next();
}

// app.use(middle1);
// app.use(middle2);
// app.use(middle3);

// app.post('/', function (req, res) {
// 	res.send('POST request to the hompage\n');
// });

// app.get('/request/:id', function (req, res) {
// 	console.log(req.params);
// 	res.send(req.toString());
// });

function broadcast (socket, channel, msg) {
	console.log('broadcasting: ', msg);
	io.emit(channel, msg);
}

app.get('/', function (req, res) {
	res.sendFile(cwd + '/index.html');
});

http.listen(3000, function () {
	console.log('Example app listening on port 3000');
});

var users = [];

function userIsConnected (user) {
	for(var i=0; i<users.length; i++) {
		if(users[i].user === user) return true;
	}
	return false;
}

function getUserByName (user) {
	for(var i=0; i<users.length; i++) {
		if(users[i].user === user) return users[i];
	}
	return false;
}

function getUserBySocket (socket) {
	for(var i=0; i<users.length; i++) {
		if(users[i].socket === socket) return users[i];
	}
	return false;
}

function addUser (user, socket) {
	if(!userIsConnected(user)) {
		users.push({user: user, socket: socket });
		return true;
	} else {
		return false;
	}
}

function removeUser (user) {
	for(var i=0; i<users.length; i++) {
		if(users[i].user === user) {
			users.splice(i, 1);
			return true;
		}
	}
	return false;
}

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