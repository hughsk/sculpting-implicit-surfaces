import Fit from 'canvas-fit'
import sliced from 'sliced'

export default (wrapper) => new Slideshow(wrapper)

class Slideshow {
  constructor (wrapper) {
    this.canvas = document.createElement('canvas')
    this.gl = this.canvas.getContext('webgl')
    this.transitionTimer = null

    this.slideWrapper = wrapper
    this.slideElements = sliced(wrapper.querySelectorAll('section[data-slide]'))
    this.totalSlides = this.slideElements.length
    this.currSlide = parseInt(window.localStorage.getItem('implicit-slide'), 10) || 0
    this.slideEvents = {}

    this.fitter = Fit(this.canvas)
    this.resize()

    window.addEventListener('resize', () => this.resize(), false)
    window.addEventListener('keydown', (e) => {
      switch (e.keyCode) {
        case 37:
        case 38:
          return this.prevSlide()

        case 32:
        case 39:
        case 40:
          return this.nextSlide()

        case 192:
          document.body.parentElement.classList.toggle('editor-enabled')
          this.fitter()
          return
      }
    }, false)

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
    }, 500)
  }

  resize () {
    this.toSlide(this.currSlide)
    this.fitter()
  }
}
