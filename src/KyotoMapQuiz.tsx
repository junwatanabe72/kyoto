import React, { useState, useRef, useEffect } from 'react';
import { GoogleMap, useJsApiLoader } from '@react-google-maps/api';
import './KyotoMapQuiz.css';

const mapContainerStyle = { width: '100%', height: '550px' };
const center = { lat: 35.0116, lng: 135.7681 };

function KyotoMapQuiz() {
  // Google Maps APIのロード状態
  const { isLoaded } = useJsApiLoader({
    googleMapsApiKey: 'AIzaSyA1AQfUtxSAW3-S-3kc0CvRXU__flcYdWY' // ご自身のAPIキーに置き換えてください
  });

  // 状態変数
  const [currentFeature, setCurrentFeature] = useState(null);
  const [options, setOptions] = useState([]);
  const [selectedOption, setSelectedOption] = useState(null);
  const [isCorrect, setIsCorrect] = useState(null);
  const [score, setScore] = useState(0);
  const [totalQuestions, setTotalQuestions] = useState(0);
  const [gameState, setGameState] = useState('waiting'); // waiting, question, result
  const [highlightedFeature, setHighlightedFeature] = useState(null);
  const [allMojiNames, setAllMojiNames] = useState([]);
  const [featuresMap, setFeaturesMap] = useState({});
  const [remainingFeatures, setRemainingFeatures] = useState([]);
  const [timeLeft, setTimeLeft] = useState(20);
  const [timer, setTimer] = useState(null);
  
  // 参照
  const mapRef = useRef(null);
  const dataLayerRef = useRef(null);

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

  // ジオメトリ内の全ての座標点をboundsに追加する再帰関数
  const processPoints = (geometry, callback, thisArg) => {
    if (geometry.getType() === 'Point') {
      callback.call(thisArg, geometry.get());
    } else if (
      geometry.getType() === 'MultiPoint' ||
      geometry.getType() === 'LineString' ||
      geometry.getType() === 'LinearRing'
    ) {
      geometry.getArray().forEach(callback, thisArg);
    } else if (
      geometry.getType() === 'MultiLineString' ||
      geometry.getType() === 'MultiPolygon'
    ) {
      geometry.getArray().forEach((g) => processPoints(g, callback, thisArg));
    } else if (geometry.getType() === 'Polygon') {
      geometry.getArray().forEach((g) => processPoints(g, callback, thisArg));
    }
  };

  if (!isLoaded) return (
    <div className="loading-container">
      <div className="loading-spinner"></div>
      <p>地図を読み込み中...</p>
    </div>
  );

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
        <GoogleMap
          mapContainerStyle={mapContainerStyle}
          center={center}
          zoom={13}
          options={{
            mapTypeControl: false,
            streetViewControl: false,
            fullscreenControl: true,
            zoomControl: true,
            styles: [
              {
                featureType: 'poi',
                elementType: 'labels',
                stylers: [{ visibility: 'off' }]
              }
            ]
          }}
          onLoad={(map) => {
            mapRef.current = map;
            map.data.loadGeoJson('/meshData.geojson', null, (features) => {
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
            });
          }}
        />
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
              正解は「<span className="correct-answer">{currentFeature?.getProperty('MOJI')}</span>」です。
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

