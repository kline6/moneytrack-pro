import { Router } from 'express';
import { validate } from '../../../middlewares';
import { getQuickSuggestions, predictCategory, updateRuleWeight, parseTitle } from '../controllers';
import { predictCategorySchema, updateRuleWeightSchema, parseTitleSchema } from '../validators';

const router = Router();

router.get('/suggestions', getQuickSuggestions);
router.post('/predict', validate(predictCategorySchema), predictCategory);
router.post('/update-weight', validate(updateRuleWeightSchema), updateRuleWeight);
router.post('/parse-title', validate(parseTitleSchema), parseTitle);

export const smartRoutes = router;