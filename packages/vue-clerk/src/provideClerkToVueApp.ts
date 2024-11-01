import type { Clerk, ClerkOptions, ClientResource, InitialState, Resources, Without } from '@clerk/types'
import { computed, ref, shallowRef } from 'vue'
import type { App } from 'vue'
import { isPublishableKey } from '@clerk/shared/keys'
import { deriveState } from '@clerk/shared/deriveState'
import type { VueClerkInjectionKeyType } from './keys'
import { VueClerkInjectionKey } from './keys'
import { IsomorphicClerk } from './isomorphicClerk'
import type { IsomorphicClerkOptions } from './types'
import { errorThrower } from './errors/errorThrower'

export interface HeadlessBrowserClerk extends Clerk {
  load: (opts?: Without<ClerkOptions, 'isSatellite'>) => Promise<void>
  updateClient: (client: ClientResource) => void
}

export interface BrowserClerk extends HeadlessBrowserClerk {
  onComponentsReady: Promise<void>
  components: any
}

let initOptions: ClerkOptions | undefined

// eslint-disable-next-line import/no-mutable-exports
export let activeClerk: VueClerkInjectionKeyType

export function provideClerkToVueApp(app: App, options: IsomorphicClerkOptions & { initialState?: InitialState }): IsomorphicClerk {
  const { initialState, publishableKey, Clerk: userInitializedClerk } = options

  if (!userInitializedClerk) {
    if (!publishableKey)
      errorThrower.throwMissingPublishableKeyError()
    else if (publishableKey && !isPublishableKey(publishableKey))
      errorThrower.throwInvalidPublishableKeyError({ key: publishableKey })
  }

  const isClerkLoaded = ref(false)
  const clerk = IsomorphicClerk.getOrCreateInstance(options)

  const state = shallowRef<Resources>({
    client: clerk.client as ClientResource,
    session: clerk.session,
    user: clerk.user,
    organization: clerk.organization,
  })

  clerk.addListener((payload) => {
    state.value = payload
  })

  clerk.addOnLoaded(() => {
    isClerkLoaded.value = true
  })

  const derivedState = computed(() => deriveState(isClerkLoaded.value, state.value, initialState))

  const authCtx = computed(() => {
    const { sessionId, userId, orgId, actor, orgRole, orgSlug, orgPermissions } = derivedState.value
    return { sessionId, userId, actor, orgId, orgRole, orgSlug, orgPermissions }
  })
  const clientCtx = computed(() => state.value.client)
  const userCtx = computed(() => derivedState.value.user)
  const sessionCtx = computed(() => derivedState.value.session)
  const organizationCtx = computed(() => derivedState.value.organization)

  app.config.globalProperties.$clerk = clerk

  const injectionValues = {
    clerk,
    isClerkLoaded,
    authCtx,
    clientCtx,
    sessionCtx,
    userCtx,
    organizationCtx,
  }

  app.provide<VueClerkInjectionKeyType>(VueClerkInjectionKey, injectionValues)

  activeClerk = injectionValues

  return clerk
}

export function updateClerkOptions(options: Pick<ClerkOptions, 'appearance' | 'localization'>) {
  // `__unstable__updateProps` is not exposed as public API from `@clerk/types`
  void (window as any).Clerk.__unstable__updateProps({
    options: { ...initOptions, ...options },
    appearance: { ...initOptions?.appearance, ...options.appearance },
  })
}

declare module 'vue' {
  interface ComponentCustomProperties {
    $clerk: IsomorphicClerk
  }
}
