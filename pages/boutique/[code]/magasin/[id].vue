<template>
  <main class="min-h-screen p-4 bg-base-100">
    <header class="mb-6">
      <NuxtLink :to="`/boutique/${code}`" class="btn btn-ghost btn-sm mb-2">
        <span class="mr-1">&#8592;</span> Retour à la boutique
      </NuxtLink>
      <div class="text-center">
        <h1 class="text-3xl font-bold text-primary">
          <span class="mr-2">{{ magasin?.emoji }}</span>{{ magasin?.name || 'Chargement...' }}
        </h1>
      </div>
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
    </div>

    <!-- Content -->
    <div v-else class="max-w-2xl mx-auto">
      <!-- Tabs -->
      <div class="tabs tabs-boxed mb-6 justify-center">
        <button
          class="tab tab-lg"
          :class="{ 'tab-active': activeTab === 'inventory' }"
          @click="activeTab = 'inventory'"
        >
          📦 Inventaire
          <span class="badge badge-sm ml-2">{{ items.length }}</span>
        </button>
        <button
          class="tab tab-lg"
          :class="{ 'tab-active': activeTab === 'shopping' }"
          @click="activeTab = 'shopping'"
        >
          🛒 Courses
          <span v-if="shoppingList.length" class="badge badge-warning badge-sm ml-2">{{ shoppingList.length }}</span>
        </button>
      </div>

      <!-- Tab Inventaire -->
      <div v-if="activeTab === 'inventory'">
        <!-- Bouton ajouter -->
        <div class="flex justify-end mb-4">
          <button class="btn btn-primary btn-sm" @click="showAddModal = true">
            + Ajouter un article
          </button>
        </div>

        <!-- Liste des items -->
        <div v-if="items.length" class="space-y-2">
          <div
            v-for="item in items"
            :key="item.id"
            class="card bg-base-200 shadow"
          >
            <div class="card-body py-3 px-4">
              <div class="flex items-center gap-4">
                <!-- Nom et quantités -->
                <div class="flex-1">
                  <h3 class="font-semibold">{{ item.name }}</h3>
                  <p class="text-sm opacity-70">
                    Idéal: {{ item.idealQuantity }}
                  </p>
                </div>

                <!-- Quantité actuelle avec contrôles -->
                <div class="flex items-center gap-2">
                  <button
                    class="btn btn-circle btn-sm btn-error"
                    @click="consumeItem(item)"
                    :disabled="item.currentQuantity <= 0"
                    title="Consommer"
                  >
                    -
                  </button>
                  <span
                    class="text-xl font-bold min-w-[3rem] text-center"
                    :class="{
                      'text-success': item.currentQuantity >= item.idealQuantity,
                      'text-warning': item.currentQuantity > 0 && item.currentQuantity < item.idealQuantity,
                      'text-error': item.currentQuantity === 0
                    }"
                  >
                    {{ item.currentQuantity }}
                  </span>
                  <button
                    class="btn btn-circle btn-sm btn-success"
                    @click="restockItem(item)"
                    title="Réapprovisionner"
                  >
                    +
                  </button>
                </div>

                <!-- Actions -->
                <div class="dropdown dropdown-end">
                  <label tabindex="0" class="btn btn-ghost btn-sm btn-circle">
                    ⋮
                  </label>
                  <ul tabindex="0" class="dropdown-content z-[1] menu p-2 shadow bg-base-100 rounded-box w-40">
                    <li><button @click="openEditModal(item)">Modifier</button></li>
                    <li><button @click="restockFull(item)">Remettre à {{ item.idealQuantity }}</button></li>
                    <li><button class="text-error" @click="deleteItem(item)">Supprimer</button></li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Aucun item -->
        <div v-else class="text-center py-12 opacity-70">
          <p class="text-6xl mb-4">📦</p>
          <p>Aucun article dans l'inventaire</p>
          <p class="text-sm">Ajoutez vos premiers articles</p>
        </div>
      </div>

      <!-- Tab Courses -->
      <div v-if="activeTab === 'shopping'">
        <div v-if="shoppingList.length" class="space-y-2">
          <div
            v-for="item in shoppingList"
            :key="item.id"
            class="card bg-warning/20 shadow"
          >
            <div class="card-body py-3 px-4">
              <div class="flex items-center gap-4">
                <!-- Checkbox pour marquer comme acheté -->
                <input
                  type="checkbox"
                  class="checkbox checkbox-success"
                  @change="restockFull(item)"
                  title="Marquer comme acheté"
                />

                <!-- Nom et quantité manquante -->
                <div class="flex-1">
                  <h3 class="font-semibold">{{ item.name }}</h3>
                  <p class="text-sm">
                    <span class="text-error font-bold">{{ item.currentQuantity }}</span>
                    / {{ item.idealQuantity }}
                    <span class="opacity-70">
                      (manque {{ item.idealQuantity - item.currentQuantity }})
                    </span>
                  </p>
                </div>

                <!-- Badge quantité -->
                <span class="badge badge-warning badge-lg">
                  {{ item.idealQuantity - item.currentQuantity }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Liste vide -->
        <div v-else class="text-center py-12">
          <p class="text-6xl mb-4">✅</p>
          <p class="text-success font-semibold">Tout est en stock !</p>
          <p class="text-sm opacity-70">Aucun article à acheter pour ce magasin</p>
        </div>
      </div>
    </div>

    <!-- Modal ajouter/modifier article -->
    <dialog :class="['modal', { 'modal-open': showAddModal || showEditModal }]">
      <div class="modal-box">
        <h3 class="font-bold text-lg mb-4">
          {{ showEditModal ? 'Modifier l\'article' : 'Ajouter un article' }}
        </h3>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Nom de l'article</span>
          </label>
          <input
            type="text"
            v-model="itemForm.name"
            class="input input-bordered"
            placeholder="Ex: Lait, Pain, Shampooing..."
          />
        </div>

        <div class="form-control mb-4">
          <label class="label">
            <span class="label-text">Quantité idéale</span>
          </label>
          <input
            type="number"
            v-model.number="itemForm.idealQuantity"
            class="input input-bordered"
            min="1"
            placeholder="1"
          />
          <label class="label">
            <span class="label-text-alt opacity-70">La quantité que vous souhaitez toujours avoir</span>
          </label>
        </div>

        <div v-if="showEditModal" class="form-control mb-4">
          <label class="label">
            <span class="label-text">Quantité actuelle</span>
          </label>
          <input
            type="number"
            v-model.number="itemForm.currentQuantity"
            class="input input-bordered"
            min="0"
            placeholder="0"
          />
        </div>

        <div v-if="formError" class="alert alert-error mb-4">
          {{ formError }}
        </div>

        <div class="modal-action">
          <button class="btn btn-ghost" @click="closeModal">Annuler</button>
          <button
            class="btn btn-primary"
            @click="showEditModal ? updateItem() : addItem()"
            :disabled="isSaving || !itemForm.name.trim()"
          >
            <span v-if="isSaving" class="loading loading-spinner loading-sm"></span>
            {{ showEditModal ? 'Enregistrer' : 'Ajouter' }}
          </button>
        </div>
      </div>
      <form method="dialog" class="modal-backdrop">
        <button @click="closeModal">close</button>
      </form>
    </dialog>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface Item {
  id: number
  name: string
  idealQuantity: number
  currentQuantity: number
}

interface Magasin {
  id: number
  name: string
  emoji: string
}

const route = useRoute()
const code = route.params.code as string
const magasinId = parseInt(route.params.id as string)

const magasin = ref<Magasin | null>(null)
const items = ref<Item[]>([])
const loading = ref(true)
const error = ref('')
const activeTab = ref<'inventory' | 'shopping'>('inventory')

// Modal
const showAddModal = ref(false)
const showEditModal = ref(false)
const editingItem = ref<Item | null>(null)
const itemForm = ref({ name: '', idealQuantity: 1, currentQuantity: 0 })
const isSaving = ref(false)
const formError = ref('')

// Computed
const shoppingList = computed(() => {
  return items.value.filter(item => item.currentQuantity < item.idealQuantity)
})

// Methods
async function loadMagasin() {
  loading.value = true
  error.value = ''

  try {
    // Charger les infos de la boutique pour avoir le nom du magasin
    const boutique = await $fetch(`/api/boutique/${code}`)
    magasin.value = boutique.magasins?.find((m: Magasin) => m.id === magasinId) || null

    if (!magasin.value) {
      error.value = 'Magasin non trouvé'
      return
    }

    // Charger les items
    items.value = await $fetch(`/api/boutique/${code}/magasins/${magasinId}/items`)
  } catch (e: any) {
    error.value = e.data?.message || 'Erreur lors du chargement'
  } finally {
    loading.value = false
  }
}

async function addItem() {
  if (!itemForm.value.name.trim()) return

  isSaving.value = true
  formError.value = ''

  try {
    const newItem = await $fetch(`/api/boutique/${code}/magasins/${magasinId}/items/add`, {
      method: 'POST',
      body: {
        name: itemForm.value.name.trim(),
        idealQuantity: itemForm.value.idealQuantity || 1
      }
    })

    items.value.push(newItem as Item)
    closeModal()
  } catch (e: any) {
    formError.value = e.data?.message || 'Erreur lors de l\'ajout'
  } finally {
    isSaving.value = false
  }
}

async function updateItem() {
  if (!editingItem.value || !itemForm.value.name.trim()) return

  isSaving.value = true
  formError.value = ''

  try {
    const updated = await $fetch(`/api/boutique/${code}/magasins/${magasinId}/items/${editingItem.value.id}`, {
      method: 'PUT',
      body: {
        name: itemForm.value.name.trim(),
        idealQuantity: itemForm.value.idealQuantity || 1,
        currentQuantity: itemForm.value.currentQuantity || 0
      }
    })

    const index = items.value.findIndex(i => i.id === editingItem.value!.id)
    if (index !== -1) {
      items.value[index] = updated as Item
    }
    closeModal()
  } catch (e: any) {
    formError.value = e.data?.message || 'Erreur lors de la modification'
  } finally {
    isSaving.value = false
  }
}

async function consumeItem(item: Item) {
  try {
    const updated = await $fetch(`/api/boutique/${code}/magasins/${magasinId}/items/${item.id}/consume`, {
      method: 'POST'
    })

    const index = items.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      items.value[index] = updated as Item
    }
  } catch (e: any) {
    console.error('Erreur consommation:', e)
  }
}

