import React from 'react';

const Header: React.FC = () => {
  return (
    <header style={{
      backgroundColor: '#8B5A3C',
      color: 'white',
      padding: '16px 24px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.1)',
      zIndex: 1000,
      position: 'relative'
    }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        maxWidth: '1200px',
        margin: '0 auto'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{
            width: '32px',
            height: '32px',
            backgroundColor: '#FF6B35',
            borderRadius: '6px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: 'bold',
            fontSize: '16px'
          }}>
            京
          </div>
          <div>
            <h1 style={{ 
              margin: 0, 
              fontSize: '20px', 
              fontWeight: '600',
              lineHeight: '1.2'
            }}>
              京都町探索マップ
            </h1>
            <p style={{ 
              margin: 0, 
              fontSize: '12px', 
              opacity: 0.8,
              fontWeight: '300'
            }}>
              データで読み解く、京都の町並み
            </p>
          </div>
        </div>
        <nav style={{ display: 'flex', gap: '24px' }}>
          <span style={{
            fontSize: '14px',
            padding: '8px 0',
            borderBottom: '2px solid #FF6B35'
          }}>
            京都町探索マップ
          </span>
        </nav>
      </div>
    </header>
  );
};

export default Header;