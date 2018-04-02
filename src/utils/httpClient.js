import LogicError from './logicError'

import axios from 'axios'

const methods = ['get', 'post', 'put', 'patch', 'del']
const JSON_CONTENT_TYPE = 'application/json;charset=utf-8'
// const inBrowser = typeof window !== 'undefined'

/*
 * This silly underscore is here to avoid a mysterious "ReferenceError: ApiClient is not defined" error.
 * See Issue #14. https://github.com/erikras/react-redux-universal-hot-example/issues/14
 *
 * Remove it at your own risk.
 */
function HttpClient() {
  methods.forEach(
    method =>
      (this[method] = (path, { params, data } = {}) =>
        new Promise((resolve, reject) => {
          const options = {
            url: path,
            method,
            data,
            params,
            timeout: 10000,
            withCredentials: true,
            headers: { Accept: JSON_CONTENT_TYPE, 'Content-Type': JSON_CONTENT_TYPE }
          }

          return axios(options)
            .then(response => {
              return resolve(response.data)
            })
            .catch(error => {
              if (error && error.response) {
                const { status, statusText } = error.response
                return reject(
                  new LogicError({
                    // data,
                    status,
                    message: `axios ${path} fail, status=${status}, statusText=${statusText}`
                  })
                )
              }
            })
        }))
  )
}
export default HttpClient
