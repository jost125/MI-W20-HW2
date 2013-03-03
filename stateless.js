var net = require('net');

var OrderStorage = function() {
	this.orders = {};

	this.orderExists = function(orderId) {
		return this.orders[orderId] !== undefined;
	};

	this.openOrder = function(orderId) {
		if (!this.orderExists(orderId)) {
			this.orders[orderId] = {
				orderItems: [],
				state: 'OPENED'
			};
		} else {
			throw 'Order already exists';
		}
	};

	this.addItem = function (orderId, item) {
		if (this.orderExists(orderId) && this.orders[orderId].state === 'OPENED') {
			this.orders[orderId].orderItems.push(item);
		} else {
			throw 'Order must be opened first';
		}
	};

	this.processOrder = function (orderId) {
		if (this.orderExists(orderId) && this.orders[orderId].state === 'OPENED' && this.orders[orderId].orderItems.length !== 0) {
			this.orders[orderId].state = 'PROCESSED';
		} else {
			throw 'Order must be opened first and must not be empty';
		}
	};

	this.getOrder = function (orderId) {
		return this.orders[orderId];
	};
};

var orderStorage = new OrderStorage();

var server = net.createServer(function(c) {
	var writeln = function(message) {
		c.write('--> ' + message + "\n");
	};

	var endHandler = function() {};

	var parseMessage = function (message) {
		var matches = message.replace(/(^\s+)|(\s+$)/, '').match(/^(open|add|process)\s+(\w+)(?:\s+(\w+))?$/);
		if (!matches || matches.length !== 4) {
			throw 'Invalid message format, expected one of: open <orderId>, process <orderId>, add <orderId> <item>';
		}
		return matches;
	};

	var dataHandler = function(message) {
		try {
			var parsedMessage = parseMessage(message);
			var command = parsedMessage[1];
			var orderId = parsedMessage[2];

			switch(command) {
				case 'open': orderStorage.openOrder(orderId); writeln('opened'); break;
				case 'add': orderStorage.addItem(orderId, parsedMessage[3]); writeln('added'); break;
				case 'process': orderStorage.processOrder(orderId); writeln(orderStorage.getOrder(orderId).orderItems); writeln('processed'); break;
				default: writeln('Unknown command ' + command); return;
			}
		} catch (e) {
			writeln(e);
		}
		c.end();
	};

	c.setEncoding('utf8');
	c.on('end', endHandler);
	c.on('data', dataHandler);
});

server.listen(8124, function() {
});
