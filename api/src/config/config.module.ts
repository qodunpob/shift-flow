import { ConfigModule } from '@nestjs/config';

import Joi from 'joi';
import dbConfig, { dbConfigValidation } from '@/config/db.config';
import authConfig, { authConfigValidation } from '@/config/auth.config';

export default ConfigModule.forRoot({
  load: [dbConfig, authConfig],
  validationSchema: Joi.object({
    ...dbConfigValidation,
    ...authConfigValidation,
  }),
  isGlobal: true,
});
