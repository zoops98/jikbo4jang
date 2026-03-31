export interface JikboData {
  meta: {
    publisher: string;
    grade: string;
    lesson: string;
    schoolLevel: string;
  };
  vocab: {
    synonyms: string[];
    antonyms: string[];
    collocations: { expression: string; meaning: string }[];
    definitions: { word: string; meaning: string; enDefinition: string }[];
  };
  dialog: {
    part1: {
      title: string;
      mainExpression: string;
      explanation: string;
      variations: string[];
      responseGood: string[];
      responseBad: string[];
    };
    part2: {
      title: string;
      mainExpression: string;
      explanation: string;
      variations: string[];
    };
    extra: { expression: string; meaning: string; note: string }[];
  };
  grammar: {
    point1: {
      title: string;
      description: string;
      construction: string;
      examples: { en: string; ko: string }[];
    };
    point2: {
      title: string;
      description: string;
      construction: string;
      examples: { en: string; ko: string }[];
    };
  };
  reading: {
    title: string;
    subtitle: string;
    paragraphs: { en: string; ko: string; grammarNote?: string }[];
  };
}

export enum AppStatus {
  IDLE,
  PROCESSING,
  SUCCESS,
  ERROR,
}