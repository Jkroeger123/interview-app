/**
 * Script to upload global reference documents to Ragie for each visa type
 * 
 * Documents are uploaded to partitions following the pattern: visa-{visaType}
 * This allows the agent to query all reference documents for a visa type.
 * 
 * Usage:
 * 1. Place your reference documents in the `global-docs/` directory:
 *    - global-docs/tourist/ - B-1/B-2 visa documents → partition: visa-tourist
 *    - global-docs/student/ - F-1 visa documents → partition: visa-student
 *    - global-docs/work/ - H-1B visa documents → partition: visa-work
 *    - global-docs/immigrant/ - Green Card documents → partition: visa-immigrant
 *    - global-docs/fiance/ - K-1 visa documents → partition: visa-fiance
 * 
 * 2. Set RAGIE_API_KEY in your .env.local file
 * 
 * 3. Run: npx tsx scripts/upload-global-docs.ts
 * 
 * 4. Verify in Ragie dashboard that documents were uploaded to correct partitions
 */

import * as fs from 'fs';
import * as path from 'path';
import { config } from 'dotenv';

// Load environment variables
config({ path: '.env.local' });

const RAGIE_API_KEY = process.env.RAGIE_API_KEY;
const RAGIE_API_URL = 'https://api.ragie.ai/documents';

const VISA_TYPES = ['tourist', 'student', 'work', 'immigrant', 'fiance'] as const;

interface UploadResult {
  visaType: string;
  fileName: string;
  documentId: string;
  error?: string;
}

async function uploadDocument(
  filePath: string,
  visaType: string
): Promise<UploadResult> {
  const fileName = path.basename(filePath);
  
  try {
    const fileBuffer = fs.readFileSync(filePath);
    const file = new File([fileBuffer], fileName);
    
    const formData = new FormData();
    formData.append('file', file);
    
    const metadata = {
      type: 'global_reference',
      fileName,
      uploadedAt: new Date().toISOString(),
    };
    formData.append('metadata', JSON.stringify(metadata));
    
    // Upload to visa-specific partition
    const partition = `visa-${visaType}`;
    formData.append('partition', partition);
    
    const response = await fetch(RAGIE_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RAGIE_API_KEY}`,
      },
      body: formData,
    });
    
    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`HTTP ${response.status}: ${errorText}`);
    }
    
    const data = await response.json();
    
    return {
      visaType,
      fileName,
      documentId: data.id,
    };
  } catch (error) {
    return {
      visaType,
      fileName,
      documentId: '',
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function uploadGlobalDocuments() {
  if (!RAGIE_API_KEY) {
    console.error('❌ RAGIE_API_KEY not found in .env.local');
    process.exit(1);
  }
  
  const globalDocsDir = path.join(process.cwd(), 'global-docs');
  
  if (!fs.existsSync(globalDocsDir)) {
    console.error(`❌ Directory not found: ${globalDocsDir}`);
    console.log('\nPlease create a global-docs/ directory with subdirectories for each visa type:');
    console.log('  - global-docs/tourist/');
    console.log('  - global-docs/student/');
    console.log('  - global-docs/work/');
    console.log('  - global-docs/immigrant/');
    console.log('  - global-docs/fiance/');
    process.exit(1);
  }
  
  console.log('🚀 Starting global document upload to Ragie...\n');
  
  const results: Record<string, UploadResult[]> = {};
  
  for (const visaType of VISA_TYPES) {
    const visaTypeDir = path.join(globalDocsDir, visaType);
    
    if (!fs.existsSync(visaTypeDir)) {
      console.log(`⚠️  Skipping ${visaType}: directory not found`);
      continue;
    }
    
    const files = fs.readdirSync(visaTypeDir).filter((file) => {
      return file.endsWith('.pdf') || file.endsWith('.doc') || file.endsWith('.docx');
    });
    
    if (files.length === 0) {
      console.log(`⚠️  Skipping ${visaType}: no documents found`);
      continue;
    }
    
    console.log(`📄 Uploading ${files.length} document(s) for ${visaType}...`);
    results[visaType] = [];
    
    for (const file of files) {
      const filePath = path.join(visaTypeDir, file);
      console.log(`   Uploading: ${file}`);
      
      const result = await uploadDocument(filePath, visaType);
      results[visaType].push(result);
      
      if (result.error) {
        console.log(`   ❌ Failed: ${result.error}`);
      } else {
        console.log(`   ✅ Success: ${result.documentId}`);
      }
    }
    
    console.log('');
  }
  
  // Display partition information
  console.log('\n' + '='.repeat(80));
  console.log('✅ Documents uploaded to Ragie partitions');
  console.log('='.repeat(80) + '\n');
  
  console.log('Documents are organized by partition:');
  for (const visaType of VISA_TYPES) {
    const docs = results[visaType] || [];
    const successCount = docs.filter((d) => !d.error).length;
    if (successCount > 0) {
      console.log(`  visa-${visaType}: ${successCount} document(s)`);
    }
  }
  
  console.log('\n💡 No code changes needed!');
  console.log('The agent automatically queries the correct partitions based on visa type:');
  console.log('  - Global docs: visa-{visaType}');
  console.log('  - User docs: visa-{visaType}-user-{userId}');
  
  console.log('\n' + '='.repeat(80));
  
  // Summary
  console.log('\n📊 Upload Summary:');
  for (const visaType of VISA_TYPES) {
    const docs = results[visaType] || [];
    const successful = docs.filter((d) => !d.error).length;
    const failed = docs.filter((d) => d.error).length;
    
    if (docs.length > 0) {
      console.log(`  ${visaType}: ${successful} successful, ${failed} failed`);
    }
  }
}

// Run the script
uploadGlobalDocuments().catch((error) => {
  console.error('Fatal error:', error);
  process.exit(1);
});

