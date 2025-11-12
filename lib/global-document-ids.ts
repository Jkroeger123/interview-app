/**
 * Ragie Partition Strategy for Document Organization
 * 
 * This file documents how documents are organized in Ragie using partitions.
 * No code is needed here - partitions are automatically managed!
 * 
 * ## Partition Naming Convention
 * 
 * ### Global Reference Documents
 * Pattern: `visa-{visaType}`
 * Examples:
 *   - visa-tourist (B-1/B-2 visa reference documents)
 *   - visa-student (F-1 visa reference documents)
 *   - visa-work (H-1B visa reference documents)
 *   - visa-immigrant (Green Card reference documents)
 *   - visa-fiance (K-1 visa reference documents)
 * 
 * ### User-Uploaded Documents
 * Pattern: `visa-{visaType}-user-{userId}`
 * Examples:
 *   - visa-tourist-user-user_abc123
 *   - visa-student-user-user_def456
 * 
 * ## How It Works
 * 
 * 1. **Global Documents**: Upload using `scripts/upload-global-docs.ts`
 *    - Documents are uploaded to partition `visa-{visaType}`
 *    - Accessible to all users interviewing for that visa type
 * 
 * 2. **User Documents**: Automatically handled during interview flow
 *    - When user uploads documents, they go to `visa-{visaType}-user-{userId}`
 *    - Only accessible to that specific user
 * 
 * 3. **Agent Queries**: Agent receives both partition names via config
 *    - Queries: [`visa-tourist`, `visa-tourist-user-user_123`]
 *    - Ragie searches both partitions and returns relevant chunks
 * 
 * ## Benefits
 * 
 * ✅ No need to track document IDs
 * ✅ Documents automatically scoped by visa type
 * ✅ User documents isolated per user
 * ✅ Easy to add/remove documents - just upload/delete in Ragie
 * ✅ Can re-upload global docs anytime without code changes
 * 
 * ## To Upload Global Documents
 * 
 * ```bash
 * cd /Users/justinkroeger/interview-app
 * npx tsx scripts/upload-global-docs.ts
 * ```
 * 
 * See `scripts/README.md` for detailed instructions.
 */

export const PARTITION_INFO = {
  pattern: {
    global: "visa-{visaType}",
    user: "visa-{visaType}-user-{userId}",
  },
  examples: {
    tourist: {
      global: "visa-tourist",
      user: "visa-tourist-user-user_abc123",
    },
    student: {
      global: "visa-student",
      user: "visa-student-user-user_def456",
    },
  },
} as const;

