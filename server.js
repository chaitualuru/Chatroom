var express = require('express');
var app = express();
var engines = require('consolidate');
var path = require('path');

app.engine('html', engines.hogan); 
app.set('views', __dirname + '/templates'); 

app.use(express.static(path.join(__dirname, 'resources'))); 
app.use(express.favicon(path.join(__dirname, 'resources/img/favicon.ico')));

var anyDB = require('any-db');
var conn = anyDB.createConnection('sqlite3://chatroom.db');

var query = 'CREATE TABLE messages (id INTEGER PRIMARY KEY AUTOINCREMENT, room TEXT, nickname TEXT, body TEXT, time INTEGER)';
conn.query(query).on('end', function() {
	console.log('Created TABLE');
})

app.use(express.bodyParser());

app.get('/:roomName', function(request, response) {
	var name = request.params.roomName; 
	console.log('GET request for room ' + name);
	response.render('room.html', {roomName: name});
});

app.post('/:roomName/messages', function(request, response) {
	var name = request.params.roomName;
	var nickname = request.body.nickname;
	var message = request.body.message;	
	var time = request.body.time;	

	var q = conn.query('INSERT INTO messages (room, nickname, body, time) VALUES ($1, $2, $3, $4)', [name, nickname, message, time]);

	q.on('error', console.error);

	response.end('Message has been added.');
});	

app.get('/:roomName/messages.json', function(request, response) {
	var messages = [];
	var roomName = request.params.roomName;
	var q = conn.query('SELECT * FROM messages WHERE room=\'' + roomName + '\'');
	q.on('row', function(row) {
		var thisTime = new Date(row.time);

		var finalTime = '';
		var nhours = thisTime.getHours();
		var nminutes = thisTime.getMinutes();

		if (nminutes < 9) {
			nminutes = '0' + nminutes;
		}

		if(nhours >= 12) {
			if(nhours > 12) {
				nhours = nhours % 12;
			}
			finalTime = nhours + ':' + nminutes + ' PM';
		}
		else {
			finalTime = nhours + ':' + nminutes + ' AM';
		}

		var thisID = row.id;
		var thisNickname = row.nickname;
		var thisBody = row.body;

		var message = {
			id: thisID,
			nickname: thisNickname,
			body: thisBody,
			time: finalTime
		}
		messages.push(message);
	});
	q.on('end', function() {
		response.json(messages);
	});
});

app.post('/', function(request, response) {
	var newId = generateRoomIdentifier();
	while(alreadyPresent(newId)) {
		newId = generateRoomIdentifier();
	}
	var newLink = request.protocol + '://' + request.get('host') + '/' + newId;
	response.redirect(newLink);
})

app.get('/', function(request, response) {
	response.render('index.html');
});

app.listen(8080, function(error, response) {
	if(error) {
		console.log('Error: ' + error);
	}
	else {
		console.log('Server listening');
	}
});

function generateRoomIdentifier() {
	var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
	var result = '';
	for (var i = 0; i < 6; i++) {
		result += chars.charAt(Math.floor(Math.random() * chars.length));
	}

	return result;
}

function alreadyPresent(id) {
	conn.query('SELECT * FROM messages WHERE room=\'' + id + '\'', function(error, result) {
		return (result.rows.length != 0);
	});
}