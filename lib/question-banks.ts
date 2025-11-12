import type { VisaTypeId } from "./visa-types";

/**
 * Question banks for each visa type
 * These questions are used by the AI agent during interviews
 */

export const QUESTION_BANKS: Record<VisaTypeId, string[]> = {
  tourist: [
    // Purpose of Visit
    "What is the purpose of your visit to the United States?",
    "How long do you plan to stay in the U.S.?",
    "Who will you be visiting?",
    "Where will you be staying during your visit?",
    "Have you booked your accommodation yet?",
    "What places do you plan to visit?",
    "Do you have a detailed itinerary?",
    "Why do you want to visit the United States specifically?",
    "Have you been to the U.S. before? When and for how long?",
    "What will you do during your stay?",
    
    // Financial Situation
    "Who is paying for your trip?",
    "How much money do you plan to bring with you?",
    "What is your current occupation?",
    "How much do you earn per month?",
    "Do you have bank statements showing sufficient funds?",
    "Can you show proof of your financial assets?",
    "Do you own any property?",
    "How will you support yourself during your visit?",
    "Do you have a sponsor? What is their relationship to you?",
    "What is your sponsor's occupation and income?",
    
    // Ties to Home Country
    "What is your occupation in your home country?",
    "How long have you worked at your current job?",
    "Who will take care of your responsibilities while you're gone?",
    "Do you own property in your home country?",
    "Are you married? Do you have children?",
    "Will your family accompany you on this trip?",
    "Why are you leaving your family behind?",
    "What guarantees that you will return home?",
    "Do you have any family members in the United States?",
    "Have you ever overstayed a visa before?",
    
    // Travel History
    "Which countries have you visited before?",
    "Have you ever been denied a visa to any country?",
    "Have you traveled outside your home country in the past year?",
    "Do you have valid visas to other countries?",
    "Why haven't you traveled internationally before?",
    "Have you ever been refused entry to the United States?",
    
    // Intent to Return
    "Why should I believe you will return to your home country?",
    "What job or business do you have waiting for you back home?",
    "Do you have any upcoming commitments in your home country?",
    "What ties do you have to your home country?",
    "Have you considered moving to the United States permanently?",
    "Do you have a return ticket booked?",
    "What date do you plan to return?",
    
    // Additional Probing
    "This seems like a very expensive trip. How can you afford it?",
    "Your bank statements show large recent deposits. Where did this money come from?",
    "You're quite young to have this much savings. How did you accumulate it?",
    "Your employer letter seems vague. Can you provide more details about your job?",
    "Why do you need to go to the United States for tourism? There are many other countries.",
    "I see you have family in the U.S. Are you sure you're not planning to stay?",
    "Your travel history is limited. Why should I trust you will return?",
    "You're unemployed but say you have funds. Please explain.",
  ],

  student: [
    // ACADEMIC PURPOSE & PROGRAM FIT (Core §214(b) Assessment)
    "Why did you choose to study in the U.S.?",
    "What is your major?",
    "Why did you select this university?",
    "How many universities did you apply to?",
    "Which schools accepted you?",
    "Why did you choose this program over others?",
    "What research have you done about the university?",
    "Can you describe your course curriculum?",
    "How does this program relate to your previous education?",
    "How is this field of study relevant to your career goals?",
    "Do you plan to transfer schools?",
    "What degree will you earn?",
    "How long is your program?",
    "Have you spoken to any professors at the university?",
    "What is the ranking of this university?",
    "How will this program improve your job prospects?",
    "Why not study this in your home country?",
    "What's your plan if you fail a course?",
    "How will you manage academic stress?",
    "What other countries did you consider studying in?",
    
    // FINANCIAL ABILITY (Critical for Visa Approval)
    "Who is sponsoring your education?",
    "What is your sponsor's relationship to you?",
    "What is your sponsor's occupation?",
    "What is their annual income?",
    "Do you have proof of their financial ability?",
    "Have you received any scholarships?",
    "How much is your tuition per year?",
    "How much are your living expenses?",
    "Do you have enough funds for your entire program?",
    "What's the source of the funds in your bank statement?",
    "Why is there a recent large deposit in your account?",
    "How will you pay for your second year?",
    "What happens if your sponsor loses their job?",
    "Have you taken a student loan?",
    "Do you understand that you cannot work off-campus?",
    "Will you be working in the U.S.?",
    "What is your backup financial plan?",
    "Can I see your bank statements?",
    "How many dependents does your sponsor support?",
    "Are you funding any part of your education yourself?",
    
    // TIES TO HOME COUNTRY (INA §214(b) - Nonimmigrant Intent)
    "What are your plans after graduation?",
    "Do you plan to return to your home country?",
    "Where will you work after your studies?",
    "Who lives with you in your home country?",
    "Do you own any property?",
    "What job do you plan to pursue?",
    "Is there a demand for your field in your home country?",
    "What specific companies might you work for back home?",
    "Do you have family obligations here?",
    "Have you discussed your return plan with your family?",
    "Will you apply for a work visa after your studies?",
    "What makes you want to come back home?",
    "What are your long-term goals?",
    "Do you have a business you plan to return to?",
    "How will your U.S. degree benefit your career at home?",
    "What community activities are you involved in here?",
    "What ties do you have outside your family?",
    "What role will you play in your local industry?",
    "Would you immigrate to the U.S. if given a chance?",
    "What motivates you to stay connected to your country?",
    
    // IMMIGRATION HISTORY & INTENT (Red Flag Detection)
    "Have you ever been refused a U.S. visa?",
    "What happened during your last visa interview?",
    "Have you ever overstayed a U.S. visa?",
    "Do you have any relatives in the U.S.?",
    "What is their immigration status?",
    "Has anyone filed a petition for you?",
    "Have you applied for a Green Card?",
    "Are you planning to work during school?",
    "Have you visited the U.S. before?",
    "Why did you return after your last visit?",
    "Do you plan to change to an H-1B visa?",
    "Have you applied to immigrate elsewhere?",
    "Are you using this visa to stay in the U.S. long-term?",
    "Have you researched Optional Practical Training (OPT)?",
    "Do you know what Curricular Practical Training (CPT) is?",
    "Will you use CPT during your degree?",
    "Have you been out of status before?",
    "Do you understand your F-1 obligations?",
    "Will you apply for asylum?",
    "Are you aware of the penalties for violating visa terms?",
    
    // ENGLISH PROFICIENCY & COMMUNICATION
    "What is your TOEFL/IELTS score?",
    "How did you prepare for the test?",
    "Have you studied in English before?",
    "Can you explain your program in English?",
    "How will you keep up with academic English?",
    "Have you ever struggled with English?",
    "How do you plan to improve your language skills?",
    "Why didn't you choose an ESL program first?",
    "Can you describe your future goals in English?",
    
    // DOCUMENTATION & DS-160 CONSISTENCY (Fraud Detection)
    "Where is your I-20 form?",
    "Have you paid your SEVIS fee?",
    "What is your SEVIS ID number?",
    "Does your DS-160 match your I-20?",
    "Can you show your acceptance letter?",
    "Why is there a gap in your education history?",
    "Why are there inconsistencies in your application?",
    "Do you have a copy of your resume?",
    "Why did your sponsor not sign the affidavit of support?",
    "Can you provide updated financial documents?",
    
    // FIELD CHANGE & ACADEMIC INTEGRITY
    "Why are you changing your field of study?",
    "Is this your second Master's degree? Why?",
    "Why are you pursuing another Bachelor's degree?",
    "Why did you take a break after graduation?",
    "Why do you want to study a subject unrelated to your background?",
    "Why did you not complete your previous degree?",
    "Why did you withdraw from your previous university?",
    "Have you ever faced academic probation?",
    "Have you ever been dismissed or expelled?",
    "Can you explain any gap years?",
    "What's your GPA?",
    "Did you use an education agent for your application?",
    "Did someone else help you prepare for this interview?",
    "Who filled out your DS-160 form?",
    
    // PRACTICAL TRAINING & WORK INTENTIONS (OPT/CPT Scrutiny)
    "Do you plan to work on-campus?",
    "What do you know about OPT?",
    "What do you know about CPT?",
    "When do you plan to start CPT?",
    "Have you already contacted companies for internships?",
    "What happens if you don't find an internship?",
    "Are you planning to stay in the U.S. after OPT?",
    "What type of work will you pursue during OPT?",
    "Are you being sponsored by a company in the U.S.?",
    "Have you applied for any job in the U.S.?",
    "Do you know the rules for on-campus employment?",
    "Do you understand your F-1 visa restrictions on work?",
    "What is your long-term plan after OPT expires?",
    "Would you be open to a Green Card if offered?",
    "Why do you keep mentioning jobs in the U.S.?",
    
    // SECURITY & INADMISSIBILITY
    "Have you ever used false documents for a visa?",
    "Have you ever been arrested or charged with a crime?",
    "Have you ever been deported or removed?",
    "Have you ever violated visa conditions in another country?",
    "Has anyone ever filed a K visa or I-130 for you?",
    "Have you ever claimed to be a U.S. citizen?",
    "Have you ever submitted fraudulent financial documents?",
    "Are you aware of visa fraud penalties?",
    "Are you aware that lying during this interview could bar you permanently?",
    "Did you write your own Statement of Purpose?",
    "Did you edit your transcripts or letters?",
    "Is all the information in your documents true?",
    "Did you hire someone to write your admission essays?",
    "Have you ever received a Notice of Intent to Deny (NOID) from USCIS?",
    
    // FAMILY & TRAVEL HISTORY
    "Do you have siblings in the U.S.?",
    "Are your parents U.S. citizens or green card holders?",
    "What visa do your relatives in the U.S. hold?",
    "Did anyone in your family study in the U.S.?",
    "Have any relatives overstayed their visas?",
    "Have you traveled abroad before?",
    "What countries have you visited and why?",
    "Did you return on time after your previous travels?",
    "Have you applied for a tourist visa before?",
    "Did you ever live abroad for more than six months?",
    "Do your parents support your decision to return after study?",
    "Have you ever been denied a visa to another country?",
    "Do you have children? If so, who will care for them while you're away?",
    "Will your spouse/dependents join you?",
    "What visa will your dependents apply for?",
    
    // EDGE CASES & SITUATIONAL (Consular Discretion)
    "What visa category are you applying for today?",
    "Do you understand the difference between F-1 and B-2 visas?",
    "Is your school SEVP-certified?",
    "How did you verify the legitimacy of your school?",
    "Why are you attending a school with a high dropout or transfer rate?",
    "Do you know your rights under U.S. law as a nonimmigrant?",
    "What would you do if your employer in the U.S. asked you to work illegally?",
    "Why do so many students from your country overstay their visas?",
    "Are you aware of the visa fraud trends from your region?",
    "What would you do if your visa was refused today?",
    "Did you sign your application yourself?",
    "Did you pay anyone to arrange your I-20 or financial documents?",
    "What will you do if your school closes?",
    "If you're offered a Green Card while studying, what would you do?",
    "If your friend in the U.S. offers you a job, will you accept it?",
    "What would you do if your sponsor stops funding your education?",
  ],

  work: [
    // Job Details
    "What position have you been offered?",
    "What company will you be working for?",
    "What does this company do?",
    "Where is the company located?",
    "What will your specific duties be?",
    "Why does this company need to hire someone from abroad?",
    "Are there no qualified American workers for this position?",
    "What makes you specifically qualified for this role?",
    "When do you start work?",
    "How long is your employment contract?",
    
    // Educational Background
    "What is your educational background?",
    "Where did you receive your degree?",
    "What was your major?",
    "Is your degree directly related to this job?",
    "Do you have any additional certifications?",
    "What were your grades in university?",
    
    // Work Experience
    "What is your current job?",
    "How long have you been in your current position?",
    "Describe your work experience in this field.",
    "What projects have you worked on?",
    "What are your key skills?",
    "How did you find this job opportunity?",
    "Have you worked in the United States before?",
    
    // Compensation
    "What will your salary be?",
    "Is this salary appropriate for your position and location?",
    "What benefits will you receive?",
    "Who is paying for your relocation?",
    "Do you think you're being fairly compensated?",
    
    // Employer Details
    "How did you first contact this employer?",
    "Have you met your future supervisor?",
    "How many employees does this company have?",
    "Is this a startup or established company?",
    "What is the company's financial situation?",
    "Why does the company think you're the best candidate?",
    
    // Intent to Return
    "Do you plan to return to your home country after your contract ends?",
    "What are your long-term career goals?",
    "Do you have family in your home country?",
    "What ties do you have to your home country?",
    "Have you considered immigrating permanently?",
    "What will you do if your employment is terminated?",
    
    // H-1B Specific
    "Has your employer filed an LCA for you?",
    "What is the prevailing wage for your position?",
    "Is your employer paying you the prevailing wage or higher?",
    "What is your specialty occupation?",
    "Does your degree qualify you for this specialty occupation?",
    
    // Additional Probing
    "This salary seems low for someone with your qualifications. Why accept it?",
    "Your degree is not directly related to this job. How are you qualified?",
    "This company is very small. Are you sure they can support an H-1B?",
    "You have limited experience. Why should they hire you over an American?",
    "Your previous work experience is in a different field. Explain the switch.",
    "The company just started. How stable is this opportunity?",
  ],

  immigrant: [
    // Basis for Immigration
    "What is the basis for your green card application?",
    "Who is your petitioner?",
    "What is your relationship to the petitioner?",
    "How long have you known your petitioner?",
    "Where does your petitioner live?",
    "What does your petitioner do for a living?",
    "How much does your petitioner earn?",
    "Why do you want to immigrate to the United States?",
    
    // Family-Based Immigration
    "When did your petitioner become a U.S. citizen?",
    "Do you have other family members in the United States?",
    "How often do you communicate with your petitioner?",
    "Has your petitioner ever supported you financially?",
    "Have you visited your petitioner in the U.S. before?",
    "Does your petitioner have other family members they've petitioned?",
    
    // Employment-Based Immigration
    "What job have you been offered in the United States?",
    "What are your qualifications for this position?",
    "What is your work experience in this field?",
    "Why can't this employer find a U.S. worker?",
    "What is the job location?",
    "What will your salary be?",
    
    // Financial Support
    "Who will support you financially in the United States?",
    "What is your sponsor's income?",
    "Do you have an affidavit of support?",
    "Do you have any assets or savings?",
    "Will you be able to support yourself without public assistance?",
    "What job will you do in the United States?",
    
    // Background and Admissibility
    "Have you ever been arrested or convicted of a crime?",
    "Have you ever overstayed a visa?",
    "Have you ever been deported from any country?",
    "Have you ever lied on a visa application?",
    "Do you have any health conditions we should know about?",
    "Have you completed your medical examination?",
    "Have you obtained police certificates from all countries you've lived in?",
    
    // Intent and Plans
    "Where do you plan to live in the United States?",
    "What are your plans after you arrive?",
    "Do you have children? Will they accompany you?",
    "What will happen to your property in your home country?",
    "What job or career do you plan to pursue?",
    "How will you adjust to life in the United States?",
    
    // Current Situation
    "What is your current occupation?",
    "Are you married? If so, where is your spouse?",
    "Do you own property in your home country?",
    "What will you do with your assets back home?",
    "When was the last time you saw your petitioner?",
    
    // Additional Probing
    "Why do you want to leave your home country permanently?",
    "Your petitioner has petitioned for many family members. Why?",
    "Your petitioner's income seems low. How will they support you?",
    "You have a criminal record. Explain these circumstances.",
    "There's a large gap in your employment history. What happened?",
    "Why didn't you pursue this opportunity in your home country?",
  ],

  fiance: [
    // Relationship History
    "How did you meet your fiancé?",
    "When did you first meet in person?",
    "How long have you been in a relationship?",
    "How long have you been engaged?",
    "Who proposed and how?",
    "How often do you communicate?",
    "What language do you speak together?",
    "Have you met each other's families?",
    
    // In-Person Meetings
    "When was the last time you saw your fiancé in person?",
    "How many times have you met in person?",
    "Where did you meet?",
    "How long did you spend together?",
    "What did you do together during your visits?",
    "Do you have photos from your time together?",
    "Who paid for these visits?",
    
    // Fiancé Details
    "What does your fiancé do for a living?",
    "How much does your fiancé earn?",
    "Where does your fiancé live?",
    "Has your fiancé been married before?",
    "Does your fiancé have children?",
    "How did your fiancé become a U.S. citizen?",
    "What is your fiancé's family background?",
    
    // Knowledge of Each Other
    "What is your fiancé's birthday?",
    "What are your fiancé's hobbies?",
    "What does your fiancé like to eat?",
    "What is your fiancé's favorite color?",
    "What are your fiancé's parents' names?",
    "Where did your fiancé grow up?",
    "What are your fiancé's career goals?",
    
    // Wedding Plans
    "When do you plan to get married?",
    "Where will the wedding take place?",
    "How many guests will attend?",
    "Have you made any wedding arrangements?",
    "What type of wedding will it be?",
    "Who will attend from your side?",
    "What will you do after the wedding?",
    
    // Future Plans
    "Where will you live after marriage?",
    "Do you plan to work after you arrive?",
    "Do you want to have children?",
    "Have you discussed how many children you want?",
    "What are your career plans in the United States?",
    "How will you support yourselves?",
    
    // Previous Relationships
    "Have you been married before?",
    "If yes, when did that marriage end?",
    "Do you have children from a previous relationship?",
    "Has your fiancé been married before?",
    "How did your previous relationship end?",
    
    // Cultural and Religious
    "What religion are you?",
    "What religion is your fiancé?",
    "How will you handle religious differences?",
    "What do your families think about this marriage?",
    "How will you adjust to American culture?",
    
    // Financial Support
    "What is your fiancé's annual income?",
    "Has your fiancé filed an affidavit of support?",
    "How will your fiancé support you?",
    "Do you have any savings of your own?",
    "Will you work after you arrive?",
    
    // Authenticity Questions
    "This relationship seems very fast. Why the rush to marry?",
    "You've only met a few times. How do you know you're compatible?",
    "There's a significant age difference. Why is that?",
    "Your fiancé has sponsored another K-1 visa before. Explain.",
    "You barely speak the same language. How do you communicate?",
    "Your stories about how you met don't match your fiancé's. Which is true?",
    "You seem to know very little about your fiancé. Is this relationship real?",
  ],
};

/**
 * Get questions for a specific visa type
 */
export function getQuestionBank(visaType: VisaTypeId): string[] {
  return QUESTION_BANKS[visaType] || [];
}

/**
 * Get a subset of questions (useful for token limits)
 */
export function getQuestionSubset(
  visaType: VisaTypeId,
  count: number = 50
): string[] {
  const questions = getQuestionBank(visaType);
  return questions.slice(0, count);
}

