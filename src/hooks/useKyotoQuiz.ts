import { useState, useRef, useEffect } from 'react';

function useKyotoQuiz() {
  // 状態変数
  const [currentFeature, setCurrentFeature] = useState<any>(null);
  const [options, setOptions] = useState<string[]>([]);
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [isCorrect, setIsCorrect] = useState<boolean | null>(null);
  const [score, setScore] = useState<number>(0);
  const [totalQuestions, setTotalQuestions] = useState<number>(0);
  const [gameState, setGameState] = useState<'waiting' | 'question' | 'result' | 'finished'>('waiting');
  const [highlightedFeature, setHighlightedFeature] = useState<any>(null);
  const [allMojiNames, setAllMojiNames] = useState<string[]>([]);
  const [featuresMap, setFeaturesMap] = useState<Record<string, any>>({});
  const [remainingFeatures, setRemainingFeatures] = useState<string[]>([]);
  const [timeLeft, setTimeLeft] = useState<number>(20);
  const [timer, setTimer] = useState<NodeJS.Timeout | null>(null);
  
  // 参照
  const mapRef = useRef<any>(null);
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [highlightedFeatureId, setHighlightedFeatureId] = useState<string | null>(null);

  // GeoJSONデータの読み込み
  useEffect(() => {
    fetch('./district/meshData_wgs84.geojson')
      .then((res) => {
        if (!res.ok) {
          throw new Error(`HTTP error! status: ${res.status}`);
        }
        return res.json();
      })
      .then((data) => {
        const allowedWards = [
          '中京区', '下京区', '上京区', '左京区', '右京区',
          '伏見区', '北区', '山科区', '西京区', '東山区', '南区'
        ];
        
        const filteredFeatures = data.features.filter(
          (f: any) =>
            allowedWards.includes(f.properties.CITY_NAME) &&
            f.properties.MOJI &&
            f.properties.JINKO !== null
        );

        setGeoJsonData({
          type: 'FeatureCollection',
          features: filteredFeatures
        });

        // 全ての町名を収集
        const mojiNames = [];
        const featuresObject = {};
        
        filteredFeatures.forEach((feature, index) => {
          const moji = feature.properties.MOJI;
          if (moji) {
            mojiNames.push(moji);
            featuresObject[`feature_${index}`] = feature;
          }
        });
        
        setAllMojiNames(mojiNames);
        setFeaturesMap(featuresObject);
        setRemainingFeatures(Object.keys(featuresObject));
      })
      .catch((error) => {
        console.error('GeoJSONデータの読み込みに失敗しました:', error);
      });
  }, []);

  // ゲームリセット
  const resetGame = () => {
    setScore(0);
    setTotalQuestions(0);
    setGameState('waiting');
    setHighlightedFeature(null);
    setHighlightedFeatureId(null);
    setRemainingFeatures([...Object.keys(featuresMap)]);
  };

  // 新しい問題を生成
  const generateNewQuestion = () => {
    if (remainingFeatures.length === 0) {
      setGameState('finished');
      return;
    }

    // タイマーをクリア
    if (timer) clearInterval(timer);

    // ランダムに特徴を選択
    const randomIndex = Math.floor(Math.random() * remainingFeatures.length);
    const featureId = remainingFeatures[randomIndex];
    const feature = featuresMap[featureId];
    
    // 残りの特徴から削除
    const newRemainingFeatures = [...remainingFeatures];
    newRemainingFeatures.splice(randomIndex, 1);
    setRemainingFeatures(newRemainingFeatures);

    // 問題設定
    setCurrentFeature(feature);
    setHighlightedFeature(feature);
    setHighlightedFeatureId(featureId);
    
    // 選択肢を生成 (正解 + ランダムな3つの選択肢)
    const correctMoji = feature.properties.MOJI;
    let optionsArray = [correctMoji];
    
    while (optionsArray.length < 4) {
      const randomMoji = allMojiNames[Math.floor(Math.random() * allMojiNames.length)];
      if (!optionsArray.includes(randomMoji)) {
        optionsArray.push(randomMoji);
      }
    }
    
    // 選択肢をシャッフル
    optionsArray = optionsArray.sort(() => Math.random() - 0.5);
    setOptions(optionsArray);
    
    // 状態リセット
    setSelectedOption(null);
    setIsCorrect(null);
    setGameState('question');
    setTotalQuestions(prev => prev + 1);
    
    // タイマー開始
    setTimeLeft(20);
    const newTimer = setInterval(() => {
      setTimeLeft(prev => {
        if (prev <= 1) {
          clearInterval(newTimer);
          checkAnswer(null); // 時間切れ
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    setTimer(newTimer);
  };

  // 答えの確認
  const checkAnswer = (option) => {
    if (timer) clearInterval(timer);
    
    if (!currentFeature) return;
    
    const correctAnswer = currentFeature.properties.MOJI;
    const isAnswerCorrect = option === correctAnswer;
    
    setSelectedOption(option);
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    setGameState('result');
  };

  // 次の問題へ
  const nextQuestion = () => {
    generateNewQuestion();
  };

  return {
    // 状態
    currentFeature,
    options,
    selectedOption,
    isCorrect,
    score,
    totalQuestions,
    gameState,
    highlightedFeature,
    timeLeft,
    
    // アクション
    generateNewQuestion,
    checkAnswer,
    nextQuestion,
    resetGame,
    
    // refs and data
    mapRef,
    geoJsonData,
    highlightedFeatureId
  };
}

export default useKyotoQuiz;