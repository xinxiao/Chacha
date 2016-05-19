var API = '** PUT THE ADDRESS OF YOUR OWN API SERVER **';

Array.prototype.sortByField = function(name){
	var compare = function(a, b){
				if(a[name] < b[name]) return -1;
				else if(a[name] > b[name]) return 1;
				return 0;
		      };
	this.sort(compare);
}

Array.prototype.drop = function(element){
	this.splice(this.indexOf(element), 1);
}

Array.prototype.add = function(element){
	this.push(element)
	this.sortByField('name');
}

app.controller('dashboard_header', [
	'$scope', '$cookies', '$http',
	function($scope, $cookies, $http){
		var email = $cookies.get('account');
  		var password = $cookies.get('password');

		$http({
			'method': 'POST',
			'url': API + '/account/info',
			'params': {
					'email': email,
					'password': password
				  }
		}).then(
			function(response){
				var info = response['data'];
				$cookies.put('name', info['name']);
				$scope.name = info['name'];
				$scope.security_question= info['security_question'];
			},
			function(){}
		);

		$scope.changePassword = function(){
			if($scope.passwordChanger){
				$scope.passwordChanger['email'] = email;
				console.log($scope.passwordChanger);
				$http({
					'method': 'POST',
					'url': API + '/account/password',
					'params': $scope.passwordChanger
				}).then(
					function(response){
						var stat = response['data']['status'];
						var comment = response['data']['comment'];
						if(stat)
							window.location.replace('/account/logout');
						else{
							$('#passwordChangerError').append(
								$('<ul class="list">').append($('<li>').text(comment))
							);
							$('#passwordChangerError').show();
						}
					},
					function(){}
				);
			}
		}
	}
]);

app.controller('dashboard_relation', [
	'$scope', '$cookies', '$http',
	function($scope, $cookies, $http){
		var email = $cookies.get('account');
  		var password = $cookies.get('password');
		
		$scope.setRID = function(rid, rname){
			var expiration = new Date();
			expiration.setDate(expiration.getDate() + 1);
			$cookies.put('rid', rid, {'expiry': expiration});
			$(document).ready(function(){
				$("#current_name").text(rname);
				$("#current_relation").show();
				$("#message").text('');
				$http({
					'method': 'POST',
					'url': API + '/message',
					'params': {'receiver': rid}
				}).then(
					function(response){
						var history = response['data'];
						for(var i=0; i<history.length; i++){
							var pack = {
								'receiver': rid,
								'sender': history[i]['sender'],	
								'name': history[i]['sender_name'],
								'message': history[i]['content']
								}
							addMessage(pack);
						}
					},
					function(response){}
				);
			});
		}

		$scope.acceptInvitation = function(invitor){
			$http({
				'method': 'POST',
				'url': API + '/account/accept', 
				'params': {
						'invitor': invitor['email'],
                                         	'acceptor': email,
					 	'password': password
					  }
			}).then(
    				function(response){
					$scope.invitation.drop(invitor);
					$scope.contact.add(invitor);
    				},
    				function(response){}
			);
                }

		$scope.rejectInvitation = function(invitor){
			$http({ 
				'method': 'POST',
				'url': API + '/account/reject', 
				'params': {
						'invitor': invitor['email'],
                                         	'acceptor': email,
					 	'password': password
					  }
			}).then(
    				function(response){
					$scope.invitation.drop(invitor); 
    				},
    				function(response){}
			);
                }

		var fetch = function(type){
			$http({
				'method': 'POST',
				'url': API + '/account/' + type,
				'params': {
						'email': email,
						'password': password
			       		  }
			}).then(
    				function(response){
      					$scope[type] = response['data']
					$scope[type].sortByField('name');
    				},
    				function(response){
      					$scope[type] = "not found";
    				}
			);
		}

		var relation = ['contact', 'group', 'invitation'];
		relation.map(fetch);

		var relation = ['Contact', 'Group'];
		relation.map(function(type){
			$scope['remove'+type] = function(r){
				$http({
					'method': 'POST',
					'url': API + '/group/leave',
					'params':{
							'group': r['id'],
							'participant': email
					   	 }
				}).then(
					function(response){
						$scope[type.toLowerCase()].drop(r);
					},
					function(response){}
				);
			}
		});

		$scope.addGroup = function(){
			var participant = $('#groupAdderParticipant').val().split(',')
			if(participant[0] == "")
				participant = email;
			else
				participant = [email].concat(participant).join('+');
			$scope.groupAdder['participant'] = participant;
			$http({
				'method': 'PUT',
				'url': API + '/group',
				'params': $scope.groupAdder
			}).then(
				function(){
					$scope.groupAdder = {};
					fetch('group');
					$('#groupAdder').modal('hide');
				},
				function(){}
			);
		}

		$scope.addContact = function(){
			if($scope.contactAdder != undefined){
				$http({
					'method': 'POST',
					'url': API + '/account/invite',
					'params': {
							'invitor': email,
							'acceptor': $scope.contactAdder['acceptor']
					   	  }
				}).then(
					function(){},
					function(){}
				);
				$('#contactAdder').modal('hide');
			}
		}

		$scope.shareGroupSetUp = function(gid){
			$scope.currentGroup = gid;
			$http({
				'method': 'POST',
				'url': API + '/group/candidate',
				'params': {
						'host': email,
						'password': password,
						'group': gid
					  }
			}).then(
				function(response){
					$scope.candidate = response['data'];
					$(".ui.dropdown").dropdown('remove selected');
					$('#groupSharer').modal('show');
				},
				function(){}
			);
		}

		$scope.shareGroup = function(){
			var others = $('#groupSharerCandidate').val().split(',');
			if(others[0] != ""){
				$http({
					'method': 'POST',
					'url': API + '/group/join',
					'params':{
							'group': $scope.currentGroup,
							'participant': others.join('+')
						 }
				}).then(
					function(){
						$scope.candidate=[];
						$scope.currentGroup = undefined;
						fetch('group');
						$(".ui.dropdown").dropdown('remove selected');
					},
					function(){}
				);
				$('#groupSharer').modal('hide');
			}
		}
	}
]);

