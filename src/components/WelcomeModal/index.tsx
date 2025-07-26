import React, { useState } from 'react';

interface WelcomeModalProps {
  onClose: () => void;
}

const WelcomeModal: React.FC<WelcomeModalProps> = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  
  const steps = [
    {
      title: "京都町探索マップへようこそ",
      content: "このアプリでは、京都市内5区の詳細な人口・世帯データを地図上で探索できます。",
      icon: "🗾"
    },
    {
      title: "地図の使い方",
      content: "地図上の町エリアにマウスを乗せると、詳細な統計情報が表示されます。",
      icon: "🖱️"
    },
    {
      title: "分析機能",
      content: "右上の「分析を見る」ボタンから、全体統計や人口ランキングを確認できます。",
      icon: "📊"
    }
  ];

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 2000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '12px',
        padding: '32px',
        maxWidth: '480px',
        margin: '20px',
        textAlign: 'center',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '16px' }}>
          {steps[currentStep].icon}
        </div>
        <h2 style={{ 
          color: '#8B5A3C', 
          marginBottom: '16px',
          fontSize: '24px'
        }}>
          {steps[currentStep].title}
        </h2>
        <p style={{ 
          color: '#666', 
          marginBottom: '32px',
          lineHeight: '1.6'
        }}>
          {steps[currentStep].content}
        </p>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            {steps.map((_, index) => (
              <div key={index} style={{
                width: '8px',
                height: '8px',
                borderRadius: '50%',
                backgroundColor: index === currentStep ? '#8B5A3C' : '#ddd'
              }} />
            ))}
          </div>
          
          <div style={{ display: 'flex', gap: '12px' }}>
            {currentStep < steps.length - 1 ? (
              <button 
                onClick={() => setCurrentStep(currentStep + 1)}
                style={{
                  backgroundColor: '#8B5A3C',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                次へ
              </button>
            ) : (
              <button 
                onClick={onClose}
                style={{
                  backgroundColor: '#2E7D32',
                  color: 'white',
                  border: 'none',
                  padding: '12px 24px',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                始める
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default WelcomeModal;