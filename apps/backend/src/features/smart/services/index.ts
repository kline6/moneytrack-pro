import { transactionRepository } from '../../transactions/repositories';
import { categoryRepository } from '../../categories/repositories';
import { logger } from '../../../infrastructure/logger';

const MERCHANT_CATEGORY_RULES: Array<{ pattern: RegExp; merchant: string; categoryKeyword: string }> = [
  { pattern: /(滴滴|t3|铁路|12306|高铁|地铁|公交|出行|打车)/i, merchant: '出行', categoryKeyword: '交通' },
  { pattern: /(美团|饿了么|外卖)/i, merchant: '外卖', categoryKeyword: '餐饮' },
  { pattern: /(全家|7-11|711|便利)/i, merchant: '便利店', categoryKeyword: '购物' },
  { pattern: /(京东|淘宝|天猫|拼多多|商城)/i, merchant: '网购', categoryKeyword: '购物' },
  { pattern: /(电费|水费|燃气|缴费|话费|宽带)/i, merchant: '生活缴费', categoryKeyword: '住房' },
  { pattern: /(医院|药房|体检|挂号)/i, merchant: '医疗', categoryKeyword: '医疗' },
  { pattern: /(电影|游戏|充值|会员|视频)/i, merchant: '娱乐', categoryKeyword: '娱乐' },
  { pattern: /(麦当劳|肯德基|星巴克|瑞幸|咖啡|奶茶|火锅|烧烤|面馆|餐厅|饭店)/i, merchant: '餐饮', categoryKeyword: '餐饮' },
  { pattern: /(超市|大润发|沃尔玛|盒马|永辉|菜场|菜市)/i, merchant: '超市', categoryKeyword: '购物' },
];

function normalizeText(text: string) {
  return text.replace(/\s+/g, ' ').trim();
}

function extractMerchantCandidate(text: string): string | null {
  // 尝试从文本中提取商户名：取第一个连续中文词或英文词
  const match = text.match(/[\u4e00-\u9fa5]{2,}|[a-zA-Z0-9]+/);
  return match ? match[0] : null;
}

export const smartService = {
  async getQuickSuggestions(userId: string) {
    const [categorySuggestions, merchantSuggestions] = await Promise.all([
      transactionRepository.aggregateUserCategoryFrequency(userId, 30, 3),
      transactionRepository.aggregateUserMerchantFrequency(userId, 30, 5),
    ]);
    return { categories: categorySuggestions, merchants: merchantSuggestions };
  },

  async predictCategoryAndMerchant(userId: string, rawText: string, source?: string) {
    const text = normalizeText(rawText);
    if (!text) {
      return this.fallbackPrediction(userId, source);
    }

    // 第零层：商户规则权重表
    const merchantCandidate = extractMerchantCandidate(text);
    if (merchantCandidate) {
      const ruleMatch = await transactionRepository.findCategoryByMerchantRule(userId, merchantCandidate);
      if (ruleMatch) {
        logger.info('Smart classifier matched from merchant rule weight', { userId, text, merchant: ruleMatch.merchant, categoryId: ruleMatch.categoryId });
        return ruleMatch;
      }
    }

    // 第一层：精准历史匹配
    const historyMatch = await transactionRepository.findBestMerchantCategoryByKeyword(userId, text, 90);
    if (historyMatch) {
      logger.info('Smart classifier matched from history', { userId, text, merchant: historyMatch.merchant, categoryId: historyMatch.categoryId });
      return historyMatch;
    }

    // 第二层：内置字典模糊映射
    for (const rule of MERCHANT_CATEGORY_RULES) {
      if (rule.pattern.test(text)) {
        const category = await categoryRepository.findClosestByUser(userId, rule.categoryKeyword);
        logger.info('Smart classifier matched from rule', { userId, text, merchant: rule.merchant, categoryId: category?.id });
        return {
          merchant: rule.merchant,
          categoryId: category?.id ?? null,
          categoryName: category?.name ?? rule.categoryKeyword,
          confidence: 0.7,
          source: 'RULE',
        };
      }
    }

    // 第三层：兜底
    return this.fallbackPrediction(userId, source, text);
  },

  async fallbackPrediction(userId: string, source?: string, text?: string) {
    const fallback = await transactionRepository.findDefaultCategoryBySource(userId, source);
    logger.info('Smart classifier fallback', { userId, source, text });
    return {
      merchant: text?.slice(0, 20) || (source || '未知来源'),
      categoryId: fallback?.categoryId ?? null,
      categoryName: fallback?.categoryName ?? '其它',
      confidence: 0.4,
      source: 'FALLBACK',
    };
  },

  async updateRuleWeight(userId: string, merchant: string, finalCategoryId: string) {
    if (!merchant || !finalCategoryId) return;
    await transactionRepository.upsertMerchantCategoryWeight(userId, merchant, finalCategoryId);
    logger.info('Smart rule weight updated', { userId, merchant, finalCategoryId });
  },

  /**
   * 语义解析：从"麦当劳 35"中提取商户和金额
   */
  parseTitleInput(input: string): { title: string; amount: number | null; merchant: string | null } {
    const trimmed = input.trim();
    // 匹配 "商户 金额" 或 "金额 商户" 模式
    const match1 = trimmed.match(/^(.+?)\s+(\d+\.?\d*)$/);
    const match2 = trimmed.match(/^(\d+\.?\d*)\s+(.+)$/);
    if (match1) {
      return { title: match1[1], amount: parseFloat(match1[2]), merchant: match1[1] };
    }
    if (match2) {
      return { title: match2[2], amount: parseFloat(match2[1]), merchant: match2[2] };
    }
    return { title: trimmed, amount: null, merchant: null };
  },
};
