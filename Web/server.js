
var config = require(__dirname + '/config.json');
var port = config['port'];
var API = config['api'];
var SESSION_LENGTH = config['session'];

var express = require('express');
var app = express();
var module = [app];

app.use('/style', express.static(__dirname + '/style'));

var bodyParser = require('body-parser');
var cookieParser = require('cookie-parser');
app.use(bodyParser.urlencoded({extended: true}));
app.use(cookieParser());

var http = require('http').Server(app);
var io = require('socket.io')(http);

var request = require('request');

app.get('/account/login', function(req, res){
 	if('account' in req.cookies)
		res.redirect('/dashboard');
	else
		res.sendFile(__dirname + '/sites/login.html');
});

app.post('/account/login', function(req, res){
	request.post({
		'url': API + '/account/validate',
		'qs': req.body
	}, 
	function(err, response, body){
		var feedback = JSON.parse(body);
		if(feedback['status']){
			res.cookie('account', req.body['email'],
				   {maxAge: SESSION_LENGTH});
			res.cookie('password', req.body['password'],
				   {maxAge: SESSION_LENGTH});
			res.redirect('/dashboard');
		}else
			res.redirect('/account/login?' + 
				     'error=' + feedback['comment']);
	});
});

app.get('/account/signup', function(req, res){
	res.sendFile(__dirname + '/sites/signup.html');
});

app.post('/account/signup', function(req, res){
	request.put({
		'url': API + '/account',
		'qs': req.body
	},
	function(err, response, body){
		var feedback = JSON.parse(body);
		if(feedback['status'])
			res.redirect('/account/login?' + 
				     'welcome=1');
		else
			res.redirect('/account/signup?' + 
				     'error=' + feedback['comment']);
	});
});

app.get('/account/logout', function(req, res){
	res.cookie('account', '', {maxAge: -1});
	res.cookie('password', '', {maxAge: -1});
	res.cookie('name', '', {maxAge: -1});
	res.cookie('rid','',{maxAge:-1});
	res.redirect('/account/login');
});

app.get('/', function(req, res){
	res.redirect('/account/login');
});

app.get('/dashboard', function(req, res){
	if('account' in req.cookies)
		res.sendFile(__dirname + '/sites/dashboard.html');
	else
		res.redirect('/');
});

app.get('/protection', function(req, res){
	res.sendFile(__dirname + '/sites/protection.html');
});

io.on('connection', function(socket){
  socket.on('chat message', function(pack){
    	io.emit('chat message', pack);
	request.put({
		'url': API + '/message',
		'qs': {
			'sender': pack['sender'],
			'receiver': pack['receiver'],
			'content': pack['message'],
		      }
	},
	function(err, response, body){});
  });
});

http.listen(port, function(){
	console.log('Server running');
});
