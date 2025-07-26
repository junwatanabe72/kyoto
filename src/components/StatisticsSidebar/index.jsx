import React, { useState, useMemo, useEffect } from 'react';

const StatisticsSidebar = ({ townData, onTownSelect, selectedTown, onClose }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedWards, setSelectedWards] = useState([]);
  const [sortConfig, setSortConfig] = useState({ field: 'population', direction: 'desc' });
  

  const allowedWards = ["中京区", "下京区", "上京区", "左京区", "右京区"];

  // 町データの処理と正規化
  const processedTowns = useMemo(() => {
    if (!townData || !townData.features) return [];
    
    return townData.features
      .filter(f => 
        allowedWards.includes(f.properties.CITY_NAME) &&
        f.properties.MOJI &&
        f.properties.JINKO !== null
      )
      .map(f => ({
        MOJI: f.properties.MOJI,
        CITY_NAME: f.properties.CITY_NAME,
        AREA: Number(f.properties.AREA),
        JINKO: Number(f.properties.JINKO),
        SETAI: Number(f.properties.SETAI),
        density: Math.round(Number(f.properties.JINKO) / (Number(f.properties.AREA) / 1000000))
      }));
  }, [townData]);

  // フィルタリングとソート
  const filteredAndSortedTowns = useMemo(() => {
    let filtered = [...processedTowns]; // 配列のコピーを作成

    // 区フィルタ
    if (selectedWards.length > 0) {
      filtered = filtered.filter(town => selectedWards.includes(town.CITY_NAME));
    }

    // 検索フィルタ
    if (searchQuery.trim()) {
      filtered = filtered.filter(town => 
        town.MOJI.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    // ソート
    const sortField = sortConfig.field === 'population' ? 'JINKO' :
                     sortConfig.field === 'households' ? 'SETAI' :
                     sortConfig.field === 'area' ? 'AREA' : 'density';
    
    filtered.sort((a, b) => {
      const aValue = a[sortField];
      const bValue = b[sortField];
      const result = aValue > bValue ? 1 : -1;
      return sortConfig.direction === 'asc' ? result : -result;
    });

    return filtered;
  }, [processedTowns, selectedWards, searchQuery, sortConfig]);


  const handleWardToggle = (ward) => {
    setSelectedWards(prev => {
      const newSelection = prev.includes(ward) 
        ? prev.filter(w => w !== ward)
        : [...prev, ward];
      return newSelection;
    });
  };

  const handleSortChange = (value) => {
    const [field, direction] = value.split('_');
    setSortConfig({ field, direction });
  };

  const clearFilters = () => {
    setSearchQuery('');
    setSelectedWards([]);
    setSortConfig({ field: 'population', direction: 'desc' });
  };

  const hasActiveFilters = searchQuery.trim() || selectedWards.length > 0;

  return (
    <div style={{
      width: '100%',
      height: '100vh',
      backgroundColor: 'white',
      borderLeft: window.innerWidth >= 768 ? '1px solid #ddd' : 'none',
      display: 'flex',
      flexDirection: 'column',
      boxShadow: window.innerWidth >= 768 ? '-2px 0 10px rgba(0,0,0,0.1)' : '0 0 20px rgba(0,0,0,0.2)'
    }}>
      {/* ヘッダー */}
      <div style={{ 
        padding: '12px 16px', 
        borderBottom: '1px solid #e5e7eb',
        backgroundColor: '#8B5A3C',
        color: 'white'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '600' }}>
            町データ統計
          </h3>
          <button 
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: 'white',
              fontSize: '20px',
              cursor: 'pointer',
              padding: '2px'
            }}
          >
            ×
          </button>
        </div>
      </div>

      {/* フィルタコントロール */}
      <div style={{ padding: '12px 16px', borderBottom: '1px solid #e5e7eb' }}>
        {/* 区フィルタ */}
        <div style={{ marginBottom: '12px' }}>
          <label style={{ 
            display: 'block', 
            fontSize: '12px', 
            fontWeight: '500', 
            color: '#374151', 
            marginBottom: '6px' 
          }}>
            区で絞り込み
          </label>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
            {allowedWards.map(ward => {
              const isSelected = selectedWards.includes(ward);
              return (
                <button
                  key={ward}
                  onClick={() => handleWardToggle(ward)}
                  style={{
                    padding: '4px 8px',
                    fontSize: '10px',
                    borderRadius: '12px',
                    border: '1px solid #d1d5db',
                    backgroundColor: isSelected ? '#8B5A3C' : 'white',
                    color: isSelected ? 'white' : '#6b7280',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                >
                  {ward} {isSelected && '✓'}
                </button>
              );
            })}
          </div>
        </div>

        {/* 検索ボックス */}
        <div style={{ marginBottom: '12px' }}>
          <div style={{ position: 'relative' }}>
            <input
              type="text"
              placeholder="町名で検索..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{
                width: '100%',
                padding: '8px 32px 8px 10px',
                border: '1px solid #d1d5db',
                borderRadius: '6px',
                fontSize: '12px',
                outline: 'none',
                boxSizing: 'border-box'
              }}
            />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                style={{
                  position: 'absolute',
                  right: '8px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  background: 'none',
                  border: 'none',
                  color: '#9ca3af',
                  cursor: 'pointer',
                  fontSize: '14px'
                }}
              >
                ×
              </button>
            )}
          </div>
        </div>

        {/* ソート */}
        <div style={{ marginBottom: '12px' }}>
          <select 
            value={`${sortConfig.field}_${sortConfig.direction}`}
            onChange={(e) => handleSortChange(e.target.value)}
            style={{
              width: '100%',
              padding: '6px 8px',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              backgroundColor: 'white',
              fontSize: '12px',
              outline: 'none'
            }}
          >
            <option value="population_desc">人口 (多い順)</option>
            <option value="population_asc">人口 (少ない順)</option>
            <option value="households_desc">世帯数 (多い順)</option>
            <option value="households_asc">世帯数 (少ない順)</option>
            <option value="area_desc">面積 (大きい順)</option>
            <option value="area_asc">面積 (小さい順)</option>
            <option value="density_desc">人口密度 (高い順)</option>
            <option value="density_asc">人口密度 (低い順)</option>
          </select>
        </div>

        {/* フィルタ状態 */}
        {hasActiveFilters && (
          <div style={{ 
            display: 'flex', 
            justifyContent: 'space-between', 
            alignItems: 'center',
            fontSize: '10px',
            color: '#6b7280'
          }}>
            <span>{filteredAndSortedTowns.length}件 / {processedTowns.length}件</span>
            <button 
              onClick={clearFilters}
              style={{
                background: 'none',
                border: 'none',
                color: '#8B5A3C',
                fontSize: '10px',
                cursor: 'pointer',
                textDecoration: 'underline'
              }}
            >
              クリア
            </button>
          </div>
        )}
      </div>

      {/* 町リスト */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        <div style={{ padding: '8px', fontSize: '10px', color: '#666', borderBottom: '1px solid #eee' }}>
          表示件数: {filteredAndSortedTowns.length} / {processedTowns.length}
        </div>
        {filteredAndSortedTowns.length === 0 ? (
          <div style={{ 
            textAlign: 'center', 
            padding: '40px 20px', 
            color: '#6b7280' 
          }}>
            <div style={{ fontSize: '32px', marginBottom: '8px' }}>🔍</div>
            <p style={{ margin: 0, fontSize: '14px' }}>該当する町が見つかりません</p>
          </div>
        ) : (
          filteredAndSortedTowns.map((town, index) => (
            <TownListItem
              key={`${town.MOJI}-${index}`}
              town={town}
              rank={index + 1}
              isSelected={selectedTown?.MOJI === town.MOJI}
              onSelect={() => onTownSelect(town)}
            />
          ))
        )}
      </div>

    </div>
  );
};

