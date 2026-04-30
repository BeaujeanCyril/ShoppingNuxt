import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const query = getQuery(event)
  const q = (query.q as string || '').trim()

  if (!code) {
    throw createError({ statusCode: 400, message: 'Code boutique requis' })
  }

  if (q.length < 2) {
    return []
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  const items = await prisma.item.findMany({
    where: {
      magasin: { boutiqueId: boutique.id },
      name: { contains: q, mode: 'insensitive' }
    },
    include: {
      magasin: { select: { id: true, name: true, emoji: true } },
      category: { select: { id: true, name: true, emoji: true } }
    },
    orderBy: [{ name: 'asc' }],
    take: 30
  })

  return items
})
