import prisma from '~/server/utils/db'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  const { itemId } = body

  const item = await prisma.shoppingListItem.findUnique({
    where: { id: itemId }
  })

  if (!item) {
    throw createError({
      statusCode: 404,
      message: 'Item non trouve'
    })
  }

  const updated = await prisma.shoppingListItem.update({
    where: { id: itemId },
    data: { checked: !item.checked },
    include: { item: true }
  })

  return updated
})
