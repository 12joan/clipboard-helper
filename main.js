import { Application, Controller } from 'https://unpkg.com/@hotwired/stimulus/dist/stimulus.js'

window.Stimulus = Application.start()

Stimulus.register('copy', class extends Controller {
  static targets = ['data', 'typeSelect', 'typeOther', 'copyButton']

  connect() {
    this.initialButtonText = this.copyButtonTarget.textContent
    this.successFeedbackTimeout = null
    this.updateTypeOtherVisibility()
  }

  handleTypeSelectChanged() {
    if (this.updateTypeOtherVisibility()) {
      this.typeOtherTarget.focus()
    }
  }

  performCopy() {
    const handler = this.handleCopy.bind(this)
    window.addEventListener('copy', handler)
    document.execCommand('copy')
    window.removeEventListener('copy', handler)
  }

  handleCopy(event) {
    event.preventDefault()

    let success = null

    try {
      event.clipboardData.setData(this.getType(), this.getData())
      success = true
    } catch (error) {
      console.error(error)
      alert('Unable to copy to clipboard. See console for details.')
      success = false
    }

    if (success) {
      this.successFeedback()
    }
  }

  successFeedback() {
    const copyButton = this.copyButtonTarget

    copyButton.textContent = '✅ Copied!'

    clearTimeout(this.successFeedbackTimeout)

    this.successFeedbackTimeout = setTimeout(() => {
      copyButton.textContent = this.initialButtonText
    }, 1000)
  }

  // Private

  updateTypeOtherVisibility() {
    const visible = this.typeSelectTarget.value === 'other'
    this.typeOtherTarget.hidden = !visible
    return visible
  }

  getData() {
    return this.dataTarget.value
  }

  getType() {
    const typeSelectValue = this.typeSelectTarget.value

    return typeSelectValue === 'other'
      ? this.typeOtherTarget.value
      : typeSelectValue
  }
})

Stimulus.register('inspect', class extends Controller {
  static targets = ['paste']

  async handlePaste(event) {
    event.preventDefault()

    const items = Array.from(event.clipboardData.items)

    const output = await Promise.all(items.map(item => new Promise(resolve => {
      switch (item.kind) {
        case 'string':
          item.getAsString(value => resolve(`[${item.type}]:\n${value}`))
          break

        case 'file':
          const file = item.getAsFile()
          resolve(`File: ${file.name} (${file.type})`)
          break

        default:
          resolve(`Unknown item kind: ${item.kind}`)
      }
    }))).then(outputs => outputs.join('\n\n'))

    this.pasteTarget.value = output
  }
})
