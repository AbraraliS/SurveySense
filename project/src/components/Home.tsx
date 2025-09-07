import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  BarChart3, 
  Users, 
  Brain, 
  ArrowRight, 
  CheckCircle, 
  Star,
  Play,
  Plus,
  TrendingUp,
  Shield,
  Zap
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { getAllSurveys } from '../services/api';

// Define the Survey type based on your survey object structure
type Survey = {
  survey_id: string;
  topic: string;
  audience: string;
  questions_count?: number;
  responses_count?: number;
  // Add other fields as needed
};

const Home: React.FC = () => {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const [recentSurveys, setRecentSurveys] = useState<Survey[]>([]);
  const [stats, setStats] = useState({
    totalSurveys: 0,
    totalResponses: 0
  });

  useEffect(() => {
    if (user) {
      fetchUserData();
    }
  }, [user]);

  const fetchUserData = async () => {
    try {
      const surveys = await getAllSurveys();
      setRecentSurveys(surveys.slice(0, 3)); // Show last 3 surveys
      
      const totalResponses = surveys.reduce((sum, survey) => sum + (survey.responses_count || 0), 0);
      setStats({
        totalSurveys: surveys.length,
        totalResponses
      });
    } catch (error) {
      // Handle error silently
    }
  };

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Questions',
      description: 'Generate smart, targeted questions using advanced AI algorithms',
      color: 'from-blue-500 to-purple-600'
    },
    {
      icon: BarChart3,
      title: 'Real-time Analytics',
      description: 'Get instant insights with beautiful charts and data visualization',
      color: 'from-green-500 to-teal-600'
    },
    {
      icon: Users,
      title: 'Easy Sharing',
      description: 'Share surveys instantly and collect responses from anywhere',
      color: 'from-orange-500 to-red-600'
    },
    {
      icon: Shield,
      title: 'Secure & Private',
      description: 'Your data is protected with enterprise-grade security',
      color: 'from-purple-500 to-pink-600'
    }
  ];

  const benefits = [
    'Create unlimited surveys',
    'AI-generated questions',
    'Real-time response tracking',
    'Advanced analytics dashboard',
    'Export data in multiple formats',
    'Mobile-responsive design'
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <BarChart3 className="h-8 w-8 animate-pulse text-blue-600" />
          </div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-indigo-50">
      {/* Hero Section */}
      <section className="relative py-12 sm:py-20 lg:py-24 overflow-hidden">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            {user ? (
              // Authenticated User Dashboard
              <div className="text-center mb-12">
                <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-4">
                  Welcome back, <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    {user.email?.split('@')[0]}
                  </span>!
                </h1>
                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
                  Ready to create amazing surveys? Let's turn your ideas into actionable insights.
                </p>
                
                {/* Quick Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-2xl mx-auto mb-8">
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        <BarChart3 className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-gray-900">{stats.totalSurveys}</p>
                        <p className="text-gray-600 text-sm">Total Surveys</p>
                      </div>
                    </div>
                  </div>
                  <div className="bg-white rounded-2xl p-6 shadow-lg border border-gray-100">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-gradient-to-r from-green-500 to-teal-600 rounded-xl flex items-center justify-center">
                        <Users className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <p className="text-2xl font-bold text-gray-900">{stats.totalResponses}</p>
                        <p className="text-gray-600 text-sm">Total Respondents</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <button
                    onClick={() => navigate('/create')}
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                  >
                    <Plus className="w-6 h-6 group-hover:rotate-90 transition-transform duration-300" />
                    <span>Create New Survey</span>
                  </button>
                  <button
                    onClick={() => navigate('/surveys')}
                    className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 flex items-center justify-center space-x-2"
                  >
                    <BarChart3 className="w-6 h-6" />
                    <span>View My Surveys</span>
                  </button>
                </div>
              </div>
            ) : (
              // Non-authenticated Hero
              <div className="text-center mb-16">
                <div className="inline-flex items-center space-x-2 bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium mb-6">
                  <Zap className="w-4 h-4" />
                  <span>AI-Powered Survey Platform</span>
                </div>
                
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
                  Create Smarter Surveys with{' '}
                  <span className="bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    AI Magic
                  </span>
                </h1>
                
                <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
                  Transform your research with intelligent question generation, real-time analytics, 
                  and actionable insights that drive better decisions.
                </p>
                
                <div className="flex flex-col sm:flex-row gap-4 justify-center mb-8">
                  <Link
                    to="/signup"
                    className="group bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1 flex items-center justify-center space-x-2"
                  >
                    <span>Get Started Free</span>
                    <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                  <button className="bg-white text-gray-700 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-50 transition-all duration-300 shadow-lg hover:shadow-xl border border-gray-200 flex items-center justify-center space-x-2">
                    <Play className="w-5 h-5" />
                    <span>Watch Demo</span>
                  </button>
                </div>
                
                <div className="flex flex-wrap justify-center gap-6 text-sm text-gray-600">
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>No credit card required</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Free forever plan</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <CheckCircle className="w-4 h-4 text-green-500" />
                    <span>Setup in 2 minutes</span>
                  </div>
                </div>
              </div>
            )}

            {/* Recent Surveys (for authenticated users) */}
            {user && recentSurveys.length > 0 && (
              <div className="bg-white rounded-3xl shadow-xl p-8 mb-16 border border-gray-100">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">Recent Surveys</h2>
                  <Link 
                    to="/surveys"
                    className="text-blue-600 hover:text-blue-700 font-medium flex items-center space-x-1"
                  >
                    <span>View all</span>
                    <ArrowRight className="w-4 h-4" />
                  </Link>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {recentSurveys.map((survey: any) => (
                    <div key={survey.survey_id} className="bg-gray-50 rounded-xl p-6 hover:bg-gray-100 transition-colors border border-gray-200">
                      <h3 className="font-semibold text-gray-900 mb-2 truncate">{survey.topic}</h3>
                      <p className="text-gray-600 text-sm mb-4 truncate">{survey.audience}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4 text-xs text-gray-500">
                          <span>{survey.questions_count} questions</span>
                          <span>{survey.responses_count} responses</span>
                        </div>
                        <button 
                          onClick={() => navigate(`/survey/${survey.survey_id}/results`)}
                          className="text-blue-600 hover:text-blue-700 text-sm font-medium"
                        >
                          View →
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 sm:py-20 bg-white">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6">
                Why Choose SurveySense?
              </h2>
              <p className="text-lg sm:text-xl text-gray-600 max-w-3xl mx-auto">
                Powerful features designed to make survey creation effortless and insights actionable
              </p>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
              {features.map((feature, index) => {
                const Icon = feature.icon;
                return (
                  <div 
                    key={index}
                    className="group relative bg-white rounded-2xl p-8 shadow-lg hover:shadow-2xl transition-all duration-300 border border-gray-100 hover:border-gray-200 transform hover:-translate-y-2"
                  >
                    <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform duration-300`}>
                      <Icon className="w-7 h-7 text-white" />
                    </div>
                    <h3 className="text-xl font-bold text-gray-900 mb-3">{feature.title}</h3>
                    <p className="text-gray-600 leading-relaxed">{feature.description}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-16 sm:py-20 bg-gradient-to-br from-blue-50 to-indigo-100">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto text-center">
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-12">
              Everything You Need to Succeed
            </h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {benefits.map((benefit, index) => (
                <div key={index} className="flex items-center space-x-3 bg-white rounded-xl p-4 shadow-sm">
                  <CheckCircle className="w-6 h-6 text-green-500 flex-shrink-0" />
                  <span className="text-gray-800 font-medium">{benefit}</span>
                </div>
              ))}
            </div>
            
            {!user && (
              <div className="mt-12">
                <Link
                  to="/signup"
                  className="inline-flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-8 py-4 rounded-2xl font-bold text-lg hover:from-blue-700 hover:to-purple-700 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  <span>Start Creating Surveys</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      {!user && (
        <section className="py-16 sm:py-20 bg-gradient-to-r from-blue-600 to-purple-600">
          <div className="container mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div className="max-w-4xl mx-auto">
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-white mb-6">
                Ready to Get Started?
              </h2>
              <p className="text-lg sm:text-xl text-blue-100 mb-8 max-w-2xl mx-auto">
                Join thousands of researchers, marketers, and businesses who trust SurveySense 
                for their data collection needs.
              </p>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Link
                  to="/signup"
                  className="bg-white text-blue-600 px-8 py-4 rounded-2xl font-bold text-lg hover:bg-gray-100 transition-all duration-300 shadow-xl hover:shadow-2xl transform hover:-translate-y-1"
                >
                  Create Free Account
                </Link>
                <Link
                  to="/login"
                  className="border-2 border-white text-white px-8 py-4 rounded-2xl font-bold text-lg hover:bg-white hover:text-blue-600 transition-all duration-300"
                >
                  Sign In
                </Link>
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
};

export default Home;
