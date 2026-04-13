<template>
  <main class="min-h-screen p-4 bg-base-100">
    <!-- Loading auth -->
    <div v-if="isLoading" class="flex justify-center items-center min-h-screen">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Accès refusé -->
    <div v-else-if="!hasAccess" class="flex flex-col justify-center items-center min-h-screen text-center px-4">
      <div class="text-6xl mb-6">🚫</div>
      <h1 class="text-2xl font-bold mb-4">Accès non autorisé</h1>
      <p class="opacity-70 mb-6" v-if="!isAuthenticated">
        Vous devez vous connecter pour accéder à cette application.
      </p>
      <p class="opacity-70 mb-6" v-else>
        Vous n'avez pas les droits d'accès à cette application.
      </p>
      <div class="flex gap-4">
        <button v-if="!isAuthenticated" @click="login" class="btn btn-primary">
          Se connecter
        </button>
        <button @click="redirectToPortal" class="btn btn-ghost">
          Retour au portail
        </button>
      </div>
    </div>

    <!-- Contenu principal -->
    <div v-else>
      <header class="text-center mb-6">
        <div class="flex justify-between items-center max-w-md mx-auto mb-2">
          <a href="https://cyriongames.fr" class="btn btn-ghost btn-sm">
            <span class="mr-1">&#8592;</span> Portail
          </a>
          <div class="flex items-center gap-2">
            <span class="text-sm opacity-70">{{ user?.name }}</span>
            <button @click="logout" class="btn btn-ghost btn-sm btn-circle" title="Déconnexion">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
            </button>
          </div>
        </div>
        <h1 class="text-3xl font-bold text-primary">🛒 Shopping</h1>
        <p class="opacity-70 mt-2">Gérez votre inventaire et vos listes de courses</p>
      </header>

      <!-- Auto-join en cours -->
      <div v-if="isAutoJoining" class="flex flex-col justify-center items-center py-12">
        <span class="loading loading-spinner loading-lg text-primary"></span>
        <p class="mt-4 opacity-70">Chargement de votre boutique...</p>
      </div>

      <div v-else-if="autoJoinError" class="max-w-md mx-auto">
        <div class="alert alert-error mb-4">
          {{ autoJoinError }}
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, watch, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { isAuthenticated, user, isLoading, hasAccess, initKeycloak, login, logout, redirectToPortal } = useAuth()

const isAutoJoining = ref(false)
const autoJoinError = ref('')

onMounted(() => {
  initKeycloak()
})

// Quand l'auth est prête et l'utilisateur connecté, auto-join
watch([isLoading, isAuthenticated, hasAccess, user], async ([loading, authenticated, access, u]: [boolean, boolean, boolean, { id: string; name: string; email: string } | null]) => {
  if (loading || !authenticated || !access || !u?.id) return

  isAutoJoining.value = true
  autoJoinError.value = ''

  try {
    const boutique = await $fetch('/api/boutique/me', {
      method: 'POST',
      body: {
        keycloakUserId: u.id,
        name: `Boutique de ${u.name}`
      }
    }) as { keycloakUserId: string }

    router.push('/boutique/' + boutique.keycloakUserId)
  } catch (e: any) {
    autoJoinError.value = e.data?.message || 'Erreur lors du chargement de votre boutique'
    isAutoJoining.value = false
  }
}, { immediate: true })
</script>
