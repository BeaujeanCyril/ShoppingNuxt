<template>
  <main class="min-h-screen p-4 bg-base-100">
    <header class="text-center mb-6">
      <a href="https://cyriongames.fr" class="btn btn-ghost btn-sm mb-2">
        <span class="mr-1">&#8592;</span> Portail
      </a>
      <h1 class="text-3xl font-bold text-primary">{{ boutique?.name || 'Chargement...' }}</h1>
      <p class="opacity-70 mt-2">Gérez vos magasins et votre inventaire</p>
    </header>

    <!-- Loading -->
    <div v-if="loading" class="flex justify-center py-12">
      <span class="loading loading-spinner loading-lg text-primary"></span>
    </div>

    <!-- Error -->
    <div v-else-if="error" class="max-w-md mx-auto">
      <div class="alert alert-error">
        {{ error }}
      </div>
      <div class="text-center mt-4">
        <NuxtLink to="/" class="btn btn-ghost">Retour à l'accueil</NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="max-w-4xl mx-auto">
      <!-- Liste des magasins -->
      <section class="mb-6">
        <div class="flex justify-between items-center mb-4">
          <h2 class="text-xl font-semibold">Mes magasins</h2>
          <div class="flex gap-2 flex-wrap">
            <NuxtLink :to="`/boutique/${code}/articles`" class="btn btn-outline btn-sm">
              Tous les articles
            </NuxtLink>
            <button class="btn btn-secondary btn-sm" @click="openShoppingListModal" :disabled="!boutique?.magasins?.length">
              🛒 Créer une liste de course
            </button>
            <button class="btn btn-primary btn-sm" @click="showAddModal = true">
              + Ajouter
            </button>
          </div>
        </div>

        <!-- Grille des magasins -->
        <div v-if="boutique?.magasins?.length" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <NuxtLink
            v-for="magasin in boutique.magasins"
            :key="magasin.id"
            :to="`/boutique/${code}/magasin/${magasin.id}`"
            class="card bg-base-200 shadow-xl hover:shadow-2xl transition-shadow cursor-pointer"
          >
            <div class="card-body">
              <div class="flex items-center gap-3">
                <span class="text-4xl">{{ magasin.emoji }}</span>
                <div class="flex-1">
                  <h3 class="card-title text-lg">{{ magasin.name }}</h3>
                  <div v-if="magasin.shoppingCount && magasin.shoppingCount > 0" class="badge badge-warning badge-sm mt-1">
                    {{ magasin.shoppingCount }} article{{ magasin.shoppingCount > 1 ? 's' : '' }} à acheter
                  </div>
                  <div v-else class="badge badge-success badge-sm mt-1">
                    Stock OK
                  </div>
                </div>
              </div>
            </div>
          </NuxtLink>
        </div>

        <!-- Aucun magasin -->
        <div v-else class="text-center py-12 opacity-70">
          <p class="text-6xl mb-4">🏪</p>
          <p>Aucun magasin pour l'instant</p>
          <p class="text-sm">Ajoutez votre premier magasin pour commencer</p>
        </div>
      </section>

      <!-- Résumé courses global -->
      <section v-if="totalShoppingItems > 0" class="card bg-warning/20 shadow-xl">
        <div class="card-body">
          <h3 class="card-title">
            <span class="text-2xl">🛒</span>
            Liste de courses globale
          </h3>
          <p>
            Vous avez <span class="font-bold">{{ totalShoppingItems }}</span> article{{ totalShoppingItems > 1 ? 's' : '' }} à acheter
            dans <span class="font-bold">{{ magasinsWithShopping }}</span> magasin{{ magasinsWithShopping > 1 ? 's' : '' }}.
          </p>
        </div>
      </section>
    </div>

    <!-- Modal ajouter magasin -->
    <dialog :class="['modal', { 'modal-open': showAddModal }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">Ajouter un magasin</h3>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nom du magasin</span>
          </label>
          <input
            type="text"
            v-model="newMagasin.name"
            class="input input-bordered"
            placeholder="Ex: Carrefour, Lidl, Pharmacie..."
          />
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Emoji</span>
          </label>
          <div class="flex flex-wrap gap-2">
            <button
              v-for="emoji in emojiOptions"
              :key="emoji"
              type="button"
              class="btn btn-circle btn-sm text-xl"
              :class="{ 'btn-primary': newMagasin.emoji === emoji }"
              @click="newMagasin.emoji = emoji"
            >
              {{ emoji }}
            </button>
          </div>
        </div>

        <div v-if="addError" class="alert alert-error mb-4">
          {{ addError }}
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeAddModal">Annuler</button>
          <button
            class="btn btn-primary"
            @click="addMagasin"
            :disabled="isAdding || !newMagasin.name.trim()"
          >
            <span v-if="isAdding" class="loading loading-spinner loading-sm"></span>
            Ajouter
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeAddModal">close</button>
      </form>
    </dialog>

    <!-- Modal liste de course -->
    <dialog :class="['modal', { 'modal-open': showShoppingModal }]">
      <div class="modal-box max-w-lg">
        <h3 class="font-bold text-lg mb-4">🛒 Créer une liste de course</h3>

        <div class="form-control mb-3">
          <label class="label py-1"><span class="label-text">Article</span></label>
          <input
            ref="shoppingNameInput"
            type="text"
            v-model="shoppingForm.name"
            class="input input-bordered"
            placeholder="Ex: Lait, Pain..."
            list="shopping-suggestions"
            @input="onShoppingNameInput"
            @keyup.enter="addToShoppingList"
          />
          <datalist id="shopping-suggestions">
            <option v-for="s in shoppingSuggestions" :key="s.name" :value="s.name" />
          </datalist>
        </div>

        <div class="grid grid-cols-2 gap-3 mb-3">
          <div class="form-control">
            <label class="label py-1"><span class="label-text">Quantité</span></label>
            <input
              type="number"
              v-model.number="shoppingForm.quantity"
              class="input input-bordered"
              min="1"
            />
          </div>
          <div class="form-control">
            <label class="label py-1"><span class="label-text">Magasin</span></label>
            <select v-model.number="shoppingForm.magasinId" class="select select-bordered">
              <option v-for="m in boutique?.magasins" :key="m.id" :value="m.id">
                {{ m.emoji }} {{ m.name }}
              </option>
            </select>
          </div>
        </div>

        <div v-if="shoppingError" class="alert alert-error mb-3 py-2">{{ shoppingError }}</div>

        <button
          class="btn btn-primary w-full"
          @click="addToShoppingList"
          :disabled="isShoppingAdding || !shoppingForm.name.trim() || !shoppingForm.magasinId || !shoppingForm.quantity"
        >
          <span v-if="isShoppingAdding" class="loading loading-spinner loading-sm"></span>
          Ajouter à la liste
        </button>

        <div v-if="shoppingAdded.length" class="mt-4">
          <div class="text-sm font-semibold mb-2">Ajoutés à la liste ({{ shoppingAdded.length }})</div>
          <ul class="text-sm space-y-2 max-h-60 overflow-y-auto">
            <li
              v-for="(entry, i) in shoppingAdded"
              :key="entry.itemId + '-' + i"
              class="border border-base-300 rounded p-2"
            >
              <template v-if="editingShoppingIndex !== i">
                <div class="flex items-center justify-between gap-2">
                  <span>
                    <span class="badge badge-sm mr-1" :class="entry.created ? 'badge-success' : 'badge-info'">
                      {{ entry.created ? 'nouveau' : 'liste' }}
                    </span>
                    <span class="font-medium">{{ entry.name }}</span>
                    <span class="opacity-70"> × {{ entry.quantity }}</span>
                  </span>
                  <span class="opacity-60 text-xs">{{ magasinLabel(entry.magasinId) }}</span>
                </div>
                <div class="flex gap-1 mt-1 justify-end">
                  <button class="btn btn-xs btn-ghost" @click="startEditShoppingEntry(i)">Modifier</button>
                  <button class="btn btn-xs btn-error btn-outline" @click="deleteShoppingEntry(i)">Retirer</button>
                </div>
              </template>
              <template v-else>
                <div class="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  <input
                    type="text"
                    v-model="editShoppingForm.name"
                    class="input input-bordered input-sm sm:col-span-2"
                    placeholder="Nom"
                  />
                  <input
                    type="number"
                    v-model.number="editShoppingForm.quantity"
                    class="input input-bordered input-sm"
                    min="1"
                  />
                  <select v-model.number="editShoppingForm.magasinId" class="select select-bordered select-sm">
                    <option v-for="m in boutique?.magasins" :key="m.id" :value="m.id">
                      {{ m.emoji }} {{ m.name }}
                    </option>
                  </select>
                </div>
                <div class="flex gap-1 mt-2 justify-end">
                  <button class="btn btn-xs btn-ghost" @click="cancelEditShoppingEntry">Annuler</button>
                  <button
                    class="btn btn-xs btn-primary"
                    @click="saveEditShoppingEntry"
                    :disabled="isEditingShopping || !editShoppingForm.name.trim() || !editShoppingForm.magasinId || !editShoppingForm.quantity"
                  >
                    <span v-if="isEditingShopping" class="loading loading-spinner loading-xs"></span>
                    Enregistrer
                  </button>
                </div>
              </template>
            </li>
          </ul>
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeShoppingListModal">Terminer</button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeShoppingListModal">close</button>
      </form>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface Magasin {
  id: number
  name: string
  emoji: string
  shoppingCount?: number
}

