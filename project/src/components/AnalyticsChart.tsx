import React from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar, Pie } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend
);

interface ChartData {
  labels: string[];
  values: number[];
}

interface AnalyticsChartProps {
  type: 'bar' | 'pie';
  data: ChartData;
  title: string;
}

export default function AnalyticsChart({ type, data, title }: AnalyticsChartProps) {
  const colors = [
    'rgba(59, 130, 246, 0.8)',
    'rgba(16, 185, 129, 0.8)',
    'rgba(249, 115, 22, 0.8)',
    'rgba(139, 92, 246, 0.8)',
    'rgba(236, 72, 153, 0.8)',
    'rgba(34, 197, 94, 0.8)',
    'rgba(239, 68, 68, 0.8)',
    'rgba(168, 85, 247, 0.8)'
  ];

  const borderColors = colors.map(color => color.replace('0.8', '1'));

  const chartData = {
    labels: data.labels,
    datasets: [
      {
        label: 'Responses',
        data: data.values,
        backgroundColor: colors.slice(0, data.labels.length),
        borderColor: borderColors.slice(0, data.labels.length),
        borderWidth: 2,
        borderRadius: type === 'bar' ? 6 : 0,
        borderSkipped: false,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: type === 'pie' ? 'right' : 'top' as const,
        labels: {
          usePointStyle: true,
          padding: 20,
          font: {
            size: 12,
            weight: '500' as const
          }
        }
      },
      tooltip: {
        backgroundColor: 'rgba(0, 0, 0, 0.8)',
        titleColor: 'white',
        bodyColor: 'white',
        borderColor: 'rgba(59, 130, 246, 1)',
        borderWidth: 1,
        cornerRadius: 8,
        padding: 12
      }
    },
    scales: type === 'bar' ? {
      y: {
        beginAtZero: true,
        ticks: {
          stepSize: 1,
          font: {
            size: 11
          }
        },
        grid: {
          color: 'rgba(0, 0, 0, 0.05)'
        }
      },
      x: {
        ticks: {
          font: {
            size: 11
          }
        },
        grid: {
          display: false
        }
      }
    } : undefined,
  };

  const ChartComponent = type === 'bar' ? Bar : Pie;

  return (
    <div className="h-80">
      <ChartComponent data={chartData} options={options} />
    </div>
  );
}