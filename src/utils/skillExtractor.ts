import { skillsList } from '../data/skillsData';

/**
 * Normalizes a skill name or alias into a stripped string for strict deduplication
 * E.g., "React.js", "ReactJS", "React" -> "react"
 * "PostgreSQL", "Postgres", "PgSQL" -> "postgresql"
 */
function normalizeSkillKey(name: string): string {
  let cleaned = name.toLowerCase().trim();
  // Strip trailing .js, js, css etc. if it's part of common variations
  cleaned = cleaned.replace(/\.js$/i, '').replace(/js$/i, '').replace(/css$/i, '');
  cleaned = cleaned.replace(/[^a-z0-9]/g, '');
  return cleaned || name.toLowerCase().trim();
}

export function extractSkillsFromJDText(jdText: string): { mustHave: string[]; niceToHave: string[]; minExperience: number } {
  if (!jdText || jdText.trim().length === 0) {
    return { mustHave: [], niceToHave: [], minExperience: 0 };
  }

  const textLower = jdText.toLowerCase();

  // Extract Min Experience Years from JD Text
  const minExperience = extractMinExperienceFromJDText(jdText);

  // Split text into paragraphs/sections
  const sections = textLower.split(/\n\s*\n|\r\n\s*\r\n/);

  const mustHaveList: string[] = [];
  const niceToHaveList: string[] = [];
  const seenKeys = new Set<string>();

  // Helper to add skill safely without duplicates
  const addSkill = (skillName: string, isNiceToHave: boolean) => {
    const key = normalizeSkillKey(skillName);

    // If key or exact name already seen, skip
    if (seenKeys.has(key) || seenKeys.has(skillName.toLowerCase().trim())) {
      return;
    }

    seenKeys.add(key);
    seenKeys.add(skillName.toLowerCase().trim());

    if (isNiceToHave) {
      niceToHaveList.push(skillName);
    } else {
      mustHaveList.push(skillName);
    }
  };

  // Section keyword classifications
  const mustHaveKeywords = ['require', 'must', 'essential', 'qualification', 'responsibility', 'need', 'core', 'minimum', 'prerequisite', 'key skill'];
  const niceToHaveKeywords = ['nice', 'plus', 'preferred', 'bonus', 'optional', 'advantage', 'desirable', 'good to have', 'extra'];

  // 1. Scan predefined skills from dictionary
  skillsList.forEach(skillObj => {
    const isFound = skillObj.aliases.some(alias => {
      const regex = new RegExp(`(?:^|[^a-zA-Z0-9\\#\\+\\.\\-])${escapeRegExp(alias)}(?:$|[^a-zA-Z0-9\\#\\+\\.\\-])`, 'i');
      return regex.test(textLower);
    });

    if (isFound) {
      let isNiceSection = false;

      sections.forEach(section => {
        const hasSkill = skillObj.aliases.some(alias => {
          const regex = new RegExp(`(?:^|[^a-zA-Z0-9\\#\\+\\.\\-])${escapeRegExp(alias)}(?:$|[^a-zA-Z0-9\\#\\+\\.\\-])`, 'i');
          return regex.test(section);
        });

        if (hasSkill) {
          const sectionNice = niceToHaveKeywords.some(kw => section.includes(kw));
          const sectionMust = mustHaveKeywords.some(kw => section.includes(kw));
          if (sectionNice && !sectionMust) {
            isNiceSection = true;
          }
        }
      });

      addSkill(skillObj.name, isNiceSection);
    }
  });

  // 2. Dynamic Fallback: Scan bullet points or comma lists for unlisted tech keywords
  const lines = jdText.split(/\n|\r\n/);
  lines.forEach(line => {
    const trimmed = line.trim();
    if (/^[•\-\*\d\.\)\s]+/.test(trimmed)) {
      // Looks like a bullet point line
      const cleanLine = trimmed.replace(/^[•\-\*\d\.\)\s]+/, '').trim();
      // Look for capital words or tech terms (e.g. Next.js, Redux, PostgreSQL)
      const techWords = cleanLine.match(/\b[A-Z][a-zA-Z0-9\+\#\.\-]{1,20}\b/g);
      if (techWords) {
        techWords.forEach(word => {
          // Ignore common English capitalized words
          const commonEnglishWords = ['The', 'And', 'For', 'With', 'Our', 'We', 'You', 'Must', 'Have', 'Work', 'Team', 'Role', 'Good', 'Strong', 'Experience', 'Knowledge', 'Ability', 'Required', 'Preferred', 'Job', 'Company', 'Requirements', 'Responsibilities', 'Candidate', 'Applicant'];
          if (!commonEnglishWords.includes(word) && word.length > 1) {
            const isNice = niceToHaveKeywords.some(kw => line.toLowerCase().includes(kw));
            addSkill(word, isNice);
          }
        });
      }
    }
  });

  // Balance if everything fell into mustHave
  if (mustHaveList.length > 5 && niceToHaveList.length === 0) {
    const splitIdx = Math.ceil(mustHaveList.length * 0.7);
    const movedToNice = mustHaveList.splice(splitIdx);
    niceToHaveList.push(...movedToNice);
  }

  return {
    mustHave: mustHaveList,
    niceToHave: niceToHaveList,
    minExperience
  };
}

export function extractMinExperienceFromJDText(jdText: string): number {
  if (!jdText) return 0;

  const regexes = [
    /(\d+)\s*\+?\s*(?:-\s*\d+\s*)?(?:years?|yrs?|year)(?:\s+of)?\s+(?:experience|exp|working|relevant)/i,
    /(?:minimum|at\s+least|around|required|has)\s+(\d+)\s*(?:years?|yrs?|year)/i,
    /(\d+)\s*(?:years?|yrs?|year)\s+minimum/i,
    /(\d+)\s*\+\s*(?:years?|yrs?|year)/i,
    /(\d+)\s*to\s*\d+\s*(?:years?|yrs?|year)/i
  ];

  for (const regex of regexes) {
    const match = jdText.match(regex);
    if (match && match[1]) {
      const num = parseInt(match[1], 10);
      if (!isNaN(num) && num > 0 && num <= 25) {
        return num;
      }
    }
  }

  return 0;
}

function escapeRegExp(string: string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}
