import React, { useState } from 'react';
import { Search, User, Mail, Globe, Eye, Users, X } from 'lucide-react';
import { SurveyResults, SurveyResponse } from '../../services/api';

interface ResponsesTabProps {
  results: SurveyResults;
}

const ResponsesTab: React.FC<ResponsesTabProps> = ({ results }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterBy, setFilterBy] = useState<'all' | 'registered' | 'anonymous'>('all');
  const [selectedResponse, setSelectedResponse] = useState<SurveyResponse | null>(null);


  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const filteredResponses = results.responses.filter(response => {
    const matchesSearch = !searchTerm || 
      (response.respondent_name?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.respondent_email?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.respondent_occupation?.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (response.response_id.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesFilter = filterBy === 'all' || 
      (filterBy === 'registered' && response.respondent_email) ||
      (filterBy === 'anonymous' && !response.respondent_email);

    return matchesSearch && matchesFilter;
  });

  return (
    <div className="space-y-6">
      {/* Filters and Search */}
      <div className="bg-white rounded-xl shadow-sm border p-6">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          <div className="flex flex-col md:flex-row gap-4 items-center">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search by name, email, or ID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <select
              value={filterBy}
              onChange={(e) => setFilterBy(e.target.value as any)}
              className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Responses</option>
              <option value="registered">Registered Users</option>
              <option value="anonymous">Anonymous Users</option>
            </select>
          </div>

          <div className="text-sm text-gray-600">
            {filteredResponses.length} response{filteredResponses.length !== 1 ? 's' : ''}
          </div>
        </div>
      </div>

      {/* Responses Table */}
      <div className="bg-white rounded-xl shadow-sm border overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User Info
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Response ID
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Submitted At
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Completion Time
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResponses.map((response) => (
                <tr key={response.response_id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10">
                        <div className="h-10 w-10 rounded-full bg-gray-300 flex items-center justify-center">
                          <User className="w-5 h-5 text-gray-600" />
                        </div>
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {response.respondent_name || 'Anonymous User'}
                        </div>
                        <div className="text-sm text-gray-500 space-y-1">
                          {response.respondent_email && (
                            <div className="flex items-center space-x-1">
                              <Mail className="w-3 h-3" />
                              <span>{response.respondent_email}</span>
                            </div>
                          )}
                          <div className="flex items-center space-x-3 text-xs">
                            {response.respondent_age && (
                              <span>Age: {response.respondent_age}</span>
                            )}
                            {response.respondent_occupation && (
                              <span>• {response.respondent_occupation}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 font-mono">
                      {response.response_id.substring(0, 8)}...
                    </div>
                    <div className="text-xs text-gray-500">
                      {response.respondent_email ? 'Registered' : 'Anonymous'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {formatDate(response.created_at)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {response.completion_time ? formatDuration(response.completion_time) : 'N/A'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button
                      onClick={() => setSelectedResponse(response)}
                      className="text-blue-600 hover:text-blue-900 flex items-center space-x-1"
                    >
                      <Eye className="w-4 h-4" />
                      <span>View</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredResponses.length === 0 && (
          <div className="text-center py-12">
            <Users className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No responses found</h3>
            <p className="text-gray-600">
              {searchTerm || filterBy !== 'all' 
                ? 'Try adjusting your search or filter criteria.'
                : 'No one has responded to this survey yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Response Detail Modal */}
      {selectedResponse && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 className="text-2xl font-bold text-gray-900">Response Details</h2>
              <button
                onClick={() => setSelectedResponse(null)}
                className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-6 max-h-[calc(90vh-140px)] overflow-y-auto">
              {/* User Info */}
              <div className="bg-gray-50 rounded-lg p-4 mb-6">
                <h3 className="font-semibold text-gray-900 mb-3">User Information</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-gray-600">Name</p>
                    <p className="font-medium">{selectedResponse.respondent_name || 'Anonymous'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Email</p>
                    <p className="font-medium">{selectedResponse.respondent_email || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Age</p>
                    <p className="font-medium">{selectedResponse.respondent_age || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Occupation</p>
                    <p className="font-medium">{selectedResponse.respondent_occupation || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Response ID</p>
                    <p className="font-medium font-mono text-xs">{selectedResponse.response_id || 'N/A'}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Submitted At</p>
                    <p className="font-medium">{formatDate(selectedResponse.created_at)}</p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600">Completion Time</p>
                    <p className="font-medium">
                      {selectedResponse.completion_time ? formatDuration(selectedResponse.completion_time) : 'N/A'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Responses */}
              <div>
                <h3 className="font-semibold text-gray-900 mb-4">Responses</h3>
                <div className="space-y-4">
                  {results.questions.map((question) => {
                    // Find the response for this question
                    const questionResponse = selectedResponse.responses.find(
                      (response) => response.question_id === question.question_id
                    );
                    
                    return (
                      <div key={question.question_id} className="border rounded-lg p-4">
                        <p className="font-medium text-gray-900 mb-2">{question.question_text}</p>
                        <div className="bg-blue-50 rounded-lg p-3">
                          <p className="text-blue-800">
                            {questionResponse?.answer || 'No response'}
                          </p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponsesTab;
