var async       = require('async'),
	cc          = require('cli-color'),
	connect     = require('connect'),
    couchapp    = require('couchapp'),
	fs          = require('fs'),
	fse         = require('fs-extra'),
	imagemagick = require('imagemagick'),
	less        = require('less'),
	path        = require('path'),
	project     = require('./project'),
	requirejs   = require('requirejs'),
	S           = require('string'),
	watchr      = require('watchr'),
	wrench      = require('wrench'),
	_           = require('underscore');

var tasks = {
	actions: {
		build: function(cb) {
			importantMsg('Building app');
			var auto = {
				mkdirs: function(cb) {
					fse.mkdirs(build('webapp'), cb);
				},
				js: ['mkdirs', tasks.helpers.js],
				html: ['mkdirs', tasks.helpers.html],				
				assets: ['mkdirs', 'css', tasks.helpers.assets]//so that generated files will be copied
			};
			if(project.helpers.less) {
				auto.css = ['mkdirs', tasks.helpers.less];
			}
			else {
				auto.css = ['mkdirs', tasks.helpers.css];
			}
			if(project.helpers.icons) {
				auto.icons = ['assets', tasks.helpers.icons];
			}
			if(project.helpers.manifest) {
				auto.manifest = ['mkdirs', 'js', 'html', 'css', 'assets'];
				if(project.helpers.icons) {
					auto.manifest.push('icons');
				}
				auto.manifest.push(tasks.helpers.manifest);
			}
            if(project.helpers.couchapp) {
                auto.couchapp = ['mkdirs', 'js', 'html', 'css', 'assets'];
				if(project.helpers.icons) {
					auto.couchapp.push('icons');
				}
                if(project.helpers.manifest) {
                    auto.couchapp.push('manifest');
                }
                auto.couchapp.push(tasks.helpers.couchapp);
            }
			async.auto(auto, function(err) {
				if(err) {
					cb(err);
					return;
				}
				tasks.actions.modules(cb);
			});
		},
		modules: function(cb) {
			//async.parallel(_.filter(tasks.modules, function(v, k) {
			//	return project.modules[k];
			//}), cb);
			cb && cb();
		},
		serve: function(cb, port) {
			startMsg('serving');
			connect()
				.use(connect.logger('dev'))
				.use(connect.static(source()))
				.listen(port || project.port);
			importantMsg("Source server started at localhost:" + (port || project.port));
			var buildP = parseInt(port || project.port) + 1
			connect()
				.use(connect.logger('dev'))
				.use(connect.static(build('webapp')))
				.listen(buildP);
			importantMsg("Build server started at localhost:" + buildP);
			doneMsg("serving");
			cb();
		},
		watch: function(cb) {
			startMsg('watching');
			var after2 = (project.helpers.couchapp
				? function() {
					tasks.helpers.couchapp(tasks.actions.modules);
				}
				: tasks.actions.modules),
				after = (project.helpers.manifest
				? function() {
					tasks.helpers.manifest(after2);
				}
				: after2);
			watchr.watch({
				path: source('js'),
				listener: function() {
					tasks.helpers.js(after);
				}
			});
			watchr.watch({
				path: path.join(source(), 'index.html'),
				listener: function() {
					tasks.helpers.html(after);
				}
			});
			if(project.helpers.less) {
				watchr.watch({
					path: source('less'),
					listener: function() {
						tasks.helpers.less(after);
					}
				});
			}
			else {
				watchr.watch({
					path: source('css'),
					listener: function() {
						tasks.helpers.css(after);
					}
				});
			}
			watchr.watch({
				paths: [
	                source('images'),
	                source('fonts')
	            ],
				listener: function() {
					tasks.helpers.assets(after);
				}
			});
			if(project.helpers.manifest) {
				watchr.watch({
					path: path.join(source(), 'cache.manifest'),
					listener: tasks.helpers.manifest(after2)
				});
			}
			doneMsg('watching ready');
			cb();
		}
	},
	modules: {
		android: function(cb) {
			startMsg('android');
			var www    = path.join(build('android'), 'assets', 'www'),
				jsTmp = path.join(build('android'), 'www-tmp', project.folders.sources.js),
				parallel = [
					function(cb) {
						async.series([
							function(cb) {
								fse.remove(www, cb);
							},
							function(cb) {
								fse.mkdirs(www, cb);
							},
							function(cb) {
								fse.copy(build('webapp'), www, cb);
							},
							function(cb) {
								fse.mkdirs(jsTmp, cb);
							},
							function(cb) {
								fse.copy(source('js'), jsTmp, cb);
							},
							function(cb) {
								fse.copy(path.join(build('android'), 'www-lib-js', project.folders.sources.js), jsTmp, cb);
							},
							function(cb) {
								tasks.helpers.js(cb, null, jsTmp, path.join(www, project.folders.sources.js));
							},
							function(cb) {
								fse.remove(path.join(build('android'), 'www-tmp'), cb);
							}
						], cb);
					}
				];
			if(project.helpers.icons) {
				parallel.push(
					image('icon', path.join(build('android'), 'res', 'drawable', 'icon.png'), 96),
					image('icon', path.join(build('android'), 'res', 'drawable-hdpi', 'icon.png'), 72),
					image('icon', path.join(build('android'), 'res', 'drawable-hdpi', 'ic_launcher.png'), 72),
					image('icon', path.join(build('android'), 'res', 'drawable-ldpi', 'icon.png'), 36),
					image('icon', path.join(build('android'), 'res', 'drawable-ldpi', 'ic_launcher.png'), 36),
					image('icon', path.join(build('android'), 'res', 'drawable-mdpi', 'icon.png'), 48),
					image('icon', path.join(build('android'), 'res', 'drawable-mdpi', 'ic_launcher.png'), 48),
					image('icon', path.join(build('android'), 'res', 'drawable-xhdpi', 'icon.png'), 96),
					image('icon', path.join(build('android'), 'res', 'drawable-xhdpi', 'ic_launcher.png'), 96)
				);
			}
			async.parallel(parallel, function(err) {
				if (err) {
					cb(err);
					return;
				}
				doneMsg('android');
				cb();
			});
		},
		blackberry: function(cb) {
			startMsg('blackberry');
			var www   = path.join(build('blackberry'), 'www'),
				jsTmp = path.join(build('blackberry'), 'www-tmp', project.folders.sources.js);
			async.series([
				function(cb) {
					fse.remove(www, cb);
				},
				function(cb) {
					fse.mkdirs(www, cb);
				},
				function(cb) {
					if(project.helpers.icons) {
						async.parallel([
							image('icon', path.join(www, 'res', 'icon', 'blackberry', 'icon-80.png'), 80),
							image('splash', path.join(www, 'res', 'screen', 'blackberry', 'screen-225.png'), 225)
						], cb);
					}
					else {
						cb();
					}
				},
				function(cb) {
					fse.copy(build('webapp'), www, cb);
				},
				function(cb, results) {
					fse.copy(path.join(build('blackberry'), 'www-lib'), www, cb);
				},
				function(cb) {
					fse.mkdirs(jsTmp, cb);
				},
				function(cb) {
					fse.copy(source('js'), jsTmp, cb);
				},
				function(cb) {
					fse.copy(path.join(build('blackberry'), 'www-lib-js', project.folders.sources.js), jsTmp, cb);
				},
				function(cb) {
					tasks.helpers.js(cb, null, jsTmp, path.join(www, project.folders.sources.js));
				},
				function(cb) {
					fse.mkdirs(path.join(www, 'playbook', project.folders.sources.js), cb);
				},
				function(cb) {
					fse.copy(path.join(build('blackberry'), 'www-lib-js', 'playbook', project.folders.sources.js), jsTmp, cb);
				},
				function(cb) {
					tasks.helpers.js(cb, null, jsTmp, path.join(www, 'playbook', project.folders.sources.js));
				},
				function(cb) {
					fse.mkdirs(path.join(www, 'qnx', project.folders.sources.js), cb);
				},
				function(cb) {
					fse.copy(path.join(build('blackberry'), 'www-lib-js', 'qnx', project.folders.sources.js), jsTmp, cb);
				},
				function(cb) {
					tasks.helpers.js(cb, null, jsTmp, path.join(www, 'qnx', project.folders.sources.js));
				},
				function(cb) {
					fse.remove(path.join(build('blackberry'), 'www-tmp'), cb);
				}
			], function(err) {
				if(err) {
					cb(err);
					return;
				}
				doneMsg('blackberry');
				cb();
			});
		},
		ios: function(cb) {
			startMsg('ios');
			var www    = path.join(build('ios'), 'www'),
				jsTmp = path.join(build('ios'), 'www-tmp', project.folders.sources.js);
			async.series([
				function(cb) {
					fse.remove(www, cb);
				},
				function(cb) {
					fse.mkdirs(www, cb);
				},
				function(cb) {
					if(project.helpers.icons) {
						var icons = path.join(build('ios'), S(project.project.name).capitalize().s, 'Resources', 'icons'),
							splash = path.join(build('ios'), S(project.project.name).capitalize().s, 'Resources', 'splash');
						async.parallel([
							image('icon',   path.join(icons, 'icon.png'), 57),
							image('icon',   path.join(icons, 'icon@2x.png'), 57, true),
							image('icon',   path.join(icons, 'icon-72.png'), 72),
							image('icon',   path.join(icons, 'icon-72@2x.png'), 72, true),
							image('splash', path.join(splash, 'Default~iphone.png'), 320, 460),
							image('splash', path.join(splash, 'Default@2x~iphone.png'), 320, 460, true),
							image('splash', path.join(splash, 'Default-568h@2x.png'), 320, 568, true),
							image('splash', path.join(splash, 'Default-Portrait~ipad.png'), 768, 1004),
							image('splash', path.join(splash, 'Default-Portrait@2x~ipad.png'), 768, 1004, true),
							image('splash', path.join(splash, 'Default-Landscape~ipad.png'), 1024, 748),
							image('splash', path.join(splash, 'Default-Landscape@2x~ipad.png'), 1024, 748, true)
						], cb);
					}
					else {
						cb();
					}
				},
				function(cb) {
					fse.copy(build('webapp'), www, cb);
				},
				function(cb) {
					fse.mkdirs(jsTmp, cb);
				},
				function(cb) {
					fse.copy(source('js'), jsTmp, cb);
				},
				function(cb) {
					fse.copy(path.join(build('ios'), 'www-lib-js', project.folders.sources.js), jsTmp, cb);
				},
				function(cb) {
					tasks.helpers.js(cb, null, jsTmp, path.join(www, project.folders.sources.js));
				},
				function(cb) {
					fse.remove(path.join(build('ios'), 'www-tmp'), cb);
				}
			], function(err) {
				if (err) {
					cb(err);
					return;
				}
				doneMsg('ios');
				cb();
			});
		}
	},
	helpers: {
		assets: function(cb) {
			startMsg('assets');
			function assetSeries(asset) {
				return function(cb) {
					var buildDir = build('webapp', asset);
					async.series([
						function(cb) {
							fse.remove(buildDir, cb);
						},
						function(cb) {
							fse.mkdirs(buildDir, cb);
						},
						function(cb) {
							fse.copy(source(asset), buildDir, cb);
						}
					], cb);
				};
			}
		
			async.parallel([
				assetSeries('fonts'),
				assetSeries('images')
			], function(err) {
				if (err) {
					cb(err);
					return;
				}
				doneMsg('assets');
				cb();
			});
		},
        couchapp: function(cb) {
			startMsg('couchapp');
            couchapp.createApp(require('./app.js'), project.couch, function (app) {
                app.push(function() {
                    doneMsg('couchapp');
                    cb();
                });
            });
		},
		css: function(cb) {
			startMsg('css');
			async.series([
				function(cb) {
					fse.remove(build('webapp', 'css'), cb);
				},
				function(cb) {
					fse.mkdirs(build('webapp', 'css'), cb);
				},
				function(cb) {
					fse.copy(source('css'), build('webapp', 'css'), cb);
				}
			], function(err) {
				if (err) {
					cb(err);
					return;
				}
				doneMsg('css');
				cb();
			});
		},
		html: function(cb) {
	        startMsg('html');
			fs.readFile(path.join(source(), 'index.html'), 'utf8', function (err, data) {
				if (err) {
	                cb(err);
	                return;
	            }
				
				if(project.helpers.require) {
					data = data.replace('src="js\/libs\/require\/require.js"', 'src="js/main.js"');
				}
				if(project.helpers.manifest) {
					data = data.replace('<html>', '<html manifest="cache.manifest">');
				}
				if(project.helpers.icons) {
					data = data.replace('<link href="'+project.folders.sources.images+'/icon.png" rel="apple-touch-icon">',
						  "<link href=\"favicon.ico\" rel=\"icon\">\n"
						+ "<link href=\"favicon.ico\" rel=\"shortcut icon\">\n"
						+ "<link href=\"" + project.folders.sources.images + "/apple-touch-icon.png\" sizes=\"57x57\" rel=\"apple-touch-icon\">\n"
						+ "<link href=\"" + project.folders.sources.images + "/apple-touch-icon-icon-2x.png\" sizes=\"114x114\" rel=\"apple-touch-icon\">\n"
						+ "<link href=\"" + project.folders.sources.images + "/apple-touch-icon-ipad.png\" sizes=\"72x72\" rel=\"apple-touch-icon\">\n"
				        + "<link href=\"" + project.folders.sources.images + "/apple-touch-icon-ipad-2x.png\" sizes=\"144x144\" rel=\"apple-touch-icon\">"
						+ "<link href=\"" + project.folders.sources.images + "/apple-touch-startup-image.png\" media=\"(device-width: 320px)\" rel=\"apple-touch-startup-image\">\n"
				        + "<link href=\"" + project.folders.sources.images + "/apple-touch-startup-image-2x.png\" media=\"(device-width: 320px) and (-webkit-device-pixel-ratio: 2)\" rel=\"apple-touch-startup-image\">\n"
					    + "<link href=\"" + project.folders.sources.images + "/apple-touch-startup-image-iphone5-2x.png\" media=\"(device-width: 320px) and (device-height: 568px) and (-webkit-device-pixel-ratio: 2)\" rel=\"apple-touch-startup-image\">\n"
					    + "<link href=\"" + project.folders.sources.images + "/apple-touch-startup-image-ipad.png\" media=\"(device-width: 768px) and (orientation: portrait)\" rel=\"apple-touch-startup-image\">\n"
				        + "<link href=\"" + project.folders.sources.images + "/apple-touch-startup-image-ipad-2x.png\" media=\"(device-width: 768px) and (orientation: portrait) and (-webkit-device-pixel-ratio: 2)\" rel=\"apple-touch-startup-image\">\n"
						+ "<link href=\"" + project.folders.sources.images + "/apple-touch-startup-image-ipad-landscape.png\" media=\"(device-width: 768px) and (orientation: landscape)\" rel=\"apple-touch-startup-image\">\n"
				        + "<link href=\"" + project.folders.sources.images + "/apple-touch-startup-image-ipad-landscape-2x.png\" media=\"(device-width: 768px)  and (orientation: landscape) and (-webkit-device-pixel-ratio: 2)\" rel=\"apple-touch-startup-image\">\n"
					);
				}
				
				fs.writeFile(path.join(build('webapp'), 'index.html'), data, 'utf8', function(err) {
					if (err) {
						cb(err);
						return;
					}
					doneMsg('html');
					cb();
				});
			});
		},
		icons: function(cb) {
			startMsg('icons');
			var images = build('webapp', 'images'),
				web = build('webapp'),
				fav16 = path.join(web, 'favicon16.png'),
				fav32 = path.join(web, 'favicon32.png'),
				fav64 = path.join(web, 'favicon64.png');
			async.auto({
				appleTouch                       : image('icon',   path.join(images, 'apple-touch-icon.png'), 57),
				appleTouch2x                     : image('icon',   path.join(images, 'apple-touch-icon-2x.png'), 57, true),
				appleTouchIPad                   : image('icon',   path.join(images, 'apple-touch-icon-ipad.png'), 72),
				appleTouchIPad2x                 : image('icon',   path.join(images, 'apple-touch-icon-ipad-2x.png'), 72, true),
				appleTouchStartup                : image('splash', path.join(images, 'apple-touch-startup-image.png'), 320, 460),
				appleTouchStartup2x              : image('splash', path.join(images, 'apple-touch-startup-image-2x.png'), 320, 460, true),
				appleTouchStartupIPhone52x       : image('splash', path.join(images, 'apple-touch-startup-image-iphone5-2x.png'), 320, 548, true),
				appleTouchStartupIPad            : image('splash', path.join(images, 'apple-touch-startup-image-ipad.png'), 768, 1004),
				appleTouchStartupIPad2x          : image('splash', path.join(images, 'apple-touch-startup-image-ipad-2x.png'), 768, 1004, true),
				appleTouchStartupIPadLandscape   : image('splash', path.join(images, 'apple-touch-startup-image-ipad-landscape.png'), 1024, 748, ['-rotate', '90']),
				appleTouchStartupIPadLandscape2x : image('splash', path.join(images, 'apple-touch-startup-image-ipad-landscape-2x.png'), 1024, 748, true, ['-rotate', '90']),
				favicon16: image('icon', fav16, 16, ['-alpha', 'background']),
				favicon16Tidy: ['favicon', function(cb) {
					fse.remove(fav16, cb);
				}],
				favicon32: image('icon', fav32, 32, ['-alpha', 'background']),
				favicon32Tidy: ['favicon', function(cb) {
					fse.remove(fav32, cb);
				}],
				favicon64: image('icon', fav64, 64, ['-alpha', 'background']),
				favicon64Tidy: ['favicon', function(cb) {
					fse.remove(fav64, cb);
				}],
				favicon: ['favicon16', 'favicon32', 'favicon64', function(cb) {
					imagemagick.convert([
						fav16,
						fav32,
						fav64,
						'-colors', '128',
						'-alpha', 'background',
						path.join(web, 'favicon.ico')
					], cb);
				}]
			}, function(err) {
				if (err) {
					cb(err);
					return;
				}
				doneMsg('icons');
				cb();
			});
		},
		js: function(cb, results, from, to) {
	        startMsg('js' + (from ? ' ' + from : ''));
			if(project.helpers.require) {
				var require = {
					baseUrl: from || source('js'),
					//Comment out the optimize line if you want
					//the code minified by UglifyJS
					//optimize: "none",

					mainConfigFile: path.join(from || source('js'), 'main.js'),
					include: ['main'],
					insertRequire: ['main'],
					wrap: true,
					findNestedDependencies: false,
					cjsTranslate: false,
					out: path.join(to || build('webapp', 'js'), 'main.js')
					//useSourceUrl: true
				};
				
				if(project.helpers.almond) {
					require.name = 'libs/almond/almond';
				}
				if(project.helpers.hogan) {
					require.pragmasOnSave = require.pragmasOnSave || {};
					require.pragmasOnSave.excludeHogan = true;
					require.stubModules = require.stubModules || [];
					require.stubModules.push('hgn');
				}
				if(project.helpers.text) {
					require.inlineText =  true;
					require.stubModules = require.stubModules || [];
					require.stubModules.push('text');
				}
				
				requirejs.optimize(require, function() {
					doneMsg('js' + (from ? ' ' + from : ''));
					cb();
				});
			}
			else {
				fse.copy(from || source('js'), to || build('webapp', 'js'), function(err) {
					if(err) {
						cb(err);
						return;
					}
					doneMsg('js' + (from ? ' ' + from : ''));
					cb();
				});
			}
		},
        less: function(cb) {
			startMsg('less');
			var parser = new(less.Parser)({
			    paths: [source('less')],
			    filename: 'main.less'
			});
			fs.readFile(path.join(source('less'), 'main.less'), 'utf8', function(err, data) {
				if (err) {
	                cb(err);
	                return;
	            }
				parser.parse(data, function (e, tree) {
					fs.writeFile(path.join(source('css'), 'main.css'), tree.toCSS({compress: true}), 'utf8', function(err) {
						if (err) {
							cb(err);
							return;
						}
						doneMsg('less');
						tasks.helpers.css(cb);
					});
				});
			});
		},
		manifest: function(cb) {
			startMsg('manifest');
			var manifestPath = path.join(build('webapp'), 'cache.manifest');
			async.auto({
				list: function(cb) {
					var strStart = (build('webapp') + path.sep).length,
						manifestFiles = [];
					async.forEach([
							build('webapp', 'fonts'),
							build('webapp', 'images'),
							build('webapp', 'css'),
							build('webapp', 'js')
						],
						function(folder, cb) {
							var c = 0,
								finish = function(err) {
									if(err) {
										c = -1;
										cb(err);
									}
									c--;
									if(c == 0) {
										cb();
									}
								};
							wrench.readdirRecursive(folder, function(err, files) {
								if(!files) {
									finish();//folders for each cb
									return;
								}
								c++;
								async.forEach(files, function(file, cb) {
									var n = path.join(folder, file);
									if(!/^\.|apple-touch|\-nc/.test(file)) {
										fs.stat(n, function(err, stats) {
											if(err) {
												cb(err);
												return;
											}
											if(stats.isFile()) {
												manifestFiles.push(n.substr(strStart));
											}
											cb();//files for each cb
										});
									}
								}, finish);
							});
					}, function(err) {
						cb(err, manifestFiles);//auto list cb
					});
				},
				rev: function(cb) {
					fs.readFile(manifestPath, "utf8", function(err, data) {
						var rev;
						if (err) {
							rev = 0;
						}
						else {
							rev = parseInt((data.match(/# rev (\d+)/) || ["0", "0"])[1]) + 1;
						}
						cb(null, rev);
					});
				},
				tmpl: function(cb) {
					fs.readFile(path.join(source(), 'cache.manifest'), "utf8", cb);
				},
				write: ['list', 'rev', 'tmpl', function(cb, results) {
					fs.writeFile(manifestPath,
						results.tmpl.replace(/^#--files--$/m, results.list.join("\n"))
							.replace("# rev 0", "# rev " + results.rev),
						"utf8", cb);//write cb
				}]
			}, function(err) {
				if (err) {
					cb(err);
					return;
				}
				doneMsg('manifest');
				cb();
			});
		}
	}
}

start(function(err) {
	if(err) console.log('error', err);
	importantMsg('all done');
});

function start(cb) {
	if(process.argv.length > 2 && process.argv[2] == 'watch') {
		async.series([
			tasks.actions.build,
			tasks.actions.watch
		], cb);
	}
	else if(process.argv.length > 2 && process.argv[2] == 'serve') {
		async.auto({
			serve: function(cb) {
				tasks.actions.serve(cb, process.argv.length > 3 ? process.argv[3] : null);
			},
			build: tasks.actions.build,
			watch: ['build', tasks.actions.watch]
		}, cb);
	}
	else {
		tasks.actions.build(cb);
	}
}

function source(source) {
	var r = path.join(__dirname, project.folders.source);
	if(source == 'jslib') {
		r = path.join(r, project.folders.sources.js, 'libs');
	}
	else if(source) {
		r = path.join(r, project.folders.sources[source]);
	}
    return r;
}

function build(module, source) {
	var r = path.join(__dirname, project.folders.build);
	if(module) {
		r = path.join(r, project.folders.modules[module]);
		if(source) {
			r = path.join(r, project.folders.sources[source]);
		}
	}
    return r;
}

//from, to, [width], [height], [double], [custom]
function image(from, to, width, height, x2, custom) {
	if(from == 'icon') {
		from = path.join(source('images'), 'icon.png');
	}
	else if(from == 'splash') {
		from = path.join(source('images'), 'splashscreen.png');
	}
	if(_.isBoolean(height)) {
		custom = x2;
		x2 = height;
		height = width;
	}
	else if(_.isArray(x2)) {
		custom = x2;
		x2 = false;
	}
	else if(_.isArray(height)) {
		custom = height;
		x2 = false;
		height = width;
	}
	if(!height) {
		height = width;
	}
	if(x2 && width) {
		width *= 2;
		height *= 2;
	}
	var crop = {
		srcPath: from,
		dstPath: to,
		format: 'png'
	};
	if(width || height) {
		crop.width = width;
		crop.height = height;
	}
	if(custom) {
		crop.customArgs = custom;
	}
	return function(cb) {
		fse.mkdirs(path.dirname(to), function(err) {
			if(err) {
				cb(err);
				return;
			}
			imagemagick.crop(crop, cb);
		});
	};
}

function startMsg(messg) {
	console.log(cc.magenta('start: ') + messg);
}

function doneMsg(messg) {
	console.log(cc.green('done: ') + messg);
}

function importantMsg(messg) {
	console.log(cc.yellowBright(messg));
}

function errorMsg(messg) {
	console.log(cc.redBright(messg));
}
