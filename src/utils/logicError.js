export default class LogicError extends Error {
  constructor ({ status = 500, message = 'Unknown client error', data } = {}) {
    super(message)
    this.data = data
    this.message = message
    this.status = status
  }

  set status (errorCode) {
    this.status = errorCode
  }
}
