import React, { useState, useRef, useEffect } from 'react';
import Map, { Source, Layer } from 'react-map-gl';
import 'mapbox-gl/dist/mapbox-gl.css';
import './KyotoMapQuiz.css';

const mapContainerStyle = { width: '100%', height: '550px' };
const initialViewState = {
  longitude: 135.7681,
  latitude: 35.0116,
  zoom: 13
};

function KyotoMapQuiz() {

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
  const [geoJsonData, setGeoJsonData] = useState<any>(null);
  const [highlightedFeatureId, setHighlightedFeatureId] = useState<string | null>(null);
  const [viewState, setViewState] = useState(initialViewState);
  
  // 参照
  const mapRef = useRef<any>(null);

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

  // GeoJSONデータの読み込み
  useEffect(() => {
    fetch('/district/meshData_wgs84.geojson')
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

  if (!process.env.REACT_APP_MAPBOX_ACCESS_TOKEN) {
    return (
      <div className="loading-container">
        <p>Mapbox APIキーが設定されていません</p>
      </div>
    );
  }

  return (
    <div className="kyoto-map-quiz">
      <header className="quiz-header">
        <h1>京都町名当てクイズ</h1>
        <p className="quiz-description">光る地域の町名を当ててください！</p>
        <div className="quiz-stats">
          <div className="score-container">
            <span className="score-label">スコア:</span>
            <span className="score-value">{score}/{totalQuestions}</span>
          </div>
          {gameState === 'question' && (
            <div className="timer-container">
              <span className="timer-label">残り時間:</span>
              <span className={`timer-value ${timeLeft <= 5 ? 'timer-warning' : ''}`}>{timeLeft}秒</span>
            </div>
          )}
        </div>
      </header>

      <div className="map-container">
        <Map
          ref={mapRef}
          {...viewState}
          onMove={evt => setViewState(evt.viewState)}
          style={mapContainerStyle}
          mapStyle="mapbox://styles/mapbox/streets-v12"
          mapboxAccessToken={process.env.REACT_APP_MAPBOX_ACCESS_TOKEN}
        >
          {geoJsonData && (
            <Source id="kyoto-districts-source" type="geojson" data={geoJsonData}>
              <Layer
                id="kyoto-districts"
                type="fill"
                paint={{
                  'fill-color': [
                    'case',
                    ['==', ['get', 'MOJI'], highlightedFeatureId ? featuresMap[highlightedFeatureId]?.properties?.MOJI || '' : ''],
                    gameState === 'result' ? (isCorrect ? '#4CAF50' : '#F44336') : '#FFC107',
                    [
                      'interpolate',
                      ['linear'],
                      ['get', 'JINKO'],
                      0, '#F3E5F5',
                      1000, '#CE93D8', 
                      5000, '#AB47BC',
                      10000, '#8E24AA',
                      20000, '#6A1B9A'
                    ]
                  ],
                  'fill-opacity': [
                    'case',
                    ['==', ['get', 'MOJI'], highlightedFeatureId ? featuresMap[highlightedFeatureId]?.properties?.MOJI || '' : ''],
                    0.7,
                    gameState === 'question' ? 0.1 : 0.2
                  ]
                }}
              />
              <Layer
                id="kyoto-districts-border"
                type="line"
                paint={{
                  'line-color': [
                    'case',
                    ['==', ['get', 'MOJI'], highlightedFeatureId ? featuresMap[highlightedFeatureId]?.properties?.MOJI || '' : ''],
                    gameState === 'result' ? (isCorrect ? '#388E3C' : '#D32F2F') : '#FF9800',
                    '#424242'
                  ],
                  'line-width': [
                    'case',
                    ['==', ['get', 'MOJI'], highlightedFeatureId ? featuresMap[highlightedFeatureId]?.properties?.MOJI || '' : ''],
                    2,
                    1
                  ]
                }}
              />
            </Source>
          )}
        </Map>
      </div>

      <div className="quiz-controls">
        {gameState === 'waiting' && (
          <div className="start-container">
            <p>京都の特徴的な町名を当てるクイズです。<br />地図上で光る地域の町名を4つの選択肢から選んでください。</p>
            <button 
              className="start-button"
              onClick={generateNewQuestion}
            >
              クイズを始める
            </button>
          </div>
        )}

        {gameState === 'question' && (
          <div className="options-container">
            <h3 className="question-prompt">光っている地域の町名は？</h3>
            <div className="options-grid">
              {options.map((option, index) => (
                <button
                  key={index}
                  className={`option-button ${selectedOption === option ? 'selected' : ''}`}
                  onClick={() => checkAnswer(option)}
                  disabled={selectedOption !== null}
                >
                  {option}
                </button>
              ))}
            </div>
          </div>
        )}

        {gameState === 'result' && (
          <div className="result-container">
            <div className={`result-badge ${isCorrect ? 'correct' : 'incorrect'}`}>
              {isCorrect ? '正解！' : '不正解'}
            </div>
            <p className="result-message">
              正解は「<span className="correct-answer">{currentFeature?.properties?.MOJI}</span>」です。
            </p>
            <button 
              className="next-button"
              onClick={nextQuestion}
            >
              次の問題へ
            </button>
          </div>
        )}

        {gameState === 'finished' && (
          <div className="finished-container">
            <h2>クイズ終了！</h2>
            <p className="final-score">あなたのスコアは {score}/{totalQuestions} です！</p>
            <button 
              className="restart-button"
              onClick={resetGame}
            >
              もう一度挑戦する
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default KyotoMapQuiz;