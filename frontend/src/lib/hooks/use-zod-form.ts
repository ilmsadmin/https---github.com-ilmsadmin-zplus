'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useForm, UseFormProps, UseFormReturn } from 'react-hook-form';
import { ZodSchema, TypeOf } from 'zod';

interface UseZodFormProps<T extends ZodSchema<any>> extends UseFormProps<TypeOf<T>> {
  schema: T;
}

export const useZodForm = <T extends ZodSchema<any>>({
  schema,
  ...formProps
}: UseZodFormProps<T>): UseFormReturn<TypeOf<T>> => {
  return useForm<TypeOf<T>>({
    ...formProps,
    resolver: zodResolver(schema),
  });
};
