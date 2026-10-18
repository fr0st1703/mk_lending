import { z } from 'zod';
export const leadSchema = z.object({
  full_name: z.string().trim().min(2, 'Укажите ФИО, от 2 до 120 символов.').max(120, 'Укажите ФИО, от 2 до 120 символов.'),
  phone: z.string().trim().regex(/^\+[\d\s().-]+$/, 'Введите номер с кодом страны.')
    .transform(value => '+' + value.replace(/\D/g, ''))
    .refine(value => /^\+[1-9]\d{6,14}$/.test(value), 'Введите номер с кодом страны.'),
  message: z.string().trim().min(10, 'Опишите задачу, от 10 до 2000 символов.').max(2000, 'Опишите задачу, от 10 до 2000 символов.'),
  privacy_consent: z.boolean().refine(Boolean, 'Подтвердите согласие.'),
  website: z.string().max(0),
});
