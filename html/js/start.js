define(['jquery',
	'routie',
	'hgn!templates/start',
	'partials',
], function($, routie, startT, partials) {
	return function() {
		routie("start", function() {
			$('#app').html(startT({
				nav: {
					add: true
				}
			}, partials));
		});
	};
});
