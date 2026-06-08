import { PrismaClient } from '@prisma/client';
import { SYSTEM_CATEGORY_SEEDS, SYSTEM_INCOME_CATEGORY_SEEDS } from '@moneytrack/shared';

export async function seedSystemCategories(prisma: PrismaClient, userId: string): Promise<void> {
  for (const seed of SYSTEM_CATEGORY_SEEDS) {
    await prisma.category.upsert({
      where: {
        userId_name_transactionType: {
          userId,
          name: seed.name,
          transactionType: 'EXPENSE'
        }
      },
      update: {},
      create: {
        userId,
        name: seed.name,
        icon: seed.icon,
        color: seed.color,
        isSystem: true,
        transactionType: 'EXPENSE',
        sortOrder: SYSTEM_CATEGORY_SEEDS.indexOf(seed)
      }
    });
  }

  for (const seed of SYSTEM_INCOME_CATEGORY_SEEDS) {
    await prisma.category.upsert({
      where: {
        userId_name_transactionType: {
          userId,
          name: seed.name,
          transactionType: 'INCOME'
        }
      },
      update: {},
      create: {
        userId,
        name: seed.name,
        icon: seed.icon,
        color: seed.color,
        isSystem: true,
        transactionType: 'INCOME',
        sortOrder: SYSTEM_INCOME_CATEGORY_SEEDS.indexOf(seed)
      }
    });
  }
}