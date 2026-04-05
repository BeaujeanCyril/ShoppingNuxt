<template>
  <main class="min-h-screen p-4 bg-base-100">
    <header class="text-center mb-6">
      <NuxtLink :to="`/boutique/${code}`" class="btn btn-ghost btn-sm mb-2">
        <span class="mr-1">&#8592;</span> Retour
      </NuxtLink>
      <h1 class="text-3xl font-bold text-primary">{{ boutique?.name || 'Chargement...' }}</h1>
      <p class="opacity-70 mt-2">Tous les articles de la famille</p>
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
        <NuxtLink :to="`/boutique/${code}`" class="btn btn-ghost">Retour</NuxtLink>
      </div>
    </div>

    <!-- Content -->
    <div v-else class="max-w-4xl mx-auto">
      <!-- Search & Filter -->
      <div class="flex flex-col sm:flex-row gap-3 mb-4">
        <input
          type="text"
          v-model="search"
          class="input input-bordered flex-1"
          placeholder="Rechercher un article..."
        />
        <select v-model="filterMagasin" class="select select-bordered">
          <option value="">Tous les magasins</option>
          <option v-for="m in boutique?.magasins" :key="m.id" :value="m.id">
            {{ m.emoji }} {{ m.name }}
          </option>
        </select>
        <select v-model="filterStatus" class="select select-bordered">
          <option value="">Tous</option>
          <option value="to-buy">A acheter</option>
          <option value="ok">Stock OK</option>
        </select>
      </div>

      <!-- Stats -->
      <div class="stats stats-horizontal shadow mb-4 w-full">
        <div class="stat">
          <div class="stat-title">Total articles</div>
          <div class="stat-value text-lg">{{ allItems.length }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">A acheter</div>
          <div class="stat-value text-lg text-warning">{{ itemsToBuy }}</div>
        </div>
        <div class="stat">
          <div class="stat-title">Stock OK</div>
          <div class="stat-value text-lg text-success">{{ allItems.length - itemsToBuy }}</div>
        </div>
      </div>

      <!-- Table -->
      <div v-if="filteredItems.length" class="overflow-x-auto">
        <table class="table table-zebra w-full">
          <thead>
            <tr>
              <th class="cursor-pointer" @click="toggleSort('name')">
                Article
                <span v-if="sortBy === 'name'">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="cursor-pointer text-center" @click="toggleSort('currentQuantity')">
                Qté actuelle
                <span v-if="sortBy === 'currentQuantity'">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="cursor-pointer text-center" @click="toggleSort('idealQuantity')">
                Qté idéale
                <span v-if="sortBy === 'idealQuantity'">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th class="cursor-pointer" @click="toggleSort('magasin')">
                Magasin
                <span v-if="sortBy === 'magasin'">{{ sortDir === 'asc' ? '▲' : '▼' }}</span>
              </th>
              <th>Statut</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in filteredItems" :key="item.id">
              <td class="font-medium">{{ item.name }}</td>
              <td class="text-center">
                <span :class="item.currentQuantity < item.idealQuantity ? 'text-warning font-bold' : ''">
                  {{ item.currentQuantity }}
                </span>
              </td>
              <td class="text-center">{{ item.idealQuantity }}</td>
              <td>
                <NuxtLink
                  :to="`/boutique/${code}/magasin/${item.magasinId}`"
                  class="link link-hover"
                >
                  {{ item.magasinEmoji }} {{ item.magasinName }}
                </NuxtLink>
              </td>
              <td>
                <span
                  v-if="item.currentQuantity < item.idealQuantity"
                  class="badge badge-warning badge-sm"
                >
                  A acheter ({{ item.idealQuantity - item.currentQuantity }})
                </span>
                <span v-else class="badge badge-success badge-sm">OK</span>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty -->
      <div v-else class="text-center py-12 opacity-70">
        <p class="text-6xl mb-4">📦</p>
        <p v-if="allItems.length === 0">Aucun article enregistré</p>
        <p v-else>Aucun article ne correspond aux filtres</p>
      </div>
    </div>
  </main>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'

interface FlatItem {
  id: number
  name: string
  idealQuantity: number
  currentQuantity: number
  magasinId: number
  magasinName: string
  magasinEmoji: string
}

interface Magasin {
  id: number
  name: string
  emoji: string
  items: { id: number; name: string; idealQuantity: number; currentQuantity: number }[]
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
const search = ref('')
const filterMagasin = ref<number | ''>('')
const filterStatus = ref<'' | 'to-buy' | 'ok'>('')
const sortBy = ref<'name' | 'currentQuantity' | 'idealQuantity' | 'magasin'>('name')
const sortDir = ref<'asc' | 'desc'>('asc')

// Flatten all items across all magasins
const allItems = computed<FlatItem[]>(() => {
  if (!boutique.value?.magasins) return []
  return boutique.value.magasins.flatMap(m =>
    m.items.map(item => ({
      ...item,
      magasinId: m.id,
      magasinName: m.name,
      magasinEmoji: m.emoji
    }))
  )
})

const itemsToBuy = computed(() =>
  allItems.value.filter(i => i.currentQuantity < i.idealQuantity).length
)

const filteredItems = computed(() => {
  let items = allItems.value

  // Search
  if (search.value.trim()) {
    const q = search.value.toLowerCase()
    items = items.filter(i => i.name.toLowerCase().includes(q))
  }

  // Filter by magasin
  if (filterMagasin.value !== '') {
    items = items.filter(i => i.magasinId === filterMagasin.value)
  }

  // Filter by status
  if (filterStatus.value === 'to-buy') {
    items = items.filter(i => i.currentQuantity < i.idealQuantity)
  } else if (filterStatus.value === 'ok') {
    items = items.filter(i => i.currentQuantity >= i.idealQuantity)
  }

  // Sort
  items = [...items].sort((a, b) => {
    let cmp = 0
    if (sortBy.value === 'name') {
      cmp = a.name.localeCompare(b.name)
    } else if (sortBy.value === 'currentQuantity') {
      cmp = a.currentQuantity - b.currentQuantity
    } else if (sortBy.value === 'idealQuantity') {
      cmp = a.idealQuantity - b.idealQuantity
    } else if (sortBy.value === 'magasin') {
      cmp = a.magasinName.localeCompare(b.magasinName)
    }
    return sortDir.value === 'asc' ? cmp : -cmp
  })

  return items
})

function toggleSort(col: typeof sortBy.value) {
  if (sortBy.value === col) {
    sortDir.value = sortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    sortBy.value = col
    sortDir.value = 'asc'
  }
}

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

onMounted(() => {
  loadBoutique()
})
</script>
