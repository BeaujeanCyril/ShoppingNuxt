import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { itemId } = body

  await prisma.shoppingListItem.delete({
    where: { id: itemId }
  })

  return { success: true }
})
