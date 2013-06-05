define(['pouch', 'underscore'], function(Pouch, _) {
	var golfdb = Pouch('golf');
	var db = {
		course: {
			all: function(cb) {
				golfdb.query(function(doc) {
					if(doc.type == 'course') {
						emit(doc._id, {name: doc.name, slug: doc.slug});
					}
				}, cb);
			},
			add: function(course, cb) {
				golfdb.post(course, cb);
			},
			get: function (slug, cb) {
				golfdb.query({map: "function(doc) {\
					if(doc.type == 'course' && doc.slug == " + JSON.stringify(slug) + ") {\
						emit(doc._id, doc);\
					}\
				}"}, function(err, courses) {
					cb(err, courses.rows[0].value);
				});
			},
			save: function(course, cb) {
				golfdb.put(course, cb);
			},
			remove: function(key, cb) {
				golfdb.get(key, function(err, doc) {
					golfdb.remove(doc, cb);
				});
			}
		},
		hole: {
			get: function (slug, number, cb) {
				db.course.get(slug, function(err, course) {
					if(err) return cb(err);
					cb(null, _.findWhere(course.holes, {number: number}));
				});
			},
			save: function(slug, number, hole, cb) {
				db.course.get(slug, function(err, course) {
					if(err) return cb(err);
					var idx;
					if(_.some(course.holes, function(hole, hIdx) {
						if(hole.number == number) {
							idx = hIdx;
							return true;
						}
					})) {
						course.holes[idx] = hole;
						db.course.save(course, cb);
					}
					else {
						cb(new Error("Hole not found"));
					}
				});
			}
		}
	};
	return db;
});
