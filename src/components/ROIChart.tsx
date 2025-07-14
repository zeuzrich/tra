import React from 'react';
import { ChartData } from '../types';

interface ROIChartProps {
  data: ChartData[];
  height?: number;
}

const ROIChart: React.FC<ROIChartProps> = ({ data, height = 300 }) => {
  if (data.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução do ROI</h3>
        <div className="flex items-center justify-center h-64 text-gray-500">
          <p>Nenhum dado disponível</p>
        </div>
      </div>
    );
  }

  const maxROI = Math.max(...data.map(d => d.roi));
  const minROI = Math.min(...data.map(d => d.roi));
  const range = maxROI - minROI;

  return (
    <div className="bg-white rounded-xl shadow-lg p-6 border border-gray-100">
      <h3 className="text-lg font-semibold text-gray-900 mb-4">Evolução do ROI</h3>
      <div className="relative" style={{ height }}>
        <svg width="100%" height="100%" className="overflow-visible">
          {/* Grid lines */}
          {[0, 25, 50, 75, 100].map((percentage) => (
            <g key={percentage}>
              <line
                x1="0"
                y1={`${percentage}%`}
                x2="100%"
                y2={`${percentage}%`}
                stroke="#f3f4f6"
                strokeWidth="1"
              />
              <text
                x="-10"
                y={`${percentage}%`}
                textAnchor="end"
                className="text-xs fill-gray-500"
                dominantBaseline="middle"
              >
                {Math.round(maxROI - (range * percentage / 100))}%
              </text>
            </g>
          ))}
          
          {/* ROI Line */}
          <polyline
            points={data.map((d, i) => 
              `${(i / (data.length - 1)) * 100}%,${100 - ((d.roi - minROI) / range) * 100}%`
            ).join(' ')}
            fill="none"
            stroke="#3B82F6"
            strokeWidth="3"
            className="drop-shadow-sm"
          />
          
          {/* Data points */}
          {data.map((d, i) => (
            <circle
              key={i}
              cx={`${(i / (data.length - 1)) * 100}%`}
              cy={`${100 - ((d.roi - minROI) / range) * 100}%`}
              r="4"
              fill="#3B82F6"
              className="hover:r-6 transition-all duration-200 cursor-pointer"
              title={`${d.date}: ${d.roi.toFixed(1)}%`}
            />
          ))}
        </svg>
        
        {/* X-axis labels */}
        <div className="flex justify-between mt-2 text-xs text-gray-500">
          {data.map((d, i) => (
            <span key={i}>{new Date(d.date).toLocaleDateString('pt-BR')}</span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ROIChart;