import { config } from 'dotenv';
config();

import '@/ai/flows/generate-planting-recommendations.ts';
import '@/ai/flows/diagnose-urban-heat-islands.ts';
import '@/ai/flows/generate-climate-plan.ts';