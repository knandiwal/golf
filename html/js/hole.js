define([
	'jquery',
	'underscore',
	'routie',
	'db',
	'loading',
	'hgn!templates/hole',
	'hgn!templates/hole/waypoint',
	'hgn!templates/hole/waypointEdit',
	'partials',
	'image-chooser',
	'location-chooser',
	'async',
	'gmapskey',
	'error',
	'bootstrapModal'
], function($, _, routie, db, loading, holeT, waypointT, waypointEditT, partials, imageChooserPartials, locationChooserPartials, async, gmapsKey, ERR) {
	return function() {
		
		var sensor = navigator.geolocation ? 'true' : 'false';
		
		var holePartials = _.extend({
			waypoint: waypointT.template,
		}, partials);
		
		var waypointEditPartials = _.extend({}, imageChooserPartials, locationChooserPartials);
		
		routie('courses/:slug/holes/new', function(slug) {
			loading(function(stopLoading) {
				db.course.get(slug, function(err, course) {
					if(ERR(err)) return;
					var number = course.holes.length + 1,
						id = course.nextId++,
						hole = {
							id: id,
							number: number,
							name: 'Hole #' + number,
							waypoints: [{
								name: 'Start',
								id: course.nextId++,
								noDelete: true
							}, {
								name: 'Finish',
								id: course.nextId++,
								noDelete: true
							}]
						};
					course.holes.push(hole);
					db.course.save(course, function(err) {
						stopLoading();
						routie('courses/' + slug + '/holes/' + id);
					});
				});
			});
		});
		
		routie('courses/:slug/holes/:id', function(slug, id) {
			loading(function(stopLoading) {
				db.hole.get(slug, id, function(err, hole, course) {
					if(ERR(err)) return;
					var $finishWaypoint,
						$waypointsBody;
					
					$('#app').html(holeT(_.extend({
						nav: {
							courses: true
						},
						sensor: sensor,
						gmapsKey: gmapsKey
					}, hole), holePartials));
					
					_.each(hole.waypoints, loadWaypointImage);
					
					$waypointsBody = $('#waypoints tbody');
					$finishWaypoint = $waypointsBody.find('tr:last-child');
					
					$('#add-waypoint').on('click', function() {
						var waypoint = {
							id: course.nextId++,
							name: 'Waypoint #' + (hole.waypoints.length - 1)
						};
						hole.waypoints.splice(hole.waypoints.length - 1, 0, waypoint);
						$finishWaypoint.before(waypointT(waypoint));
					});
					
					$waypointsBody.on('click', 'tr', function(e) {
						var $tr = $(this),
							waypointId = $tr.attr('data-waypoint-id'),
							waypoint = _.find(hole.waypoints, function(waypoint) {
								return waypoint.id == waypointId;
							}),
							$modal,
							imageChooser,
							locationChooser;

						e.preventDefault();
						$(document.body).append(waypointEditT(waypoint, waypointEditPartials));
						
						$modal = $('#edit-waypoint');
						imageChooser = $modal.find('[data-image-chooser]').imageChooser(waypoint.id, course);
						
						$modal.on('submit', function(e) {
							var position = locationChooser();
							e.preventDefault();
							if(position) {
								waypoint.position = position;
							}
							waypoint.name = $modal.find('[name=name]').val();
							waypoint.description = $modal.find('[name=description]').val();
							loading(function(stopLoading) {
								db.course.save(course, function(err, res) {
									if(ERR(err)) {
										stopLoading();
										return;
									}
									course._rev = res.rev;
									async.waterfall([
										function(cb) {
											var file = imageChooser();
											if(file == 'clear') {
												db.course.removeImage(waypoint.id, course, cb);
											}
											else if(file) {
												db.course.saveImage(waypoint.id, course, file, cb);
											}
											else {
												cb();
											}
										}
									], function(err, res) {
										$modal.modal('hide');
										stopLoading();
										if(ERR(err)) return;
										if(res) {
											course._rev = res.rev;
										}
										$tr.replaceWith(waypointT(_.extend({
											sensor: sensor,
											gmapsKey: gmapsKey
										}, waypoint)));
										loadWaypointImage(waypoint);
										return err;
									});
								});
							});
						});
						
						$modal.on('shown', function() {
							locationChooser = $modal.find('[data-location-chooser]').locationChooser(waypoint.position);
						});
						
						$modal.on('hidden', function() {
							$modal.remove();
						});
						
						$modal.modal('show');
					});
					
					$waypointsBody.on('click', '[data-waypoint-delete]', function(e) {
						var $this = $(this);
							waypointId = $this.attr('data-waypoint-delete');
						e.preventDefault();
						hole.waypoints = _.filter(hole.waypoints, function(waypoint) {
							return waypoint.id != waypointId;
						});
						$this.parents('tr').remove();
					});
					
					$('#hole').on('submit', function(e) {
						var $this = $(this);
						e.preventDefault();
						hole.name = $this.find('[name=name]').val();
						hole.par = $this.find('[name=par]').val();
						loading(function(stopLoading) {
							db.course.save(course, function(err) {
								stopLoading();
								if(ERR(err)) return;
								routie('courses/' + slug);
							});
						});
					});
					
					stopLoading();
					
					function loadWaypointImage(waypoint) {
						db.course.getImageURL(waypoint.id, course, function(err, url) {
							if(ERR(err, true)) return;
							var $img = $(document.createElement('img'));
							$img.one('load', function() {
								var $holder = $waypointsBody.find('img[data-waypoint-image=' + waypoint.id + ']');
								$holder.html('');
								$holder.append($img);
								db.course.releaseURL(url);
							});
							$img.attr('src', url);
							$img.attr('class', 'img-polaroid');
						});
					}
				});
			});
		});
	}
});