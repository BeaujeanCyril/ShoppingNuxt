<template>
  <main class="min-h-screen p-4 bg-base-100">
    <header class="mb-6 max-w-4xl mx-auto">
      <a href="https://cyriongames.fr" class="btn btn-ghost btn-sm">
        <span class="mr-1">&#8592;</span> Portail
      </a>
      <h1 class="text-3xl font-bold text-primary text-center mt-3">{{ boutique?.name || 'Chargement...' }}</h1>
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

      <!-- Recherche d'articles -->
      <section v-if="boutique?.magasins?.length" class="mb-6">
        <div class="relative">
          <span class="absolute left-3 top-1/2 -translate-y-1/2 opacity-60">
            <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          </span>
          <input
            type="text"
            v-model="searchQuery"
            class="input input-bordered w-full pl-10"
            placeholder="Rechercher un article..."
            @input="onSearchInput"
          />
          <button
            v-if="searchQuery"
            class="btn btn-ghost btn-sm btn-square absolute right-1 top-1/2 -translate-y-1/2"
            @click="clearSearch"
            title="Effacer"
          >✕</button>
        </div>

        <!-- Résultats -->
        <div v-if="searchQuery && searchQuery.trim().length >= 2" class="mt-3 space-y-2">
          <div v-if="searchLoading" class="text-center py-4 opacity-60">
            <span class="loading loading-spinner loading-sm"></span>
          </div>
          <div v-else-if="!searchResults.length" class="card bg-base-200 shadow">
            <div class="card-body py-4 px-4 items-center text-center">
              <p class="opacity-70">Aucun article trouvé pour "<span class="font-semibold">{{ searchQuery }}</span>"</p>
              <button class="btn btn-primary btn-sm" @click="openShoppingListModalForNewItem(searchQuery)">
                + Créer "{{ searchQuery.trim() }}"
              </button>
            </div>
          </div>
          <div
            v-else
            v-for="item in searchResults"
            :key="item.id"
            class="card bg-base-200 shadow"
          >
            <div class="card-body py-3 px-4">
              <div class="flex items-center gap-3 flex-wrap">
                <div class="flex-1 min-w-[180px]">
                  <div class="flex items-center gap-2 flex-wrap">
                    <h3 class="font-semibold">{{ item.name }}</h3>
                    <span v-if="item.category" class="badge badge-sm badge-outline">
                      {{ item.category.emoji }} {{ item.category.name }}
                    </span>
                  </div>
                  <div class="text-sm opacity-70 mt-1">
                    <span>{{ item.magasin.emoji }} {{ item.magasin.name }}</span>
                    <span class="mx-2">•</span>
                    <span :class="toBuyQty(item) > 0 ? 'text-warning font-semibold' : 'text-success'">
                      Stock {{ item.currentQuantity }} / {{ item.idealQuantity }}
                    </span>
                    <span v-if="item.requestedQuantity > 0" class="badge badge-info badge-xs ml-1" title="Demandé via liste de course">
                      +{{ item.requestedQuantity }}
                    </span>
                    <span v-if="toBuyQty(item) > 0" class="opacity-80 ml-1">
                      (à acheter {{ toBuyQty(item) }})
                    </span>
                  </div>
                </div>
                <div class="flex items-center gap-2 flex-wrap">
                  <div class="join">
                    <span class="join-item btn btn-sm btn-ghost no-animation cursor-default">QI</span>
                    <input
                      type="number"
                      min="1"
                      :value="item.idealQuantity"
                      class="input input-bordered input-sm w-16 join-item"
                      @change="onIdealQuantityChange(item, $event)"
                    />
                  </div>
                  <button class="btn btn-primary btn-sm" @click="openShoppingListModalForItem(item)">
                    + Liste
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Onboarding : aucun magasin -->
      <section v-if="!boutique?.magasins?.length" class="card bg-base-200 shadow-xl text-center">
        <div class="card-body items-center py-10">
          <p class="text-6xl mb-2">🏪</p>
          <h2 class="card-title">Crée ton premier magasin</h2>
          <p class="opacity-70 mb-4">Aucun magasin pour l'instant — démarre par en ajouter un.</p>
          <button class="btn btn-primary btn-lg btn-circle" @click="showAddModal = true" title="Ajouter un magasin">
            <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
          </button>
        </div>
      </section>

      <template v-else>
        <!-- Suggestions QI -->
        <section v-if="qiSuggestions.length" class="card bg-info/10 border border-info/30 shadow mb-6">
          <div class="card-body py-3">
            <div class="flex items-center justify-between gap-2 flex-wrap">
              <h2 class="card-title text-base">
                💡 Suggestions
                <span class="badge badge-info badge-sm">{{ qiSuggestions.length }}</span>
              </h2>
              <button class="btn btn-ghost btn-xs" @click="showSuggestions = !showSuggestions">
                {{ showSuggestions ? 'Masquer' : 'Afficher' }}
              </button>
            </div>
            <ul v-if="showSuggestions" class="space-y-2 mt-2">
              <li
                v-for="s in qiSuggestions"
                :key="s.itemId"
                class="bg-base-100 rounded p-2 text-sm"
              >
                <div class="flex items-center justify-between gap-2 flex-wrap">
                  <span>
                    <span class="font-medium">{{ s.itemName }}</span>
                    <span class="opacity-60 text-xs ml-1">({{ s.magasinEmoji }} {{ s.magasinName }})</span>
                    <span class="block opacity-80 text-xs mt-1">
                      <template v-if="s.reason === 'create'">
                        Ajouté {{ s.sampleSize }} fois en 3 mois — quantité médiane : <span class="font-bold">{{ s.suggestedIdeal }}</span>. Définir une QI ?
                      </template>
                      <template v-else>
                        QI actuelle : {{ s.currentIdeal }}, mais l'usage suggère plutôt <span class="font-bold">{{ s.suggestedIdeal }}</span> ({{ s.sampleSize }} ajouts en 3 mois)
                      </template>
                    </span>
                  </span>
                  <div class="flex gap-1">
                    <button
                      class="btn btn-success btn-xs"
                      @click="acceptQiSuggestion(s)"
                    >Accepter (QI = {{ s.suggestedIdeal }})</button>
                    <button class="btn btn-ghost btn-xs" @click="dismissQiSuggestion(s)">Ignorer</button>
                  </div>
                </div>
              </li>
            </ul>
          </div>
        </section>

        <!-- Hero CTA : liste de courses -->
        <section
          class="card shadow-xl mb-6"
          :class="totalShoppingItems > 0 ? 'bg-warning/20' : 'bg-base-200'"
        >
          <div class="card-body">
            <div class="flex items-start gap-4 flex-wrap">
              <span class="text-4xl">🛒</span>
              <div class="flex-1 min-w-[200px]">
                <h2 class="card-title">Liste de courses</h2>
                <p v-if="totalShoppingItems > 0" class="opacity-90">
                  <span class="font-bold">{{ totalShoppingItems }}</span> article{{ totalShoppingItems > 1 ? 's' : '' }} à acheter
                  dans <span class="font-bold">{{ magasinsWithShopping }}</span> magasin{{ magasinsWithShopping > 1 ? 's' : '' }}.
                </p>
                <p v-else class="opacity-70">Tout est en stock. Ajoute des articles à racheter.</p>
              </div>
              <div class="flex gap-2 flex-wrap">
                <button
                  v-if="totalShoppingItems > 0"
                  class="btn btn-ghost btn-sm"
                  @click="showArticlesTab('to-buy')"
                >Voir détails</button>
                <button class="btn btn-primary btn-sm" @click="openShoppingListModal">
                  + Créer une liste
                </button>
              </div>
            </div>
          </div>
        </section>

        <!-- Tabs : magasins / articles -->
        <section class="mb-6">
          <div role="tablist" class="tabs tabs-boxed mb-4 justify-center">
            <button
              role="tab"
              class="tab"
              :class="{ 'tab-active': activeTab === 'magasins' }"
              @click="activeTab = 'magasins'"
            >🏪 Mes magasins</button>
            <button
              role="tab"
              class="tab"
              :class="{ 'tab-active': activeTab === 'articles' }"
              @click="activeTab = 'articles'"
            >📋 Mes articles</button>
            <button
              role="tab"
              class="tab"
              :class="{ 'tab-active': activeTab === 'categories' }"
              @click="activeTab = 'categories'"
            >🏷️ Mes catégories</button>
          </div>

          <!-- Tab : magasins -->
          <div v-if="activeTab === 'magasins'">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-xl font-semibold">Mes magasins</h2>
              <button class="btn btn-primary btn-sm btn-square" @click="showAddModal = true" title="Ajouter un magasin">
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>
              </button>
            </div>

            <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
          </div>

          <!-- Tab : articles -->
          <div v-else-if="activeTab === 'articles'">
            <div class="flex flex-col sm:flex-row gap-2 mb-3">
              <input
                type="text"
                v-model="articlesSearch"
                class="input input-bordered input-sm flex-1"
                placeholder="Filtrer par nom..."
              />
              <select v-model="articlesFilterMagasin" class="select select-bordered select-sm">
                <option :value="''">Tous les magasins</option>
                <option v-for="m in boutique.magasins" :key="m.id" :value="m.id">
                  {{ m.emoji }} {{ m.name }}
                </option>
              </select>
              <select v-model="articlesFilterStatus" class="select select-bordered select-sm">
                <option value="">Tous</option>
                <option value="to-buy">À acheter</option>
                <option value="ok">Stock OK</option>
              </select>
            </div>

            <div class="stats stats-horizontal shadow w-full mb-3 text-sm">
              <div class="stat py-2">
                <div class="stat-title text-xs">Total</div>
                <div class="stat-value text-base">{{ allItems.length }}</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">À acheter</div>
                <div class="stat-value text-base text-warning">{{ itemsToBuyCount }}</div>
              </div>
              <div class="stat py-2">
                <div class="stat-title text-xs">Stock OK</div>
                <div class="stat-value text-base text-success">{{ allItems.length - itemsToBuyCount }}</div>
              </div>
            </div>

            <div v-if="filteredArticles.length" class="overflow-x-auto">
              <table class="table table-zebra table-sm w-full">
                <thead>
                  <tr>
                    <th class="cursor-pointer" @click="toggleArticlesSort('name')">
                      Article
                      <span v-if="articlesSortBy === 'name'">{{ articlesSortDir === 'asc' ? '▲' : '▼' }}</span>
                    </th>
                    <th class="cursor-pointer text-center" @click="toggleArticlesSort('stock')">
                      Stock
                      <span v-if="articlesSortBy === 'stock'">{{ articlesSortDir === 'asc' ? '▲' : '▼' }}</span>
                    </th>
                    <th class="cursor-pointer" @click="toggleArticlesSort('magasin')">
                      Magasin
                      <span v-if="articlesSortBy === 'magasin'">{{ articlesSortDir === 'asc' ? '▲' : '▼' }}</span>
                    </th>
                    <th>Statut</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in filteredArticles" :key="item.id">
                    <td>
                      <div class="font-medium">{{ item.name }}</div>
                      <div v-if="item.categoryId" class="text-xs opacity-60">{{ categoryLabel(item.categoryId) }}</div>
                    </td>
                    <td class="text-center">
                      <span :class="item.currentQuantity < item.idealQuantity ? 'text-warning font-bold' : ''">
                        {{ item.currentQuantity }}
                      </span>
                      <span class="opacity-50"> / {{ item.idealQuantity }}</span>
                      <span v-if="item.requestedQuantity > 0" class="badge badge-info badge-xs ml-1" title="Demandé via liste de course">
                        +{{ item.requestedQuantity }}
                      </span>
                    </td>
                    <td>
                      <NuxtLink :to="`/boutique/${code}/magasin/${item.magasinId}`" class="link link-hover">
                        {{ item.magasinEmoji }} {{ item.magasinName }}
                      </NuxtLink>
                    </td>
                    <td>
                      <span v-if="toBuyQty(item) > 0" class="badge badge-warning badge-sm">
                        À acheter ({{ toBuyQty(item) }})
                      </span>
                      <span v-else class="badge badge-success badge-sm">OK</span>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
            <div v-else class="text-center py-8 opacity-70">
              <p class="text-4xl mb-2">📦</p>
              <p v-if="allItems.length === 0">Aucun article enregistré</p>
              <p v-else>Aucun article ne correspond aux filtres</p>
            </div>
          </div>

          <!-- Tab : catégories -->
          <div v-else>
            <div v-if="!boutique.categories?.length" class="text-center py-6 opacity-70">
              Aucune catégorie pour l'instant.
            </div>

            <ul v-else class="space-y-2 mb-4">
              <li
                v-for="cat in boutique.categories"
                :key="cat.id"
                class="border border-base-300 rounded p-2 bg-base-100"
              >
                <template v-if="editingCategoryId !== cat.id">
                  <div class="flex items-center justify-between gap-2">
                    <span>
                      <span class="text-xl mr-2">{{ cat.emoji }}</span>
                      <span class="font-medium">{{ cat.name }}</span>
                    </span>
                    <div class="flex gap-1">
                      <button class="btn btn-xs btn-ghost" @click="startEditCategory(cat)">Modifier</button>
                      <button class="btn btn-xs btn-error btn-outline" @click="deleteCategory(cat)">Supprimer</button>
                    </div>
                  </div>
                </template>
                <template v-else>
                  <div class="space-y-2">
                    <div class="flex gap-2 items-center">
                      <span class="text-2xl w-10 text-center">{{ editCategoryForm.emoji }}</span>
                      <input
                        type="text"
                        v-model="editCategoryForm.name"
                        class="input input-bordered input-sm flex-1"
                        placeholder="Nom"
                      />
                    </div>
                    <div class="flex flex-wrap gap-1">
                      <button
                        v-for="e in categoryEmojiOptions"
                        :key="e"
                        type="button"
                        class="btn btn-xs"
                        :class="{ 'btn-primary': editCategoryForm.emoji === e, 'btn-ghost': editCategoryForm.emoji !== e }"
                        @click="editCategoryForm.emoji = e"
                      >{{ e }}</button>
                    </div>
                    <div class="flex gap-1 justify-end">
                      <button class="btn btn-xs btn-ghost" @click="cancelEditCategory">Annuler</button>
                      <button
                        class="btn btn-xs btn-primary"
                        @click="saveEditCategory"
                        :disabled="!editCategoryForm.name.trim()"
                      >Enregistrer</button>
                    </div>
                  </div>
                </template>
              </li>
            </ul>

            <div class="divider">Ajouter une catégorie</div>

            <div class="space-y-2">
              <div class="flex gap-2 items-center">
                <span class="text-2xl w-10 text-center">{{ newCategory.emoji }}</span>
                <input
                  type="text"
                  v-model="newCategory.name"
                  class="input input-bordered input-sm flex-1"
                  placeholder="Ex: Frais, Surgelés, Hygiène..."
                  @keyup.enter="addCategory"
                />
              </div>
              <div class="flex flex-wrap gap-1">
                <button
                  v-for="e in categoryEmojiOptions"
                  :key="e"
                  type="button"
                  class="btn btn-xs"
                  :class="{ 'btn-primary': newCategory.emoji === e, 'btn-ghost': newCategory.emoji !== e }"
                  @click="newCategory.emoji = e"
                >{{ e }}</button>
              </div>
              <button
                class="btn btn-primary btn-sm w-full"
                @click="addCategory"
                :disabled="isAddingCategory || !newCategory.name.trim()"
              >
                <span v-if="isAddingCategory" class="loading loading-spinner loading-xs"></span>
                Ajouter
              </button>
            </div>
          </div>
        </section>
      </template>
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
          <div class="form-control sm:col-span-2">
            <label class="label py-1"><span class="label-text">Catégorie</span></label>
            <select v-model.number="shoppingForm.categoryId" class="select select-bordered">
              <option :value="null">— Aucune —</option>
              <option v-for="c in boutique?.categories" :key="c.id" :value="c.id">
                {{ c.emoji }} {{ c.name }}
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
                  <span class="opacity-60 text-xs text-right">
                    <span>{{ magasinLabel(entry.magasinId) }}</span>
                    <span v-if="entry.categoryId" class="block">{{ categoryLabel(entry.categoryId) }}</span>
                  </span>
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
                  <select v-model.number="editShoppingForm.categoryId" class="select select-bordered select-sm sm:col-span-2">
                    <option :value="null">— Sans catégorie —</option>
                    <option v-for="c in boutique?.categories" :key="c.id" :value="c.id">
                      {{ c.emoji }} {{ c.name }}
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
  items?: { id: number; name: string; idealQuantity: number; currentQuantity: number; requestedQuantity: number; categoryId: number | null }[]
}

