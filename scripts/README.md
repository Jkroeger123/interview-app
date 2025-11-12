# Scripts

Utility scripts for managing the Vysa application.

## upload-global-docs.ts

Upload global reference documents to Ragie for each visa type. These documents provide general legal context that the AI agent can reference during interviews.

### Prerequisites

1. **Ragie API Key**: Set `RAGIE_API_KEY` in your `.env.local` file
2. **Reference Documents**: Prepare PDF or DOC files containing visa law and procedure information

### Directory Structure

Create a `global-docs/` directory in the project root with subdirectories for each visa type:

```
global-docs/
├── tourist/          # B-1/B-2 visa documents
│   ├── b1-b2-overview.pdf
│   ├── tourist-visa-requirements.pdf
│   └── common-denial-reasons.pdf
├── student/          # F-1 visa documents
│   ├── f1-visa-guide.pdf
│   └── student-visa-requirements.pdf
├── work/             # H-1B visa documents
│   ├── h1b-overview.pdf
│   └── specialty-occupation-criteria.pdf
├── immigrant/        # Green Card documents
│   ├── immigrant-visa-categories.pdf
│   └── inadmissibility-grounds.pdf
└── fiance/           # K-1 visa documents
    ├── k1-visa-process.pdf
    └── marriage-requirements.pdf
```

### Suggested Documents to Include

**Tourist (B-1/B-2):**
- General tourist visa requirements
- Common red flags and denial reasons
- Ties to home country evaluation criteria
- Purpose of visit categories

**Student (F-1):**
- F-1 visa requirements and process
- Proof of financial support requirements
- SEVIS and I-20 information
- Post-graduation options (OPT, CPT)

**Work (H-1B):**
- H-1B visa requirements
- Specialty occupation definitions
- LCA and prevailing wage requirements
- H-1B lottery and cap information

**Immigrant:**
- Family-based immigration categories
- Employment-based immigration categories
- Inadmissibility grounds
- Affidavit of support requirements

**Fiancé (K-1):**
- K-1 visa process and timeline
- In-person meeting requirements
- Bona fide relationship criteria
- Adjustment of status after entry

### Usage

1. **Install dependencies** (if not already installed):
   ```bash
   npm install
   ```

2. **Place your documents** in the appropriate `global-docs/` subdirectories

3. **Run the upload script**:
   ```bash
   npx tsx scripts/upload-global-docs.ts
   ```

4. **Copy the output** into `lib/global-document-ids.ts`:
   ```typescript
   export const GLOBAL_RAGIE_DOCS: Record<VisaTypeId, string[]> = {
     tourist: ["ragie_doc_id_1", "ragie_doc_id_2"],
     student: ["ragie_doc_id_3"],
     // ... etc
   };
   ```

### What Documents to Use

You can source reference documents from:

1. **Official Government Sources:**
   - U.S. Department of State website
   - USCIS official guides
   - Embassy and consulate guidelines

2. **Legal Resources:**
   - Immigration law summaries
   - Visa category overviews
   - Policy memos and updates

3. **Educational Resources:**
   - Immigration lawyer guides
   - Visa application handbooks
   - Interview preparation guides

### Notes

- Documents must be in PDF, DOC, or DOCX format
- Ragie will automatically extract text and create embeddings
- Document IDs can be reused across deployments
- You only need to upload once; document IDs persist in Ragie

### Troubleshooting

**"RAGIE_API_KEY not found"**
- Ensure `.env.local` exists with `RAGIE_API_KEY=your_key`

**"Directory not found"**
- Create the `global-docs/` directory structure as shown above

**"Upload failed"**
- Check file format (PDF, DOC, DOCX only)
- Verify file size (max 10MB)
- Check Ragie API status and quota


