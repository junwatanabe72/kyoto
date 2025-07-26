import React, { createContext, ReactNode } from 'react';
import useKyotoQuiz from '../hooks/useKyotoQuiz';

export const KyotoQuizContext = createContext<any>(null);

interface Props {
  children: ReactNode;
}

export const KyotoQuizProvider: React.FC<Props> = ({ children }) => {
  const quizState = useKyotoQuiz();

  return (
    <KyotoQuizContext.Provider value={quizState}>
      {children}
    </KyotoQuizContext.Provider>
  );
};