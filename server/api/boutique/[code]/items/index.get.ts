import prisma from '~/server/utils/db'
import { findBoutique } from '~/server/utils/boutique'

export default defineEventHandler(async (event) => {
  const code = getRouterParam(event, 'code')
  const query = getQuery(event)
  const search = (query.search as string || '').trim()

  if (!code) {
    throw createError({ statusCode: 400, message: 'Code boutique requis' })
  }

  const boutique = await findBoutique(code)
  if (!boutique) {
    throw createError({ statusCode: 404, message: 'Boutique non trouvée' })
  }

  const items = await prisma.item.findMany({
    where: {
      magasin: { boutiqueId: boutique.id },
      ...(search ? { name: { contains: search, mode: 'insensitive' } } : {})
    },
    select: { name: true, magasinId: true, updatedAt: true },
    orderBy: { updatedAt: 'desc' },
    take: 100
  })

  // Distinct par nom (case-insensitive). Garde la 1ère occurrence rencontrée
  // (la plus récemment modifiée grâce à orderBy updatedAt desc).
  const seen = new Set<string>()
  const suggestions: { name: string; magasinId: number }[] = []
  for (const it of items) {
    const key = it.name.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      suggestions.push({ name: it.name, magasinId: it.magasinId })
    }
  }

  return suggestions.slice(0, 20)
})
