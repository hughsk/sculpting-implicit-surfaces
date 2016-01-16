(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict';

var _slideshow = require('./src/slideshow');

var _slideshow2 = _interopRequireDefault(_slideshow);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

var slides = (0, _slideshow2.default)(document.querySelector('main'));

},{"./src/slideshow":5}],2:[function(require,module,exports){
var size = require('element-size')

module.exports = fit

var scratch = new Float32Array(2)

function fit(canvas, parent, scale) {
  var isSVG = canvas.nodeName.toUpperCase() === 'SVG'

  canvas.style.position = canvas.style.position || 'absolute'
  canvas.style.top = 0
  canvas.style.left = 0

  resize.scale  = parseFloat(scale || 1)
  resize.parent = parent

  return resize()

  function resize() {
    var p = resize.parent || canvas.parentNode
    if (typeof p === 'function') {
      var dims   = p(scratch) || scratch
      var width  = dims[0]
      var height = dims[1]
    } else
    if (p && p !== document.body) {
      var psize  = size(p)
      var width  = psize[0]|0
      var height = psize[1]|0
    } else {
      var width  = window.innerWidth
      var height = window.innerHeight
    }

    if (isSVG) {
      canvas.setAttribute('width', width * resize.scale + 'px')
      canvas.setAttribute('height', height * resize.scale + 'px')
    } else {
      canvas.width = width * resize.scale
      canvas.height = height * resize.scale
    }

    canvas.style.width = width + 'px'
    canvas.style.height = height + 'px'

    return resize
  }
}

},{"element-size":3}],3:[function(require,module,exports){
module.exports = getSize

function getSize(element) {
  // Handle cases where the element is not already
  // attached to the DOM by briefly appending it
  // to document.body, and removing it again later.
  if (element === window || element === document.body) {
    return [window.innerWidth, window.innerHeight]
  }

  if (!element.parentNode) {
    var temporary = true
    document.body.appendChild(element)
  }

  var bounds = element.getBoundingClientRect()
  var styles = getComputedStyle(element)
  var height = (bounds.height|0)
    + parse(styles.getPropertyValue('margin-top'))
    + parse(styles.getPropertyValue('margin-bottom'))
  var width  = (bounds.width|0)
    + parse(styles.getPropertyValue('margin-left'))
    + parse(styles.getPropertyValue('margin-right'))

  if (temporary) {
    document.body.removeChild(element)
  }

  return [width, height]
}

function parse(prop) {
  return parseFloat(prop) || 0
}

},{}],4:[function(require,module,exports){

/**
 * An Array.prototype.slice.call(arguments) alternative
 *
 * @param {Object} args something with a length
 * @param {Number} slice
 * @param {Number} sliceEnd
 * @api public
 */

module.exports = function (args, slice, sliceEnd) {
  var ret = [];
  var len = args.length;

  if (0 === len) return ret;

  var start = slice < 0
    ? Math.max(0, slice + len)
    : slice || 0;

  if (sliceEnd !== undefined) {
    len = sliceEnd < 0
      ? sliceEnd + len
      : sliceEnd
  }

  while (len-- > start) {
    ret[len - start] = args[len];
  }

  return ret;
}


},{}],5:[function(require,module,exports){
'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _canvasFit = require('canvas-fit');

var _canvasFit2 = _interopRequireDefault(_canvasFit);

var _sliced = require('sliced');

var _sliced2 = _interopRequireDefault(_sliced);

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { default: obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

exports.default = function (wrapper) {
  return new Slideshow(wrapper);
};

var Slideshow = (function () {
  function Slideshow(wrapper) {
    var _this = this;

    _classCallCheck(this, Slideshow);

    this.canvas = document.createElement('canvas');
    this.gl = this.canvas.getContext('webgl');
    this.transitionTimer = null;

    this.slideWrapper = wrapper;
    this.slideElements = (0, _sliced2.default)(wrapper.querySelectorAll('section[data-slide]'));
    this.totalSlides = this.slideElements.length;
    this.currSlide = parseInt(window.localStorage.getItem('implicit-slide'), 10) || 0;
    this.slideEvents = {};

    this.fitter = (0, _canvasFit2.default)(this.canvas);
    this.resize();

    window.addEventListener('resize', function () {
      return _this.resize();
    }, false);
    window.addEventListener('keydown', function (e) {
      switch (e.keyCode) {
        case 38:
          return _this.prevSlide();

        case 32:
        case 40:
          return _this.nextSlide();

        case 192:
          document.body.parentElement.classList.toggle('editor-enabled');
          _this.fitter();
          return;
      }
    }, false);
  }

  _createClass(Slideshow, [{
    key: 'nextSlide',
    value: function nextSlide() {
      this.toSlide((this.currSlide + 1) % this.totalSlides);
    }
  }, {
    key: 'prevSlide',
    value: function prevSlide() {
      this.toSlide((this.currSlide + this.totalSlides - 1) % this.totalSlides);
    }
  }, {
    key: 'toSlide',
    value: function toSlide(nextSlide) {
      var _this2 = this;

      var prev = this.slideElements[this.currSlide];
      var next = this.slideElements[nextSlide];

      prev.classList.remove('current');
      next.classList.add('current');

      this.currSlide = nextSlide;
      this.slideWrapper.style.top = -100 * nextSlide + 'vh';

      window.localStorage.setItem('implicit-slide', String(this.currSlide));

      if (this.transitionTimer) clearTimeout(this.transitionTimer);

      var canvasShell = next.querySelector('.canvas-shell');
      this.transitionTimer = setTimeout(function () {
        if (!canvasShell) return;

        canvasShell.appendChild(_this2.canvas);
        _this2.fitter();
      }, 500);
    }
  }, {
    key: 'resize',
    value: function resize() {
      this.toSlide(this.currSlide);
      this.fitter();
    }
  }]);

  return Slideshow;
})();

},{"canvas-fit":2,"sliced":4}]},{},[1]);
