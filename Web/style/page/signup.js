$(document).ready(function(){
	$('.dropdown').dropdown();
	$(".ui.checkbox").checkbox();
	$('#customize').hide();
	$('#selector').change(function(){
		if($('#security').val()==0)
			$('#customize').show();
		else
			$('#customize').hide();
	});
        $('.ui.form').form({
          fields : {
		    email: {
	              	      identifier: 'email',
			      rules: [{type: 'empty', 
                                       prompt: 'Please enter your email'},
                                      {type: 'email',
                                       prompt: 'Please enter a valid email address'}]
                           },
		     name: {
	              	      identifier: 'name',
			      rules: [{type: 'empty', 
                                       prompt: 'Please enter your name'},
				      ]
                           },
                     password: {
                                identifier: 'password',
				rules: [{type: 'empty',
                                         prompt: 'Please enter a password'},
                                        {type: 'length[6]',
					 prompt: 'Your password must be at least 6 characters'}]
                              },
		     confirm_password: {
                                identifier: 'confirm_password',
				rules: [{type: 'empty',
                                         prompt: 'Please confirm a password'},
					{type: 'match[password]',
					 prompt: 'Your passwords does not match'}]
                              },
		     security: {
	              	      identifier: 'security',
			      rules: [{type: 'empty', 
                                       prompt: 'Please choose a security question'}]
                           },
		     answer: {
	              	      identifier: 'answer',
			      rules: [{type: 'empty', 
                                       prompt: 'Please put an answer to your security question'}]
                             }
		   }
        });
});
