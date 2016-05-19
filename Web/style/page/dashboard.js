$('document').ready(function(){
	$(".ui.dropdown").dropdown();
	$(".ui.checkbox").checkbox();
	$(".ui.accordion").accordion();
	$(".ui.modal").modal("hide");
     	$(".addTask").click(function(){
       		$('#taskAdder').modal('show');
		$(this).blur();
		$(".ui.dropdown").dropdown('remove selected');
     	});
	$("#addGroup").click(function(){
       		$('#groupAdder').modal('show');
		$(this).blur();
		$(".ui.dropdown").dropdown('remove selected');
     	});
	$("#addContact").click(function(){
       		$('#contactAdder').modal('show');
		$(this).blur();
		$(".ui.dropdown").dropdown('remove selected');
     	});
	$("#changePassword").click(function(){
       		$('#passwordChanger').modal('show');
		$(this).blur();
		$(".ui.dropdown").dropdown('remove selected');
     	});
	$("#current_relation").hide();
	$("#task_list").hide();
        $('#passwordChangerForm').form({
          fields : {answer: {
	              	      identifier: 'answer',
			      rules: [{type: 'empty', 
                                       prompt: 'Please enter the answer to your security question'}]
                           },
                    newPassword: {
                                   identifier: 'newPassword',
				   rules: [{type: 'empty',
                                            prompt: 'Please enter your new password'},
                                         {type: 'length[6]',
					  prompt: 'Your new password must be at least 6 characters'}]
                              },
		    confirmNewPassword: {

                                	identifier: 'confirmNewPassword',
					rules: [{type: 'empty',
                                        	 prompt: 'Please confirm your new password'},
						{type: 'match[newPassword]',
						 prompt: 'Your passwords does not match'}]
				}}
        });
        $('#groupAdderForm').form({
          fields : {name: {
	              	      identifier: 'name',
			      rules: [{type: 'empty', 
                                       prompt: 'Please enter a valid name for you group'}]
                           }
		   }
        });
        $('#contactAdderForm').form({
          fields : {email: {
	              	      identifier: 'email',
			      rules: [{type: 'empty', 
                                       prompt: 'Please enter the valid email of your new friend'}]
                           }
		   }
        });
        $('#taskAdderForm').form({
          fields : {date: {
	              	      identifier: 'date',
			      rules: [{type: 'empty', 
                                       prompt: 'Please enter a valid date for you task'}]
                           },
                    time: {
                                   identifier: 'time',
				   rules: [{type: 'empty',
                                            prompt: 'Please enter a valid time for your task'}]
                              },
		    content: {

                                identifier: 'content',
				rules: [{type: 'empty',
                                         prompt: 'Please fill some basics about your task'}]
				}}
        });
});

var cleanCurrentRelation = function(){
	eraseCookie('rid');
	$(document).ready(function(){
		$('#message').text('');
		$('#current_relation').hide();
	});
}
