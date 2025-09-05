import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { 
  X, 
  Copy, 
  Check, 
  Share2, 
  Edit, 
  Eye, 
  Calendar, 
  Users, 
  MessageSquare,
  ExternalLink,
  Facebook,
  Twitter,
  Linkedin,
  Mail
} from 'lucide-react';

interface Survey {
  survey_id: string;
  topic: string;
  audience: string;
  num_questions: number;
  created_at: string;
  questions_count: number;
  responses_count: number;
}

interface ShareModalProps {
  survey: Survey;
  isOpen: boolean;
  onClose: () => void;
}

const ShareModal: React.FC<ShareModalProps> = ({ survey, isOpen, onClose }) => {
  const [copied, setCopied] = useState(false);
  const [shareMethod, setShareMethod] = useState<'link' | 'social'>('link');

  if (!isOpen) return null;

  const surveyUrl = `${window.location.origin}/survey/${survey.survey_id}`;
  const shareText = `Take this survey: ${survey.topic}`;

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(surveyUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const shareToSocial = (platform: string) => {
    const encodedUrl = encodeURIComponent(surveyUrl);
    const encodedText = encodeURIComponent(shareText);
    
    let shareUrl = '';
    
    switch (platform) {
      case 'facebook':
        shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`;
        break;
      case 'twitter':
        shareUrl = `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`;
        break;
      case 'linkedin':
        shareUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`;
        break;
      case 'email':
        shareUrl = `mailto:?subject=${encodeURIComponent(survey.topic)}&body=${encodedText}%0A%0A${encodedUrl}`;
        break;
    }
    
    if (shareUrl) {
      window.open(shareUrl, '_blank', 'width=600,height=400');
    }
  };

  const handleNativeShare = async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: survey.topic,
          text: shareText,
          url: surveyUrl,
        });
      } catch (error) {
        
      }
    } else {
      copyToClipboard();
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <h2 className="text-2xl font-bold text-gray-900">Share Survey</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content with Custom Scrollbar */}
        <div 
          className="overflow-y-auto max-h-[calc(90vh-140px)] custom-scrollbar"
          style={{
            scrollbarWidth: 'thin',
            scrollbarColor: '#CBD5E1 #F1F5F9'
          }}
        >
          <style>{`
            .custom-scrollbar::-webkit-scrollbar {
              width: 6px;
            }
            .custom-scrollbar::-webkit-scrollbar-track {
              background: #f1f5f9;
              border-radius: 10px;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb {
              background: linear-gradient(180deg, #cbd5e1 0%, #94a3b8 100%);
              border-radius: 10px;
              border: none;
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:hover {
              background: linear-gradient(180deg, #94a3b8 0%, #64748b 100%);
            }
            .custom-scrollbar::-webkit-scrollbar-thumb:active {
              background: linear-gradient(180deg, #64748b 0%, #475569 100%);
            }
          `}</style>
          
          <div className="p-6 space-y-8">
            {/* Survey Details Section */}
            <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Survey Details</h3>
              
              <div className="space-y-3">
                <div>
                  <h4 className="font-medium text-gray-900 text-lg">{survey.topic}</h4>
                  <p className="text-gray-600">Target Audience: {survey.audience}</p>
                </div>
                
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                    <MessageSquare className="w-6 h-6 text-blue-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-gray-900">{survey.questions_count}</div>
                    <div className="text-xs text-gray-600">Questions</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm">
                    <Users className="w-6 h-6 text-green-600 mx-auto mb-1" />
                    <div className="text-xl font-bold text-gray-900">{survey.responses_count}</div>
                    <div className="text-xs text-gray-600">Responses</div>
                  </div>
                  
                  <div className="text-center p-3 bg-white rounded-lg shadow-sm col-span-2">
                    <Calendar className="w-6 h-6 text-purple-600 mx-auto mb-1" />
                    <div className="text-sm font-bold text-gray-900">{formatDate(survey.created_at)}</div>
                    <div className="text-xs text-gray-600">Created</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Share Options Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Share Options</h3>
              
              {/* Share Method Toggle */}
              <div className="flex bg-gray-100 rounded-lg p-1 mb-4">
                <button
                  onClick={() => setShareMethod('link')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    shareMethod === 'link'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Copy Link
                </button>
                <button
                  onClick={() => setShareMethod('social')}
                  className={`flex-1 py-2 px-4 rounded-md text-sm font-medium transition-colors ${
                    shareMethod === 'social'
                      ? 'bg-white text-blue-600 shadow-sm'
                      : 'text-gray-600 hover:text-gray-800'
                  }`}
                >
                  Social Share
                </button>
              </div>

              {shareMethod === 'link' ? (
                /* Link Sharing */
                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <div className="flex-1 p-3 bg-gray-50 rounded-lg border">
                      <p className="text-sm text-gray-600 mb-1">Survey Link:</p>
                      <p className="text-sm font-mono text-gray-800 break-all">{surveyUrl}</p>
                    </div>
                    <button
                      onClick={copyToClipboard}
                      className="p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                      title="Copy to clipboard"
                    >
                      {copied ? <Check className="w-5 h-5" /> : <Copy className="w-5 h-5" />}
                    </button>
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={handleNativeShare}
                      className="flex-1 inline-flex items-center justify-center space-x-2 bg-gray-100 text-gray-700 px-4 py-3 rounded-lg font-medium hover:bg-gray-200 transition-colors"
                    >
                      <Share2 className="w-4 h-4" />
                      <span>Share via Device</span>
                    </button>
                    
                    <Link
                      to={`/survey/${survey.survey_id}`}
                      target="_blank"
                      className="flex-1 inline-flex items-center justify-center space-x-2 bg-blue-100 text-blue-700 px-4 py-3 rounded-lg font-medium hover:bg-blue-200 transition-colors"
                    >
                      <ExternalLink className="w-4 h-4" />
                      <span>Open Survey</span>
                    </Link>
                  </div>
                </div>
              ) : (
                /* Social Media Sharing */
                <div className="grid grid-cols-2 gap-3">
                  <button
                    onClick={() => shareToSocial('facebook')}
                    className="flex items-center justify-center space-x-2 p-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    <Facebook className="w-5 h-5" />
                    <span>Facebook</span>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('twitter')}
                    className="flex items-center justify-center space-x-2 p-3 bg-sky-500 text-white rounded-lg hover:bg-sky-600 transition-colors"
                  >
                    <Twitter className="w-5 h-5" />
                    <span>Twitter</span>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('linkedin')}
                    className="flex items-center justify-center space-x-2 p-3 bg-blue-700 text-white rounded-lg hover:bg-blue-800 transition-colors"
                  >
                    <Linkedin className="w-5 h-5" />
                    <span>LinkedIn</span>
                  </button>
                  
                  <button
                    onClick={() => shareToSocial('email')}
                    className="flex items-center justify-center space-x-2 p-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  >
                    <Mail className="w-5 h-5" />
                    <span>Email</span>
                  </button>
                </div>
              )}
            </div>

            {/* Edit & Preview Section */}
            <div>
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Survey Management</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Link
                  to={`/edit/${survey.survey_id}`}
                  onClick={onClose}
                  className="flex items-center justify-center space-x-2 bg-green-100 text-green-700 px-6 py-4 rounded-lg font-medium hover:bg-green-200 transition-colors"
                >
                  <Edit className="w-5 h-5" />
                  <span>Edit Survey</span>
                </Link>
                
                <Link
                  to={`/survey/${survey.survey_id}`}
                  target="_blank"
                  className="flex items-center justify-center space-x-2 bg-purple-100 text-purple-700 px-6 py-4 rounded-lg font-medium hover:bg-purple-200 transition-colors"
                >
                  <Eye className="w-5 h-5" />
                  <span>Preview Survey</span>
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-gray-50 rounded-b-2xl border-t border-gray-100">
          <div className="flex justify-center items-center">
            <p className="text-sm text-gray-600">
              {copied ? 'Link copied to clipboard!' : 'Share your survey to start collecting responses'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ShareModal;
