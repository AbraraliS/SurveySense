import React from 'react';
import { Brain, Cpu, Database, Zap, CheckCircle } from 'lucide-react';
import { SurveyResults } from '../../services/api';

interface MLProcessingStatusProps {
  isProcessing: boolean;
  metrics: {
    accuracy: number;
    precision: number;
    recall: number;
    f1Score: number;
    processingTime: number;
    dataQuality: number;
    algorithmUsed: string[];
  };
  results: SurveyResults;
}

const MLProcessingStatus: React.FC<MLProcessingStatusProps> = ({ 
  isProcessing, 
  metrics, 
  results 
}) => {
  if (isProcessing) {
    return (
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl shadow-sm border p-8">
        <div className="flex items-center justify-center space-x-4 mb-6">
          <div className="relative">
            <div className="w-12 h-12 bg-purple-200 rounded-full animate-pulse"></div>
            <Brain className="w-6 h-6 text-purple-600 absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 animate-bounce" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">AI Analysis in Progress</h3>
            <p className="text-gray-600">Processing {results.responses.length} responses with machine learning algorithms...</p>
          </div>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: 'Data Preprocessing', icon: Database, status: 'complete' },
            { label: 'Pattern Recognition', icon: Zap, status: 'processing' },
            { label: 'ML Model Training', icon: Cpu, status: 'pending' },
            { label: 'Results Generation', icon: CheckCircle, status: 'pending' }
          ].map((step, index) => (
            <div key={index} className="text-center">
              <div className={`w-10 h-10 rounded-full flex items-center justify-center mx-auto mb-2 ${
                step.status === 'complete' ? 'bg-green-100 text-green-600' :
                step.status === 'processing' ? 'bg-blue-100 text-blue-600 animate-pulse' :
                'bg-gray-100 text-gray-400'
              }`}>
                <step.icon className="w-5 h-5" />
              </div>
              <p className="text-sm font-medium text-gray-900">{step.label}</p>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-2xl shadow-sm border p-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center space-x-3">
          <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
            <CheckCircle className="w-6 h-6 text-green-600" />
          </div>
          <div>
            <h3 className="text-xl font-bold text-gray-900">ML Analysis Complete</h3>
            <p className="text-gray-600">
              Processed {results.responses.length} responses in {metrics.processingTime.toFixed(0)}ms
            </p>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-2xl font-bold text-green-600">{Math.round(metrics.accuracy)}%</div>
          <div className="text-sm text-gray-600">Model Accuracy</div>
        </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{metrics.precision.toFixed(3)}</div>
          <div className="text-sm text-gray-600">Precision</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{metrics.recall.toFixed(3)}</div>
          <div className="text-sm text-gray-600">Recall</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{metrics.f1Score.toFixed(3)}</div>
          <div className="text-sm text-gray-600">F1 Score</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{Math.round(metrics.dataQuality)}%</div>
          <div className="text-sm text-gray-600">Data Quality</div>
        </div>
        <div className="text-center">
          <div className="text-lg font-bold text-gray-900">{metrics.algorithmUsed.length}</div>
          <div className="text-sm text-gray-600">Algorithms</div>
        </div>
      </div>

      <div className="mt-4 pt-4 border-t border-green-200">
        <p className="text-sm text-gray-600">
          <span className="font-medium">Algorithms used:</span> {metrics.algorithmUsed.join(', ')}
        </p>
      </div>
    </div>
  );
};

export default MLProcessingStatus;