interface Category {
  id: number
  name: string
  emoji: string
  position: number
}

interface Boutique {
  id: number
  name: string
  code: string
  magasins: Magasin[]
  categories: Category[]
}

interface FlatArticle {
  id: number
  name: string
  idealQuantity: number
  currentQuantity: number
  requestedQuantity: number
  categoryId: number | null
  magasinId: number
  magasinName: string
  magasinEmoji: string
}

interface QiSuggestion {
  itemId: number
  itemName: string
  magasinId: number
  magasinName: string
  magasinEmoji: string
  currentIdeal: number
  suggestedIdeal: number
  sampleSize: number
  reason: 'create' | 'adjust'
}

function toBuyQty(item: { idealQuantity: number; currentQuantity: number; requestedQuantity: number }): number {
  return Math.max(item.idealQuantity - item.currentQuantity, 0) + item.requestedQuantity
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

// Tabs
const activeTab = ref<'magasins' | 'articles' | 'categories'>('magasins')

// Suggestions QI
const qiSuggestions = ref<QiSuggestion[]>([])
const showSuggestions = ref(true)

async function loadQiSuggestions() {
  try {
    qiSuggestions.value = await $fetch(`/api/boutique/${code}/qi-suggestions`) as QiSuggestion[]
  } catch {
    qiSuggestions.value = []
  }
}

async function acceptQiSuggestion(s: QiSuggestion) {
  try {
    await $fetch(`/api/boutique/${code}/items/${s.itemId}/qi-suggestion`, {
      method: 'POST',
      body: { action: 'accept', value: s.suggestedIdeal }
    })
    qiSuggestions.value = qiSuggestions.value.filter((x: QiSuggestion) => x.itemId !== s.itemId)
    loadBoutique()
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

async function dismissQiSuggestion(s: QiSuggestion) {
  try {
    await $fetch(`/api/boutique/${code}/items/${s.itemId}/qi-suggestion`, {
      method: 'POST',
      body: { action: 'dismiss', value: s.suggestedIdeal }
    })
    qiSuggestions.value = qiSuggestions.value.filter((x: QiSuggestion) => x.itemId !== s.itemId)
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

// Tab Articles : filtres / tri
const articlesSearch = ref('')
const articlesFilterMagasin = ref<number | ''>('')
const articlesFilterStatus = ref<'' | 'to-buy' | 'ok'>('')
const articlesSortBy = ref<'name' | 'stock' | 'magasin'>('name')
const articlesSortDir = ref<'asc' | 'desc'>('asc')

const allItems = computed<FlatArticle[]>(() => {
  if (!boutique.value?.magasins) return []
  const out: FlatArticle[] = []
  for (const m of boutique.value.magasins) {
    if (!m.items) continue
    for (const it of m.items) {
      out.push({
        id: it.id,
        name: it.name,
        idealQuantity: it.idealQuantity,
        currentQuantity: it.currentQuantity,
        requestedQuantity: it.requestedQuantity ?? 0,
        categoryId: it.categoryId,
        magasinId: m.id,
        magasinName: m.name,
        magasinEmoji: m.emoji
      })
    }
  }
  return out
})

const itemsToBuyCount = computed(() =>
  allItems.value.filter((i: FlatArticle) => toBuyQty(i) > 0).length
)

const filteredArticles = computed(() => {
  let list = allItems.value

  if (articlesSearch.value.trim()) {
    const q = articlesSearch.value.toLowerCase()
    list = list.filter((i: FlatArticle) => i.name.toLowerCase().includes(q))
  }
  if (articlesFilterMagasin.value !== '') {
    list = list.filter((i: FlatArticle) => i.magasinId === articlesFilterMagasin.value)
  }
  if (articlesFilterStatus.value === 'to-buy') {
    list = list.filter((i: FlatArticle) => toBuyQty(i) > 0)
  } else if (articlesFilterStatus.value === 'ok') {
    list = list.filter((i: FlatArticle) => toBuyQty(i) === 0)
  }

  list = [...list].sort((a: FlatArticle, b: FlatArticle) => {
    let cmp = 0
    if (articlesSortBy.value === 'name') {
      cmp = a.name.localeCompare(b.name)
    } else if (articlesSortBy.value === 'stock') {
      cmp = (a.idealQuantity - a.currentQuantity) - (b.idealQuantity - b.currentQuantity)
    } else if (articlesSortBy.value === 'magasin') {
      cmp = a.magasinName.localeCompare(b.magasinName)
    }
    return articlesSortDir.value === 'asc' ? cmp : -cmp
  })
  return list
})

function toggleArticlesSort(col: 'name' | 'stock' | 'magasin') {
  if (articlesSortBy.value === col) {
    articlesSortDir.value = articlesSortDir.value === 'asc' ? 'desc' : 'asc'
  } else {
    articlesSortBy.value = col
    articlesSortDir.value = 'asc'
  }
}

function showArticlesTab(filterStatus: '' | 'to-buy' | 'ok' = '') {
  activeTab.value = 'articles'
  articlesFilterStatus.value = filterStatus
  articlesSearch.value = ''
  articlesFilterMagasin.value = ''
}

// Recherche d'articles
interface SearchResultItem {
  id: number
  name: string
  idealQuantity: number
  currentQuantity: number
  requestedQuantity: number
  magasinId: number
  categoryId: number | null
  magasin: { id: number; name: string; emoji: string }
  category: { id: number; name: string; emoji: string } | null
}
const searchQuery = ref('')
const searchResults = ref<SearchResultItem[]>([])
const searchLoading = ref(false)
let searchTimer: ReturnType<typeof setTimeout> | null = null

// Modal liste de course
const showShoppingModal = ref(false)
const shoppingForm = ref({ name: '', quantity: 1, magasinId: 0, categoryId: null as number | null })

// Catégories CRUD (intégré dans l'onglet)
const newCategory = ref({ name: '', emoji: '🏷️' })
const isAddingCategory = ref(false)
const editingCategoryId = ref<number | null>(null)
const editCategoryForm = ref({ name: '', emoji: '🏷️' })
const categoryEmojiOptions = ['🥬', '🧊', '🍝', '🍪', '🥖', '☕', '🥤', '🍷', '🧴', '🧽', '💊', '🐾', '🧸', '🔧', '🏷️', '🥩', '🧀', '🌿', '🍎']
const shoppingSuggestions = ref<{ name: string; magasinId: number }[]>([])
interface ShoppingEntry {
  itemId: number
  magasinId: number
  name: string
  quantity: number
  created: boolean
  categoryId?: number | null
  entryId?: number | null
}
const shoppingAdded = ref<ShoppingEntry[]>([])
const editingShoppingIndex = ref<number | null>(null)
const editShoppingForm = ref<{ name: string; quantity: number; magasinId: number; categoryId: number | null }>({ name: '', quantity: 1, magasinId: 0, categoryId: null })
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
    magasinId: boutique.value.magasins[0].id,
    categoryId: null
  }
  shoppingAdded.value = []
  shoppingSuggestions.value = []
  shoppingError.value = ''
  showShoppingModal.value = true
}

function openShoppingListModalForItem(item: SearchResultItem) {
  if (!boutique.value?.magasins?.length) return
  shoppingForm.value = {
    name: item.name,
    quantity: 1,
    magasinId: item.magasinId,
    categoryId: item.categoryId
  }
  shoppingAdded.value = []
  shoppingSuggestions.value = []
  shoppingError.value = ''
  showShoppingModal.value = true
}

function openShoppingListModalForNewItem(rawName: string) {
  if (!boutique.value?.magasins?.length) return
  const name = rawName.trim()
  if (!name) return
  shoppingForm.value = {
    name,
    quantity: 1,
    magasinId: boutique.value.magasins[0].id,
    categoryId: null
  }
  shoppingAdded.value = []
  shoppingSuggestions.value = []
  shoppingError.value = ''
  showShoppingModal.value = true
}

// === Recherche ===
function onSearchInput() {
  if (searchTimer) clearTimeout(searchTimer)
  const term = searchQuery.value.trim()
  if (term.length < 2) {
    searchResults.value = []
    return
  }
  searchLoading.value = true
  searchTimer = setTimeout(async () => {
    try {
      searchResults.value = await $fetch(
        `/api/boutique/${code}/items/search?q=${encodeURIComponent(term)}`
      ) as SearchResultItem[]
    } catch {
      searchResults.value = []
    } finally {
      searchLoading.value = false
    }
  }, 250)
}

function clearSearch() {
  searchQuery.value = ''
  searchResults.value = []
  if (searchTimer) clearTimeout(searchTimer)
}

async function onIdealQuantityChange(item: SearchResultItem, event: Event) {
  const input = event.target as HTMLInputElement
  const newQty = parseInt(input.value)
  if (!newQty || newQty < 1) {
    input.value = String(item.idealQuantity)
    return
  }
  if (newQty === item.idealQuantity) return

  try {
    const updated = await $fetch(
      `/api/boutique/${code}/magasins/${item.magasinId}/items/${item.id}`,
      {
        method: 'PUT',
        body: { idealQuantity: newQty }
      }
    ) as { idealQuantity: number; currentQuantity: number }
    item.idealQuantity = updated.idealQuantity
    item.currentQuantity = updated.currentQuantity
    // Refresh boutique-level data (shopping counts on magasin cards)
    loadBoutique()
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
    input.value = String(item.idealQuantity)
  }
}

// === Catégories CRUD ===
async function addCategory() {
  if (!newCategory.value.name.trim()) return
  isAddingCategory.value = true
  try {
    await $fetch(`/api/boutique/${code}/categories/add`, {
      method: 'POST',
      body: { name: newCategory.value.name.trim(), emoji: newCategory.value.emoji }
    })
    newCategory.value = { name: '', emoji: '🏷️' }
    await loadBoutique()
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  } finally {
    isAddingCategory.value = false
  }
}

function startEditCategory(cat: Category) {
  editingCategoryId.value = cat.id
  editCategoryForm.value = { name: cat.name, emoji: cat.emoji }
}

function cancelEditCategory() {
  editingCategoryId.value = null
}

async function saveEditCategory() {
  if (editingCategoryId.value == null) return
  if (!editCategoryForm.value.name.trim()) return
  try {
    await $fetch(`/api/boutique/${code}/categories/${editingCategoryId.value}`, {
      method: 'PUT',
      body: { name: editCategoryForm.value.name.trim(), emoji: editCategoryForm.value.emoji }
    })
    editingCategoryId.value = null
    await loadBoutique()
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

async function deleteCategory(cat: Category) {
  if (!confirm(`Supprimer la catégorie "${cat.name}" ? Les articles associés perdront leur catégorie.`)) return
  try {
    await $fetch(`/api/boutique/${code}/categories/${cat.id}`, { method: 'DELETE' })
    await loadBoutique()
  } catch (e: any) {
    alert(e.data?.message || 'Erreur')
  }
}

function categoryLabel(categoryId: number | null | undefined): string {
  if (!categoryId) return ''
  const c = boutique.value?.categories?.find((x: Category) => x.id === categoryId)
  return c ? `${c.emoji} ${c.name}` : ''
}

function closeShoppingListModal() {
  showShoppingModal.value = false
  if (shoppingAdded.value.length > 0) {
    loadBoutique()
  }
}

type ItemSuggestion = { name: string; magasinId: number; categoryId: number | null }

function applySuggestionMatch() {
  const current = shoppingForm.value.name.trim().toLowerCase()
  const match = shoppingSuggestions.value.find((s: ItemSuggestion) => s.name.toLowerCase() === current)
  if (match) {
    shoppingForm.value.magasinId = match.magasinId
    if (match.categoryId) shoppingForm.value.categoryId = match.categoryId
  }
}

function onShoppingNameInput() {
  applySuggestionMatch()

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
      applySuggestionMatch()
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
    magasinId: entry.magasinId,
    categoryId: entry.categoryId ?? null
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
      body: { itemId: entry.itemId, quantity: entry.quantity, created: entry.created, entryId: entry.entryId ?? null }
    })
    // Re-applique avec les nouvelles valeurs
    const res = await $fetch(`/api/boutique/${code}/shopping-list/add`, {
      method: 'POST',
      body: {
        magasinId: newMagasinId,
        name: newName,
        quantity: newQuantity,
        categoryId: editShoppingForm.value.categoryId
      }
    }) as { item: { id: number; name: string; magasinId: number; categoryId: number | null }; created: boolean; entryId: number }

    shoppingAdded.value[idx] = {
      itemId: res.item.id,
      magasinId: res.item.magasinId,
      name: res.item.name,
      quantity: newQuantity,
      created: res.created,
      categoryId: res.item.categoryId,
      entryId: res.entryId
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
      body: { itemId: entry.itemId, quantity: entry.quantity, created: entry.created, entryId: entry.entryId ?? null }
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
          quantity: shoppingForm.value.quantity,
          categoryId: shoppingForm.value.categoryId
        }
      }
    ) as { item: { id: number; name: string; magasinId: number; categoryId: number | null }; created: boolean; entryId: number }
    shoppingAdded.value.unshift({
      itemId: res.item.id,
      magasinId: res.item.magasinId,
      name: res.item.name,
      quantity: shoppingForm.value.quantity,
      created: res.created,
      categoryId: res.item.categoryId,
      entryId: res.entryId
    })
    shoppingForm.value.name = ''
    shoppingForm.value.quantity = 1
    shoppingForm.value.categoryId = null
    shoppingSuggestions.value = []
    shoppingNameInput.value?.focus()
  } catch (e: any) {
    shoppingError.value = e.data?.message || 'Erreur lors de l\'ajout'
  } finally {
    isShoppingAdding.value = false
  }
}

onMounted(async () => {
  await loadBoutique()
  loadQiSuggestions()
})
</script>
