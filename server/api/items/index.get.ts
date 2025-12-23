import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  const search = query.search as string || ''

  const items = await prisma.item.findMany({
    where: search ? {
      name: {
        contains: search,
        mode: 'insensitive'
      }
    } : undefined,
    orderBy: { name: 'asc' },
    take: 20
  })

  return items
})
