import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const id = parseInt(getRouterParam(event, 'id') || '0')
  const body = await readBody(event)

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

  const data: { name?: string; emoji?: string; position?: number } = {}
  if (typeof body?.name === 'string' && body.name.trim()) data.name = body.name.trim()
  if (typeof body?.emoji === 'string' && body.emoji) data.emoji = body.emoji
  if (typeof body?.position === 'number') data.position = body.position

  return await prisma.category.update({ where: { id }, data })
})
