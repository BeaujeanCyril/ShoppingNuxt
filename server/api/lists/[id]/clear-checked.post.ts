import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const id = parseInt(getRouterParam(event, 'id') || '0')

  await prisma.shoppingListItem.deleteMany({
    where: {
      shoppingListId: id,
      checked: true
    }
  })

  return { success: true }
})
