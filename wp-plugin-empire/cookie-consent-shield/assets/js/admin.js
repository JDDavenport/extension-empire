jQuery(function($) {
	$('.ccs-color-picker').wpColorPicker();

	$('.nav-tab-wrapper .nav-tab').on('click', function(e) {
		e.preventDefault();
		$('.nav-tab').removeClass('nav-tab-active');
		$(this).addClass('nav-tab-active');
		$('.ccs-tab-panel').hide();
		$($(this).attr('href')).show();
	});
});
