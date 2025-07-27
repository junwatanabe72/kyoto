// Mapbox utilities for the Kyoto quiz app

// Mapbox style configuration (Japanese-friendly with colors)
export const mapboxStyle = "mapbox://styles/mapbox/streets-v12";

// Initial view state for Kyoto
export const kyotoViewState = {
  longitude: 135.7681,
  latitude: 35.0116,
  zoom: 13
};

// Allowed wards for filtering
export const allowedWards = ["中京区", "下京区", "上京区", "左京区", "右京区", "伏見区", "北区", "山科区", "西京区", "東山区", "南区"];

// Layer styles for districts (colorful based on population)
export const districtLayerStyle = {
  id: 'kyoto-districts',
  type: 'fill' as const,
  paint: {
    'fill-color': [
      'interpolate',
      ['linear'],
      ['get', 'JINKO'],
      0, '#E8F5E8',
      1000, '#81C784', 
      5000, '#4CAF50',
      10000, '#2E7D32',
      20000, '#1B5E20'
    ] as any,
    'fill-opacity': 0.7
  }
};

export const districtBorderLayerStyle = {
  id: 'kyoto-districts-border',
  type: 'line' as const,
  paint: {
    'line-color': '#1976D2',
    'line-width': 2
  }
};