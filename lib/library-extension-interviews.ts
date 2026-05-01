// Hand-curated extension to LIBRARY_DERIVED_INTERVIEWS.
// Adds tracks not yet covered by the auto-generated library file.
// Survives regeneration of library-derived-interviews.ts.

import type { LibraryDerivedInterview } from "./library-derived-interviews";

export const EXTENSION_VISA_TYPE_IDS = [
  "h4",
  "l2",
  "mbgc",
  "naturalization",
  "h1b_site_beneficiary",
  "h1b_site_employer",
  "l1_site_beneficiary",
  "l1_site_employer",
] as const;

export type ExtensionVisaTypeId = (typeof EXTENSION_VISA_TYPE_IDS)[number];

export const EXTENSION_INTERVIEWS: Record<ExtensionVisaTypeId, LibraryDerivedInterview> = {
  "h4": {
    name: "H-4 Dependent Visa",
    code: "H-4",
    description: "For spouses and children of H-1B specialty workers",
    iconKey: "users",
    iconBgColor: "bg-pink-500/10",
    documentCategories: [
      {
        id: "relationship",
        label: "Relationship Evidence",
        description: "Marriage certificate, photos, joint records, birth certificates for children",
        required: true,
      },
      {
        id: "principal_case",
        label: "Principal H-1B Case",
        description: "Spouse's I-797 approval notice, employment letter, pay stubs, current status",
        required: true,
      },
      {
        id: "travel",
        label: "Travel and Immigration",
        description: "Passport, prior visas, prior U.S. entries, refusals",
        required: false,
      },
      {
        id: "other",
        label: "Other Evidence",
        description: "DS-160 confirmation, supporting case-specific documents",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "principal-case",
        label: "Principal H-1B Case",
        description: "Knowledge of spouse's employer, role, work location, and H-1B status",
      },
      {
        id: "relationship",
        label: "Dependency Relationship",
        description: "How and when you met, marriage timeline, family integration",
      },
      {
        id: "travel-plans",
        label: "Travel and Living Plans",
        description: "Where you'll live, when you travel, how long you intend to stay",
      },
      {
        id: "immigration-history",
        label: "Prior Immigration History",
        description: "Prior visas, refusals, overstays, status changes for both applicant and principal",
      },
    ],
    agentPromptContext: `This is an H-4 dependent visa interview. The H-4 is a derivative nonimmigrant visa for the qualifying spouse or child of an H-1B principal. The officer is assessing three things: whether the principal H-1B case is real and active, whether the dependency relationship is genuine and documented, and whether the applicant's answers are consistent and credible.

CORE ASSESSMENT AREAS:
1. PRINCIPAL CASE FAMILIARITY: Employer name, job role in simple terms, work city/state, whether the principal is already in the U.S., basic timeline of the principal's H-1B employment.
2. DEPENDENCY RELATIONSHIP: For spouse-based H-4 — how and when you met, marriage date, whether you have lived together, intended U.S. living plan. For child-based H-4 — parent-child relationship, custody facts, who the child will live with, school plans.
3. PRIOR IMMIGRATION HISTORY: Prior U.S. visas, refusals, prior entries, prior statuses, prior petitions tied to the principal or the dependent.

KEY PRINCIPLES:
- H-4 interviews are often brief and document-light but fact-sensitive. Long, wandering answers create avoidable problems.
- Be especially skeptical of weak knowledge of the principal's employer or job, recent marriages with thin evidence, hidden refusals, and separate filings with stale principal-case documents.
- Probe relationship timeline, principal-case familiarity, and DS-160 ownership.
- For child-based applicants, focus on parent-child relationship and custody/consent.`,
    sourceFolder: "Library 2/H4 - Functionality",
    sourceQuestionDocument: "H4 Questions",
    extractedQuestionCount: 100,
  },
  "l2": {
    name: "L-2 Dependent Visa",
    code: "L-2",
    description: "For spouses and children of L-1 intracompany transferees",
    iconKey: "users",
    iconBgColor: "bg-pink-500/10",
    documentCategories: [
      {
        id: "relationship",
        label: "Relationship Evidence",
        description: "Marriage certificate, photos, joint records, birth certificates for children",
        required: true,
      },
      {
        id: "principal_case",
        label: "Principal L-1 Case",
        description: "Spouse's L-1 approval notice or Blanket L documentation, employer letter, transfer details",
        required: true,
      },
      {
        id: "travel",
        label: "Travel and Immigration",
        description: "Passport, prior visas, prior U.S. entries, refusals",
        required: false,
      },
      {
        id: "other",
        label: "Other Evidence",
        description: "DS-160 confirmation, custody documents for children, supporting evidence",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "principal-case",
        label: "Principal L-1 Case",
        description: "Knowledge of spouse's employer, role, L-1A vs L-1B vs Blanket, work location, transfer purpose",
      },
      {
        id: "relationship",
        label: "Dependency Relationship",
        description: "How and when you met, marriage timeline, family integration",
      },
      {
        id: "travel-plans",
        label: "Travel and Living Plans",
        description: "Where you'll live, when you travel, how long you intend to stay",
      },
      {
        id: "immigration-history",
        label: "Prior Immigration History",
        description: "Prior visas, refusals, overstays, status changes for both applicant and principal",
      },
    ],
    agentPromptContext: `This is an L-2 dependent visa interview. The L-2 is a derivative visa for the qualifying spouse or child of an L-1 (intracompany transferee) principal. The officer wants to confirm: the principal L-1 case is valid and coherent, the applicant qualifies as a true derivative, and the applicant's answers are consistent with the forms and supporting record.

CORE ASSESSMENT AREAS:
1. PRINCIPAL L-1 CASE: Employer name, general role of the principal, whether the principal is L-1A, L-1B, or Blanket L, U.S. city/state of work, whether the principal is already in the U.S., basic transfer purpose.
2. DEPENDENCY RELATIONSHIP: For spouse-based L-2 — how and when you met, marriage date, whether you have lived together, U.S. living plan. For child-based L-2 — parent-child relationship, custody facts, who the child will live with.
3. PRIOR IMMIGRATION HISTORY: Prior U.S. visas, refusals, prior entries, prior statuses, prior derivative filings, principal's relevant visa history.

KEY PRINCIPLES:
- Derivative interviews are often brief. Rambling answers create confusion where short answers would have sufficed.
- Red flags: weak knowledge of the L-1 case, vague transfer explanation, recent marriage with thin evidence, hidden refusals, separate filings with stale principal documents, weak custody documentation in child cases, thin documentary support in Blanket L derivative cases.
- Probe employer identity, transfer purpose, marriage timeline, and DS-160 ownership.`,
    sourceFolder: "Library 2/L2 - Functionality",
    sourceQuestionDocument: "L2 Questions",
    extractedQuestionCount: 104,
  },
  "mbgc": {
    name: "Marriage-Based Green Card",
    code: "IR-1/CR-1",
    description: "USCIS field office or consular interview to prove a bona fide marriage",
    iconKey: "heart",
    iconBgColor: "bg-pink-500/10",
    documentCategories: [
      {
        id: "relationship",
        label: "Relationship Evidence",
        description: "Wedding photos, joint travel, communication records, photos with each other's families",
        required: true,
      },
      {
        id: "cohabitation",
        label: "Joint Residence",
        description: "Lease or mortgage, utility bills, mail addressed to both spouses",
        required: true,
      },
      {
        id: "financial",
        label: "Joint Finances",
        description: "Joint bank accounts, joint tax returns, shared insurance, beneficiary designations, I-864 with supporting tax/income documents",
        required: true,
      },
      {
        id: "civil",
        label: "Civil Documents",
        description: "Marriage certificate, birth certificates, divorce decrees from prior marriages, police certificates (consular)",
        required: true,
      },
      {
        id: "other",
        label: "Other Evidence",
        description: "I-130/I-485 receipts (USCIS) or DS-260 confirmation (consular), medical exam (consular), interview notice",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "bona-fide-marriage",
        label: "Bona Fide Marriage",
        description: "Origin and timeline of the relationship, wedding details, emotional and family integration",
      },
      {
        id: "shared-life",
        label: "Daily Shared Life",
        description: "Routines, household details, daily communication, shared knowledge of each other",
      },
      {
        id: "joint-residence-finances",
        label: "Joint Residence and Finances",
        description: "Where you live together, commingling of finances, shared obligations",
      },
      {
        id: "consistency",
        label: "Consistency With Petition",
        description: "Alignment with I-130, I-485 or DS-260, and any prior immigration filings",
      },
    ],
    agentPromptContext: `This is a marriage-based green card interview. The interview is conducted by USCIS (for adjustment of status within the U.S.) or by a consular officer abroad (for immigrant visa processing). The officer's job is to determine whether the marriage is bona fide and not entered into solely for immigration benefits. Authority: INA §204(c) bars approval where there is evidence of prior or current sham marriage; INA §212(a)(6)(C) makes misrepresentation grounds for inadmissibility.

CORE ASSESSMENT AREAS:
1. BONA FIDE MARRIAGE: How and when you met, courtship timeline, wedding details, family integration on both sides, future plans together.
2. DAILY SHARED LIFE: Routines, household details (who cooks, sleeps on which side, daily schedule), shared knowledge of each other, communication patterns.
3. JOINT RESIDENCE AND FINANCES: Cohabitation, commingled finances (joint accounts, joint tax returns, joint leases), shared obligations and beneficiary designations.
4. CONSISTENCY: Answers must align with the I-130 petition, I-485 or DS-260, and any prior filings.

KEY PRINCIPLES:
- Apply the bona fide marriage standard; presumption of fraud is heightened where the marriage formed shortly after entry on a nonimmigrant visa.
- If the spouses are interviewed separately (Stokes-style), answers should be materially consistent across rooms.
- Officers are trained to detect rehearsed or coached responses — natural, honest, sometimes-imperfect answers are stronger than polished scripts.
- Red flags: large age gaps, cultural disconnect with no bridge, short window between entry and marriage, no shared residence or finances, inconsistent answers, minimal contact with each other's families, prior I-130 petitions by the same petitioner.
- Where the applicant is unsure, 'I don't know' or 'I'm not sure' is safer than guessing.`,
    sourceFolder: "Library 2/MB GC - Functionality",
    sourceQuestionDocument: "MB GC Questions",
    extractedQuestionCount: 206,
  },
  "naturalization": {
    name: "Naturalization Interview",
    code: "N-400",
    description: "USCIS interview for U.S. citizenship including civics and English",
    iconKey: "landmark",
    iconBgColor: "bg-blue-500/10",
    documentCategories: [
      {
        id: "core",
        label: "Core Documents",
        description: "Interview notice, green card, passport(s), state ID, N-400 copy",
        required: true,
      },
      {
        id: "travel",
        label: "Travel Records",
        description: "List of all trips abroad, passport stamps, evidence of continued residence",
        required: false,
      },
      {
        id: "criminal",
        label: "Criminal/Citation Records",
        description: "Certified court dispositions, police reports, proof of completion of probation/fines",
        required: false,
      },
      {
        id: "tax",
        label: "Tax Records",
        description: "IRS tax transcripts, payment plan documentation, proof of current compliance",
        required: false,
      },
      {
        id: "marital",
        label: "Marital Records (3-Year Rule)",
        description: "Spouse's citizenship proof, marriage certificate, proof of marital union, joint documents",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "n400-review",
        label: "N-400 Review",
        description: "Walkthrough of every form answer — addresses, employers, trips, marital history, eligibility yes/no questions",
      },
      {
        id: "residence-presence",
        label: "Continuous Residence and Physical Presence",
        description: "Trips abroad, days outside the U.S., trips of 6 months or longer, maintained U.S. ties during travel",
      },
      {
        id: "good-moral-character",
        label: "Good Moral Character",
        description: "Arrests, citations, tax compliance, support obligations, Selective Service, unlawful acts during the statutory period",
      },
      {
        id: "civics-english",
        label: "Civics and English",
        description: "Civics test, English speaking/reading/writing under interview pressure, unless statutorily exempt",
      },
    ],
    agentPromptContext: `This is a naturalization interview conducted by USCIS after Form N-400. The officer is determining whether the applicant qualifies for U.S. citizenship and can satisfy the interview, English, and civics requirements unless exempt. This is NOT a consular interview — it is a USCIS interview. The officer reviews eligibility, truthfulness, continuity of residence, and moral character.

CORE ASSESSMENT AREAS:
1. N-400 REVIEW: Officer typically moves through the application systematically — addresses, employers, every trip, marital history, every yes/no eligibility answer.
2. CONTINUOUS RESIDENCE & PHYSICAL PRESENCE: Trips abroad, total days outside the U.S., longest trip, trips of six months or longer, maintenance of U.S. home/job/family during travel.
3. GOOD MORAL CHARACTER: Arrests, citations, charges, convictions, probation, taxes owed, support obligations, Selective Service registration where required, any unlawful acts during the statutory period.
4. ENGLISH AND CIVICS: Unless exempt, applicant must demonstrate basic English ability and pass civics testing.
5. THREE-YEAR RULE (if applicable): Continued marital union with U.S. citizen spouse, joint taxes, ongoing relationship.

KEY PRINCIPLES:
- The applicant bears the burden of establishing eligibility in every respect.
- Problems in the underlying LPR grant can resurface at naturalization.
- Red flags: inconsistent N-400 answers, omitted travel, residence-break concerns, unpaid taxes, Selective Service issues, undisclosed arrests or citations, underlying LPR eligibility concerns.
- The interview is both a legal eligibility interview AND a communication test under pressure. Practice oral answers, not just written ones.
- Honesty about negative facts (with documentation) is far safer than denial. 'I don't remember exactly' is safer than approximation on dates and trips.`,
    sourceFolder: "Library 2/NATURALIZATION - Functionality",
    sourceQuestionDocument: "NATURALIZATION Questions",
    extractedQuestionCount: 105,
  },
  "h1b_site_beneficiary": {
    name: "H-1B FDNS Site Visit (Beneficiary)",
    code: "FDNS / H-1B",
    description: "Workplace verification by USCIS Fraud Detection officers — beneficiary side",
    iconKey: "briefcase",
    iconBgColor: "bg-amber-500/10",
    documentCategories: [
      {
        id: "petition",
        label: "Petition Materials",
        description: "I-129 petition, I-797 approval notice, LCA, job description as filed",
        required: true,
      },
      {
        id: "employment",
        label: "Employment Records",
        description: "Recent pay stubs, badge/ID, workstation evidence, current org chart",
        required: true,
      },
      {
        id: "client_placement",
        label: "Client Placement (if applicable)",
        description: "Client letter, end-client supervision documentation, MSA/SOW excerpts",
        required: false,
      },
      {
        id: "other",
        label: "Other Evidence",
        description: "Any internal compliance documentation referenced by HR",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "duties-daily-work",
        label: "Duties & Daily Work",
        description: "What you actually do day-to-day, projects, tools, who assigns tasks",
      },
      {
        id: "supervision",
        label: "Supervision & Reporting",
        description: "Who supervises you, how often, who evaluates performance",
      },
      {
        id: "location-schedule",
        label: "Work Location & Schedule",
        description: "Where you work, remote/hybrid status, whether locations have changed",
      },
      {
        id: "compensation",
        label: "Compensation",
        description: "Salary amount, pay frequency, treatment of nonproductive time",
      },
      {
        id: "client-placement",
        label: "Client Placement",
        description: "If at a client site: who controls day-to-day work, who supervises on-site",
      },
    ],
    agentPromptContext: `This is an FDNS (Fraud Detection and National Security) Administrative Site Visit interview from the H-1B beneficiary's perspective. This is NOT a visa interview, NOT a new petition adjudication, and NOT a test of technical skills. It is a post-approval compliance and fact-verification exercise — often unannounced — to confirm that the beneficiary's actual employment matches what was filed in the H-1B petition.

WHAT FDNS EVALUATES (CONSISTENCY ACROSS THREE SOURCES):
1. The H-1B petition and filings
2. Employer / HR statements
3. The beneficiary's statements
Even small inconsistencies can escalate into RFEs, NOIRs, petition revocation, or future immigration complications.

CORE ASSESSMENT AREAS:
- DUTIES & DAILY WORK: Typical day, current projects, tools/systems, who assigns tasks.
- WORK LOCATION: Where the beneficiary works most days, remote/hybrid status, location changes since filing.
- SUPERVISION: Direct supervisor, frequency of interaction, who evaluates performance.
- COMPENSATION: Pay amount, pay frequency, treatment of nonproductive time.
- CLIENT PLACEMENT (if applicable): Who supervises on-site, who controls day-to-day work.

INTERVIEW STYLE:
- Conversational, sequential, designed to confirm details already in the petition.
- The beneficiary should answer ONLY what is asked, factually, without speculation, immigration jargon, or legal conclusions.
- 'I don't want to guess. I can confirm that information.' is acceptable.

RED FLAGS:
- Describing duties differently than the petition
- Overstating autonomy if supervised, or understating supervision if it exists
- Guessing salary figures
- Describing work as 'freelance' or 'independent'
- Contradicting HR or the manager

Be skeptical of overly polished or rehearsed-sounding answers — FDNS is testing reality, not perfection.`,
    sourceFolder: "Library 2/H1B FDNS Site Visit - Beneficiary Side",
    sourceQuestionDocument: "FDNS Site Visit Prep Guide & Questions",
    extractedQuestionCount: 16,
  },
  "h1b_site_employer": {
    name: "H-1B FDNS Site Visit (Employer / HR)",
    code: "FDNS / H-1B (HR)",
    description: "Workplace verification by USCIS Fraud Detection officers — employer / HR side",
    iconKey: "briefcase",
    iconBgColor: "bg-amber-500/10",
    documentCategories: [
      {
        id: "petition",
        label: "Petition Materials",
        description: "I-129 petition summary, LCA postings, approval notice, certified job description",
        required: true,
      },
      {
        id: "payroll",
        label: "Payroll & Compensation",
        description: "Recent payroll records, pay stubs, prevailing wage documentation",
        required: true,
      },
      {
        id: "operations",
        label: "Operational Documents",
        description: "Org charts (current), office lease or proof of premises, work schedules",
        required: true,
      },
      {
        id: "client_contracts",
        label: "Client Contracts (if applicable)",
        description: "MSA/SOW or end-client letter for client-placed beneficiaries",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "employment-basics",
        label: "Employment Basics",
        description: "Start date, title, hours, work location, supervisor identity",
      },
      {
        id: "duties-role",
        label: "Duties & Role Alignment",
        description: "Day-to-day duties, alignment with petition, any changes since filing",
      },
      {
        id: "compensation",
        label: "Compensation",
        description: "Salary, pay frequency, nonproductive-time treatment, prevailing wage compliance",
      },
      {
        id: "supervision",
        label: "Supervision Structure",
        description: "Who assigns work, who evaluates, supervision frequency",
      },
      {
        id: "location-client",
        label: "Worksite & Client Placement",
        description: "Physical worksite, hybrid/remote arrangements, client-site supervision",
      },
    ],
    agentPromptContext: `This is an FDNS Administrative Site Visit interview from the EMPLOYER / HR perspective for an H-1B petition. FDNS site visits are post-approval compliance and verification actions — NOT visa interviews, NOT new-petition adjudications, NOT criminal investigations.

FDNS'S DUAL VERIFICATION GOAL:
1. The facts in the petition match reality.
2. The employer is complying with the material terms of the H-1B filing.

FDNS WILL CROSS-CHECK ANSWERS ACROSS:
- HR personnel
- The beneficiary's direct supervisor
- Company management
- The H-1B beneficiary
- Client-site representatives (if applicable)
Even small discrepancies between these sources can escalate.

CORE ASSESSMENT AREAS:
- EMPLOYMENT BASICS: Start date, title, supervisor, hours, physical worksite.
- DUTIES & ROLE: Day-to-day duties, whether the beneficiary is performing what the petition describes, any changes.
- COMPENSATION: Salary, pay frequency, payment during nonproductive time (LCA compliance).
- SUPERVISION: Who assigns work, who evaluates, frequency.
- LOCATION & CLIENT PLACEMENT: Where the employee works, client-site arrangements, who supervises on client site.

INTERVIEW STYLE & PRINCIPLES:
- Use business language, NOT immigration jargon.
- Align answers with actual practice, not idealized descriptions.
- 'I need to confirm that information' is acceptable when uncertain.
- Provide only requested documents; do not volunteer additional documentation.

COMMON HR MISTAKES TO PROBE:
- Guessing when unsure
- Speculating about duties or schedules
- Over-explaining or adding unnecessary detail
- Contradicting the beneficiary's account
- Treating the visit casually

Consistency is the primary risk factor — not technical knowledge of immigration law.`,
    sourceFolder: "Library 2/H1B FDNS Site Visit - Employer Side",
    sourceQuestionDocument: "FDNS Site Visit Prep Guide & Questions",
    extractedQuestionCount: 17,
  },
  "l1_site_beneficiary": {
    name: "L-1 FDNS Site Visit (Beneficiary)",
    code: "FDNS / L-1",
    description: "Workplace verification by FDNS for L-1A or L-1B transferees — beneficiary side",
    iconKey: "briefcase",
    iconBgColor: "bg-amber-500/10",
    documentCategories: [
      {
        id: "petition",
        label: "Petition Materials",
        description: "L-1 approval notice, petition cover, role description as filed, blanket L documentation if applicable",
        required: true,
      },
      {
        id: "role",
        label: "Role Evidence",
        description: "Current org chart showing reports/peers, recent project artifacts, internal title and team",
        required: true,
      },
      {
        id: "qualifying_relationship",
        label: "Qualifying Relationship",
        description: "Foreign-entity employment record, transfer documentation, parent/affiliate proof",
        required: false,
      },
      {
        id: "other",
        label: "Other Evidence",
        description: "Any compliance documentation referenced by HR or counsel",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "role-reality",
        label: "Role Reality",
        description: "What you actually do day-to-day vs. the L-1A managerial / L-1B specialized-knowledge framing of the petition",
      },
      {
        id: "reporting-structure",
        label: "Reporting Structure",
        description: "Who you report to, who reports to you, decision-making authority",
      },
      {
        id: "specialized-knowledge",
        label: "Specialized Knowledge (L-1B)",
        description: "Company-specific or proprietary expertise, how it was acquired, why it cannot be easily replaced",
      },
      {
        id: "managerial-authority",
        label: "Managerial Authority (L-1A)",
        description: "Subordinates, decisions made independently, separation between strategic and hands-on work",
      },
      {
        id: "location-control",
        label: "Work Location & Control",
        description: "Where and how you work, client sites, remote arrangements",
      },
    ],
    agentPromptContext: `This is an FDNS Administrative Site Visit interview for an L-1A or L-1B transferee, from the BENEFICIARY's perspective. FDNS is not investigating in a consular sense — it is a compliance verification exercise asking: 'Is this person actually performing the role described in the petition, under the structure described, at the location described?' FDNS officers are trained to detect misalignment, not to test legal knowledge.

WHAT FDNS EVALUATES:
1. ROLE REALITY: What the beneficiary actually does day-to-day.
2. REPORTING STRUCTURE: Who they report to and who reports to them.
3. WORK LOCATION & CONTROL: Where and how the work happens.
4. CONSISTENCY: Alignment with the petition, HR records, and manager statements.

L-1A FOCUS (Executives / Managers): Test whether the beneficiary is truly managing people or functions (not tasks), exercising discretion and authority, operating at a strategic level. Probe: who reports to them, what decisions they make, what they do NOT personally execute, how their role differs from subordinates'.
Red-flag language to watch for: 'I help out with...' / 'I sometimes do hands-on work' / 'We're a small team so I do everything'.

L-1B FOCUS (Specialized Knowledge): Test whether the beneficiary's knowledge is company-specific, proprietary or uncommon, and not easily transferable. Probe: what makes the knowledge unique within the company, why others cannot easily replace them, how the knowledge was acquired, how it is used in the current role.
Red flags: generic IT/industry buzzwords, descriptions that sound like standard H-1B duties, statements suggesting outsourcing or commoditization.

INTERVIEW STYLE:
- Conversational, often informal — at desk, conference room, or on the floor.
- Beneficiary should answer truthfully and narrowly, defer to HR for filings/legal questions, not guess or speculate, not inflate authority or expertise.
- Probe: 'Can someone else do your job?' / 'Do you do hands-on work?' / 'Do you manage people directly?' / 'Is your work client-facing?' — answers should be factual with context, not defensive.

Overstatement is riskier than understatement. The beneficiary's role should sound exactly like the petition describes.`,
    sourceFolder: "Library 2/L1 Site Visit - Beneficiary",
    sourceQuestionDocument: "FDNS Site Visit Prep Guide & Questions",
    extractedQuestionCount: 24,
  },
  "l1_site_employer": {
    name: "L-1 FDNS Site Visit (Employer / HR)",
    code: "FDNS / L-1 (HR)",
    description: "Workplace verification by FDNS for L-1A or L-1B transferees — employer / HR side",
    iconKey: "briefcase",
    iconBgColor: "bg-amber-500/10",
    documentCategories: [
      {
        id: "petition",
        label: "Petition Materials",
        description: "L-1 petition, approval notice, blanket L documentation, role description as filed",
        required: true,
      },
      {
        id: "qualifying_relationship",
        label: "Qualifying Relationship",
        description: "Parent/subsidiary/affiliate proof, ownership records, current corporate structure",
        required: true,
      },
      {
        id: "operations",
        label: "Operations & Worksite",
        description: "Org charts (current, not aspirational), office lease, payroll records, job descriptions",
        required: true,
      },
      {
        id: "client_contracts",
        label: "Client Contracts (if applicable)",
        description: "Off-site placement agreements, end-client supervision documentation",
        required: false,
      },
    ],
    focusAreas: [
      {
        id: "company-operations",
        label: "Company Operations",
        description: "What the company does, revenue model, U.S. operation size, foreign-entity relationship",
      },
      {
        id: "qualifying-relationship",
        label: "Qualifying Relationship",
        description: "Parent/subsidiary/affiliate links, ownership percentages, changes since filing",
      },
      {
        id: "control-supervision",
        label: "Control & Supervision",
        description: "Who assigns work, evaluates performance, approves leave, can discipline or terminate",
      },
      {
        id: "managerial-or-specialized",
        label: "Managerial vs. Specialized Knowledge",
        description: "Reporting lines (L-1A); uniqueness of knowledge vs. industry standard (L-1B)",
      },
      {
        id: "consistency",
        label: "Consistency Since Approval",
        description: "Role, reporting, location, and headcount changes since the petition was filed",
      },
    ],
    agentPromptContext: `This is an FDNS Administrative Site Visit interview for an L-1A or L-1B transferee, from the EMPLOYER / HR / MANAGER perspective. From FDNS's perspective, the employer is the primary source of truth. FDNS is asking: 'Is this company operating as described, exercising real control over the L-1 employee, and using the L-1 category appropriately?' Most negative outcomes result from internal inconsistency, not fraud.

FIVE EMPLOYER-SIDE QUESTIONS FDNS EVALUATES:
1. Is the business real, active, and operating as described?
2. Is the qualifying relationship genuine and ongoing?
3. Does the organizational structure support the claimed role?
4. Is the beneficiary supervised and controlled appropriately?
5. Do HR, management, and the beneficiary tell the same story?

FDNS WILL CROSS-CHECK ANSWERS ACROSS:
- HR or global mobility
- Direct manager / supervisor
- Senior leadership (in smaller companies)
- The beneficiary (separately)

CORE ASSESSMENT AREAS:
- COMPANY OPERATIONS: What the company does, how revenue is generated, size of U.S. operation, foreign-entity relationship.
- QUALIFYING RELATIONSHIP: Parent/subsidiary/affiliate links, ownership percentages, changes since filing, where management control resides.
- CONTROL & SUPERVISION: Who assigns work, evaluates performance, approves leave, can discipline or terminate. Especially critical for L-1B, blanket petitions, hybrid/remote arrangements.
- L-1A SPECIFIC: Reporting lines, number and level of subordinates, decision-making authority, separation between strategic and hands-on work. Avoid 'we're small so everyone does everything', 'they help out wherever needed', 'titles don't really matter here'. FDNS looks at structure, not titles.
- L-1B SPECIFIC (HIGHEST SCRUTINY): What knowledge is specialized, how it differs from industry-standard knowledge, how it was developed internally, why the company needs this person. Avoid duties that sound routine/generic, implying easy replacement, suggesting outsourcing or vendor equivalence.
- CHANGES SINCE APPROVAL: Changes are not automatically fatal, but unexplained changes are. Acknowledge changes, explain when and why.

INTERVIEW STYLE:
- Use business language, not immigration jargon.
- Align answers with actual practice, not idealized descriptions.
- Defer legal questions to counsel; do not improvise documentation.
- Overstatement is riskier than understatement. L-1B and blanket cases receive heightened scrutiny.`,
    sourceFolder: "Library 2/L1 FDNS Site Visit - Employer Side",
    sourceQuestionDocument: "FDNS Site Visit Prep Guide & Questions",
    extractedQuestionCount: 20,
  },
};

