import { ConfigModule } from '@nestjs/config';

import Joi from 'joi';
import dbConfig, { dbConfigValidation } from './db.config';

export default ConfigModule.forRoot({
  load: [dbConfig],
  validationSchema: Joi.object({
    ...dbConfigValidation,
  }),
  isGlobal: true,
});
