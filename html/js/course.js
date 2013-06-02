define([
	'jquery',
	'lodash',
	'routie',
	'db',
	'loading',
	'hgn!templates/course',
	'hgn!templates/course/hole',
	'hgn!templates/course/waypoint',
	'partials',
	'image-chooser',
	'async',
	'bootstrapTab',
	'bootstrapModal'
], function($, _, routie, db, loading, courseT, holeT, waypointT, partials, imageChooser, async) {
	return function() {
		function getCourse(slug, cb) {
			db.query({map: "function(doc) {\
				if(doc.type == 'course' && doc.slug == " + JSON.stringify(slug) + ") {\
					emit(doc._id, doc);\
				}\
			}"}, cb);
		}
		
		var coursePartials = _.extend({
			hole: holeT.template,
			waypoint: waypointT.template,
			imageChooser: imageChooser.partial
		}, partials);
	
		routie('courses/:slug', function(slug) {
			loading(function(stopLoading) {
				getCourse(slug, function(err, courses) {
					var course = courses.rows[0].value,
						imageChoosers;
					$('#app').html(courseT({
						nav: {
							courses: true
						},
						holes: course.holes,
						slug: slug,
						name: course.name,
						waypoints: [{
							idx: 0,
							name: 'Start',
							active: 'active'
						},{
							idx: 1,
							name: 'Finish'
						}]
					}, coursePartials));
					
					imageChoosers = imageChooser($('#app'));
					
					$('#add-hole').on('submit', function(e) {
						var $this = $(this),
							nameInp = $this.find('[name=name]'),
							name = nameInp.val();
						e.preventDefault();
						loading(function(stopLoading) {
							var hole = {
								name: name,
								number: course.holes.length + 1
							};
							course.holes.push(hole);
							
							async.auto({
								course: function(cb) {
									db.put(course, cb);
								},
								start: ['course', function(cb, results) {
									var startImage = imageChoosers.start();
									if(startImage) {
										db.putAttachment('images/start', results.course.rev, startImage, startImage.type, cb);
									}
									else {
										cb();
									}
								}]
							}, function(err) {
								$this.modal('hide');
								nameInp.val('');
								$('tbody').append(holeT(_.extend({
									slug: slug
								}, hole)));
								stopLoading();
							});
						});
					});
					
					$('[data-hole-delete]').on('click', function(e) {
						var $this = $(this);
						e.preventDefault();
						loading(function(stopLoading) {
							var holeNum = $this.attr('data-hole-delete');
							course.holes = course.holes.filter(function(hole) {
								return hole.number != holeNum;
							});
							db.put(course, function(err, doc) {
								$this.parents('tr').remove();
								stopLoading();
							});
						});
					});
					
					stopLoading();
				});
			});
		});
	};
});