interface Boutique {
  id: number
  name: string
  code: string
  magasins: Magasin[]
}

const route = useRoute()
const code = route.params.code as string

const boutique = ref<Boutique | null>(null)
const loading = ref(true)
const error = ref('')

// Modal ajouter magasin
const showAddModal = ref(false)
const newMagasin = ref({ name: '', emoji: '🛒' })
const isAdding = ref(false)
const addError = ref('')

const emojiOptions = ['🛒', '🏪', '🥖', '💊', '🥩', '🧀', '🍷', '🌿', '🔧', '👕', '📚', '🎮']

// Modal liste de course
const showShoppingModal = ref(false)
const shoppingForm = ref({ name: '', quantity: 1, magasinId: 0 })
const shoppingSuggestions = ref<{ name: string; magasinId: number }[]>([])
interface ShoppingEntry {
  itemId: number
  magasinId: number
  name: string
  quantity: number
  created: boolean
}
const shoppingAdded = ref<ShoppingEntry[]>([])
const editingShoppingIndex = ref<number | null>(null)
const editShoppingForm = ref<{ name: string; quantity: number; magasinId: number }>({ name: '', quantity: 1, magasinId: 0 })
const isEditingShopping = ref(false)
const shoppingError = ref('')
const isShoppingAdding = ref(false)
const shoppingNameInput = ref<HTMLInputElement | null>(null)
let suggestionsTimer: ReturnType<typeof setTimeout> | null = null

