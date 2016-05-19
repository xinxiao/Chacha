
var config = require(__dirname + '/config.json');

var express = require('express');
var app = express();
var port = config['port'];

var header = function(req, res, next){
	res.header('Access-Control-Allow-Origin', '*');
	res.header('Access-Control-Allow-Methods', 'PUT,POST,DELETE');
	res.header('Access-Control-Allow-Headers', 'Content-Type');
	var visitor = req.connection.remoteAddress.substring(7);
	next();
}

var account = express();
var group = express();
var message = express();
var task = express();

app.use(header);
app.use('/account', account);
app.use('/group', group);
app.use('/message', message);
app.use('/task', task);


var E = require('encrypton');

var pg = require('pg');
pg.defaults['user'] = config['handler'];
pg.defaults['password'] = config['password'];

// ----------------------------------------------------------------



/*---------------------------------------------
Extend frequent methods to Response class
---------------------------------------------*/

/*
*	Report the execution failure with comment
*
*	Parameter: comment - Error comment
*/
express.response.fail = function (comment){
	this.json({
		'status': false,
		'comment': comment
	});
};

express.response.succeed = function(){
	this.json({
		'status': true,
		'comment': null
	});
}

pg.Query.prototype.addRow = function(){
	this.on('row', function(row, result){
		result.addRow(row);
	});
}

pg.Query.prototype.processRow = function(proc){
	this.on('row', function(row, result){
		result.addRow(proc(row));
	});
}

pg.Query.prototype.end = function(res, client){
	this.on('end', function(){
		client.end();
		res.succeed();
	});
}

pg.Query.prototype.result = function(proc){
	this.on('end', function(result){
		proc(result['rows']);
	});
};

pg.Query.prototype.error = function(res, client){
	this.on('error', function(error){
		client.end();
		var comment = error; //'Unknow database error';
		switch(error['code']){
		case '23505':
			comment = error['table'] + ' already exists';
			break;
		default:
			break;
		}
		res.fail(comment);
	});
}

var encrypt = function(key, content){
	var e = new E(key);
	return e.encrypt(content);
}

var decrypt = function(key, content){
	var e = new E(key);
	return e.decrypt(content);
}

/*---------------------------------------------
User handler
---------------------------------------------*/

express.request.parseAccount = function(){
	return {
		'email': this.query['email'] ?
			 this.query['email'] : this.query['acceptor'],
		'name': this.query['name'],
		'password': this.query['password'] ? 
			    encrypt(this.query[this.query['email'] ? 'email' : 'acceptor'], 
				    this.query['password']) :
			    undefined,
		'developer': !!this.query['developer'],
		'security': this.query['security'] ? 
			    parseInt(this.query['security']) : 
			    undefined,
		'question': this.query['question'],
		'answer': this.query['answer'] ?
			  encrypt(this.query['email'], this.query['answer']) : 
			  undefined,
		'invitor': this.query['invitor'],
		'acceptor': this.query['acceptor']
	       }
}

/*
*  Account registration
*
*  Method: Put
*  Route: /user
*
*  Parameter: email -User's email address, 
*	      name  -User's name, 
*             password - User's password, 
*	      developer - Developer status ,
*	      security - Security number ID, 0 for customized question,
*	      question - customized security question,
*	      answer - Answer to security question
*
*  Response: status - Execution result,
*	     comment - Explaination for execution error  
*/
account.put('/', function(req, res){
	var chacha = req.parseAccount();
	var client = new pg.Client();
	client.connect();
	var addAccount = 'SELECT add_account' +
		         '($1,$2,$3,$4,$5,$6);';
	var addAccountWithSecurityQuestion = 'SELECT add_account_with_security_question' +
					     '($1,$2,$3,$4,$5,$6);';
	var withQuestion = chacha['security'] == 0;
	var execution = client.query({
				'text': withQuestion ? addAccountWithSecurityQuestion :
						       addAccount,
				'values': [chacha['email'], chacha['name'], 
					   chacha['password'], chacha['developer'],
					   withQuestion ? chacha['question'] :
							  chacha['security'],
					   chacha['answer']]
		    	});
	execution.error(res, client);
	execution.end(res, client);
});

/*

*/
account.delete('/', function(req, res){
	var chacha = req.parseAccount();
	var client = new pg.Client();
	client.connect();
	var removeAccount = 'SELECT remove_account($1, $2);';
	var execution = client.query({
				'text': removeAccount,
				'values': [chacha['email'], chacha['password']]
		    	});
	execution.error(res, client);
	execution.end(res, client);
});

/*

*/
account.post('/validate', function(req, res){
	var chacha = req.parseAccount();
	var client = new pg.Client();
	client.connect();
	var validateAccount = 'SELECT validate_account($1, $2);';
	var execution = client.query({
				'text': validateAccount,
				'values': [chacha['email'], chacha['password']]
			});
	execution.addRow();
	execution.error(res, client);
	execution.result(function(row){
		client.end();
		var valid = row[0]['validate_account'];
		if(valid == null)
			res.fail('Account does not exist');
		else if(valid)
			res.succeed();
		else
			res.fail('Incorrect password');
	});
});

