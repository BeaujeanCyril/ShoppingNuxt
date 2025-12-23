import { reactive, ref, onMounted, computed } from 'vue'

type Item = {
  id: number
  name: string
  idealQuantity: number
  currentQuantity: number
  magasinId: number
}

interface MagasinState {
  id: number
  name: string
  emoji: string
  items: Item[]
}

export const useMagasinState = (boutiqueCode: string, magasinId: number) => {
  const state = reactive<MagasinState>({
    id: magasinId,
    name: '',
    emoji: '🛒',
    items: []
  })

  const isLoading = ref(true)
  const error = ref<string | null>(null)

  // Liste de courses : items où currentQuantity < idealQuantity
  const shoppingList = computed(() =>
    state.items
      .filter(item => item.currentQuantity < item.idealQuantity)
      .map(item => ({
        ...item,
        toBuy: item.idealQuantity - item.currentQuantity
      }))
  )

  // Tous les items triés par nom
  const inventory = computed(() =>
    [...state.items].sort((a, b) => a.name.localeCompare(b.name))
  )

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<{ magasin: MagasinState, items: Item[] }>(
        `/api/boutique/${boutiqueCode}/magasins/${magasinId}/items`
      )
      if (response) {
        state.id = response.magasin.id
        state.name = response.magasin.name
        state.emoji = response.magasin.emoji
        state.items = response.items || []
      }
    } catch (e: any) {
      console.error('Erreur chargement magasin:', e)
      error.value = e.data?.message || 'Erreur de chargement'
    }
    isLoading.value = false
  }

  async function addItem(name: string, idealQuantity: number = 1) {
    try {
      const newItem = await $fetch<Item>(
        `/api/boutique/${boutiqueCode}/magasins/${magasinId}/items/add`,
        {
          method: 'POST',
          body: { name, idealQuantity }
        }
      )
      state.items.push(newItem)
      return newItem
    } catch (e: any) {
      console.error('Erreur ajout item:', e)
      throw e
    }
  }

  async function updateItem(itemId: number, data: { name?: string, idealQuantity?: number, currentQuantity?: number }) {
    try {
      const updatedItem = await $fetch<Item>(
        `/api/boutique/${boutiqueCode}/magasins/${magasinId}/items/${itemId}`,
        {
          method: 'PUT',
          body: data
        }
      )
      const idx = state.items.findIndex(i => i.id === itemId)
      if (idx !== -1) state.items[idx] = updatedItem
      return updatedItem
    } catch (e: any) {
      console.error('Erreur mise à jour item:', e)
      throw e
    }
  }

  async function deleteItem(itemId: number) {
    try {
      await $fetch(
        `/api/boutique/${boutiqueCode}/magasins/${magasinId}/items/${itemId}`,
        { method: 'DELETE' }
      )
      const idx = state.items.findIndex(i => i.id === itemId)
      if (idx !== -1) state.items.splice(idx, 1)
    } catch (e: any) {
      console.error('Erreur suppression item:', e)
      throw e
    }
  }

  async function consume(itemId: number, quantity: number = 1) {
    try {
      const updatedItem = await $fetch<Item>(
        `/api/boutique/${boutiqueCode}/magasins/${magasinId}/items/${itemId}/consume`,
        {
          method: 'POST',
          body: { quantity }
        }
      )
      const idx = state.items.findIndex(i => i.id === itemId)
      if (idx !== -1) state.items[idx] = updatedItem
      return updatedItem
    } catch (e: any) {
      console.error('Erreur consommation:', e)
      throw e
    }
  }

  async function restock(itemId: number, quantity?: number) {
    try {
      const updatedItem = await $fetch<Item>(
        `/api/boutique/${boutiqueCode}/magasins/${magasinId}/items/${itemId}/restock`,
        {
          method: 'POST',
          body: quantity !== undefined ? { quantity } : {}
        }
      )
      const idx = state.items.findIndex(i => i.id === itemId)
      if (idx !== -1) state.items[idx] = updatedItem
      return updatedItem
    } catch (e: any) {
      console.error('Erreur réapprovisionnement:', e)
      throw e
    }
  }

  // Marquer un article comme acheté (restock au niveau idéal)
  async function markAsPurchased(itemId: number) {
    return restock(itemId)
  }

  onMounted(load)

  return {
    state,
    isLoading,
    error,
    load,
    inventory,
    shoppingList,
    addItem,
    updateItem,
    deleteItem,
    consume,
    restock,
    markAsPurchased
  }
}