// Computed
const totalShoppingItems = computed(() => {
  if (!boutique.value?.magasins) return 0
  return boutique.value.magasins.reduce((sum, m) => sum + (m.shoppingCount || 0), 0)
})

const magasinsWithShopping = computed(() => {
  if (!boutique.value?.magasins) return 0
  return boutique.value.magasins.filter(m => (m.shoppingCount || 0) > 0).length
})

// Methods
async function loadBoutique() {
  loading.value = true
  error.value = ''

  try {
    boutique.value = await $fetch(`/api/boutique/${code}`)
  } catch (e: any) {
    if (e.status === 404) {
      error.value = 'Boutique non trouvée. Vérifiez le code PIN.'
    } else {
      error.value = e.data?.message || 'Erreur lors du chargement'
    }
  } finally {
    loading.value = false
  }
}

async function addMagasin() {
  if (!newMagasin.value.name.trim()) return

  isAdding.value = true
  addError.value = ''

  try {
    await $fetch(`/api/boutique/${code}/magasins/add`, {
      method: 'POST',
      body: {
        name: newMagasin.value.name.trim(),
        emoji: newMagasin.value.emoji
      }
    })

    closeAddModal()
    await loadBoutique()
  } catch (e: any) {
    addError.value = e.data?.message || 'Erreur lors de l\'ajout'
  } finally {
    isAdding.value = false
  }
}

function closeAddModal() {
  showAddModal.value = false
  newMagasin.value = { name: '', emoji: '🛒' }
  addError.value = ''
}

function openShoppingListModal() {
  if (!boutique.value?.magasins?.length) return
  shoppingForm.value = {
    name: '',
    quantity: 1,
    magasinId: boutique.value.magasins[0].id
  }
  shoppingAdded.value = []
  shoppingSuggestions.value = []
  shoppingError.value = ''
  showShoppingModal.value = true
}

function closeShoppingListModal() {
  showShoppingModal.value = false
  if (shoppingAdded.value.length > 0) {
    loadBoutique()
  }
}

type ItemSuggestion = { name: string; magasinId: number }

