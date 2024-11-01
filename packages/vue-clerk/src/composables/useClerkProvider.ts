import { inject } from 'vue'
import type { VueClerkInjectionKeyType } from '../keys'
import { VueClerkInjectionKey } from '../keys'
import { activeClerk } from '../provideClerkToVueApp'

export function useClerkProvider() {
  const ctx = inject<VueClerkInjectionKeyType>(VueClerkInjectionKey)

  if (!ctx) {
    // throw new Error(
    //   'This composable can only be used when the Vue Clerk plugin is installed. Learn more: https://vue-clerk.com/plugin',
    // )
    console.warn('Using global clerk as provide/inject is unavailable')

    return activeClerk
  }

  return ctx
}
