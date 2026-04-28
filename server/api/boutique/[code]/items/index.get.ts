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
    select: { name: true },
    orderBy: { name: 'asc' },
    take: 50
  })

  // Distinct par nom (case-insensitive), conserve la 1ère casse rencontrée
  const seen = new Set<string>()
  const names: string[] = []
  for (const it of items) {
    const key = it.name.toLowerCase()
    if (!seen.has(key)) {
      seen.add(key)
      names.push(it.name)
    }
  }

  return names.slice(0, 20)
})
