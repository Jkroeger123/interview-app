import {
  LIBRARY_DERIVED_QUESTION_BANKS,
  type LibraryVisaTypeId,
} from "./library-derived-interviews";
import {
  EXTENSION_QUESTION_BANKS,
  type ExtensionVisaTypeId,
} from "./library-extension-interviews";
import type { CoreVisaTypeId, VisaTypeId } from "./visa-types";

/**
 * Question banks for each visa type
 * These questions are used by the AI agent during interviews
 */

const CORE_QUESTION_BANKS: Record<CoreVisaTypeId, string[]> = {
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

  student: LIBRARY_DERIVED_QUESTION_BANKS.f1,

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

  fiance: LIBRARY_DERIVED_QUESTION_BANKS.k1,
};

export const QUESTION_BANKS: Record<VisaTypeId, string[]> = {
  ...CORE_QUESTION_BANKS,
  ...(LIBRARY_DERIVED_QUESTION_BANKS as Record<LibraryVisaTypeId, string[]>),
  ...(EXTENSION_QUESTION_BANKS as Record<ExtensionVisaTypeId, string[]>),
};

/**
 * Get questions for a specific visa type
 */
export function getQuestionBank(visaType: VisaTypeId): string[] {
  return QUESTION_BANKS[visaType] ?? [];
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