async function restockItem(item: Item) {
  try {
    const updated = await $fetch(`/api/boutique/${code}/magasins/${magasinId}/items/${item.id}/restock`, {
      method: 'POST',
      body: { quantity: item.currentQuantity + 1 }
    })

    const index = items.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      items.value[index] = updated as Item
    }
  } catch (e: any) {
    console.error('Erreur restock:', e)
  }
}

async function restockFull(item: Item) {
  try {
    const updated = await $fetch(`/api/boutique/${code}/magasins/${magasinId}/items/${item.id}/restock`, {
      method: 'POST'
    })

    const index = items.value.findIndex(i => i.id === item.id)
    if (index !== -1) {
      items.value[index] = updated as Item
    }
  } catch (e: any) {
    console.error('Erreur restock:', e)
  }
}

async function deleteItem(item: Item) {
  if (!confirm(`Supprimer "${item.name}" ?`)) return

  try {
    await $fetch(`/api/boutique/${code}/magasins/${magasinId}/items/${item.id}`, {
      method: 'DELETE'
    })

    items.value = items.value.filter(i => i.id !== item.id)
  } catch (e: any) {
    console.error('Erreur suppression:', e)
  }
}

function openEditModal(item: Item) {
  editingItem.value = item
  itemForm.value = {
    name: item.name,
    idealQuantity: item.idealQuantity,
    currentQuantity: item.currentQuantity
  }
  showEditModal.value = true
}

function closeModal() {
  showAddModal.value = false
  showEditModal.value = false
  editingItem.value = null
  itemForm.value = { name: '', idealQuantity: 1, currentQuantity: 0 }
  formError.value = ''
}

onMounted(() => {
  loadMagasin()
})
</script>
