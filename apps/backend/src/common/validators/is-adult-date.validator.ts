import {
  registerDecorator,
  ValidationArguments,
  ValidationOptions,
} from 'class-validator';

export function isAdultDate(value: string | Date | null | undefined): boolean {
  if (!value) return false;
  const birthDate = typeof value === 'string' ? value.slice(0, 10) : value.toISOString().slice(0, 10);
  const today = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Mexico_City',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(new Date());
  const [year, month, day] = today.split('-').map(Number);
  const cutoff = new Date(Date.UTC(year - 18, month - 1, day)).toISOString().slice(0, 10);
  return birthDate <= cutoff;
}

export function IsAdultDate(validationOptions?: ValidationOptions) {
  return (object: object, propertyName: string) => {
    registerDecorator({
      name: 'isAdultDate',
      target: object.constructor,
      propertyName,
      options: validationOptions,
      validator: {
        validate(value: unknown) {
          return isAdultDate(value as string | Date | null | undefined);
        },
        defaultMessage(args: ValidationArguments) {
          return `${args.property} debe indicar una persona de 18 años o más`;
        },
      },
    });
  };
}
