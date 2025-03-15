// src/hooks/useGameLogic.js
import { useState } from "react";

export default function useGameLogic(
  featuresMap,
  allMojiNames,
  mapRef,
  dataLayerRef
) {
  const [currentFeature, setCurrentFeature] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameState, setGameState] = useState("waiting"); // waiting, question, result, finished
  const [remainingFeatures, setRemainingFeatures] = useState(
    Object.keys(featuresMap || {})
  );
  const [timeLeft, setTimeLeft] = useState(20);
  const [timer, setTimer] = useState(null);

  const resetGame = () => {
    if (mapRef.current && dataLayerRef.current) {
      dataLayerRef.current.setStyle({
        fillColor: "#AEDFF7",
        fillOpacity: 0.2,
        strokeColor: "#0088E8",
        strokeWeight: 1,
        visible: true,
      });
    }
    setScore(0);
    setTotalQuestions(0);
    setGameState("waiting");
    setCurrentFeature(null);
    setRemainingFeatures(Object.keys(featuresMap || {}));
  };

  const generateNewQuestion = () => {
    if (remainingFeatures.length === 0) {
      setGameState("finished");
      return;
    }
    if (timer) clearInterval(timer);

    const randomIndex = Math.floor(Math.random() * remainingFeatures.length);
    const featureId = remainingFeatures[randomIndex];
    const feature = featuresMap[featureId];

    const newRemainingFeatures = [...remainingFeatures];
    newRemainingFeatures.splice(randomIndex, 1);
    setRemainingFeatures(newRemainingFeatures);

    setCurrentFeature(feature);

    const correctMoji = feature.getProperty("MOJI");
    let optionsArray = [correctMoji];
    while (optionsArray.length < 4) {
      const randomMoji =
        allMojiNames[Math.floor(Math.random() * allMojiNames.length)];
      if (!optionsArray.includes(randomMoji)) {
        optionsArray.push(randomMoji);
      }
    }
    optionsArray = optionsArray.sort(() => Math.random() - 0.5);
    setOptions(optionsArray);

    setSelectedOption(null);
    setIsCorrect(null);
    setGameState("question");
    setTotalQuestions((prev) => prev + 1);

    setTimeLeft(20);
    const newTimer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(newTimer);
          checkAnswer(null); // 時間切れの場合
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimer(newTimer);

    if (mapRef.current && dataLayerRef.current) {
      dataLayerRef.current.setStyle({
        fillColor: "#AEDFF7",
        fillOpacity: 0.1,
        strokeColor: "#0088E8",
        strokeWeight: 0.5,
        visible: true,
      });
      dataLayerRef.current.overrideStyle(feature, {
        fillColor: "#FFC107",
        fillOpacity: 0.7,
        strokeColor: "#FF9800",
        strokeWeight: 2,
        visible: true,
      });
    }
  };

  const checkAnswer = (option) => {
    if (timer) clearInterval(timer);
    if (!currentFeature) return;
    const correctAnswer = currentFeature.getProperty("MOJI");
    const isAnswerCorrect = option === correctAnswer;
    setSelectedOption(option);
    setIsCorrect(isAnswerCorrect);
    if (isAnswerCorrect) {
      setScore((prevScore) => prevScore + 1);
    }
    setGameState("result");

    if (mapRef.current && dataLayerRef.current && currentFeature) {
      dataLayerRef.current.overrideStyle(currentFeature, {
        fillColor: isAnswerCorrect ? "#4CAF50" : "#F44336",
        fillOpacity: 0.7,
        strokeColor: isAnswerCorrect ? "#388E3C" : "#D32F2F",
        strokeWeight: 2,
        visible: true,
      });
    }
  };

  const nextQuestion = () => {
    generateNewQuestion();
  };

  return {
    currentFeature,
    options,
    selectedOption,
    isCorrect,
    score,
    totalQuestions,
    gameState,
    remainingFeatures,
    timeLeft,
    timer,
    resetGame,
    generateNewQuestion,
    checkAnswer,
    nextQuestion,
  };
}
