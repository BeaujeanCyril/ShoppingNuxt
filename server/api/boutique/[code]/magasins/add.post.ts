import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const body = await readBody(event)
  const { name, emoji } = body

  if (!code) {
    throw createError({
      statusCode: 400,
      message: 'Code boutique requis'
    })
  }

  if (!name || !name.trim()) {
    throw createError({
      statusCode: 400,
      message: 'Le nom du magasin est requis'
    })
  }

  // Vérifier que la boutique existe
  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({
      statusCode: 404,
      message: 'Boutique non trouvée'
    })
  }

  // Compter les magasins existants pour définir la position
  const magasinCount = await prisma.magasin.count({
    where: { boutiqueId: boutique.id }
  })

  // Créer le magasin
  const magasin = await prisma.magasin.create({
    data: {
      name: name.trim(),
      emoji: emoji || '🛒',
      position: magasinCount,
      boutiqueId: boutique.id
    },
    include: {
      items: true
    }
  })

  return {
    ...magasin,
    itemsCount: 0,
    shoppingCount: 0
  }
})
