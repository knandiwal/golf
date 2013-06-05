define([
	'jquery',
	'underscore',
	'hgn!templates/image-chooser'
], function($, _, imageChooserT) {
	var setup = function($root) {
		var choosers = {};
		$root.find('[data-image-chooser]:not([data-image-chooser-setup])').each(function(idx, chooser) {
			var $chooser = $(chooser),
				name = $chooser.attr('data-image-chooser'),
				$imageHolder = $chooser.find('.image'),
				$image,
				$fileInp = $chooser.find('input');
				
			$chooser.attr('data-image-chooser-setup', 'done');

			$imageHolder.on('click', function(e) {
				$fileInp.click();
				e.preventDefault();
			});

			$fileInp.on('change', function() {
				if ($fileInp[0].files.length && $fileInp[0].files[0].type.indexOf('image/') != -1) {
					var reader = new FileReader();
					reader.onload = function(e) {
						if(!$image) {
							$image = $(document.createElement('img'));
							$imageHolder.html('');
							$imageHolder.append($image);
						}
						$image.attr('src', e.target.result);
					};
					reader.readAsDataURL($fileInp[0].files[0]);
				}
			});
			
			choosers[name] = function(cb) {
				return $fileInp.files.length && $fileInp.files[0];
			};
		});
		return choosers;
	};
	setup.partial = imageChooserT.template;
	return setup;
});
