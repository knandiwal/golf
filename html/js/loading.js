define(['jquery'], function($) {
	$loading = $('#loading');
	return function(cb) {
		$loading.addClass('in');
		cb(function() {
			$loading.removeClass('in');
		});
	};
});
