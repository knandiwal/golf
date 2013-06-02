define(['jquery',
	'lodash',
	'routie',
	'db',
	'loading',
	'hgn!templates/courses',
	'hgn!templates/courses/course',
	'partials',
	'bootstrapModal'
], function($, _, routie, db, loading, coursesT, courseT, partials) {
	return function() {
		function getCourses(cb) {
			db.query(function(doc) {
				if(doc.type == 'course') {
					emit(doc._id, {name: doc.name, slug: doc.slug});
				}
			}, cb);
		}
		
		var coursesPartials = _.extend({
			course: courseT.template
		}, partials);
		
		routie('courses', function() {
			loading(function(stopLoading){
				getCourses(function(err, courses) {
					$('#app').html(coursesT({
						nav: {
							courses: true
						},
						courses: courses.rows
					}, coursesPartials));
					
					$('#add-course').on('submit', function(e) {
						var $this = $(this),
							nameInp = $this.find('[name=name]'),
							name = nameInp.val(),
							slug = name.toLowerCase().replace(' ', '-');
						e.preventDefault();
						loading(function(stopLoading){
							db.post({
								type: 'course',
								name: name,
								slug: slug,
								holes: []
							}, function(err, response) {
								$this.modal('hide');
								nameInp.val('');
								$('tbody').append(courseT({
									key: response.id,
									value: {
										name: name,
										slug: slug
									}
								}));
								stopLoading();
							});
						});
					});
					
					$('[data-course-delete]').on('click', function(e) {
						var $this = $(this);
						e.preventDefault();
						loading(function(stopLoading) {
							db.get($this.attr('data-course-delete'), function(err, doc) {
								db.remove(doc, function(err, response) {
									$this.parents('tr').remove();
									stopLoading();
								});
							});
						});
					});
					stopLoading();
				});
			});
		});
		
		
	};
});