function onShoppingNameInput() {
  // Si la valeur saisie correspond exactement à une suggestion connue,
  // pré-sélectionne automatiquement son magasin.
  const current = shoppingForm.value.name.trim().toLowerCase()
  const match = shoppingSuggestions.value.find((s: ItemSuggestion) => s.name.toLowerCase() === current)
  if (match) {
    shoppingForm.value.magasinId = match.magasinId
  }

  if (suggestionsTimer) clearTimeout(suggestionsTimer)
  const term = shoppingForm.value.name.trim()
  if (term.length < 2) {
    shoppingSuggestions.value = []
    return
  }
  suggestionsTimer = setTimeout(async () => {
    try {
      shoppingSuggestions.value = await $fetch(
        `/api/boutique/${code}/items?search=${encodeURIComponent(term)}`
      ) as ItemSuggestion[]
      // Re-vérifie après réception (cas où l'utilisateur a fini de taper avant la réponse)
      const cur = shoppingForm.value.name.trim().toLowerCase()
      const m = shoppingSuggestions.value.find((s: ItemSuggestion) => s.name.toLowerCase() === cur)
      if (m) shoppingForm.value.magasinId = m.magasinId
    } catch {
      shoppingSuggestions.value = []
    }
  }, 200)
}

function magasinLabel(magasinId: number): string {
  const m = boutique.value?.magasins.find((x: Magasin) => x.id === magasinId)
  return m ? `${m.emoji} ${m.name}` : ''
}

function startEditShoppingEntry(index: number) {
  const entry = shoppingAdded.value[index]
  if (!entry) return
  editShoppingForm.value = {
    name: entry.name,
    quantity: entry.quantity,
    magasinId: entry.magasinId
  }
  editingShoppingIndex.value = index
}

function cancelEditShoppingEntry() {
  editingShoppingIndex.value = null
}

async function saveEditShoppingEntry() {
  if (editingShoppingIndex.value == null) return
  const idx = editingShoppingIndex.value
  const entry = shoppingAdded.value[idx]
  if (!entry) return

  const newName = editShoppingForm.value.name.trim()
  const newQuantity = editShoppingForm.value.quantity
  const newMagasinId = editShoppingForm.value.magasinId
  if (!newName || !newQuantity || newQuantity < 1 || !newMagasinId) return

  isEditingShopping.value = true
  try {
    // Revert l'action initiale
    await $fetch(`/api/boutique/${code}/shopping-list/revert`, {
      method: 'POST',
      body: { itemId: entry.itemId, quantity: entry.quantity, created: entry.created }
    })
    // Re-applique avec les nouvelles valeurs
    const res = await $fetch(`/api/boutique/${code}/shopping-list/add`, {
      method: 'POST',
      body: { magasinId: newMagasinId, name: newName, quantity: newQuantity }
    }) as { item: { id: number; name: string; magasinId: number }; created: boolean }

    shoppingAdded.value[idx] = {
      itemId: res.item.id,
      magasinId: res.item.magasinId,
      name: res.item.name,
      quantity: newQuantity,
      created: res.created
    }
    editingShoppingIndex.value = null
  } catch (e: any) {
    shoppingError.value = e.data?.message || 'Erreur lors de la modification'
  } finally {
    isEditingShopping.value = false
  }
}

async function deleteShoppingEntry(index: number) {
  const entry = shoppingAdded.value[index]
  if (!entry) return
  if (!confirm(`Retirer "${entry.name}" × ${entry.quantity} de la liste ?`)) return

  try {
    await $fetch(`/api/boutique/${code}/shopping-list/revert`, {
      method: 'POST',
      body: { itemId: entry.itemId, quantity: entry.quantity, created: entry.created }
    })
    shoppingAdded.value.splice(index, 1)
    if (editingShoppingIndex.value === index) editingShoppingIndex.value = null
  } catch (e: any) {
    shoppingError.value = e.data?.message || 'Erreur lors de la suppression'
  }
}

async function addToShoppingList() {
  const name = shoppingForm.value.name.trim()
  if (!name || !shoppingForm.value.magasinId || !shoppingForm.value.quantity) return

  isShoppingAdding.value = true
  shoppingError.value = ''

  try {
    const res = await $fetch(
      `/api/boutique/${code}/shopping-list/add`,
      {
        method: 'POST',
        body: {
          magasinId: shoppingForm.value.magasinId,
          name,
          quantity: shoppingForm.value.quantity
        }
      }
    ) as { item: { id: number; name: string; magasinId: number }; created: boolean }
    shoppingAdded.value.unshift({
      itemId: res.item.id,
      magasinId: res.item.magasinId,
      name: res.item.name,
      quantity: shoppingForm.value.quantity,
      created: res.created
    })
    shoppingForm.value.name = ''
    shoppingForm.value.quantity = 1
    shoppingSuggestions.value = []
    shoppingNameInput.value?.focus()
  } catch (e: any) {
    shoppingError.value = e.data?.message || 'Erreur lors de l\'ajout'
  } finally {
    isShoppingAdding.value = false
  }
}

onMounted(() => {
  loadBoutique()
})
</script>
