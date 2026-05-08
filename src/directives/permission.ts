import type { Directive, DirectiveBinding } from 'vue'
import { useUserStore } from '@/stores/user'

interface PermissionBinding {
  roles?: string[]
  permissions?: string[]
}

const permission: Directive = {
  mounted(el: HTMLElement, binding: DirectiveBinding<PermissionBinding>) {
    const { value } = binding
    const userStore = useUserStore()
    const userRoles = userStore.userRoles

    if (value && value.roles instanceof Array && value.roles.length > 0) {
      const requiredRoles = value.roles
      const hasPermission = requiredRoles.some(role => userRoles.includes(role))

      if (!hasPermission) {
        el.parentNode?.removeChild(el)
      }
    }
  }
}

export default permission
