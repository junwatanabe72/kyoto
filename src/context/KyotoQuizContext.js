import React, { createContext } from 'react';
import useKyotoQuiz from '../hooks/useKyotoQuiz';

export const KyotoQuizContext = createContext();

export const KyotoQuizProvider = ({ children }) => {
  const quizState = useKyotoQuiz();
  
  return (
    <KyotoQuizContext.Provider value={quizState}>
      {children}
    </KyotoQuizContext.Provider>
  );
};