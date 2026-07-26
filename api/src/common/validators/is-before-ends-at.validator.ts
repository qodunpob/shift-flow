import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

interface DtoWithEndsAt {
  endsAt?: Date;
}

export const IsBeforeEndsAt = (validationOptions?: ValidationOptions) => {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isBeforeEndsAt',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown, args: ValidationArguments): boolean {
          const dto = args.object as DtoWithEndsAt;
          if (!(value instanceof Date) || !(dto.endsAt instanceof Date)) {
            return true;
          }
          return value.getTime() < dto.endsAt.getTime();
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} must be before endsAt`;
        },
      },
    });
  };
};
