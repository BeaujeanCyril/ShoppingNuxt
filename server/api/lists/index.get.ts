import prisma from '~/server/utils/db'

export default defineEventHandler(async () => {
  const lists = await prisma.shoppingList.findMany({
    include: {
      items: {
        include: {
          item: true
        },
        orderBy: [
          { checked: 'asc' },
          { createdAt: 'desc' }
        ]
      }
    },
    orderBy: { updatedAt: 'desc' }
  })

  return lists
})