var accountInfoPackage = ['info', 'contact', 'group', 'invitation', 'task'];
accountInfoPackage.map(function(type){
	var route = '/' + type;
	var dbFunction = 'SELECT * FROM select_' + type +'($1, $2);';
	account.post(route, function(req, res){
		var chacha = req.parseAccount();
		var client = new pg.Client();
		client.connect();
		var execution = client.query({
					'text': dbFunction,
					'values': [chacha['email'], 
						   chacha['password']]
				});
		execution.addRow();
		execution.error(res, client);
		execution.result(function(result){
			client.end();
			res.json(type == 'info' ? 
				 result[0] : result);
		});
	});
});

/*
*/
account.post('/invite', function(req, res){
	var chacha = req.parseAccount();
	var client = new pg.Client();
	client.connect();
	var sendInvitation = 'SELECT add_contact($1, $2);';
	var execution = client.query({
				'text': sendInvitation,
				'values': [chacha['invitor'], chacha['acceptor']]
			});
	execution.error(res, client);
	execution.addRow();
	execution.result(function(row){
		client.end();
		var valid = row[0]['add_contact'];
		if(valid)
			res.succeed();
		else
			res.fail('Has been contact or ' + 
				 'has sent out an invitation');
	});
});

account.post('/password', function(req, res){
	var chacha = req.parseAccount();
	var client = new pg.Client();
	client.connect();
	var updatePassword = 'SELECT update_password($1, $2, $3);';
	var execution = client.query({
				'text': updatePassword,
				'values': [chacha['email'], chacha['answer'],chacha['password']]
			});
	execution.addRow();
	execution.error(res, client);
	execution.result(function(row){
		client.end();
		var valid = row[0]['update_password'];
		if(valid)
			res.succeed();
		else
			res.fail('Incorrect Answer');
	});
});

/*
*/
account.post('/accept', function(req, res){
	var chacha = req.parseAccount();
	var client = new pg.Client();
	client.connect();
	var acceptInvitation = 'SELECT accept_invitation($1, $2, $3);';
	var execution = client.query({
				'text': acceptInvitation,
				'values': [chacha['invitor'], chacha['acceptor'],
					   chacha['password']]
			});
	execution.error(res, client);
	execution.addRow();
	execution.result(function(row){
		client.end();
		var valid = row[0]['accept_invitation'];
		if(valid)
			res.succeed();
		else
			res.fail('Invitation does not exist');
	});
});

/*
*/
account.post('/reject', function(req, res){
	var chacha = req.parseAccount();
	var client = new pg.Client();
	client.connect();
	var rejectInvitation = 'SELECT reject_invitation($1, $2, $3);';
	var execution = client.query({
				'text': rejectInvitation,
				'values': [chacha['invitor'], chacha['acceptor'],
					   chacha['password']]
			});
	execution.error(res, client);
	execution.addRow();
	execution.result(function(row){
		client.end();
		var valid = row[0]['reject_invitation'];
		if(valid)
			res.succeed();
		else
			res.fail('Invitation does not exist');
	});
});

/*---------------------------------------------
Group handler
---------------------------------------------*/

/*

*/
express.request.parseGroup = function(){
	return {
		'name': this.query['name'],
		'group': this.query['group'] ?
			 parseInt(this.query['group']) :
			 undefined,
		'participant': this.query['participant'] ?
			       this.query['participant'].split('+') :
			       undefined,
		'host': this.query['host'],
		'password': this.query['host'] ? 
			    encrypt(this.query['host'], 
				    this.query['password']) :
			    undefined
       	       }
}

group.put('/', function(req, res){
	var chacha = req.parseGroup();
	var client = new pg.Client();
	client.connect();
	var addGroup = 'SELECT add_relation($1);';
	var execution = client.query({
				'text': addGroup,
				'values': [chacha['name']]
			});
	execution.error(res, client);
	execution.addRow();
	execution.result(function(row){
		var GID = row[0]['add_relation']
		var joinGroup = 'SELECT join_group($2, $1)';
		for(var i=3; i<chacha['participant'].length+2; i++)
			joinGroup += ',join_group($' + i + ', $1)';
		var execution = client.query({
					'text': joinGroup,
					'values': [GID].concat(chacha['participant'])
				});
		execution.error(res, client);
		execution.end(res, client);
	});
});

group.post('/join', function(req, res){
	var chacha = req.parseGroup();
	var client = new pg.Client();
	client.connect();
	var joinGroup = 'SELECT join_group($2, $1)';
	for(var i=3; i<chacha['participant'].length+2; i++)
		joinGroup += ',join_group($' + i + ', $1)';
	var execution = client.query({
				'text': joinGroup,
				'values': [chacha['group']].concat(chacha['participant'])
			});
	execution.error(res, client);
	execution.end(res, client);
});

