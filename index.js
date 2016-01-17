window.devicePixelRatio = 1

import Slider from './src/slideshow'
import Editor from './src/editor'

const editor = Editor()
const slides = Slider(document.querySelector('main'), editor)

editor.editor.on('focus', () => slides.enabled = false)
editor.editor.on('blur', () => slides.enabled = true)

slides.register('triangles', require('./src/slide-triangles.js').default)
slides.register('primitives', require('./src/slide-primitives.js').default)
slides.register('look-ma-two-triangles', require('./src/slide-look-ma-two-triangles.js').default)
slides.register('sphere-tracing', require('./src/slide-sphere-tracing.js').default)
slides.register('implicits-example-circle', require('./src/slide-implicits-example-circle.js').default)
slides.register('implicits-example-sphere', require('./src/slide-implicits-example-sphere.js').default)
slides.register('operations-combined', require('./src/slide-operations-combined.js').default)
