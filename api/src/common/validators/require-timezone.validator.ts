import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

interface DtoWithTimeZone {
  timeZone?: string;
}

export const RequireTimeZone = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'requireTimeZone',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          if (value === undefined) {
            return true;
          }
          const dto = args.object as DtoWithTimeZone;
          return dto.timeZone !== undefined;
        },
        defaultMessage(args: ValidationArguments): string {
          return `timeZone is required when ${args.property} is provided`;
        },
      },
    });
  };
};
