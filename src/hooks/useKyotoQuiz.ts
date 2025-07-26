import { useState, useRef, useEffect } from 'react';
import { processPoints } from '../utils/mapUtils';

function useKyotoQuiz() {
  // 状態変数
  const [currentFeature, setCurrentFeature] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameState, setGameState] = useState('waiting'); // waiting, question, result, finished
  const [highlightedFeature, setHighlightedFeature] = useState(null);
  const [allMojiNames, setAllMojiNames] = useState([]);
  const [featuresMap, setFeaturesMap] = useState({});
  const [remainingFeatures, setRemainingFeatures] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timer, setTimer] = useState(null);
  
  // 参照
  const mapRef = useRef(null);
  const dataLayerRef = useRef(null);

  // マップ参照を設定する関数
  const setMapRefs = (map, dataLayer) => {
    mapRef.current = map;
    dataLayerRef.current = dataLayer;
  };

  // GeoJSONデータをロードした後の処理
  const onGeoJsonLoaded = (features, map) => {
    console.log('GeoJSON loaded. Number of features:', features.length);
    
    // 全ての町名を収集
    const mojiNames = [];
    const featuresObject = {};
    
    map.data.forEach((feature) => {
      const moji = feature.getProperty('MOJI');
      if (moji) {
        mojiNames.push(moji);
        featuresObject[feature.getId() || Math.random().toString(36).substr(2, 9)] = feature;
      }
    });
    
    setAllMojiNames(mojiNames);
    setFeaturesMap(featuresObject);
    setRemainingFeatures(Object.keys(featuresObject));
    dataLayerRef.current = map.data;
    
    // 読み込んだフィーチャーに合わせて地図の表示範囲を調整する
    const bounds = new window.google.maps.LatLngBounds();
    map.data.forEach((feature) => {
      processPoints(feature.getGeometry(), bounds.extend, bounds);
    });
    map.fitBounds(bounds);
    
    // スタイルの設定
    map.data.setStyle({
      fillColor: '#AEDFF7',
      fillOpacity: 0.2,
      strokeColor: '#0088E8',
      strokeWeight: 1,
      visible: true
    });
  };

  // ゲームリセット
  const resetGame = () => {
    if (mapRef.current && dataLayerRef.current) {
      dataLayerRef.current.setStyle({
        fillColor: '#AEDFF7',
        fillOpacity: 0.2,
        strokeColor: '#0088E8',
        strokeWeight: 1,
        visible: true
      });
      
      setScore(0);
      setTotalQuestions(0);
      setGameState('waiting');
      setHighlightedFeature(null);
      setRemainingFeatures([...Object.keys(featuresMap)]);
    }
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
    
    // 選択肢を生成 (正解 + ランダムな3つの選択肢)
    const correctMoji = feature.getProperty('MOJI');
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

    // マップの表示を更新
    if (mapRef.current && dataLayerRef.current) {
      // すべての特徴を薄いスタイルに
      dataLayerRef.current.setStyle({
        fillColor: '#AEDFF7',
        fillOpacity: 0.1,
        strokeColor: '#0088E8',
        strokeWeight: 0.5,
        visible: true
      });
      
      // ハイライトする特徴のスタイルを変更
      dataLayerRef.current.overrideStyle(feature, {
        fillColor: '#FFC107',
        fillOpacity: 0.7,
        strokeColor: '#FF9800',
        strokeWeight: 2,
        visible: true
      });
      
      // マップビューを特徴の範囲に合わせる
      const bounds = new window.google.maps.LatLngBounds();
      processPoints(feature.getGeometry(), bounds.extend, bounds);
      mapRef.current.fitBounds(bounds, { padding: 50 });
    }
  };

  // 答えの確認
  const checkAnswer = (option) => {
    if (timer) clearInterval(timer);
    
    if (!currentFeature) return;
    
    const correctAnswer = currentFeature.getProperty('MOJI');
    const isAnswerCorrect = option === correctAnswer;
    
    setSelectedOption(option);
    setIsCorrect(isAnswerCorrect);
    
    if (isAnswerCorrect) {
      setScore(prevScore => prevScore + 1);
    }
    
    setGameState('result');
    
    // 結果表示のスタイルを設定
    if (mapRef.current && dataLayerRef.current && currentFeature) {
      dataLayerRef.current.overrideStyle(currentFeature, {
        fillColor: isAnswerCorrect ? '#4CAF50' : '#F44336',
        fillOpacity: 0.7,
        strokeColor: isAnswerCorrect ? '#388E3C' : '#D32F2F',
        strokeWeight: 2,
        visible: true
      });
    }
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
    setMapRefs,
    onGeoJsonLoaded,
    generateNewQuestion,
    checkAnswer,
    nextQuestion,
    resetGame,
    
    // refs
    mapRef,
    dataLayerRef
  };
}

export default useKyotoQuiz;