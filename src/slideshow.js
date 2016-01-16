import Event from 'synthetic-dom-events'
import Fit from 'canvas-fit'
import sliced from 'sliced'

export default (wrapper, editor) => new Slideshow(wrapper, editor)

class Slideshow {
  constructor (wrapper, editor) {
    this.canvas = document.createElement('canvas')
    this.gl = this.canvas.getContext('webgl')
    this.transitionTimer = null
    this.enabled = true
    this.editor = editor

    this.slideWrapper = wrapper
    this.slideElements = sliced(wrapper.querySelectorAll('section[data-slide]'))
    this.totalSlides = this.slideElements.length
    this.currSlide = parseInt(window.localStorage.getItem('implicit-slide'), 10) || 0
    this.slideEvents = {}
    this.latestEvent = null
    this.latestName = null

    this.fitter = Fit(this.canvas)
    this.resizeLock = false
    this.resize()

    window.addEventListener('resize', () => {
      if (this.resizeLock) return
      this.resizeLock = true
      this.resize()
      this.resizeLock = false
    }, false)

    window.addEventListener('keydown', (e) => {
      switch (e.keyCode) {
        case 192:
          document.body.parentElement.classList.toggle('editor-enabled')
          this.resize()
          return

        case 38:
          return this.enabled && this.prevSlide()

        case 32:
        case 40:
          return this.enabled && this.nextSlide()

      }
    }, false)

    const render = () => {
      window.requestAnimationFrame(render)
      if (this.latestEvent) this.latestEvent.emit('render')
    }

    render()
  }

  nextSlide () {
    this.toSlide((this.currSlide + 1) % this.totalSlides)
  }

  prevSlide () {
    this.toSlide((this.currSlide + this.totalSlides - 1) % this.totalSlides)
  }

  toSlide (nextSlide) {
    const prev = this.slideElements[this.currSlide]
    const next = this.slideElements[nextSlide]
    const name = next.getAttribute('data-slide')

    prev.classList.remove('current')
    next.classList.add('current')

    this.currSlide = nextSlide
    this.slideWrapper.style.top = (-100 * nextSlide) + 'vh'

    window.localStorage.setItem('implicit-slide', String(this.currSlide))

    if (this.transitionTimer) clearTimeout(this.transitionTimer)

    const canvasShell = next.querySelector('.canvas-shell')
    this.transitionTimer = setTimeout(() => {
      if (!canvasShell) return

      canvasShell.appendChild(this.canvas)
      this.fitter()

      if (this.latestName !== name) {
        if (this.latestEvent) this.latestEvent.emit('dispose')

        let event = this.slideEvents[name] || (() => null)
        if (event) this.latestEvent = event(this.gl, this.editor)
        this.latestName = name
      }
    }, 500)
  }

  resize () {
    if (!this.resizeLock) {
      window.dispatchEvent(Event('resize'))
    }

    this.toSlide(this.currSlide)
    this.fitter()
  }

  register (name, bootstrap) {
    this.slideEvents[name] = bootstrap
  }
}
