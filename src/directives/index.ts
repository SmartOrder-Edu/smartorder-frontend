import type { App } from 'vue'
import loading from './loading'
import permission from './permission'
import debounce from './debounce'

export default function setupDirectives(app: App) {
  app.directive('loading', loading)
  app.directive('permission', permission)
  app.directive('debounce', debounce)
}