app.controller('dashboard_task', [
	'$scope', '$http', '$cookies',
	function($scope, $http, $cookies){
		var email = $cookies.get('account');
  		var password = $cookies.get('password');
		
		var fetch = function(type){
 			$http({
				'method': 'POST',
				'url': API + '/account/' + type,
				'params': {
						'email': email,
						'password': password
				          }
			}).then(
    				function(response){
      					$scope[type] = response['data']
					if(type == 'task'){
						$scope[type].map(function(task){
							var t = task['date'].substring(0,10) + 
								" " + 
								task['start_time'];
							task['stamp'] = Date.parse(t);
							task['date'] = task['date'].substring(0,10);
							task['start_time'] = task['start_time'].substring(0,5);
						});
						$scope[type].sortByField('stamp');
						if($scope[type].length > 0)
							$(document).ready(function(){
								$("#task_list").show()
							});
					}else
						$scope[type].sortByField('name');
    				},
    				function(response){
      					$scope[type] = "not found";
    				}
			);
		}

		var repo = ['contact', 'task']
		repo.map(fetch);

		$scope.addTask = function(){
			if($scope.taskAdder){
				var others = $('#taskAdderParticipant').val().split(',')
				if(others[0] != "")
					$scope.taskAdder['participant'] = [email].concat(others).join('+');
				else
					$scope.taskAdder['participant'] = email;
				$http({
					'method': 'PUT',
					'url': API + '/task',
					'params': $scope.taskAdder
				}).then(
					function(response){
						$scope.taskAdder={};
						fetch('task');
						$('#taskAdder').modal("hide");
					},
					function(response){}
				);
			}
		}

		$scope.leaveTask = function(t){
			$scope.task.drop(t);
			$http({
				'method': 'POST',
				'url': API + '/task/leave',
				'params': {
						'task': t['id'],
						'participant': email
				   	  }
			}).then(
				function(response){},
				function(response){}
			);

		}	
	
		$scope.shareTaskSetUp = function(tid){
			$scope.currentTask = tid;
			$http({
				'method': 'POST',
				'url': API + '/task/candidate',
				'params': {
						'host': email,
						'password': password,
						'task': tid
				   	  }
			}).then(
				function(response){
					$scope.candidate = response['data'];
					$(".ui.dropdown").dropdown('remove selected');
					$('#taskSharer').modal('show');
				},
				function(){}
			);
		}
		
		$scope.shareTask = function(){
			var others = $('#taskSharerCandidate').val().split(',');
			if(others[0] != ""){
				$http({
					'method': 'POST',
					'url': API + '/task/share',
					'params':{
							'task': $scope.currentTask,
							'participant': others.join('+')
					   	 }
				}).then(
					function(){
						$scope.candidate=[];
						$scope.currentTask = undefined;
						$(".ui.dropdown").dropdown('remove selected');
					},
					function(){}
				)
				$('#taskSharer').modal('hide');
			}
		}
	}
]);
