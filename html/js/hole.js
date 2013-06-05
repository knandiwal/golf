define([
	'jquery',
	'underscore',
	'routie',
	'db',
	'loading',
	'hgn!templates/hole',
	'hgn!templates/hole/waypoint',
	'partials',
	'image-chooser',
	'async'
], function($, _, routie, db, loading, holeT, waypointT, partials, imageChooser, async) {
	return function() {
		
		var holePartials = _.extend({
			waypoint: waypointT.template,
		}, partials);
		
		routie('courses/:slug/holes/new', function(slug) {
			loading(function(stopLoading) {
				db.course.get(slug, function(err, course) {
					var hole = {
						number: course.holes.length + 1,
						waypoints: [{
							name: 'Start',
							id: 0
						}, {
							name: 'Finish',
							id: 1
						}]
					};
					course.holes.push(hole);
					db.course.save(course, function(err) {
						stopLoading();
						routie('courses/' + slug + '/holes/' + hole.number);
					});
				});
			});
		});
		
		
					
		// 			async.auto({
		// 				course: function(cb) {
		// 					
		// 				},
		// 				start: ['course', function(cb, results) {
		// 					var startImage = imageChoosers.start();
		// 					if(startImage) {
		// 						db.putAttachment('images/start', results.course.rev, startImage, startImage.type, cb);
		// 					}
		// 					else {
		// 						cb();
		// 					}
		// 				}]
		// 			}, function(err) {
		// 				$this.modal('hide');
		// 				nameInp.val('');
		// 				$('tbody').append(holeT(_.extend({
		// 					slug: slug
		// 				}, hole)));
		// 				stopLoading();
		// 			});
		// 		});
		// 	});
		// });
		// 
		routie('courses/:slug/holes/:number', function(slug, number) {
			number = parseInt(number);
			loading(function(stopLoading) {
				db.hole.get(slug, number, function(err, hole) {
					$('#app').html(holeT({
						nav: {
							courses: true
						},
						waypoints: hole.waypoints,
						name: hole.name,
						par: hole.par,
						number: number
					}, holePartials));
					
					$finishWaypoint = $('#waypoints tbody tr:last-child');
					
					$('#add-waypoint').on('click', function() {
						var waypoint = {
							id: hole.waypoints.length,
							name: 'Waypoint #' + (hole.waypoints.length - 1)
						};
						hole.waypoints.splice(hole.waypoints.length - 1, 0, waypoint);
						$finishWaypoint.before(waypointT(waypoint));
					});
					
					$('#hole').on('submit', function(e) {
						var $this = $(this);
						e.preventDefault();
						hole.name = $this.find('[name=name]').val();
						hole.par = $this.find('[name=par]').val();
						loading(function(stopLoading) {
							db.hole.save(slug, number, hole, function(err) {
								
								
								stopLoading();
							});
						});
					});
					
					stopLoading();
				});
			});
		});
	}
});