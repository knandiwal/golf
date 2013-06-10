define(['jquery',
	'underscore',
	'routie',
	'db',
	'loading',
	'hgn!templates/courses',
	'hgn!templates/courses/course',
	'partials',
	'error',
	'bootstrapModal'
], function($, _, routie, db, loading, coursesT, courseT, partials, ERR) {
	return function() {
		
		var coursesPartials = _.extend({
			course: courseT.template
		}, partials);
		
		routie('edit/courses', function() {
			loading(function(stopLoading) {
				db.course.all(function(err, courses) {
					if(ERR(err)) return;
					$('#app').html(coursesT({
						nav: {
							edit: true
						},
						courses: courses.rows
					}, coursesPartials));
					
					$('#add-course').on('submit', function(e) {
						var $this = $(this),
							nameInp = $this.find('[name=name]'),
							name = nameInp.val(),
							slug = name.toLowerCase().replace(' ', '-');
						e.preventDefault();
						loading(function(stopLoading) {
							db.course.add({
								type: 'course',
								name: name,
								slug: slug,
								holes: [],
								nextId: 0
							}, function(err, response) {
								$this.modal('hide');
								stopLoading();
								if(ERR(err)) return;
								routie('edit/courses/' + slug);
							});
						});
					});
					
					$('[data-course-delete]').on('click', function(e) {
						var $this = $(this);
						e.preventDefault();
						loading(function(stopLoading) {
							db.course.remove($this.attr('data-course-delete'), function(err, response) {
								stopLoading();
								if(ERR(err)) return;
								$this.parents('tr').remove();
							});
						});
					});
					
					$('#push').on('click', function() {
						loading(function(stopLoading) {
							db.push(function(err) {
								stopLoading();
								ERR(err);
							});
						});
					});
					
					$('#pull').on('click', function() {
						loading(function(stopLoading) {
							db.pull(function(err) {
								stopLoading();
								if(ERR(err)) return;
								routie('');
							});
						});
					});
					
					stopLoading();
				});
			});
		});
	};
});
