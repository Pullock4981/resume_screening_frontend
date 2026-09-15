import { skillsList } from '../data/skillsData';

export function extractSkillsFromJDText(jdText: string): { mustHave: string[]; niceToHave: string[]; minExperience: number } {
  if (!jdText || jdText.trim().length === 0) {
    return { mustHave: [], niceToHave: [], minExperience: 0 };
  }

  const textLower = jdText.toLowerCase();

  // Extract Min Experience Years from JD Text
  const minExperience = extractMinExperienceFromJDText(jdText);

  // Split text into sections if possible
  const sections = textLower.split(/\n\s*\n/);
  
  const mustHaveSet = new Set<string>();
  const niceToHaveSet = new Set<string>();

  // Check section keywords
  const mustHaveKeywords = ['require', 'must', 'essential', 'qualification', 'responsibility', 'need', 'core', 'minimum'];
  const niceToHaveKeywords = ['nice', 'plus', 'preferred', 'bonus', 'optional', 'advantage', 'desirable'];

  skillsList.forEach(skillObj => {
    // Check if any alias is mentioned in the JD
    const isFound = skillObj.aliases.some(alias => {
      const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i');
      return regex.test(textLower);
    });

    if (isFound) {
      // Find where in text it appeared
      let targetSet = mustHaveSet;

      sections.forEach(section => {
        const hasSkill = skillObj.aliases.some(alias => {
          const regex = new RegExp(`\\b${escapeRegExp(alias)}\\b`, 'i');
          return regex.test(section);
        });

        if (hasSkill) {
          const isNiceSection = niceToHaveKeywords.some(kw => section.includes(kw));
          const isMustSection = mustHaveKeywords.some(kw => section.includes(kw));

          if (isNiceSection && !isMustSection) {
            targetSet = niceToHaveSet;
          } else {
            targetSet = mustHaveSet;
          }
        }
      });

      targetSet.add(skillObj.name);
    }
  });

  // If all skills landed in MustHave, split top 60% as must, remaining as nice to have for balance
  if (mustHaveSet.size > 0 && niceToHaveSet.size === 0 && mustHaveSet.size >= 4) {
    const arr = Array.from(mustHaveSet);
    const splitIdx = Math.ceil(arr.length * 0.6);
    return {
      mustHave: arr.slice(0, splitIdx),
      niceToHave: arr.slice(splitIdx),
      minExperience
    };
  }

  return {
    mustHave: Array.from(mustHaveSet),
    niceToHave: Array.from(niceToHaveSet),
    minExperience
  };
}

export function extractMinExperienceFromJDText(jdText: string): number {
  if (!jdText) return 0;
  
  // Matches "3+ years of experience", "2-5 years experience", "minimum 3 years", etc.
  const regexes = [
    /(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs?)(?:\s+of)?\s+(?:experience|exp|working|relevant)/i,
    /(?:minimum|at\s+least|around|required)\s+(\d+)\s*(?:years?|yrs?)/i,
    /(\d+)\s*(?:years?|yrs?)\s+minimum/i,
    /(\d+)\s*\+\s*(?:years?|yrs?)/i
  ];

  for (const regex of regexes) {
    const match = jdText.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 20) {
        return num;
      }
    }
  }

  return 0;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
