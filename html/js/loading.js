define(['jquery'], function($) {
	var $loading = $('#loading'),
		loading = function(cb) {
			loading.show();
			cb(loading.hide);
		};
	loading.hide = function() {
		$loading.removeClass('in');
	};
	loading.show = function() {
		$loading.addClass('in');
	};
	return loading;
});
