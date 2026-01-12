import {
  registerDecorator,
  ValidationOptions,
  ValidationArguments,
} from 'class-validator';

export function IsNotInFuture(validationOptions?: ValidationOptions) {
  return function (object: Object, propertyName: string) {
    registerDecorator({
      name: 'isNotInFuture',
      target: object.constructor,
      propertyName: propertyName,
      options: validationOptions,
      validator: {
        validate(value: any, args: ValidationArguments) {
          if (!value) return true; // optional
          const date = new Date(value);
          if (Number.isNaN(date.getTime())) return false;
          // allow small clock skew: consider now as cut-off
          return date.getTime() <= Date.now();
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} deve ser uma data e hora no passado ou presente`;
        },
      },
    });
  };
}
