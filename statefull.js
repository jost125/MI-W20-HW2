var net = require('net');

var server = net.createServer(function(c) {
	var orders = [];
	var currentOpenedOrder = [];
	var actualState = 'WAITING_FOR_ORDER';

	var writeln = function(message) {
		c.write('--> ' + message + "\n");
	};

	var endHandler = function() {};

	var handleOpen = function() {
		if (actualState === 'WAITING_FOR_ORDER') {
			currentOpenedOrder = [];
			actualState = 'OPENED';
		} else {
			throw 'Order is already opened';
		}
	};

	var handleAdd = function(item) {
		if (actualState === 'OPENED') {
			currentOpenedOrder.push(item);
		} else {
			throw 'Order must be opened first';
		}
	};

	var handleProcess = function() {
		if (actualState === 'OPENED' && currentOpenedOrder.length !== 0) {
			writeln(currentOpenedOrder);
			orders.push(currentOpenedOrder);
			actualState = 'WAITING_FOR_ORDER';
		} else {
			throw 'Order must be opened first and must not be empty';
		}
	};

	var parseMessage = function (message) {
		var matches = message.replace(/(^\s+)|(\s+$)/, '').match(/^(open|add|process)(?:\s+(.+))?/);
		if (!matches || !(matches.length == 3 || matches.length == 2)) {
			throw 'Invalid message format, expected one of: open, process, add <item>';
		}
		return matches;
	};

	var dataHandler = function(message) {
		try {
			var parsedMessage = parseMessage(message);
			var command = parsedMessage[1];

			switch(command) {
				case 'open': handleOpen(); writeln('opened'); break;
				case 'add': handleAdd(parsedMessage[2]); writeln('added'); break;
				case 'process': handleProcess(); writeln('processed'); break;
				default: writeln('Unknown command ' + command); return;
			}
		} catch (e) {
			writeln(e);
		}
	};

	c.setEncoding('utf8');
	c.on('end', endHandler);
	c.on('data', dataHandler);
});

server.listen(8124, function() {
});
