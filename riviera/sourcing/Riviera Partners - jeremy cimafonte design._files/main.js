define([
	'/_jsapps/imagegallery/base.js?nocache=19-01-30',
	'text!/_jsapps/imagegallery/slideshow/defaults.json'
],
function(
	GalleryBase,
	defaults
) {

	return GalleryBase.extend({

		name: 'Slideshow',
		parentView: null,

		// allows images to be resized inside the Cargo editor
		allowsResize: true,

		// limits the size of each image to its natural size
		limitResize: true,

		/**
		 * Set attributes to el for layout options.
		 *
		 * @return {Object} attributes
		 */
		setElAttributes: function () {

			var model_data = this.galleryOptions.data;

			this.el.style.paddingBottom = ''
			this.$el.removeAttr('image-gallery-horizontal-align image-gallery-vertical-align image-gallery-pad image-gallery-gutter data-exploded image-gallery-row data-slideshow-in-transition');
			this.$el.addClass('slick ');
			this.$el.attr({
				'image-gallery'	: this.name.toLowerCase(),
				'style': '',
				'data-constrained-by' : model_data.constrain_height ? "height" : "width"
			});


		},

		/**
		 * Bind event listeners.
		 *
		 * @return {Object} this
		 */
		initialize: function (options) {

			var _this = this;

			this.rendered = false;

			if (!options){
				return
			}

			if( options.parentView) {
				this.parentView = options.parentView;
			}

			if ( options.galleryOptions){
				this.galleryOptions = options.galleryOptions;

				var model_data = _.clone(this.galleryOptions.data);
				this.galleryOptions.data =  _.defaults(model_data || {}, JSON.parse(defaults))
			}


			if ( options.mobile_active){
				this.mobile_active = options.mobile_active
			}

			if (typeof scrollMonitor !== 'undefined' && $(this.el).closest('.pinned').length == 0 ) {

				this.viewport_monitor = scrollMonitor.create(this.el, 10);

				this.viewport_monitor.enterViewport(function(){
					_this.resume();

				});

				this.viewport_monitor.exitViewport(function(){
					_this.pause();

				});
			}

			this.debouncedSlickUpdate = _.debounce( _.bind( this.updateSlick, this), 30 );

			// listening happens in render step since we do not want the initial render to be delayed at all

			return this;
		},

		destroy: function(){

			this.stopListening();
			var $slideshow = this.$el

			$slideshow.off();

			if ( $slideshow.is('.slick-initialized') ){
				$slideshow.slick('unslick')
			};

		},

		remove: function(){

			Backbone.View.prototype.remove.apply(this, arguments);

		},

		pause: function(){

			if ( this.$el.hasClass('slick-initialized') && this.galleryOptions.data.autoplay ){
				this.$el.slick('slickPause')
			}
		},

		resume: function(){

			if ( this.$el.hasClass('slick-initialized') && this.galleryOptions.data.autoplay ){
				this.$el.slick('slickPlay')
			}
		},

		/**
		 * Handle the changes to the model triggered from the admin panel
		 * @param  {Object} event
		 * @param  {Object} options sent from settings model, changing and value
		 */
		handleUpdates: function(galleryOptions, options){

			if (galleryOptions){
				this.galleryOptions = galleryOptions
			}

			if ( !options || !this.$el.is('.slick-initialized') ){
				return
			}

			switch (options.changing) {

				case "constrain_height":

					this.pause();

					this.$el.slick('getSlick').$slideTrack.css({
						'transform': ''
					});

					this.$el.slick('getSlick').$slideTrack.finish();

					this.$el.slick('setPosition');

					this.$el.find('.gallery_card').css('height', '');

					this.setConstraint();
					this.setElAttributes();

					// reset the cached heights
					this.elementH = 0;

					Cargo.Plugins.elementResizer.refresh();
					break;

				case "image_alignment":
					this.setAlignmentAttributes();
					break;

				case "autoplaySpeed":

					if ( this.galleryOptions.data['transition-type'] !== 'scrub' ){
						this.$el.slick('slickSetOption', 'autoplaySpeed', options.value *1000 , false);
						this.$el.slick('setPosition');
					}

					break;

				case "transition-type":

					var currentSlide = this.$el.slick('getSlick').currentSlide;

					this.$el.slick('getSlick').$slideTrack.finish();
					this.$el.slick('getSlick').$slides.finish();

					this.$el.slick('getSlick').$slideTrack.removeAttr('style');
					this.$el.slick('getSlick').$slides.removeAttr('style');

					this.$el.removeClass('scrub fade slide');
					this.$el.addClass(options.value);

					if ( this.galleryOptions.data['transition-type'] === 'scrub' ){
						this.$el.slick('slickSetOption', 'speed', 0);
					} else {
						this.$el.slick('slickSetOption', 'speed', parseFloat(this.galleryOptions.data.speed)*1000);
					}

					this.$el.slick('slickSetOption', 'fade', options.value == 'scrub' || options.value == 'fade' , true );
					this.$el.slick('slickGoTo', currentSlide, true);

					this.$el.slick('setPosition');

					break;

				case "speed":

					var currentSlide = this.$el.slick('getSlick').currentSlide;

					if ( options.value == 0 && this.$el.slick('getSlick').options.fade == false ){

						this.$el.slick('getSlick').$slideTrack.finish();
						this.$el.slick('getSlick').$slides.finish();

						this.$el.slick('getSlick').$slideTrack.removeAttr('style');
						this.$el.slick('getSlick').$slides.removeAttr('style');

						this.$el.slick('slickSetOption', 'fade', true, false );
						this.$el.slick('slickGoTo', currentSlide, true);

					} else if ( galleryOptions.data['transition-type'] != 'fade' && this.$el.slick('getSlick').options.fade == true ){

						this.$el.slick('getSlick').$slideTrack.finish();
						this.$el.slick('getSlick').$slides.finish();

						this.$el.slick('getSlick').$slideTrack.removeAttr('style');
						this.$el.slick('getSlick').$slides.removeAttr('style');

						this.$el.slick('slickSetOption', 'fade', false, false );
						this.$el.slick('slickGoTo', currentSlide, true);

					}
					if ( options.value == 0 ){
						this.$el.slick('slickSetOption', 'cssEase', 'none', false );
					} else {
						this.$el.slick('slickSetOption', 'cssEase', 'ease-in-out', false );
					}

					this.$el.slick('slickSetOption', 'speed', options.value *1000 , true)
					break;

				case "autoplay":

					this.$el.slick('setPosition');

					if ( this.galleryOptions.data['transition-type'] === 'scrub'){
						this.$el.slick('slickSetOption', 'autoplay', false, false)	
						this.$el.slick('slickPause')

						if ( options.value  ){
							this.startScrubAutoplay();
						} else {
							this.stopScrubAutoplay();
						}
					} else {
						this.$el.slick('slickSetOption', 'autoplay', options.value, false)
						if ( options.value  ){
							this.$el.slick('slickPlay')
						} else {
							this.$el.slick('slickPause')
						}
					}

					break;

				case "arrows":
					this.$el.slick('slickSetOption', 'arrows', options.value, true )
					break;

				default:
				    break;
			}

		},

		/**
		 * @return {Object} this
		 */
		render: function () {

			if ( Cargo.Core.ImageGallery.draggingInEditor && (this.parentView.isEditing)) {
				this.explodeView();
				return;
			}

			var _this = this;
			var model_data = _.clone(this.galleryOptions.data)
			// this.$el.css('height', '');
			this.el.innerHTML ='';

			this.images = _.sortBy(this.parentView.images, 'index');

			_.each( this.images, function(imageObject, index) {
				var image = _this.createItem(imageObject);

				image.setAttribute('data-gallery-item', '')
				// this step realigns serialized order with render order
				image.setAttribute('data-gallery-item-index', index);

				// caption is the last element in the queue with a data-caption attribute
				var interiorImages = image.querySelectorAll('img[width][height], iframe[width][height], video[width][height]')
				var caption = document.createElement('DIV')
				var hasCaption = false;

				caption.className = 'gallery_image_caption'

				_.each(interiorImages, function(interiorImage){

					if (interiorImage.hasAttribute('data-caption')){
						caption.innerHTML = interiorImage.getAttribute('data-caption')
						hasCaption = true
					}

					$(interiorImage).removeAttr( 'data-elementresizer-no-resize data-elementresizer-no-centering data-elementresizer-no-vertical-resize')

				});

				if ( image.hasAttribute('width') && image.hasAttribute('height') && !image.hasAttribute('data-elementresizer-child') ){
					$(image).removeAttr( 'data-elementresizer-no-resize data-elementresizer-no-centering data-elementresizer-no-vertical-resize')
				}

				var slide, ratio;
				var isLink = false;
				var slide_inner = document.createElement('DIV');


				// make the whole slide into a link
				if ( image.tagName === 'A' && interiorImages.length == 1 ){
					isLink = true;

					if ( interiorImages[0].hasAttribute('autoplay') ){
						interiorImages[0].removeAttribute('autoplay');
						interiorImages[0].setAttribute('data-autoplay', '');
					}

					slide = image;
					slide_inner.appendChild(interiorImages[0]);

					slide.innerHTML ='';

					//slide = image.cloneNode(true)
					ratio = interiorImages[0].getAttribute('height')/ interiorImages[0].getAttribute('width');


				} else {

					if ( image.hasAttribute('autoplay') ){
						image.removeAttribute('autoplay');
						image.setAttribute('data-autoplay', '');
					}

					// only change specific styles since we need to maintain cursor properties
					$(image).css('margin', '')
					ratio = image.getAttribute('height')/image.getAttribute('width')

					slide = document.createElement('DIV')
					slide_inner.appendChild(image)

				}

				$(slide_inner).attr({
					'class': 'gallery_card_image'
				})

				slide.appendChild(slide_inner)

				$(slide).addClass('gallery_card').attr({
					'image-gallery-vertical-align': model_data.image_vertical_align,
					'image-gallery-horizontal-align': model_data.image_horizontal_align
				});


				if ( image.hasAttribute('data-caption') ){

					caption.innerHTML = image.getAttribute('data-caption');
					hasCaption = true;

				}


				if ( hasCaption){

					slide.appendChild(caption);
					slide.className += ' has_caption'
				}

				slide.setAttribute('data-gallery-item-id', index)

				_this.el.appendChild(slide)

			});

			this.setConstraint();

			this.setElAttributes();
			this.initSlick();
			this.$el.prepend('<div class="slideshow-nav" style="display: none" contenteditable="false"><a href="#" data-prev>Prev</a> / <a href="#" data-next>Next</a> (<span data-current data-ignore-changes>1</span> of <span data-total data-ignore-changes>1</span>)</div>')

			// initialized needs to be added before refresh in order for the images to have their models
			this.$el.addClass('initialized');

			// scrollMonitor.recalculateLocations();
			Cargo.Plugins.elementResizer.refresh();

			this.updateSlick();

			this.listenTo(Cargo.Event, "elementresizer_update_complete", this.debouncedSlickUpdate);

			this.exploded = false;

			Cargo.Event.trigger('image_gallery_rendered', this);

			return this;
		},

		setConstraint: function(){

			// disallow if we're moving things around
			if (this.exploded ){
				return
			}

			var images = this.el.querySelectorAll('img, video, iframe');

			if ( this.galleryOptions.data.constrain_height ){

				var minScale = 100;

				var minRatio = 9e9;
				var maxRatio = 0;
				var anchorID = null;

				for (var i = 0; i < images.length; i++){

					// assign all images to the scale set by the widest image
					var ratio =	images[i].getAttribute('width') / images[i].getAttribute('height');
					var scale = images[i].hasAttribute('data-scale') ? images[i].getAttribute('data-scale') : 100;

					if ( scale < minScale){
						minScale = scale;
					}

					if ( ratio > maxRatio ){

						maxRatio = ratio;

						if ( images[i].hasAttribute('data-mid') ){
							images[i].setAttribute('data-anchor-id', images[i].getAttribute('data-mid'));
						} else {
							images[i].setAttribute('data-anchor-id', i+'_anchor');
						}

						anchorID = images[i].getAttribute('data-anchor-id');

					}

				}

				for (var i = 0; i < images.length; i++){

					this.anchorHeight = null;
					if ( images[i].getAttribute('data-anchor-id') == anchorID){
						images[i].setAttribute('data-scale', minScale);
						images[i].setAttribute('data-slideshow-anchor', '');
						images[i].removeAttribute('data-anchored-item', '');

					} else {
						images[i].removeAttribute('data-scale');
						images[i].setAttribute('data-anchored-item', '');
						images[i].removeAttribute('data-slideshow-anchor', '');
						images[i].setAttribute('data-elementresizer-no-resize', '');
					}

				}

			} else {

				this.anchorImage = null;
				for (var i = 0; i < images.length; i++){
					images[i].removeAttribute('data-anchored-item', '');
					images[i].removeAttribute('data-slideshow-anchor', '');
					images[i].removeAttribute('data-elementresizer-no-resize', '');
				}

			}

		},

		setAlignmentAttributes: function(){

			var model_data = _.clone(this.galleryOptions.data);

			this.$el.find('.gallery_card').attr({
				'image-gallery-vertical-align': model_data.image_vertical_align,
				'image-gallery-horizontal-align': model_data.image_horizontal_align
			});
		},

		explodeView: function(){

			if ( this.exploded ){
				return;
			}

			var _this = this;

			this.exploded = true;

			if ( this.$el.hasClass('slick-initialized') ){
				this.$el.slick('destroy');
				this.$el.find('.slick-arrow, .slick-list').hide();
			};
			this.$el.removeClass('slick');

			this.$el.attr('data-exploded', '');

			// hide excluded item so it doesn't get removed and cancel the drag event

			this.$el.find('.gallery_image_caption').hide();

			this.el.innerHTML = '';

			this.images = _.sortBy(this.parentView.images, 'index');

			var cards = this.$el.find('.gallery_card');

			_.each( this.images, function(imageObject, index) {

				var imageObject = _this.images[index];
				var card = document.createElement('DIV');

				$(card).attr({
					'class': 'gallery_card',
					'data-gallery-item-id': index
				});

				card.className = 'gallery_card';

				var cardInner = document.createElement('DIV');
				cardInner.className = 'gallery_card_image';


				var item = _this.createItem(imageObject);

				if ( item.tagName === "A"){
					cardInner = item;
					var lazyItem = item.querySelector('[data-lazy]');
					if ( lazyItem){
						lazyItem.removeAttribute('data-lazy')
					}

				} else {
					item.removeAttribute('data-lazy')
					cardInner.appendChild(item)
				}

				$(cardInner).attr({
					'class': 'gallery_card_image',
					'style': 'display: block; padding-bottom: '+((parseInt(imageObject.height) / parseInt(imageObject.width))* 100 ) + '%',
					'data-elementresizer-no-resize': ''
				});

				card.appendChild(cardInner);
				_this.el.appendChild(card);
			});

			var newHeight = Math.max( this.$el.height(), parseInt(this.el.getAttribute('data-drag-height')));

			this.$el.height(newHeight);

			Cargo.Plugins.elementResizer.refresh();

			this.parentView.cachedRects.needsUpdate = true;
			this.parentView.updateCacheRects();
		},

		unExplodeView: function(){

			if ( !this.exploded){
				return;
			}

			$(this).height('');

			this.$el.removeAttr('data-exploded');

			this.$el.find('.gallery_image_caption').css('display', '');
			var galleryCards = this.$el.find('.gallery_card_image');
			galleryCards.each(function(){

				var cardItem = this.children[0];
				this.style.paddingBottom = '';

				cardItem.removeAttribute('data-elementresizer-no-resize','');
				cardItem.setAttribute('style','');

			});


			this.exploded = false;

			this.render();

			return;

		},


		getThumbRectPositionRelatedToPoint: function(point,rect){

			var in_y = false,
				in_x = false,
				above = false,
				below = false,
				to_left = false,
				to_right = false,
				distance = 0,
				rise = 0,
				run = 0,
				midpoint_distance = 0,
				midpoint_rise = 0,
				midpoint_run = 0;

			if ( point.x >= (rect.left) && point.x <= (rect.left+rect.width) ){
				in_x = true;
			}

			if ( point.y >= (rect.top) && point.y <= (rect.top+rect.height) ){
				in_y = true;
			}

			if ( rect.left > point.x ){
				to_right = true;
			} else if ( point.x > rect.left+rect.width ){
				to_left = true;
			}

			if ( rect.top > point.y ){
				below = true;
			} else if ( point.y > rect.top+rect.height ){
				above = true;
			}

			if ( in_x && in_y){

				var midpoint_rise = rect.midPoint.y - point.y;
				var midpoint_run = rect.midPoint.x - point.x;
				midpoint_distance = Math.sqrt(midpoint_rise*midpoint_rise + midpoint_run*midpoint_run)

			} else {

				if ( below ){

					rise = rect.top - point.y;

				} else if ( above ) {

					rise = (rect.top+rect.height) - point.y;

				}

				if ( to_right ){

					run = rect.left - point.x;

				} else if (to_left){

					run = (rect.left + rect.width) - point.x;

				}

			}

			distance = Math.sqrt( (rise*rise)+(run*run) );

			return {
				in_x: in_x,
				in_y: in_y,
				above: above,
				below: below,
				to_right: to_right,
				to_left: to_left,
				distance: distance,
				midpoint_rise: midpoint_rise,
				midpoint_run: midpoint_run,
				midpoint_distance: midpoint_distance,
				rise: rise,
				run: run,
				inside: in_x && in_y
			}

		},

		indicateInsertion: function(event, dragged){

			clearTimeout(this.unexplodeTimer);
			if ( !this.exploded ){

				this.explodeView();
				return
			}

			var m = {x: event.clientX, y: event.clientY}
			var minDistAbove = 9e9;
			var minDistBelow = 9e9;
			var minDistToRight = 9e9;
			var minDistToLeft = 9e9;
			var minDist = 9e9;

			var closestThumbToLeft = "default";
			var closestThumbToRight = "default";
			var closestThumbAbove = "default";
			var closestThumbBelow = "default";
			var closestThumb = "default";

			// build data into cache rects, also find closest thumb index
			for (var i in this.parentView.cachedRects.rects ){

				if ( i == 'default'){
					continue
				}

				var positions = this.getThumbRectPositionRelatedToPoint(m, this.parentView.cachedRects.rects[i] )
				this.parentView.cachedRects.rects[i].positions = positions;

				if ( this.parentView.cachedRects.rects[i].positions.distance < minDist ){
					minDist = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumb = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.above && this.parentView.cachedRects.rects[i].positions.distance < minDistAbove){
					minDistAbove = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbAbove = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.below && this.parentView.cachedRects.rects[i].positions.distance < minDistBelow){
					minDistBelow = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbBelow = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.to_left && this.parentView.cachedRects.rects[i].positions.distance < minDistToLeft){
					minDistToLeft = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbToLeft = i;
				}

				if ( this.parentView.cachedRects.rects[i].positions.to_right && this.parentView.cachedRects.rects[i].positions.distance < minDistToRight){
					minDistToRight = this.parentView.cachedRects.rects[i].positions.distance;
					closestThumbToRight = i;
				}
			}

			var targetNext = targetPrev = horizVertical = indicatePrev = indicateNext = "default";

			if ( this.parentView.cachedRects.rects[closestThumb].midPoint.x > m.x){

				// now to figure out where it gets indiciated
				var prevItem = $('[data-gallery-item-id="'+(parseInt(closestThumb)-1)+'"]');

				if (prevItem.length > 0){

					if (
						(
							this.parentView.cachedRects.rects.hasOwnProperty(prevItem.attr('data-gallery-item-id') ) &&
							this.parentView.cachedRects.rects[ prevItem.attr('data-gallery-item-id') ].midPoint.x < this.parentView.cachedRects.rects[closestThumb].midPoint.x
						) ||
						prevItem.attr('data-gallery-item-id') == closestThumbToLeft
					) {
						indicatePrev = prevItem.attr('data-gallery-item-id');
					}

				}

				targetNext = closestThumb;
				indicateNext = targetNext;

			} else {

				// now to figure out where it gets indiciated
				var nextItem = $('[data-gallery-item-id="'+(parseInt(closestThumb)+1)+'"]');

				if (nextItem.length > 0){

					if (
						(
							this.parentView.cachedRects.rects.hasOwnProperty(nextItem.attr('data-gallery-item-id') ) &&
							this.parentView.cachedRects.rects[ nextItem.attr('data-gallery-item-id') ].midPoint.x > this.parentView.cachedRects.rects[closestThumb].midPoint.x
						) ||
						nextItem.attr('data-gallery-item-id') == closestThumbToRight
					) {
						indicateNext = nextItem.attr('data-gallery-item-id')
					}

					targetNext = nextItem.attr("data-gallery-item-id");

				} else {

					targetNext = 9e9;

				}

				indicatePrev = closestThumb
			}


			var rotatedPrevItem = this.$el.find('[data-gallery-item-id="'+indicatePrev+'"] [data-rotation]');
			var rotatedNextItem = this.$el.find('[data-gallery-item-id="'+indicateNext+'"] [data-rotation]');
			var nextRotation = 0;
			var prevRotation = 0;

			if ( rotatedPrevItem.length >0){
				prevRotation = rotatedPrevItem.attr('data-rotation');
			}

			if ( rotatedNextItem.length >0){
				nextRotation = rotatedNextItem.attr('data-rotation');
			}			


			this.$el.find('.indication-prev, .indication-next').removeClass('indication-prev indication-next')				

			if ( indicatePrev != 'default' ){
				this.$el.find('[data-gallery-item-id="'+indicatePrev+'"]').addClass('indication-prev').css({
					'transform' : 'translateX(-2.5rem) rotate('+prevRotation+'deg)',
					'transition' : 'transform .08s cubic-bezier(0, 0, 0, 1)',
					'position': 'relative',
					'z-index' : '99'						
				})
			}

			if ( indicateNext != 'default' ){
				this.$el.find('[data-gallery-item-id="'+indicateNext+'"]').addClass('indication-next').css({
					'transform' : 'translateX(2.5rem) rotate('+nextRotation+'deg)',
					'transition' : 'transform .08s cubic-bezier(0, 0, 0, 1)',
					'position': 'relative',
					'z-index' : '99'						
				})
			}		

			var galleryCards = 	this.$el.find('.gallery_card').not('.indication-next, .indication-prev');
			galleryCards.each(function(card){

				var $card = $(card);
				var rotation = 0;
				var rotationItem = $card.find('[data-rotation]');
				if ( rotationItem.length >0 ){
					rotation = rotationItem.attr('data-rotation');
				}
				$card.css({
					'position': '',
					'transform' : rotation ? 'rotate('+rotation+'deg)': '',
					'z-index' : ''
				})
			})

			this.parentView.insertionPoint = targetNext
			this.$el.removeAttr('data-slideshow-in-transition')

		},

		unexplodeTimer: null,

		resetIndication: function(){

			var _this = this;

			this.parentView.insertionPoint = 0;

			var galleryCards = 	this.$el.find('.gallery_card');
			galleryCards.each(function(card){

				var $card = $(card);
				var rotation = 0;
				var rotationItem = $card.find('[data-rotation]');
				if ( rotationItem.length >0 ){
					rotation = rotationItem.attr('data-rotation');
				}
				$card.css({
					'position': '',
					'transform' : rotation ? 'rotate('+rotation+'deg)': '',
					'z-index' : ''
				}).removeClass('indication-next indication-prev')
			})

			// allow implementationfixes to reset and rerender at the end
			if ( Cargo.Core.ImageGallery.draggingInEditor){

				this.parentView.draggingOverGallery = true

			} else if ( this.exploded && !this.parentView.adding_item ){

				clearTimeout(this.unexplodeTimer)
				this.unexplodeTimer = setTimeout(function(){
					_this.unExplodeView();
				}, 200)

			}

		},

		initSlick: function(){

			var _this = this;

			var $slideshow = this.$el

			var isAdminEdit = false
			var mouseTimeout
			var mouseDownTarget
			var currentCursor
			var preventClick = false;
			var dragTimer;
			var canSelect = false;
			var transitionAttributeSet = false;
			var mouseDown = false;

			try {
				if(parent.hasOwnProperty('Cargo')) {
					isAdminEdit = parent.Cargo.Helper.IsAdminEdit();
				}
			} catch(e) {
				// Cross domain issue
			}

			var model_data = _.clone(this.galleryOptions.data)

			var autoplay = model_data.autoplay
			if ( this.viewport_monitor ){
				this.viewport_monitor.recalculateLocation();
				this.viewport_monitor.update();
				this.viewport_monitor.triggerCallbacks();

				autoplay = model_data.autoplay && this.viewport_monitor.isInViewport;
			}
		

			var slickOptions = {

				autoplay: (this.galleryOptions.data['transition-type'] === 'scrub') ? false : autoplay,
				autoplaySpeed: model_data.autoplaySpeed * 1000,
				speed: (this.galleryOptions.data['transition-type'] === 'scrub') ? 0 : model_data.speed * 1000,
				fade: model_data['transition-type'] == 'fade' || model_data.speed == 0 || (this.galleryOptions.data['transition-type'] === 'scrub'),
				arrows: model_data.arrows,

				cssEase: model_data.speed == 0 ? 'none': 'ease-in-out',
				useCSS: true,
				useTransform: true,
				adaptiveHeight: false,
				prevArrow: '<div class="slick-prev image-gallery-navigation">\
								<svg class="left-arrow" version="1.1"  xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\
									 viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve">\
										<path class="arrow-outline outer-color" d="M8.0008001,17.2999992c-0.4000001,0.3999996-0.4000001,1,0,1.3999996l15.7991991,15.7992001\
											c0.3999996,0.4000015,1,0.4000015,1.3999996,0l2.6992016-2.6991997c0.3999996-0.3999996,0.3999996-1,0-1.3999996\
											L16.2992001,18.7000008c-0.4000006-0.3999996-0.4000006-1,0-1.3999996L27.8992004,5.6999998\
											c0.3999996-0.4000001,0.3999996-1,0-1.4000001l-2.6992016-2.6992002c-0.3999996-0.4-1-0.4-1.3999996,0L8.0008001,17.2999992z"/>\
										<path class="arrow-shape inner-color" d="M9.6999998,17.6000004c-0.1999998,0.2000008-0.1999998,0.5,0,0.7000008l14.500001,14.5000019\
											c0.2000008,0.2000008,0.5,0.2000008,0.7000008,0l1.3999996-1.3999996c0.2000008-0.2000008,0.2000008-0.5,0-0.7000008\
											L13.8999996,18.3999996c-0.1999998-0.2000008-0.1999998-0.5,0-0.7000008L26.2999992,5.3000002\
											c0.2000008-0.1999998,0.2000008-0.5,0-0.6999998l-1.3999996-1.4000001c-0.2000008-0.2-0.5-0.2-0.7000008,0L9.6999998,17.6000004z"/>\
								</svg>\
							</div>',
				nextArrow: '<div class="slick-next image-gallery-navigation">\
								<svg class="right-arrow" version="1.1" xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" x="0px" y="0px"\
									 viewBox="0 0 36 36" style="enable-background:new 0 0 36 36;" xml:space="preserve">\
										<path class="arrow-outline outer-color" d="M8.0008001,17.2999992c-0.4000001,0.3999996-0.4000001,1,0,1.3999996l15.7991991,15.7992001\
											c0.3999996,0.4000015,1,0.4000015,1.3999996,0l2.6992016-2.6991997c0.3999996-0.3999996,0.3999996-1,0-1.3999996\
											L16.2992001,18.7000008c-0.4000006-0.3999996-0.4000006-1,0-1.3999996L27.8992004,5.6999998\
											c0.3999996-0.4000001,0.3999996-1,0-1.4000001l-2.6992016-2.6992002c-0.3999996-0.4-1-0.4-1.3999996,0L8.0008001,17.2999992z"/>\
										<path class="arrow-shape inner-color" d="M9.6999998,17.6000004c-0.1999998,0.2000008-0.1999998,0.5,0,0.7000008l14.500001,14.5000019\
											c0.2000008,0.2000008,0.5,0.2000008,0.7000008,0l1.3999996-1.3999996c0.2000008-0.2000008,0.2000008-0.5,0-0.7000008\
											L13.8999996,18.3999996c-0.1999998-0.2000008-0.1999998-0.5,0-0.7000008L26.2999992,5.3000002\
											c0.2000008-0.1999998,0.2000008-0.5,0-0.6999998l-1.3999996-1.4000001c-0.2000008-0.2-0.5-0.2-0.7000008,0L9.6999998,17.6000004z"/>\
								</svg>\
							</div>',
				dots: false,
			    lazyLoad: (this.galleryOptions.data['transition-type'] === 'scrub') && this.images.length <= 32 ? 'progressive' : 'ondemand',
				accessibility: !isAdminEdit,
				draggable: !isAdminEdit && this.galleryOptions.data['transition-type'] !== 'scrub',
				pauseOnHover: isAdminEdit,
				touchMove: !isAdminEdit && this.galleryOptions.data['transition-type'] !== 'scrub',
				preventDefaults: false,
			};

			$slideshow.removeClass('scrub fade slide');
			$slideshow.addClass( model_data['transition-type'] );

			var datestamp = 0;
			var inertiaDirection = 'forward'
			var autoplayTimeout;

		    var mouseMoved =false;
		    var stopImageDrag = true;
			var videoResumeTimer;
			var slideshowRect = 0;
			var startMouseX = 0;
			var startMouseY = 0;
			var startSlideIndex = 0;
			var cancelClick = false;


			var dragTimer;
			var resumeVideos = function(slick){

				var currentSlide = $slideshow.slick('slickCurrentSlide');
				var videos = slick.$slides[currentSlide].querySelectorAll('video[data-autoplay]');

				_.each(videos, function(videoEl){
					if ( videoEl.hasAttribute('muted') ){
						videoEl.muted = true;
					}
					// safari will complain if there isn't a promise callback
					// even if the promise is empty
					var playPromise = videoEl.play();


					if (playPromise !== undefined) {

					  playPromise.then(function() {
					    // Automatic playback started!
					  }).catch(function(error) {


					  });
					}
				})
			}

	       function captureClick(event){

	        	if ( mouseMoved ){
					cancelClick = true;
		        	event.preventDefault();
				    event.stopPropagation();
	        	}

			    window.removeEventListener('click', captureClick, true); // cleanup
	        }


			var onMouseMove = function(event){

				var isTouch = event.type ==='touchmove';
				var clientX = isTouch? event.touches[0].clientX : event.clientX;
				var clientY = isTouch ? event.touches[0].clientY : event.clientY;
				var mouseDeltaX = (startMouseX-clientX);
				var mouseDeltaY = (startMouseY-clientY);

				if ( !mouseMoved && Math.abs(mouseDeltaX) > 10){
					mouseMoved = true;
				}

				if ( _this.galleryOptions.data['transition-type'] == 'scrub' ){

					var percentage = (mouseDeltaX/slideshowRect.width);
					// ensure we stay within modulo range
					percentage = (percentage+1000)%1;

					var numberOfSlides = $slideshow.slick('getSlick').$slides.length;
					var slideMoveDelta = Math.floor(numberOfSlides*percentage);
					var targetSlide = (startSlideIndex+slideMoveDelta+numberOfSlides)%numberOfSlides;

					$slideshow.slick('slickGoTo', targetSlide, true);					
				}

			}

			var holdDelta = 0;

			var bindScrubNav = function(){
				var $nextArrow = $slideshow.find('.slick-next');
				$nextArrow.off('mousedown.scrub touchstart.scrub mouseup.nav mouseleave.nav touchend.nav')
				if ( _this.galleryOptions.data['transition-type'] !== 'scrub'){
					return
				}				
				$nextArrow.on('mousedown.scrub touchstart.scrub',function(){
					onStartNavClick();
					onHoldNextNav();
					$(this).on('mouseup.nav mouseleave.nav touchend.nav', function(){
						onReleaseNav();
						$(this).off('mouseup.nav mouseleave.nav touchend.nav')
					});						
				})

				var $prevArrow = $slideshow.find('.slick-prev');
				$prevArrow.off('mousedown.scrub touchstart.scrub mouseup.nav mouseleave.nav touchend.nav');
				if ( _this.galleryOptions.data['transition-type'] !== 'scrub'){
					return
				}				
				$prevArrow.on('mousedown.scrub touchstart.scrub',function(){			
					onStartNavClick();
					onHoldPrevNav();
					$(this).on('mouseup.nav mouseleave.nav touchend.nav', function(){
						onReleaseNav();
						$(this).off('mouseup.nav mouseleave.nav touchend.nav')
					});	
				})	
			}

			var onStartNavClick = function(event){
				clearTimeout(autoplayTimeout)					
				holdDelta = Math.min(holdDelta, 150);
			}
			
			var onHoldNextNav = function(){

				holdDelta = Math.max(20,holdDelta*.8);

				clearTimeout(autoplayTimeout)
				var currentSlide = $slideshow.slick('slickCurrentSlide');
				var numberOfSlides = $slideshow.slick('getSlick').$slides.length;
				var targetSlide = (currentSlide+1+numberOfSlides)%numberOfSlides;

				$slideshow.slick('slickGoTo', targetSlide, true);
				clearTimeout(autoplayTimeout)

				autoplayTimeout = setTimeout(function(){
					onHoldNextNav();
				}, holdDelta)
			}

			var onHoldPrevNav = function(){

				holdDelta = Math.max(20,holdDelta*.8);

				clearTimeout(autoplayTimeout)
				var currentSlide = $slideshow.slick('slickCurrentSlide');
				var numberOfSlides = $slideshow.slick('getSlick').$slides.length;
				var targetSlide = (currentSlide-1+numberOfSlides)%numberOfSlides;

				$slideshow.slick('slickGoTo', targetSlide, true);
				clearTimeout(autoplayTimeout)

				autoplayTimeout = setTimeout(function(){
					onHoldPrevNav();
				}, holdDelta)
			}

			var onReleaseNav = function(){
				clearTimeout(autoplayTimeout)					
				decayAutoPlay(holdDelta, 30)
			}


			var scrubAutoplay = function(){
				if ( _this.galleryOptions.data.autoplay ) {
					var currentSlide = $slideshow.slick('slickCurrentSlide');
					var numberOfSlides = $slideshow.slick('getSlick').$slides.length;
					var targetSlide;
					if ( inertiaDirection === 'forward'){
						targetSlide = (currentSlide+1+numberOfSlides)%numberOfSlides;
					} else {
						targetSlide = (currentSlide-1+numberOfSlides)%numberOfSlides;
					}
					$slideshow.slick('slickGoTo', targetSlide, true);
					clearTimeout(autoplayTimeout)

					autoplayTimeout = setTimeout(function(){
						scrubAutoplay();
					}, parseFloat(_this.galleryOptions.data.autoplaySpeed)*1000)

				}
			}

			this.startScrubAutoplay = scrubAutoplay;

			this.stopScrubAutoplay = function(){
				clearTimeout(autoplayTimeout)
			}

	
			var decayAutoPlay = function(delta, iteration){

				var newDelta = delta*1.05+(iteration*.5)
				var newIteration = iteration+1;

				var currentSlide = $slideshow.slick('slickCurrentSlide');
				var numberOfSlides = $slideshow.slick('getSlick').$slides.length;
				var targetSlide
				if ( inertiaDirection === 'forward'){
					targetSlide = (currentSlide+1+numberOfSlides)%numberOfSlides;
				} else {
					targetSlide = (currentSlide-1+numberOfSlides)%numberOfSlides;
				}

				clearTimeout(autoplayTimeout)
				if ( model_data.autoplay && newDelta >=  Math.min(.25, parseFloat(model_data.autoplaySpeed))*1000){
					autoplayTimeout = setTimeout(function(){
						scrubAutoplay()
					}, parseFloat(model_data.autoplaySpeed)*1000 );
				} else if ( newDelta < 200 ){
					autoplayTimeout = setTimeout(function(){
						decayAutoPlay(newDelta, newIteration)
					}, newDelta);
				}
				$slideshow.slick('slickGoTo', targetSlide, true);

			}


			var endMouseMove = function(event){
				var isTouch = event.type ==='touchend';

				mouseDown = false;
				$slideshow.removeAttr('data-mousedown');
				clearTimeout(dragTimer)
				clearTimeout(autoplayTimeout)


				// calc delta at time of release rather than wait for slide


				if ( _this.galleryOptions.data['transition-type'] !== 'scrub' ){

						window.removeEventListener('mouseup', endMouseMove)
						window.removeEventListener('mousemove', onMouseMove);	

				} else {
					$('body').removeClass('slideshow-scrub-dragging');

					var newDate = new Date().getTime();
					timeDelta = newDate-datestamp;
					if ( timeDelta < 100){
						autoplayTimeout = setTimeout(function(){
							decayAutoPlay(timeDelta, timeDelta*.5)
						}, timeDelta);
					}

					if ( isTouch){
						window.removeEventListener('touchmove', onMouseMove)
						window.removeEventListener('touchend', endMouseMove)

					} else {
						window.removeEventListener('mousemove', onMouseMove);	
						window.removeEventListener('mouseup', endMouseMove)

					}					
				}
				
			}



			var onMouseDown = function(event){

				clearTimeout(autoplayTimeout)
				$slideshow.attr('data-mousedown', '')
				cancelClick = false;
				mouseMoved = false;
				stopImageDrag = true;				
				clearTimeout(dragTimer)

				dragTimer = setTimeout(function(){

					if ( !mouseMoved){
						stopImageDrag = false;						
					}

				}, 250)


				if ( isAdminEdit){
					return
				}

				var isTouch = event.type ==='touchstart';

				startMouseX = isTouch? event.originalEvent.touches[0].clientX : event.clientX;
				startMouseY = isTouch? event.originalEvent.touches[0].clientY : event.clientY;

				if ( _this.galleryOptions.data['transition-type'] !== 'scrub' ){

					window.addEventListener('mouseup', endMouseMove)						
					window.addEventListener('mousemove', onMouseMove)

				} else {
				
					$('body').addClass('slideshow-scrub-dragging');

					slideshowRect = $slideshow.get(0).getBoundingClientRect();
					startSlideIndex = $slideshow.slick('slickCurrentSlide')
					$slideshow.slick('slickPause')

					if ( isTouch){
						window.addEventListener('touchmove', onMouseMove)
						window.addEventListener('touchend', endMouseMove)
					} else {
						event.preventDefault();						
						window.addEventListener('mousemove', onMouseMove)
						window.addEventListener('mouseup', endMouseMove)						
					}
				}	

			    window.addEventListener(
			        'click',
			        captureClick,
			        true
			    )
			}

			$slideshow
				.slick(slickOptions)
				.on('afterChange', function(event, slick, currentSlide){

					datestamp = new Date().getTime();

					clearTimeout(videoResumeTimer);
					videoResumeTimer = setTimeout(function(){
						resumeVideos(slick)
					}, 400)

					$slideshow.removeAttr('data-slideshow-in-transition')
					Cargo.Event.trigger('slideshow_update');
					_this.el.__cachedSlide = currentSlide;
				})
				.on(isAdminEdit ? 'dblclick' : 'click', '.slick-list > *', function(e){
					if ( !mouseMoved  && !cancelClick ) {
						if ( e.target.classList.contains('image-zoom') || $(e.target).closest('a').length >0 ){
							clearTimeout(autoplayTimeout)
							return
						}
						$slideshow.slick('slickNext');						
					}
				}).on('dragstart', '.slick-list img', function(e){
					if ( !isAdminEdit && stopImageDrag){
						e.preventDefault();
						e.stopPropagation();
					}

				}).on('dragend', '.slick-list img', function(e){
					$slideshow.trigger('touchend.slick');
				}).on('beforeChange', function(event, slick, currentSlide, nextSlide){

					// if at end and going forwards
					if (currentSlide == slick.$slides.length -1 && nextSlide == 0){
						inertiaDirection = 'forward'
					} else if (currentSlide == 0 && nextSlide == slick.$slides.length -1){
						inertiaDirection = 'backward'
					} else if ( nextSlide > currentSlide){
						inertiaDirection = 'forward'
					} else {
						inertiaDirection = 'backward'
					}

					var currentTime = 0;
					_.each(slick.$slides[currentSlide].querySelectorAll('video'), function(videoEl){

						videoEl.pause();
						currentTime = videoEl.currentTime;

					});

					// if at beginning and going backwards
					if ( currentSlide == 0 && nextSlide == slick.$slides.length -1 ){
						$slideshow.find('.slick-cloned').last().find('video').each(function(){
							this.currentTime = currentTime;
						})
					}

					// if at end and going forwards
					if (currentSlide == slick.$slides.length -1 && nextSlide == 0){
						$slideshow.find('.slick-cloned').first().find('video').each(function(){
							this.currentTime = currentTime;
						})
					}

					$slideshow.attr('data-slideshow-in-transition', '')
				}).on('reInit', bindScrubNav);

			bindScrubNav();

			$slideshow.on('mousedown', '.slick-list', onMouseDown)
			$slideshow.on('touchstart', '.slick-list', onMouseDown);



		

			if (this.galleryOptions.data['transition-type'] === 'scrub' ){
				scrubAutoplay();
			}




			$slideshow.find('.slick-cloned').removeAttr('data-gallery-item-id');

			if ( isAdminEdit) {
				$slideshow.find('.slick-cloned *, .slick-cloned').attr("data-exclude-item", '');
			}

			$slideshow.find('.slick-list').on('scroll', function(e){
				// prevent scrolling when selecting text
				this.scrollLeft = 0;
			});



			var currentSlide = 0;


			var $slides = $slideshow.slick('getSlick').$slides

			// if gallery is in the process of breakdown during init, avoid touching current slides or navigating
			if ( $slides.length > 0){

				if ( this.el.__cachedSlide ){
					$slideshow.slick('slickGoTo', this.el.__cachedSlide, true);
					currentSlide = this.el.__cachedSlide;
					this.el.__cachedSlide = null;
				}

				_.each($slideshow.slick('getSlick').$slides[currentSlide].querySelectorAll('video[data-autoplay]'), function(videoEl){

					var playPromise = videoEl.play();

					// gotta do it like this or safari will complain
					if (playPromise !== undefined) {

					  playPromise.then(function() {
					    // Automatic playback started!
					  }).catch(function(error) {

					  });
					}
				});
			}


			this.rendered = true;

		},

		slickTimeout: null,

		elementH: null,
		elementW: null,
		updateSlick: function(){

			var elRect = this.el.getBoundingClientRect();

			if ( this.exploded || !this.$el.hasClass('slick-initialized') ){
				return
			}

			if ( !document.contains(this.el) ){
				this.destroy();
				return;
			}

			// this.elementW = elRect.width;
			var elementH = elRect.height;

			var anchorImage = this.el.querySelector('[data-slideshow-anchor]');

			if ( this.galleryOptions.data.constrain_height && anchorImage) {

				var anchorHeight = anchorImage.offsetHeight;

				if ( this.anchorHeight != anchorHeight){
					this.anchorHeight = anchorHeight;

					var images = this.el.querySelectorAll('[data-anchored-item]');

					for(var i = 0; i < images.length; i++){

						var imageWidth = images[i].getAttribute('width');
						var imageHeight = images[i].getAttribute('height');

						var reduction = anchorHeight / imageHeight;

						var newHeight = anchorHeight;
						var newWidth = imageWidth * reduction;

						if ( anchorHeight > imageHeight ){
							newHeight = imageHeight;
							newWidth = imageWidth;
						}

						$(images[i]).css({
							'width': newWidth +'px',
							'height': newHeight +'px'
						});

					}

				}

			}

			var galleryCards = this.el.querySelectorAll('.gallery_card');
			this.$el.find('.gallery_image_caption').css('height', '')
			var captionHeight = 0;

			var targetHeight = 0;

			for (var i =0; i < galleryCards.length; i++){

				if ( galleryCards[i].children.length ==0 ){
					continue
				}

				const firstRect = galleryCards[i].children[0].getBoundingClientRect();

				if ( galleryCards[i].children.length > 1 ){

					const lastRect = galleryCards[i].children[galleryCards[i].children.length-1].getBoundingClientRect();
					captionHeight = Math.max(lastRect.height, captionHeight);

					targetHeight = Math.max( (lastRect.height+lastRect.top) - firstRect.top, targetHeight )

				} else {

					targetHeight = Math.max( firstRect.height, targetHeight );

				}

			}
			this.$el.find('.gallery_image_caption').css('height', captionHeight);

			this.elementH = elRect.height;

			this.el.setAttribute('data-drag-height', this.elementH);
			// this.$el.removeAttr('data-slideshow-in-transition')

			this.$el.find('.gallery_card').height(targetHeight);
			this.$el.slick('setPosition');
			this.resume();
		},

		resizeImage: function(targetImage, scale){


			scale = Math.min(Math.max(5, Math.round(scale)), 100);

			if ( this.galleryOptions.data.constrain_height ) {

				if ( scale == 100 ){
					this.$el.find('.gallery_card img').removeAttr('data-scale');
				} else {
					this.$el.find('.gallery_card img').attr('data-scale', scale);
				}


			} else {

				var targetIndex = parseInt($(targetImage).closest('[data-gallery-item-id]').attr('data-gallery-item-id'));
				var targetMid = targetImage.getAttribute('data-mid');

				var currentScale = targetImage.hasAttribute('data-scale') ? parseInt(targetImage.getAttribute('data-scale') ) : 100;

				if ( targetIndex == 0 ){

					this.$el.find('.slick-cloned').last().find('[data-mid="'+targetMid+'"]').attr('data-scale', scale)

				} else if (targetIndex == this.images.length -1 ){

					this.$el.find('.slick-cloned').first().find('[data-mid="'+targetMid+'"]').attr('data-scale', scale)

				}

				if ( scale == 100 ){
					targetImage.removeAttribute('data-scale');
				} else {
					targetImage.setAttribute('data-scale', scale);
				}


			};

			// trigger new sizes and refresh slideshow position
			Cargo.Plugins.elementResizer.update();


		}

	})


});
