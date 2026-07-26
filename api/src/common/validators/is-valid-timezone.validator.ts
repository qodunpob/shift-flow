import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';
import { IANAZone } from 'luxon';

export const IsValidTimeZone = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isValidTimeZone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          return typeof value === 'string' && IANAZone.isValidZone(value);
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be a valid IANA time zone name`;
        },
      },
    });
  };
};