group.post('/leave', function(req, res){
	var chacha = req.parseGroup();
	var client = new pg.Client();
	client.connect();
	var leaveGroup = 'SELECT leave_relation($2, $1)';
	for(var i=3; i<chacha['participant'].length+2; i++)
		leaveGroup += ',leave_relation($' + i + ', $1)';
	var execution = client.query({
				'text': leaveGroup,
				'values': [chacha['group']].concat(chacha['participant'])
			});
	execution.error(res, client);
	execution.end(res, client);
});

group.post('/candidate', function(req, res){
	var chacha = req.parseGroup();
	var client = new pg.Client();
	client.connect();
	var selectGroupCandidate = 'SELECT * from select_group_candidate($1, $2, $3);';
	var execution = client.query({
				'text': selectGroupCandidate,
				'values': [chacha['group'], chacha['host'],
					   chacha['password']]
			});
	execution.addRow();
	execution.error(res, client);
	execution.result(function(row){
		client.end();
		res.json(row);
	});
});

/*---------------------------------------------
Message handler
---------------------------------------------*/

/*

*/
express.request.parseMessage = function(){
	return {
		'sender': this.query['sender'],
		'receiver': this.query['receiver'] ? 
			    parseInt(this.query['receiver']) :
			    undefined,
		'content': this.query['content']
       	       }
}

/*

*/
message.put('/', function(req, res){
	var chacha = req.parseMessage();
	var client = new pg.Client();
	client.connect();
	var storeMessage = 'SELECT store_message($1, $2, $3);';
	var execution = client.query({
				'text': storeMessage,
				'values': [chacha['sender'], chacha['receiver'],
					   chacha['content']]
			});
	execution.error(res, client);
	execution.end(res, client);
});

/*

*/
message.post('/', function(req, res){
	var chacha = req.parseMessage();
	var client = new pg.Client();
	client.connect();
	var getMessageHistory = 'SELECT * ' +
				'FROM get_message_history($1);';
	var execution = client.query({
				'text': getMessageHistory,
				'values': [chacha['receiver']]
			});
	execution.addRow();
	execution.error(res, client);
	execution.result(function(row){
		client.end();
		res.json(row);
	});
});

/*---------------------------------------------
Task handler
---------------------------------------------*/

express.request.parseTask = function(){
	return {
		'task': this.query['task'] ? 
			parseInt(this.query['task']) :
			undefined,
		'date': this.query['date'],
		'time': this.query['time'],
		'content': this.query['content'],
		'participant': this.query['participant'] ?
			       this.query['participant'].split('+') :
			       undefined,
		'host': this.query['host'],
		'password': this.query['host'] ? 
			    encrypt(this.query['host'],
				    this.query['password']) :
			    undefined
	       }
}

/*

*/
task.put('/', function(req, res){
	var chacha = req.parseTask();
	var client = new pg.Client();
	client.connect();
	var addTask = 'SELECT add_task($1, $2, $3);';
	var execution = client.query({
				'text': addTask,
				'values': [chacha['date'], chacha['time'],
					   chacha['content']]
			});
	execution.addRow();
	execution.error(res, client);
	execution.result(function(row){
		var TID = row[0]['add_task'];
		var shareTask = 'SELECT share_task($2, $1)';
		for(var i=3; i<chacha['participant'].length+2; i++)
			shareTask += ',share_task($' + i + ', $1)';
		var execution = client.query({
					'text': shareTask,
					'values': [TID].concat(chacha['participant'])
				});
		execution.error(res, client);
		execution.end(res, client);
	});
});

/*

*/
task.post('/share', function(req, res){
	var chacha = req.parseTask();
	var client = new pg.Client();
	client.connect();
	var shareTask = 'SELECT share_task($2, $1)';
	for(var i=3; i<chacha['participant'].length+2; i++)
		shareTask += ',share_task($' + i + ', $1)';
	var execution = client.query({
				'text': shareTask,
				'values': [chacha['task']].concat(chacha['participant'])
			});
	execution.error(res, client);
	execution.end(res, client);
});

/*

*/
task.post('/leave', function(req, res){
	var chacha = req.parseTask();
	var client = new pg.Client();
	client.connect();
	var leaveTask = 'SELECT leave_task($2, $1)';
	for(var i=3; i<chacha['participant'].length+2; i++)
		leaveTask += ',leave_task($' + i + ', $1)';
	var execution = client.query({
				'text': leaveTask,
				'values': [chacha['task']].concat(chacha['participant'])
			});
	execution.error(res, client);
	execution.end(res, client);
});

task.post('/candidate', function(req, res){
	var chacha = req.parseTask();
	var client = new pg.Client();
	client.connect();
	var selectTaskCandidate = 'SELECT * from select_task_candidate($1, $2, $3);';
	var execution = client.query({
				'text': selectTaskCandidate,
				'values': [chacha['task'], chacha['host'],
					   chacha['password']]
			});
	execution.addRow();
	execution.error(res, client);
	execution.result(function(row){
		client.end();
		res.json(row);
	});
});

/*---------------------------------------------
Host service
---------------------------------------------*/

app.listen(port, function(){
	console.log('Server running on port: %d', port);
});
