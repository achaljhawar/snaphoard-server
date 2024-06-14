import * as z from 'zod';

export const postValidator = z.object({
    caption: z.string().min(1, 'Caption must be at least 1 character').max(100, 'Caption must be less than 1001 characters'),
    url: z.string().url('Invalid URL'),
});
