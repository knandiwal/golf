define(['jquery',
	'routie',
	'hgn!templates/home',
	'partials',
], function($, routie, homeT, partials) {
	return function() {
		routie("*", function() {
			$('#app').html(homeT({
				nav: {
					home: true
				}
			}, partials));
		});
	};
});