export const EXTENSION_QUESTION_BANKS: Record<ExtensionVisaTypeId, string[]> = {
  "h4": [
    "Why are you applying for an H-4 visa?",
    "Who is the principal H-1B visa holder?",
    "What is your relationship to the principal applicant?",
    "Is the principal your spouse or parent?",
    "What is your spouse's full name?",
    "What does your spouse do for work?",
    "Which company does your spouse work for?",
    "Where does your spouse work?",
    "Is your spouse currently in the United States?",
    "When did your spouse last enter the United States?",
    "Where will you live in the United States?",
    "When do you plan to travel?",
    "Have you been to the United States before?",
    "Have you ever had a U.S. visa before?",
    "Have you ever been refused a U.S. visa?",
    "When did you get married?",
    "Where did you get married?",
    "Do you have your marriage certificate?",
    "Do you have a copy of your spouse's H-1B approval?",
    "Do you have your spouse's employment documents?",
    "What is your spouse's job title?",
    "What city and state does your spouse live in?",
    "What is your spouse's salary range?",
    "How long has your spouse worked for that employer?",
    "Did your spouse change employers recently?",
    "Are you traveling together or separately?",
    "If separately, why are you traveling separately?",
    "How long do you intend to stay in the United States?",
    "Have you previously held any other U.S. status?",
    "Did you complete the DS-160 yourself?",
    "Did your spouse ever receive an RFE or denial?",
    "Has your spouse ever fallen out of status?",
    "Has your spouse changed work location?",
    "Do you know who your spouse reports to?",
    "Do you know whether your spouse works onsite, remote, or hybrid?",
    "How did you meet your spouse?",
    "When did you first meet in person?",
    "When did the relationship become serious?",
    "Who proposed?",
    "When did you get engaged?",
    "Who attended your wedding?",
    "Was it a large or small wedding?",
    "Where do your spouse's parents live?",
    "Have you met your spouse's family?",
    "What languages do you speak with your spouse?",
    "How do you stay in touch when apart?",
    "When did you last see your spouse in person?",
    "How long have you lived together?",
    "What are your plans once you arrive in the United States?",
    "Do you have wedding photos?",
    "What attracted you to your spouse?",
    "What does your spouse do on weekends?",
    "What are your spouse's hobbies?",
    "What is your spouse's highest degree?",
    "What kind of work schedule does your spouse have?",
    "Have you traveled together?",
    "Where did you go on your honeymoon?",
    "Do you and your spouse share finances?",
    "Do you plan to work in the United States?",
    "Do you plan to study in the United States?",
    "Was your marriage arranged?",
    "How long did you date before marriage?",
    "Have you ever broken up?",
    "What is your spouse's date of birth?",
    "What is your spouse's phone number?",
    "What is your spouse's U.S. address?",
    "What apps do you use to communicate?",
    "What was the last gift your spouse gave you?",
    "What did you do together during your last visit?",
    "Why did you marry when you did?",
    "Who is the H-1B parent?",
    "How old are you?",
    "Have you been to the U.S. before?",
    "Which parent do you currently live with?",
    "Will both parents be in the United States?",
    "Do you have your birth certificate?",
    "What school will you attend in the United States?",
    "Are you traveling with a parent now?",
    "Do you have custody documents if needed?",
    "When was the last time you saw your H-1B parent?",
    "What does your parent do for work?",
    "Where does your parent work?",
    "What city will you live in?",
    "Do you know how long you will stay?",
    "Have you ever applied for a U.S. visa before?",
    "Have you ever overstayed in the United States?",
    "Have you ever worked in the United States?",
    "Have you ever studied in the United States?",
    "Have you ever changed status in the United States?",
    "Has your spouse ever been refused a visa?",
    "Has your spouse ever changed employers?",
    "Has your spouse ever changed status?",
    "Do you know your spouse's current immigration status?",
    "Were you ever listed in another visa application?",
    "Did you previously apply for another dependent visa?",
    "Have you ever had administrative processing before?",
    "Is anything in this application different from your prior application?",
    "Is all the information in your DS-160 true and correct?",
    "Why are you traveling separately from your spouse?",
    "Do you have your spouse's H-1B approval notice?",
  ],
  "l2": [
    "Why are you applying for an L-2 visa?",
    "Who is the principal L-1 visa holder?",
    "What is your relationship to the principal applicant?",
    "Is the principal your spouse or parent?",
    "What is your spouse's full name?",
    "What company does your spouse work for?",
    "What does your spouse do for work?",
    "Is your spouse coming to the U.S. on L-1A or L-1B?",
    "Is this connected to a Blanket L case?",
    "Where will your spouse work in the United States?",
    "Is your spouse already in the United States?",
    "When do you plan to travel?",
    "Where will you live in the United States?",
    "Have you been to the United States before?",
    "Have you ever had a U.S. visa before?",
    "Have you ever been refused a U.S. visa?",
    "When did you get married?",
    "Do you have your marriage certificate?",
    "Do you have a copy of your spouse's L-1 approval documents?",
    "Are you applying together or separately?",
    "What is your spouse's job title?",
    "What city and state will your spouse work in?",
    "Why is your spouse being transferred?",
    "How long will your spouse work in the United States?",
    "Has your spouse worked for this company abroad?",
    "How long has your spouse been with the company?",
    "Are you traveling with children?",
    "How long do you intend to stay?",
    "Did you complete the DS-160 yourself?",
    "Do you know your spouse's U.S. employer address?",
    "Has your spouse changed employers recently?",
    "Has your spouse changed work location?",
    "Has your spouse ever been refused an L visa?",
    "Do you know whether the principal petition was Blanket or individual?",
    "Has your spouse been in the U.S. before in another status?",
    "How did you meet your spouse?",
    "When did you first meet in person?",
    "When did the relationship become serious?",
    "Who proposed?",
    "When did you get engaged?",
    "Who attended your wedding?",
    "Was it a large or small wedding?",
    "Have you met your spouse's family?",
    "What languages do you speak together?",
    "How do you stay in touch when apart?",
    "When did you last see your spouse in person?",
    "Have you lived together?",
    "What are your plans after arriving in the United States?",
    "Do you have wedding photos?",
    "Do you know your spouse's date of birth?",
    "What attracted you to your spouse?",
    "What are your spouse's hobbies?",
    "What kind of work schedule does your spouse have?",
    "Have you traveled together?",
    "Where did you go on your honeymoon?",
    "Do you and your spouse share finances?",
    "What is your spouse's educational background?",
    "What is your spouse's U.S. address?",
    "What kind of home will you live in?",
    "Do you plan to study or work in the United States?",
    "Was your marriage arranged?",
    "How long did you date before marriage?",
    "Have you ever broken up?",
    "What is your spouse's phone number?",
    "What apps do you use to communicate?",
    "What was the last gift your spouse gave you?",
    "What did you do during your last visit together?",
    "Why did you marry when you did?",
    "Have you met your spouse's coworkers?",
    "What do you and your spouse do on weekends?",
    "Who is the L-1 parent?",
    "How old are you?",
    "Have you been to the U.S. before?",
    "Which parent do you currently live with?",
    "Will both parents be in the United States?",
    "Do you have your birth certificate?",
    "What school will you attend in the United States?",
    "Are you traveling now with a parent?",
    "Do you have custody documents if needed?",
    "When did you last see your L-1 parent?",
    "What does your parent do for work?",
    "Which company does your parent work for?",
    "What city will you live in?",
    "Do you know how long you will stay?",
    "Have you ever applied for a U.S. visa before?",
    "Have you ever overstayed in the United States?",
    "Have you ever studied in the United States?",
    "Have you ever worked in the United States?",
    "Have you ever changed status in the U.S.?",
    "Has your spouse ever been refused a visa?",
    "Has your spouse ever been denied L-1 classification?",
    "Has your spouse ever changed immigration status?",
    "Do you know your spouse's current status history?",
    "Were you listed in an earlier visa application?",
    "Did you previously apply for L-2 or another derivative visa?",
    "Have you had administrative processing before?",
    "Is anything different from your prior application?",
    "Is everything in your DS-160 true and correct?",
    "Which company does your spouse work for?",
    "Is your spouse L-1A or L-1B?",
    "Why is your spouse being transferred to the United States?",
    "Do you have your spouse's approval notice or support documents?",
    "What city will your spouse work in?",
    "Is all the information in your DS-160 true and correct?",
  ],
  "mbgc": [
    "When and where did you meet your spouse?",
    "What attracted you to your spouse?",
    "When did you decide to get married?",
    "Where was the wedding held?",
    "Who attended the wedding?",
    "What did you do after the wedding?",
    "Where do you currently live?",
    "How many rooms are in your home?",
    "What side of the bed does your spouse sleep on?",
    "Who wakes up first in the morning?",
    "Who usually makes breakfast?",
    "What is your spouse's typical work schedule?",
    "What time does your spouse get home from work?",
    "What kind of car does your spouse drive?",
    "Do you share a bank account?",
    "Do you share a lease or mortgage?",
    "What's your spouse's cellphone number?",
    "What kind of toothpaste do you both use?",
    "Who is your internet provider?",
    "When is your spouse's birthday?",
    "What is your spouse's phone number?",
    "What is your spouse's email address?",
    "What kind of phone does your spouse use?",
    "Do you own or rent your home?",
    "How much is your rent or mortgage?",
    "What floor do you live on?",
    "Do you have laundry in-unit or on-site?",
    "Do you have any roommates?",
    "What color is your spouse's toothbrush?",
    "What brand of shampoo does your spouse use?",
    "What are your spouse's parents' names?",
    "Have you met your spouse's family?",
    "How did your spouse propose?",
    "What TV shows do you watch together?",
    "What holidays have you celebrated together?",
    "Who pays the bills?",
    "Do you attend religious services?",
    "What was the last movie you watched together?",
    "Do you have health insurance together?",
    "Who does the grocery shopping?",
    "What is your spouse's job title?",
    "What is your spouse's salary?",
    "When did you move in together?",
    "Have you traveled together?",
    "Where did you go on your honeymoon?",
    "What's your morning routine?",
    "What's your spouse's favorite food?",
    "What allergies does your spouse have?",
    "What medications does your spouse take?",
    "Do you have any pets?",
    "What are your weekend routines?",
    "What's your spouse's favorite restaurant?",
    "What's your spouse's favorite drink?",
    "How do you celebrate anniversaries?",
    "Who usually drives when you go out?",
    "Do you have joint credit cards?",
    "Have you filed taxes jointly?",
    "Do you share a gym membership or streaming account?",
    "What kind of music does your spouse like?",
    "How does your spouse commute to work?",
    "What kind of birth control do you use?",
    "What time do you go to bed?",
    "What's your spouse's best friend's name?",
    "What deodorant brand does your spouse use?",
    "Where do you keep the dirty laundry?",
    "What does your living room couch look like?",
    "Where do you keep important documents?",
    "Do you share a car?",
    "When did you last go to a doctor together?",
    "What time did your spouse leave home today?",
    "What color are your bedroom curtains?",
    "What brand is your microwave?",
    "Where do you keep your cleaning supplies?",
    "Do you have a joint savings goal?",
    "What kind of mattress do you have?",
    "What is the name of your landlord?",
    "What's in your refrigerator right now?",
    "What's the last gift you gave your spouse?",
    "Do you use pet names for each other?",
    "How many TVs do you have?",
    "How did you meet your spouse?",
    "When did the relationship become romantic?",
    "When did you get engaged?",
    "Who proposed?",
    "How many times have you seen your spouse in person?",
    "When was your last visit?",
    "What do you and your spouse have in common?",
    "What are your future plans as a couple?",
    "What is your spouse's occupation?",
    "Where does your spouse live?",
    "What city and state will you live in?",
    "What are your spouse's work hours?",
    "What is your spouse's income?",
    "What is the address of your spouse's residence?",
    "Do you know the names of your spouse's children (if any)?",
    "Have you communicated with your spouse's family?",
    "What do your parents think about the marriage?",
    "Have you had a wedding celebration?",
    "Do you have wedding photos?",
    "Do you plan to work in the U.S.?",
    "What is your spouse's educational background?",
    "What religion is your spouse?",
    "How do your families feel about the marriage?",
    "Have you met your spouse's children (if any)?",
    "Do you speak your spouse's language?",
    "What was your wedding like?",
    "Did your spouse attend the wedding?",
    "What kind of wedding did you have?",
    "Who paid for the wedding?",
    "What are your spouse's hobbies?",
    "What's your spouse's favorite sport?",
    "Do you have any shared hobbies?",
    "Have you ever broken up?",
    "What challenges have you faced as a couple?",
    "What is your spouse's plan for your arrival?",
    "Do you plan to have children?",
    "Who will support you financially at first?",
    "What is your spouse's future career goal?",
    "Have you and your spouse talked about religion?",
    "Do your families get along?",
    "Have you applied for a U.S. visa before?",
    "Were you ever denied a visa?",
    "Was your spouse previously married to a foreign national?",
    "Why did your spouse divorce their previous spouse?",
    "Why do you think your marriage is genuine?",
    "Did your spouse visit you before the wedding?",
    "Was your marriage arranged?",
    "What gifts has your spouse given you?",
    "Do you have children together?",
    "Do you know your spouse's Social Security number?",
    "How do you plan to support yourselves financially?",
    "Do you know your spouse's address history?",
    "How does your spouse get to work?",
    "How do you keep in touch (apps, platforms)?",
    "What's your spouse's favorite color?",
    "Do you know your spouse's tax filing status?",
    "Do you know your spouse's middle name?",
    "What does your spouse's bedroom look like?",
    "Have you and your spouse ever broken up?",
    "Has your spouse filed I-130s before?",
    "What kind of relationship do you have with your in-laws?",
    "Do you know your spouse's favorite restaurant?",
    "Where did you go on your last vacation together?",
    "When was the last time you had a fight?",
    "What was the fight about?",
    "How do you communicate after a disagreement?",
    "What's your spouse's favorite TV show?",
    "What streaming services do you both use?",
    "Do you have any future financial plans (house, savings)?",
    "Who's the more organized one in the relationship?",
    "What's your spouse's shoe size?",
    "Do you know your spouse's clothing sizes?",
    "What's your spouse's favorite dessert?",
    "When is your spouse's work anniversary?",
    "Who is your spouse's employer?",
    "Do you know your spouse's work address?",
    "Who's your spouse's closest friend in the U.S.?",
    "Have you ever attended any family events together?",
    "What's the most recent photo you took together?",
    "Do you have joint social media accounts?",
    "What nickname do you call your spouse?",
    "What is your spouse's favorite holiday?",
    "What's the name of your spouse's best friend?",
    "Do you and your spouse share a religion?",
    "What was your first impression of your spouse?",
    "What do you both argue about?",
    "Who manages the finances?",
    "Do you share responsibilities equally?",
    "What traditions do you celebrate together?",
    "What's your spouse's favorite clothing brand?",
    "What did you do for your spouse's last birthday?",
    "Do you know your spouse's favorite childhood memory?",
    "Have you ever had a joint bank loan?",
    "What is your spouse's credit score?",
    "Have you met your spouse's coworkers?",
    "Have you met your spouse's friends?",
    "Do you know your spouse's political views?",
    "Do you attend events together?",
    "Do you have matching tattoos or rings?",
    "What language(s) do you speak at home?",
    "What does your spouse do on weekends?",
    "What time do you usually go to bed?",
    "What does your spouse wear to sleep?",
    "Do you know your spouse's family medical history?",
    "Do you and your spouse go to the gym?",
    "What are your spouse's fears or insecurities?",
    "What was the last thing you and your spouse cooked together?",
    "Who does the dishes?",
    "What kitchen appliances do you own?",
    "Do you recycle?",
    "Do you have plants or a garden?",
    "What time is dinner usually?",
    "Do you and your spouse attend therapy or counseling?",
    "Do you celebrate cultural holidays together?",
    "Do you share an Amazon or other online account?",
    "Do you have shared savings goals?",
    "How do you plan to raise your children?",
    "Who disciplines the kids (if any)?",
    "What did your spouse get you for your last anniversary?",
    "What did you get your spouse for the last holiday?",
    "What's the funniest moment you've shared together?",
    "Do you share any financial accounts or assets?",
    "What did you get your spouse for their last birthday?",
    "What is your spouse's daily routine?",
    "What is your spouse's favorite food or restaurant?",
    "Do you plan to have children together?",
  ],
  "naturalization": [
    "What is your full legal name?",
    "Have you used any other names?",
    "What is your date of birth?",
    "When did you become a lawful permanent resident?",
    "What is your A-number?",
    "Where do you currently live?",
    "How long have you lived at your current address?",
    "Where did you live before this address?",
    "Where do you work?",
    "What is your job title?",
    "How long have you worked there?",
    "Are you married, single, divorced, or widowed?",
    "Have you ever been married before?",
    "What is your spouse's name?",
    "Do you have children?",
    "Have you taken any trips outside the United States in the last five years?",
    "How many total days were you outside the United States?",
    "What was the longest trip you took?",
    "When did you last travel outside the United States?",
    "Did you file your taxes every year?",
    "What phone number do you use?",
    "What email address do you use?",
    "Have you ever missed filing taxes?",
    "Have you ever claimed to be a U.S. citizen?",
    "Have you ever registered to vote?",
    "Have you ever voted in a U.S. election?",
    "Have you ever failed to support dependents?",
    "Have you ever had a title of nobility?",
    "Have you ever been a member of any organization or association?",
    "Have you ever worked outside the United States while an LPR?",
    "Have you ever moved without updating your address?",
    "Have you ever used a different date of birth or name?",
    "Did anyone help you prepare the N-400?",
    "Have you reviewed the N-400 before today?",
    "Are all your answers still true and correct?",
    "Why did you take your longest trip abroad?",
    "Did you keep your job or home while abroad?",
    "Have you ever filed taxes as a nonresident?",
    "Have you ever been stopped by border officers on return?",
    "Have you ever had any immigration applications denied?",
    "How many times have you left the United States in the last five years?",
    "What countries did you visit?",
    "What was the purpose of your travel?",
    "Did any trip last six months or more?",
    "Did you maintain your home in the United States during your travel?",
    "Did your family remain in the United States during any long trip?",
    "Did you continue working for a U.S. employer?",
    "Do you live in the USCIS district where you filed?",
    "When did you return from your most recent trip?",
    "Have you ever been outside the U.S. for one year or more since becoming an LPR?",
    "How did you calculate the number of days abroad?",
    "Did you keep paying rent or mortgage during travel?",
    "Did you file U.S. taxes while abroad?",
    "Did you keep a U.S. driver's license or state ID?",
    "Were any trips related to family emergencies?",
    "Have you ever been arrested?",
    "Have you ever been cited by law enforcement?",
    "Have you ever been charged with a crime?",
    "Have you ever been convicted?",
    "Have you ever been on probation?",
    "Do you owe any overdue taxes?",
    "Have you filed all required tax returns?",
    "Do you owe child support or alimony?",
    "Are you a male who was required to register for Selective Service?",
    "Did you register for Selective Service?",
    "What happened in your arrest or citation case?",
    "Do you have certified court documents with you?",
    "Have you ever used alcohol or drugs in a way that caused legal trouble?",
    "Have you ever lied to a government officer?",
    "Have you ever given false information to obtain an immigration benefit?",
    "Have you ever failed to pay court-ordered obligations?",
    "Are you on a tax payment plan?",
    "Have you completed all terms of probation or supervision?",
    "Why did you fail to register for Selective Service, if applicable?",
    "Have you ever been involved in gambling, prostitution, smuggling, or unlawful acts listed on the N-400?",
    "Have you ever committed an offense for which you were not arrested?",
    "Have you ever helped anyone enter the U.S. unlawfully?",
    "Have you ever concealed a marriage or child from immigration authorities?",
    "Have you ever filed taxes inconsistently with your claimed residence?",
    "Have you ever used someone else's identity or documents?",
    "What is the supreme law of the land?",
    "What does the Constitution do?",
    "What is one right or freedom from the First Amendment?",
    "How many U.S. Senators are there?",
    "Who is your U.S. Representative?",
    "Who is the current President of the United States?",
    "Who is the Governor of your state?",
    "What is the rule of law?",
    "What do we show loyalty to when we say the Pledge of Allegiance?",
    "Are you willing to take the full Oath of Allegiance?",
    "What does \"support the Constitution\" mean to you?",
    "Are you willing to bear arms on behalf of the United States if the law requires it?",
    "Are you willing to perform noncombatant service if required?",
    "Are you willing to perform work of national importance if required?",
    "Why do you want to become a U.S. citizen?",
    "Are you still married to the same U.S. citizen spouse?",
    "How long has your spouse been a U.S. citizen?",
    "Do you live together?",
    "Have you filed joint taxes?",
    "Are you still living in marital union?",
    "Have you ever been arrested or cited?",
    "Are all the answers on your N-400 true and correct?",
    "Are you willing to take the Oath of Allegiance?",
    "What was your longest trip outside the United States?",
    "Have you ever failed to support your children or dependents?",
  ],
  "h1b_site_beneficiary": [
    "What do you do on a typical day?",
    "What projects are you working on now?",
    "What tools or systems do you use?",
    "Who assigns your tasks?",
    "Where do you work most days?",
    "Do you work remotely or hybrid?",
    "Have your work locations changed?",
    "Who supervises you?",
    "How often do you interact with your supervisor?",
    "Who evaluates your performance?",
    "How much are you paid?",
    "How often are you paid?",
    "Are you paid when work is slow?",
    "Do you work at a client site?",
    "Who supervises you there?",
    "Who controls your day-to-day work?",
  ],
  "h1b_site_employer": [
    "When did the employee start?",
    "What is their job title?",
    "Who is their supervisor?",
    "What are their normal work hours?",
    "Where do they physically work?",
    "What does the employee do day to day?",
    "Are they performing the duties listed in the petition?",
    "Have duties changed since filing?",
    "What is the employee's salary?",
    "How often are they paid?",
    "Are they paid during nonproductive time?",
    "Who assigns work?",
    "Who evaluates performance?",
    "How often does supervision occur?",
    "Does the employee work at a client site?",
    "If yes, where?",
    "Who supervises the employee at that site?",
  ],
  "l1_site_beneficiary": [
    "What is your job title?",
    "What do you do on a typical day?",
    "What are your primary responsibilities?",
    "How do you spend most of your time?",
    "Who do you report to?",
    "Who reports to you?",
    "How many direct reports do you have?",
    "What decisions do you make independently?",
    "Where do you usually work?",
    "Do you work remotely?",
    "Do you work at client sites?",
    "How often are you at this location?",
    "What knowledge do you have that others don't?",
    "How did you acquire it?",
    "How long would it take to train someone else?",
    "What happens if you are not available?",
    "When did you start working here?",
    "What projects are you currently working on?",
    "How does your role interact with other teams?",
    "Can someone else do your job?",
    "Do you do hands-on work?",
    "Do you manage people directly?",
    "Is your work client-facing?",
    "How much of your work is technical?",
  ],
  "l1_site_employer": [
    "What does the company do?",
    "How long has the U.S. entity been operating?",
    "How many employees are here?",
    "How is the company structured?",
    "What is the beneficiary's title?",
    "What are their primary duties?",
    "How do they add value?",
    "What decisions do they make?",
    "Who does the beneficiary report to?",
    "Who reports to them?",
    "How is performance evaluated?",
    "Who assigns work?",
    "What expertise does the beneficiary have?",
    "Why can't others perform this role?",
    "How was this expertise acquired?",
    "How critical is it to operations?",
    "Has the role changed since approval?",
    "Has reporting changed?",
    "Has the work location changed?",
    "Has headcount changed materially?",
  ],
};
