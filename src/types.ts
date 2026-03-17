export type Category = 'General' | 'School' | 'Work' | 'Personal' | 'Ideas';

export interface Note {
  id: string;
  title: string;
  content: string;
  category: Category;
  createdAt: number;
  updatedAt: number;
  isLocked: boolean;
  password?: string;
}

export const CATEGORIES: Category[] = ['General', 'School', 'Work', 'Personal', 'Ideas'];