// 町リストアイテムコンポーネント
const TownListItem = ({ town, rank, isSelected, onSelect }) => (
  <div
    onClick={onSelect}
    style={{
      padding: '8px 16px',
      borderBottom: '1px solid #f3f4f6',
      cursor: 'pointer',
      backgroundColor: isSelected ? '#fef3e2' : 'transparent',
      borderLeft: isSelected ? '3px solid #8B5A3C' : '3px solid transparent',
      transition: 'all 0.2s'
    }}
    onMouseEnter={(e) => {
      if (!isSelected) {
        e.target.style.backgroundColor = '#f9fafb';
      }
    }}
    onMouseLeave={(e) => {
      if (!isSelected) {
        e.target.style.backgroundColor = 'transparent';
      }
    }}
  >
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
          <span style={{ 
            fontWeight: '500', 
            color: '#111827', 
            fontSize: '12px',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap'
          }}>
            {town.MOJI}
          </span>
          <span style={{
            fontSize: '8px',
            padding: '1px 4px',
            backgroundColor: '#e5e7eb',
            color: '#6b7280',
            borderRadius: '8px',
            flexShrink: 0
          }}>
            {town.CITY_NAME}
          </span>
        </div>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px', 
          fontSize: '9px', 
          color: '#6b7280' 
        }}>
          <span>👥 {town.JINKO.toLocaleString()}</span>
          <span>🏠 {town.SETAI.toLocaleString()}</span>
          <span>📊 {town.density.toLocaleString()}/km²</span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0, marginLeft: '6px' }}>
        <div style={{ 
          fontSize: '10px', 
          fontWeight: 'bold', 
          color: '#8B5A3C' 
        }}>
          #{rank}
        </div>
      </div>
    </div>
  </div>
);


export default StatisticsSidebar;