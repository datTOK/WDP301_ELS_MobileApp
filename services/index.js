/**
 * Services Index
 * Central export point for all API services
 */

// Export the main API instance and utilities
export { default as api } from './api';
export { apiUtils } from './api';

// Export individual service classes
export { default as authService } from './authService';
export { default as courseService } from './courseService';
export { default as testService } from './testService';
export { default as blogService } from './blogService';
export { default as userService } from './userService';
export { default as achievementService } from './achievementService';
export { default as userAchievementService } from './userAchievementService';
export { default as lessonService } from './lessonService';
export { default as userLessonService } from './userLessonService';
export { default as userExerciseService } from './userExerciseService';
export { default as membershipService } from './membershipService';
export { default as flashcardService } from './flashcardService';
// flashcardSetService is the same as flashcardService for mobile app
export { default as flashcardSetService } from './flashcardService'; 