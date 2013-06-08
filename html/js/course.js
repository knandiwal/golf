define([
	'jquery',
	'underscore',
	'routie',
	'db',
	'loading',
	'hgn!templates/course',
	'hgn!templates/course/hole',
	'partials',
	'error'
], function($, _, routie, db, loading, courseT, holeT, partials, ERR) {
	return function() {
		
		var coursePartials = _.extend({
			hole: holeT.template,
		}, partials);
		
		routie('courses/:slug', function(slug) {
			loading(function(stopLoading) {
				db.course.get(slug, function(err, course) {
					if(ERR(err)) return;
					$('#app').html(courseT({
						nav: {
							courses: true
						},
						holes: course.holes,
						slug: slug,
						name: course.name
					}, coursePartials));
					
					$('[data-hole-delete]').on('click', function(e) {
						var $this = $(this);
						e.preventDefault();
						loading(function(stopLoading) {
							var holeId = $this.attr('data-hole-delete');
							course.holes = _.filter(course.holes, function(hole) {
								return hole.id != holeId;
							});
							db.course.save(course, function(err, res) {
								stopLoading();
								if(ERR(err)) return;
								course._rev = res.rev;
								$this.parents('tr').remove();
							});
						});
					});
					
					stopLoading();
				});
			});
		});
	};
});
