export interface Question {
  id: string;
  examTitle: string;
  questionText: string;
  type: 'MCQ' | 'True/False' | 'Short';
  answers: number;
  correctAnswer: string;
  points: number;
  timeLimit?: number;
}

export type QuestionDifficultyLevel = 'EASY' | 'MEDIUM' | 'HARD';

export interface QuestionDetail {
  id: string;
  text: string;
  type: 'MCQ' | 'True/False' | 'Short';
  difficultyLevel: QuestionDifficultyLevel;
  answers: Answer[];
  timeLimit?: number;
}

export interface Answer {
  id: string;
  text: string;
  isCorrect: boolean;
}
