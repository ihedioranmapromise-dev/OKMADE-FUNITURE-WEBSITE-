import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY  // use service role key from .env.local
);

const buckets = ['showroom-bucket', 'catalog-bucket', 'workspace-requests', 'workspace-progress'];

async function setCacheHeaders() {
  for (const bucket of buckets) {
    console.log(`Processing bucket: ${bucket}`);
    // List all files in the bucket
    const { data: files, error } = await supabase.storage.from(bucket).list();
    if (error) {
      console.error(`Error listing ${bucket}:`, error.message);
      continue;
    }
    for (const file of files) {
      const filePath = file.name;
      console.log(`Updating cache for: ${bucket}/${filePath}`);
      // Update metadata (cache-control)
      const { error: updateError } = await supabase.storage
        .from(bucket)
        .update(filePath, { cacheControl: '31536000' });
      if (updateError) {
        console.error(`Error updating ${filePath}:`, updateError.message);
      } else {
        console.log(`✅ ${filePath} updated`);
      }
    }
  }
}

setCacheHeaders();
