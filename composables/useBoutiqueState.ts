import { reactive, ref, onMounted, computed } from 'vue'

type Item = {
  id: number
  name: string
  idealQuantity: number
  currentQuantity: number
  magasinId: number
}

type Magasin = {
  id: number
  name: string
  emoji: string
  position: number
  items: Item[]
  itemsCount: number
  shoppingCount: number
}

interface BoutiqueState {
  id: number
  name: string
  code: string
  magasins: Magasin[]
}

export const useBoutiqueState = (boutiqueCode: string) => {
  const state = reactive<BoutiqueState>({
    id: 0,
    name: '',
    code: boutiqueCode,
    magasins: []
  })

  const isLoading = ref(true)
  const error = ref<string | null>(null)

  async function load() {
    isLoading.value = true
    error.value = null
    try {
      const response = await $fetch<BoutiqueState>(`/api/boutique/${boutiqueCode}`)
      if (response) {
        state.id = response.id
        state.name = response.name
        state.code = response.code
        state.magasins = response.magasins || []
      }
    } catch (e: any) {
      console.error('Erreur chargement boutique:', e)
      error.value = e.data?.message || 'Erreur de chargement'
    }
    isLoading.value = false
  }

  async function addMagasin(name: string, emoji: string) {
    try {
      const newMagasin = await $fetch<Magasin>(`/api/boutique/${boutiqueCode}/magasins/add`, {
        method: 'POST',
        body: { name, emoji }
      })
      state.magasins.push(newMagasin)
      return newMagasin
    } catch (e: any) {
      console.error('Erreur ajout magasin:', e)
      throw e
    }
  }

  async function removeMagasin(magasinId: number) {
    try {
      await $fetch(`/api/boutique/${boutiqueCode}/magasins/${magasinId}`, {
        method: 'DELETE'
      })
      const idx = state.magasins.findIndex(m => m.id === magasinId)
      if (idx !== -1) state.magasins.splice(idx, 1)
    } catch (e: any) {
      console.error('Erreur suppression magasin:', e)
      throw e
    }
  }

  // Total des articles à acheter dans tous les magasins
  const totalShoppingCount = computed(() =>
    state.magasins.reduce((sum, m) => sum + (m.shoppingCount || 0), 0)
  )

  onMounted(load)

  return {
    state,
    isLoading,
    error,
    load,
    addMagasin,
    removeMagasin,
    totalShoppingCount
  }
}
