import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = parseInt(getRouterParam(event, 'id') || '0')

  if (!code || !id) {
    throw createError({ statusCode: 400, message: 'Code boutique et ID requis' })
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  const category = await prisma.category.findFirst({
    where: { id, boutiqueId: boutique.id }
  })
  if (!category) {
    throw createError({ statusCode: 404, message: 'Catégorie non trouvée' })
  }

  // onDelete SetNull sur Item.categoryId : les items perdent leur catégorie
  await prisma.category.delete({ where: { id } })
  return { success: true }
})
