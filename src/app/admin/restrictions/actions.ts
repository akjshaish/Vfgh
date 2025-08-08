'use server';

import { z } from 'zod';
import { db } from '@/lib/firebase';
import { ref, set } from 'firebase/database';
import { revalidatePath } from 'next/cache';

const restrictionSettingsSchema = z.object({
  freeUserLimitEnabled: z.boolean(),
});

export async function saveRestrictionSettings(data: z.infer<typeof restrictionSettingsSchema>) {
    const validatedData = restrictionSettingsSchema.parse(data);
    const settingsRef = ref(db, 'settings/restrictions');
    await set(settingsRef, validatedData);
    revalidatePath('/admin/restrictions');
}
