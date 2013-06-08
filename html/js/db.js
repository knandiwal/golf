define(['pouch', 'underscore'], function(Pouch, _) {
	var URL = window.URL || window.webkitURL,
		golfdb = Pouch('golf'),
		db = {
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
							emit(doc._id, null);\
						}\
					}"}, function(err, ids) {
						if(err) return cb(err);
						golfdb.get(ids.rows[0].key, {
							attachments: false
						}, cb);
					});
				},
				save: function(course, cb) {
					golfdb.put(course, cb);
				},
				remove: function(key, cb) {
					golfdb.get(key, function(err, doc) {
						golfdb.remove(doc, cb);
					});
				},
				saveImage: function(id, course, file, cb) {
					golfdb.putAttachment(course._id + '/image' + id, course._rev, file, file.type, cb);
				},
				removeImage: function(id, course, cb) {
					golfdb.removeAttachment(course._id + '/image' + id, course._rev, cb);
				},
				getImageURL: function(id, course, cb) {
					golfdb.getAttachment(course._id + '/image' + id, function(err, file) {
						if(err) return cb(err);
						cb(null, file && URL.createObjectURL(file));
					});
				},
				releaseURL: function(url) {
					URL.revokeObjectURL(url);
				}
			},
			hole: {
				get: function (slug, id, cb) {
					db.course.get(slug, function(err, course) {
						if(err) return cb(err);
						cb(null, _.findWhere(course.holes, {id: parseInt(id)}), course);
					});
				}
			}
		};
	return db;
});
