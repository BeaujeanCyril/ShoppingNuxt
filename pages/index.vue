<template>
  <main class="min-h-screen p-4 bg-base-100">
    <header class="text-center mb-6">
      <h1 class="text-3xl font-bold text-primary">Liste de courses</h1>
    </header>

    <div class="max-w-lg mx-auto space-y-4">
      <!-- Ajouter un item -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body p-4">
          <div class="flex gap-2">
            <div class="flex-1 relative">
              <input
                type="text"
                v-model="newItemName"
                @input="searchItems"
                @keydown.down.prevent="navigateSuggestion(1)"
                @keydown.up.prevent="navigateSuggestion(-1)"
                @keydown.enter.prevent="handleEnter"
                @keydown.escape="closeSuggestions"
                @focus="showSuggestions = suggestions.length > 0"
                class="input input-bordered w-full"
                placeholder="Ajouter un article..."
              />
              <!-- Suggestions autocomplete -->
              <ul
                v-if="showSuggestions && suggestions.length > 0"
                class="absolute z-10 w-full bg-base-100 border border-base-300 rounded-lg mt-1 shadow-lg max-h-48 overflow-y-auto"
              >
                <li
                  v-for="(suggestion, index) in suggestions"
                  :key="suggestion.id"
                  @click="selectSuggestion(suggestion)"
                  :class="[
                    'px-4 py-2 cursor-pointer hover:bg-base-200',
                    index === selectedSuggestionIndex ? 'bg-base-200' : ''
                  ]"
                >
                  {{ suggestion.name }}
                </li>
              </ul>
            </div>
            <input
              type="number"
              v-model.number="newItemQuantity"
              min="1"
              class="input input-bordered w-20 text-center"
              placeholder="1"
            />
            <button
              class="btn btn-primary"
              @click="addItem"
              :disabled="!newItemName.trim() || isAdding"
            >
              <span v-if="isAdding" class="loading loading-spinner loading-sm"></span>
              <span v-else>+</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Liste des items -->
      <div class="card bg-base-200 shadow-xl">
        <div class="card-body p-4">
          <div class="flex justify-between items-center mb-2">
            <h2 class="card-title text-lg">
              Articles ({{ uncheckedCount }}/{{ list?.items?.length || 0 }})
            </h2>
            <button
              v-if="checkedCount > 0"
              class="btn btn-ghost btn-sm text-error"
              @click="clearChecked"
            >
              Supprimer coches
            </button>
          </div>

          <div v-if="!list || list.items.length === 0" class="text-center py-8 opacity-50">
            Aucun article dans la liste
          </div>

          <ul v-else class="space-y-2">
            <li
              v-for="entry in list.items"
              :key="entry.id"
              class="flex items-center gap-3 p-2 rounded-lg bg-base-100"
              :class="{ 'opacity-50': entry.checked }"
            >
              <input
                type="checkbox"
                :checked="entry.checked"
                @change="toggleItem(entry.id)"
                class="checkbox checkbox-primary"
              />
              <span class="flex-1" :class="{ 'line-through': entry.checked }">
                {{ entry.item.name }}
              </span>
              <span class="badge badge-ghost">x{{ entry.quantity }}</span>
              <button
                class="btn btn-ghost btn-xs text-error"
                @click="removeItem(entry.id)"
              >
                x
              </button>
            </li>
          </ul>
        </div>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'

interface Item {
  id: number
  name: string
}

interface ShoppingListItem {
  id: number
  quantity: number
  checked: boolean
  item: Item
}

interface ShoppingList {
  id: number
  name: string
  items: ShoppingListItem[]
}

const list = ref<ShoppingList | null>(null)
const newItemName = ref('')
const newItemQuantity = ref(1)
const isAdding = ref(false)

// Autocomplete
const suggestions = ref<Item[]>([])
const showSuggestions = ref(false)
const selectedSuggestionIndex = ref(-1)
let searchTimeout: ReturnType<typeof setTimeout> | null = null

const uncheckedCount = computed(() =>
  list.value?.items.filter(i => !i.checked).length || 0
)

const checkedCount = computed(() =>
  list.value?.items.filter(i => i.checked).length || 0
)

onMounted(async () => {
  await loadList()
})

async function loadList() {
  const lists = await $fetch<ShoppingList[]>('/api/lists')
  if (lists.length > 0) {
    list.value = lists[0]
  } else {
    // Creer une liste par defaut
    list.value = await $fetch<ShoppingList>('/api/lists', { method: 'POST' })
  }
}

async function searchItems() {
  if (searchTimeout) clearTimeout(searchTimeout)

  const query = newItemName.value.trim()
  if (query.length < 1) {
    suggestions.value = []
    showSuggestions.value = false
    return
  }

  searchTimeout = setTimeout(async () => {
    suggestions.value = await $fetch<Item[]>('/api/items', {
      query: { search: query }
    })
    showSuggestions.value = suggestions.value.length > 0
    selectedSuggestionIndex.value = -1
  }, 150)
}

function navigateSuggestion(direction: number) {
  if (!showSuggestions.value || suggestions.value.length === 0) return

  selectedSuggestionIndex.value += direction
  if (selectedSuggestionIndex.value < 0) {
    selectedSuggestionIndex.value = suggestions.value.length - 1
  } else if (selectedSuggestionIndex.value >= suggestions.value.length) {
    selectedSuggestionIndex.value = 0
  }
}

function handleEnter() {
  if (showSuggestions.value && selectedSuggestionIndex.value >= 0) {
    selectSuggestion(suggestions.value[selectedSuggestionIndex.value])
  } else {
    addItem()
  }
}

function selectSuggestion(suggestion: Item) {
  newItemName.value = suggestion.name
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

function closeSuggestions() {
  showSuggestions.value = false
  selectedSuggestionIndex.value = -1
}

async function addItem() {
  if (!newItemName.value.trim() || !list.value) return

  isAdding.value = true
  try {
    await $fetch(`/api/lists/${list.value.id}/add-item`, {
      method: 'POST',
      body: {
        itemName: newItemName.value.trim(),
        quantity: newItemQuantity.value || 1
      }
    })
    newItemName.value = ''
    newItemQuantity.value = 1
    closeSuggestions()
    await loadList()
  } catch (e) {
    console.error(e)
  } finally {
    isAdding.value = false
  }
}

async function toggleItem(itemId: number) {
  if (!list.value) return

  try {
    await $fetch(`/api/lists/${list.value.id}/toggle-item`, {
      method: 'POST',
      body: { itemId }
    })
    await loadList()
  } catch (e) {
    console.error(e)
  }
}

async function removeItem(itemId: number) {
  if (!list.value) return

  try {
    await $fetch(`/api/lists/${list.value.id}/remove-item`, {
      method: 'POST',
      body: { itemId }
    })
    await loadList()
  } catch (e) {
    console.error(e)
  }
}

async function clearChecked() {
  if (!list.value) return

  try {
    await $fetch(`/api/lists/${list.value.id}/clear-checked`, {
      method: 'POST'
    })
    await loadList()
  } catch (e) {
    console.error(e)
  }
}
</script>
