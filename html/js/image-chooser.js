define([
	'jquery',
	'underscore',
	'db',
	'hgn!templates/image-chooser',
	'hgn!templates/image-chooser/empty',
	'error'
], function($, _, db, imageChooserT, emptyT, ERR) {
	var URL = window.URL || window.webkitURL;
	$.fn.imageChooser = function(id, course) {
		var $chooser = this,
			name = $chooser.attr('data-image-chooser'),
			$imageHolder = $chooser.find('.image'),
			$image,
			$fileInp = $chooser.find('input'),
			cleared = false;
		if($chooser.attr('data-image-chooser-setup')) {
			return;
		}
		$chooser.attr('data-image-chooser-setup', 'done');
		
		db.course.getImageURL(id, course, function(err, url) {
			if(ERR(err, true)) return;
			imgEl();
			$image.one('load', function() {
				db.course.releaseURL(url);
			});
			$image.attr('src', url);
		});
		
		$imageHolder.on('click', function(e) {
			e.preventDefault();
			$fileInp.click();
		});
		
		$fileInp.on('change', function() {
			var src;
			if ($fileInp[0].files.length && $fileInp[0].files[0].type.indexOf('image/') != -1) {
				cleared = false;
				imgEl();
				src = URL.createObjectURL($fileInp[0].files[0]);
				$image.one('load', function() {
					URL.revokeObjectURL(src);
				});
				$image.attr('src', src);
			}
		});
		
		$chooser.find('[data-image-clear]').on('click', function() {
			$fileInp.wrap('<form>').closest('form').get(0).reset();
			$fileInp.unwrap();
			$imageHolder.html(emptyT());
			$image = null;
			cleared = true;
		});
		
		function imgEl() {
			if(!$image) {
				$image = $(document.createElement('img'));
				$imageHolder.html('');
				$imageHolder.append($image);
			}
			return $image;
		}
		
		return function() {
			if(cleared) {
				return 'clear';
			}
			return $fileInp[0].files.length && $fileInp[0].files[0];
		};
	};
	return {
		imageChooser: imageChooserT.template,
		imageChooserEmpty: emptyT.template
	};
});
