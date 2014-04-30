var messageID = [];

$(document).ready(function() {
	var roomIdentifier = meta('roomName');

	$('body').prepend("<div id='transScreen' style='display: none'><div id='nameContainer'>" + "<div id='roomIntro'>You are about to enter room " + roomIdentifier + "</div>" + "<div id='namePicker'>Enter a Nickname below</div>" + "<form id='nicknameForm' action='/'><input id='nameValue' name='nameValue'></input></form></div></div>");

	$('#transScreen').show();

	$('#nameValue').focus();

	$('#nicknameForm').submit(function(e) {
		e.preventDefault();

		$('meta[name=nickname]').attr('content', $('#nameValue').val());

		chatRoom();
	});
});

function chatRoom() {
	$('#transScreen').remove();

	$('#container').show();

	$('#chatText').focus();

	chatRefresh();

	var chatForm = document.getElementById('chatForm');

	chatForm.addEventListener('submit', handleText, false);

	intervalID = setInterval(chatRefresh, 500);
}

function chatRefresh() {
	httpRequest('GET', '/' + meta('roomName') + '/messages.json', null, addNew, 'Messages could not be loaded.');
}

function addNew(response) {
	var container = $('#messageBox');

	var data = JSON.parse(response);

	for(var k = 0; k < data.length; k++) {
		var present = data[k];
		var id = present.id;
		var nickname = present.nickname;
		var body = present.body;
		var time = present.time;

		if(messageID.indexOf(id) > -1) {
			;
		}
		else {
			messageAdder(nickname, body, time);
			messageID.push(id);
			$("#messageBox").animate({ scrollTop: $("#messageBox")[0].scrollHeight}, 0);
		}
	}
}

function handleText(e) {
	e.preventDefault();

	var messageData = new FormData(document.getElementById('chatForm'));

	messageData.append('nickname', meta('nickname'));

	messageData.append('time', (new Date()).getTime());

	if($('#chatText').val() == '') {
		return;
	}

	$('#chatText').val('');

	httpRequest('POST', '/' + meta('roomName') + '/messages', messageData, messagePosted, 'Message could not be posted!');
}

function messagePosted(response) {
	;
}

function httpRequest(kind, link, content, callback, info) {
	var req = new XMLHttpRequest();

	req.open(kind, link, true);

	req.addEventListener('load', function(e) {
		if(req.status == 200) {
			var content = req.responseText;
			callback(content);
		}
		else {
			alert(info);
		}
	});

	req.send(content);
}

function messageAdder(nickname, body, time) {
	var ul = $('#messageBox');

	var liClass = 'message';

	if(nickname == meta('nickname')) {
		liClass += ' author';
	}

	var li = "<li class='" + liClass + "'><div class='nickname'>" + nickname + "</div><div class='body'>" + body + "</div><div class='time'>" + time + "</div></li>";

	ul.append(li);
}

function meta(name) {
	var tag = document.querySelector('meta[name=' + name + ']');

	if(tag != null) {
		return tag.content;
	}
	return '';
}