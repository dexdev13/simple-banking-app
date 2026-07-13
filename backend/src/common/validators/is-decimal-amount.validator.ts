import { registerDecorator, ValidationArguments, ValidationOptions } from 'class-validator';

export function IsDecimalAmount(validationOptions?: ValidationOptions) {
  return function (object: object, propertyName: string): void {
    registerDecorator({
      name: 'isDecimalAmount',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown): boolean {
          if (typeof value !== 'string') return false;
          if (!/^\d+(\.\d{1,2})?$/.test(value)) return false;
          return Number(value) > 0;
        },
        defaultMessage(args: ValidationArguments): string {
          return `${args.property} phải là số dương, tối đa 2 chữ số thập phân`;
        },
      },
    });
  };
}
