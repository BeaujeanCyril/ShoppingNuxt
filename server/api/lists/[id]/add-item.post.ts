import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)
  const { itemName, quantity } = body

  if (!itemName) {
    throw createError({
      statusCode: 400,
      message: 'Nom de l\'item requis'
    })
  }

  // Trouver ou creer l'item (pas de doublons)
  let item = await prisma.item.findUnique({
    where: { name: itemName.trim().toLowerCase() }
  })

  if (!item) {
    item = await prisma.item.create({
      data: { name: itemName.trim().toLowerCase() }
    })
  }

  // Verifier si l'item est deja dans la liste
  const existingEntry = await prisma.shoppingListItem.findUnique({
    where: {
      shoppingListId_itemId: {
        shoppingListId: id,
        itemId: item.id
      }
    }
  })

  if (existingEntry) {
    // Mettre a jour la quantite
    const updated = await prisma.shoppingListItem.update({
      where: { id: existingEntry.id },
      data: {
        quantity: existingEntry.quantity + (quantity || 1),
        checked: false
      },
      include: { item: true }
    })
    return updated
  }

  // Ajouter l'item a la liste
  const listItem = await prisma.shoppingListItem.create({
    data: {
      shoppingListId: id,
      itemId: item.id,
      quantity: quantity || 1
    },
    include: { item: true }
  })

  return listItem
})
