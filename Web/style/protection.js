var isLegal = function(str){
	var expression = /^[A-Za-z0-9+-= _]+$/
	return str=undefined ||
	       str.length == 0 ||
	       str.value.match(expression);
};

$(document).ready(function(){
	$("form").submit(function(event){
		var $inputs = $('form :input:text');
		$inputs.each(function() {
			var val = $(this).val();
			console.log(val);
			console.log(isLegal(val));
			if(!isLegal(val)){
				event.preventDefault();
				window.location.replace("/protection");
			}
		});
	});
});
