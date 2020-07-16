require(['jquery','art-template','jquery.validate','layer','k','k-blank'], function($,template) {
	
	$(function(){
		$('.skin-minimal input').iCheck({
			checkboxClass: 'icheckbox-blue',
			radioClass: 'iradio-blue',
			increaseArea: '20%'
		});
	
		$("#form-admin-add").validate({
			rules:{
				adminName:{
					required:true,
					minlength:4,
					maxlength:16
				},
				password:{
					required:true,
				},
				password2:{
					required:true,
					equalTo: "#password"
				},
				sex:{
					required:true,
				},
				phone:{
					required:true,
					isPhone:true,
				},
				email:{
					required:true,
					email:true,
				},
				adminRole:{
					required:true,
				},
			},
			onkeyup:false,
			focusCleanup:true,
			success:"valid",
			submitHandler:function(form){
				$(form).ajaxSubmit();
				var index = parent.layer.getFrameIndex(window.name);
				parent.$('.btn-refresh').click();
				parent.layer.close(index);
			}
		});
	});
	
	

});
