import Slider from './src/slideshow'
import Editor from './src/editor'

const editor = Editor()
const slides = Slider(document.querySelector('main'), editor)

editor.editor.on('focus', () => slides.enabled = false)
editor.editor.on('blur', () => slides.enabled = true)

slides.register('triangles', require('./src/slide-triangles.js').default)
