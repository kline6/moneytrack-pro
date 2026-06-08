import { aiRepository } from '../repositories';
import { toDisplayAmount } from '@moneytrack/shared';

export const aiService = {
  async generateMonthlyReport(userId: string, year: number, month: number) {
    const data = await aiRepository.getUserFinancialSummary(userId, year, month);

    // Build structured analysis without external AI API
    const savingsRate = data.totalIncome > 0
      ? Math.round(((data.totalIncome - data.totalExpense) / data.totalIncome) * 100)
      : 0;

    const monthOverMonth = data.prevMonthExpense > 0
      ? Math.round(((data.totalExpense - data.prevMonthExpense) / data.prevMonthExpense) * 100)
      : 0;

    const topCategory = data.categoryBreakdown[0];
    const topCategoryPercent = data.totalExpense > 0 && topCategory
      ? Math.round((topCategory.amount / data.totalExpense) * 100)
      : 0;

    // Build insights
    const insights: string[] = [];

    if (savingsRate < 10) {
      insights.push('本月储蓄率仅' + savingsRate + '%，建议控制非必要支出，目标储蓄率至少20%。');
    } else if (savingsRate >= 30) {
      insights.push('本月储蓄率' + savingsRate + '%，表现优秀！继续保持。');
    }

    if (monthOverMonth > 20) {
      insights.push('本月支出较上月增长' + monthOverMonth + '%，需关注支出增长趋势。');
    } else if (monthOverMonth < -10) {
      insights.push('本月支出较上月下降' + Math.abs(monthOverMonth) + '%，消费控制良好。');
    }

    if (topCategory && topCategoryPercent > 40) {
      insights.push(topCategory.category + '占本月支出的' + topCategoryPercent + '%，建议检查该分类是否有优化空间。');
    }

    if (data.budgets.length > 0 && data.totalExpense > 0) {
      const totalBudget = data.budgets.reduce((s, b) => s + b.amount, 0);
      if (totalBudget > 0) {
        const budgetUsage = Math.round((data.totalExpense / totalBudget) * 100);
        if (budgetUsage > 100) {
          insights.push('本月已超预算' + (budgetUsage - 100) + '%，建议调整后续消费计划。');
        } else if (budgetUsage > 80) {
          insights.push('本月预算已使用' + budgetUsage + '%，请注意控制消费节奏。');
        }
      }
    }

    if (data.topExpenses.length > 0) {
      const biggest = data.topExpenses[0];
      insights.push('本月最大单笔支出：' + biggest.title + '（' + biggest.category + '）' + toDisplayAmount(biggest.amount).toFixed(2) + '元。');
    }

    if (insights.length === 0) {
      insights.push('本月财务状况平稳，建议继续保持良好的记账习惯。');
    }

    return {
      year, month,
      summary: {
        totalIncome: data.totalIncome,
        totalExpense: data.totalExpense,
        netIncome: data.totalIncome - data.totalExpense,
        savingsRate,
        monthOverMonthChange: monthOverMonth
      },
      categoryBreakdown: data.categoryBreakdown.map(c => ({
        ...c,
        amountYuan: toDisplayAmount(c.amount),
        percentage: data.totalExpense > 0 ? Math.round((c.amount / data.totalExpense) * 100) : 0
      })),
      topExpenses: data.topExpenses.map(e => ({ ...e, amountYuan: toDisplayAmount(e.amount) })),
      insights,
      recommendations: generateRecommendations(data, savingsRate, monthOverMonth)
    };
  },

  async answerQuestion(userId: string, question: string, year?: number, month?: number) {
    const now = new Date();
    const y = year || now.getFullYear();
    const m = month || now.getMonth() + 1;
    const data = await aiRepository.getUserFinancialSummary(userId, y, m);
    const trend = await aiRepository.getMultiMonthSummary(userId, y, m, 6);

    const trendSummary = trend.map(t => t.month + '月支出:' + toDisplayAmount(t.expense).toFixed(0) + '元').join(', ');

    const response = this.processQuestion(question, data, trend);

    return {
      question,
      answer: response,
      context: {
        year: y, month: m,
        totalExpense: data.totalExpense,
        totalIncome: data.totalIncome,
        recentTrend: trendSummary
      }
    };
  },

  processQuestion(question: string, data: any, trend: any[]): string {
    const q = question.toLowerCase();
    const totalExpenseYuan = toDisplayAmount(data.totalExpense);
    const totalIncomeYuan = toDisplayAmount(data.totalIncome);

    if (q.includes('花了多少') || q.includes('支出') || q.includes('消费')) {
      const top3 = data.categoryBreakdown.slice(0, 3);
      const top3Str = top3.map((c: any) => c.category + ':' + toDisplayAmount(c.amount).toFixed(2) + '元').join(', ');
      return '本月总支出' + totalExpenseYuan.toFixed(2) + '元，总收入' + totalIncomeYuan.toFixed(2) + '元。主要支出分类：' + top3Str + '。';
    }

    if (q.includes('趋势') || q.includes('变化') || q.includes('对比')) {
      const trendStr = trend.map(t => t.month + '月:' + toDisplayAmount(t.expense).toFixed(0) + '元').join(' -> ');
      return '近6个月支出趋势：' + trendStr + '。';
    }

    if (q.includes('建议') || q.includes('怎么') || q.includes('如何')) {
      return generateRecommendations(data, 
        data.totalIncome > 0 ? Math.round(((data.totalIncome - data.totalExpense) / data.totalIncome) * 100) : 0,
        0
      ).join(' ');
    }

    // Default comprehensive answer
    const topCat = data.categoryBreakdown[0];
    let answer = '本月支出' + totalExpenseYuan.toFixed(2) + '元，收入' + totalIncomeYuan.toFixed(2) + '元。';
    if (topCat) {
      answer += '最大支出分类为' + topCat.category + '（' + toDisplayAmount(topCat.amount).toFixed(2) + '元）。';
    }
    answer += '如需更详细的分析，请询问具体方面如"本月预算使用情况"或"消费趋势"。';
    return answer;
  }
};

function generateRecommendations(data: any, savingsRate: number, mom: number): string[] {
  const recs: string[] = [];

  if (savingsRate < 20) {
    recs.push('建议将月度储蓄率提升至20%以上，可以先设定自动转账定额储蓄。');
  }

  const top3 = data.categoryBreakdown.slice(0, 3);
  if (top3.length > 0) {
    recs.push('重点关注前三大支出分类：' + top3.map((c: any) => c.category).join('、') + '，审视是否有可优化项。');
  }

  if (data.budgets.length === 0) {
    recs.push('尚未设置月度预算，建议为各主要分类设定预算上限以控制支出。');
  }

  if (mom > 15) {
    recs.push('支出环比增长明显，建议回顾本月新增的大额消费，评估是否为一次性支出。');
  }

  recs.push('坚持每日记账，定期回顾月度报告，养成良好的财务管理习惯。');
  return recs;
}
