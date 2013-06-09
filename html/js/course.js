define([
	'jquery',
	'underscore',
	'routie',
	'db',
	'loading',
	'hgn!templates/course',
	'hgn!templates/course/hole',
	'partials',
	'gmaps',
	'error'
], function($, _, routie, db, loading, courseT, holeT, partials, gmaps, ERR) {
	return function() {
		
		var coursePartials = _.extend({
			hole: holeT.template,
		}, partials);
		
		routie('edit/courses/:slug', function(slug) {
			loading(function(stopLoading) {
				db.course.get(slug, function(err, course) {
					if(ERR(err)) return;
					$('#app').html(courseT(_.extend({
						nav: {
							edit: true
						},
						holes: course.holes,
						slug: slug,
						name: course.name
					}, gmaps), coursePartials));
					
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
