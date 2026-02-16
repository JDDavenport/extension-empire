jQuery(function($) {
	$('#wtd_upload_logo').on('click', function(e) {
		e.preventDefault();
		var frame = wp.media({ title: 'Select Logo', multiple: false });
		frame.on('select', function() {
			var url = frame.state().get('selection').first().toJSON().url;
			$('#wtd_logo').val(url);
		});
		frame.open();
	});
});
