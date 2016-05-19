var socket = io();
$(document).ready(function(){
   	$('#sender').submit(function(){
		var pack = {
				'sender': readCookie('account'),
				'name': readCookie('name'),
				'receiver': readCookie('rid'),
				'message': $('#message_in').val()
 			   }
		if(pack['message'] != '' && pack['receiver'] != null)
     			socket.emit('chat message', pack);
     		$('#message_in').val('');
    		return false;
    	});
});

var makeHostLabel = function(pack){
   	return 	$('<li style="text-align:right">').append(
			$('<div class="ui blue label" ' + 
			  'style="max-width:300px; word-wrap:break-word;text-align:left">').text( 
				pack['message']));
}

var makeGuestLabel = function(pack){
    	var phaseA = $('<li>').append( 
			$('<a class="ui black small label">').text( 
				pack['name']));
	var phaseB = phaseA.append(
			$('<div class="ui green label" ' + 
			  'style="max-width:300px; word-wrap:break-word;">').text(
				pack['message']));
	return phaseB;
}
	
var addMessage = function(pack){
	if(pack['receiver'] == readCookie('rid')){
		var label = ""
		if(pack['sender'] == readCookie('account'))
			label = makeHostLabel(pack);
		else
    			label = makeGuestLabel(pack);
		$('#message').append(label);
		$('#message')[0].scrollTop = $('#message')[0].scrollHeight;
	}
}

socket.on('chat message', function(pack){
	addMessage(pack);
});
 
