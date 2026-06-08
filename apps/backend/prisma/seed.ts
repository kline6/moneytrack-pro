import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');
  const passwordHash = await bcrypt.hash('Demo1234', 12);

  const user = await prisma.user.upsert({
    where: { email: 'demo@moneytrack.app' },
    update: {},
    create: { email: 'demo@moneytrack.app', passwordHash, displayName: 'Demo User' },
  });

  console.log('Demo user:', user.email, 'password: Demo1234');
  // Create default categories for the demo user
  const expenseCategories = [
    { name: '餐饮', icon: 'food', color: '#EF4444' },
    { name: '购物', icon: 'shopping_bag', color: '#F59E0B' },
    { name: '交通', icon: 'directions_car', color: '#3B82F6' },
    { name: '娱乐', icon: 'sports_esports', color: '#8B5CF6' },
    { name: '学习', icon: 'school', color: '#0EA5E9' },
    { name: '医疗', icon: 'local_hospital', color: '#10B981' },
    { name: '住房', icon: 'house', color: '#D97706' },
    { name: '旅游', icon: 'flight', color: '#14B8A6' },
    { name: '宠物', icon: 'pets', color: '#F472B6' },
    { name: '数码', icon: 'devices', color: '#6366F1' },
    { name: '服饰', icon: 'checkroom', color: '#A855F7' },
    { name: '礼物', icon: 'card_giftcard', color: '#EC4899' },
    { name: '保险', icon: 'shield', color: '#64748B' },
    { name: '投资', icon: 'trending_up', color: '#059669' },
    { name: '其它', icon: 'more_horiz', color: '#9CA3AF' },
  ];
  const incomeCategories = [
    { name: '工资', icon: 'trending_up', color: '#10B981' },
    { name: '奖金', icon: 'card_giftcard', color: '#F59E0B' },
    { name: '投资收益', icon: 'trending_up', color: '#059669' },
    { name: '兼职', icon: 'devices', color: '#3B82F6' },
    { name: '其它', icon: 'more_horiz', color: '#9CA3AF' },
  ];

  for (let i = 0; i < expenseCategories.length; i++) {
    const cat = expenseCategories[i];
    await prisma.category.upsert({
      where: { userId_name_transactionType: { userId: user.id, name: cat.name, transactionType: 'EXPENSE' } },
      update: {},
      create: { userId: user.id, name: cat.name, icon: cat.icon, color: cat.color, transactionType: 'EXPENSE', sortOrder: i, isSystem: true },
    });
  }
  for (let i = 0; i < incomeCategories.length; i++) {
    const cat = incomeCategories[i];
    await prisma.category.upsert({
      where: { userId_name_transactionType: { userId: user.id, name: cat.name, transactionType: 'INCOME' } },
      update: {},
      create: { userId: user.id, name: cat.name, icon: cat.icon, color: cat.color, transactionType: 'INCOME', sortOrder: i, isSystem: true },
    });
  }
  console.log('Categories seeded:', expenseCategories.length + incomeCategories.length);

  console.log('Seed completed');
}

main().catch((e) => { console.error(e); process.exit(1); }).finally(() => prisma.$disconnect());
