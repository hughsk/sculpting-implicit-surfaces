import sliced from 'sliced'

export default (wrapper) => new Slideshow(wrapper)

class Slideshow {
  constructor (wrapper) {
    this.slideWrapper = wrapper
    this.slideElements = sliced(wrapper.querySelectorAll('section[data-slide]'))
    this.totalSlides = this.slideElements.length
    this.currSlide = 0

    this.slideEvents = {}

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
      }
    }, false)
  }

  nextSlide () {
    this.toSlide((this.currSlide + 1) % this.totalSlides)
  }

  prevSlide () {
    this.toSlide((this.currSlide + this.totalSlides - 1) % this.totalSlides)
  }

  toSlide (n) {
    this.currSlide = n
    this.slideWrapper.style.top = (-100 * n) + 'vh'
  }

  resize () {
    this.toSlide(this.currSlide)
  }
}
