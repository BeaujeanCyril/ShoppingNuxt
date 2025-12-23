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

      <div class="max-w-md mx-auto space-y-6">
      <!-- Rejoindre une boutique -->
      <section class="card bg-base-200 shadow-xl">
        <div class="card-body">
          <h2 class="card-title text-2xl">Rejoindre une boutique</h2>
          <p class="opacity-70">Entrez le code PIN à 6 chiffres de votre boutique</p>

          <div class="form-control">
            <input
              type="password"
              v-model="joinCode"
              class="input input-bordered text-center text-2xl tracking-widest"
              placeholder="******"
              maxlength="6"
              @input="joinCode = joinCode.replace(/\D/g, '')"
              @keyup.enter="joinBoutique"
            />
          </div>

          <div class="card-actions justify-end mt-2">
            <button
              class="btn btn-secondary"
              @click="joinBoutique"
              :disabled="isJoining || joinCode.length !== 6"
            >
              <span v-if="isJoining" class="loading loading-spinner loading-sm"></span>
              Rejoindre
            </button>
          </div>

          <div v-if="joinError" class="alert alert-error mt-2">
            {{ joinError }}
          </div>
        </div>
      </section>

      <!-- Créer une boutique (accordion fermé) -->
      <div class="collapse collapse-arrow bg-base-200 shadow-xl">
        <input type="checkbox" />
        <div class="collapse-title text-xl font-medium">
          Créer une nouvelle boutique
        </div>
        <div class="collapse-content">
          <div class="space-y-4 pt-2">
            <div class="form-control">
              <label class="label">
                <span class="label-text">Nom de la boutique</span>
              </label>
              <input
                type="text"
                v-model="boutiqueName"
                class="input input-bordered"
                placeholder="Ex: Maison Dupont"
              />
            </div>

            <div class="form-control">
              <label class="label">
                <span class="label-text">Code PIN boutique (6 chiffres)</span>
              </label>
              <input
                type="text"
                v-model="boutiquePin"
                class="input input-bordered text-center text-2xl tracking-widest"
                placeholder="000000"
                maxlength="6"
                @input="boutiquePin = boutiquePin.replace(/\D/g, '')"
              />
              <label class="label">
                <span class="label-text-alt opacity-70">Ce code permettra à tous de rejoindre la boutique</span>
              </label>
            </div>

            <div class="flex justify-end mt-4">
              <button
                class="btn btn-primary"
                @click="createBoutique"
                :disabled="isCreating || !boutiqueName.trim() || boutiquePin.length !== 6"
              >
                <span v-if="isCreating" class="loading loading-spinner loading-sm"></span>
                Créer la boutique
              </button>
            </div>

            <div v-if="createError" class="alert alert-error">
              {{ createError }}
            </div>
          </div>
        </div>
      </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'

const router = useRouter()
const { isAuthenticated, user, isLoading, hasAccess, initKeycloak, login, logout, redirectToPortal } = useAuth()

onMounted(() => {
  initKeycloak()
})

// Rejoindre boutique
const joinCode = ref('')
const isJoining = ref(false)
const joinError = ref('')

// Créer boutique
const boutiqueName = ref('')
const boutiquePin = ref('')
const isCreating = ref(false)
const createError = ref('')

async function joinBoutique() {
  if (joinCode.value.length !== 6) return

  isJoining.value = true
  joinError.value = ''

  try {
    await $fetch('/api/boutique/' + joinCode.value)
    router.push('/boutique/' + joinCode.value)
  } catch (e: any) {
    if (e.status === 404) {
      joinError.value = 'Boutique non trouvée. Vérifiez le code PIN.'
    } else {
      joinError.value = e.data?.message || 'Erreur lors de la recherche'
    }
  } finally {
    isJoining.value = false
  }
}

async function createBoutique() {
  if (!boutiqueName.value.trim()) return
  if (boutiquePin.value.length !== 6) {
    createError.value = 'Le code PIN doit contenir 6 chiffres'
    return
  }

  isCreating.value = true
  createError.value = ''

  try {
    const boutique = await $fetch('/api/boutique/create', {
      method: 'POST',
      body: {
        name: boutiqueName.value.trim(),
        code: boutiquePin.value
      }
    }) as { code: string }

    router.push('/boutique/' + boutique.code)
  } catch (e: any) {
    createError.value = e.data?.message || 'Erreur lors de la création'
  } finally {
    isCreating.value = false
  }
}
</script>
