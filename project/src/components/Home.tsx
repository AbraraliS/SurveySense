import React from 'react';
import { Link } from 'react-router-dom';
import { PlusCircle, Users, BarChart3, Zap, Brain, Share2 } from 'lucide-react';

export default function Home() {
  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Questions',
      description: 'Generate intelligent survey questions tailored to your topic and audience using advanced AI'
    },
    {
      icon: Users,
      title: 'Targeted Surveys',
      description: 'Create surveys optimized for specific audiences with context-aware questions'
    },
    {
      icon: Share2,
      title: 'Easy Sharing',
      description: 'Share surveys with a simple link and collect responses from multiple participants'
    },
    {
      icon: BarChart3,
      title: 'Smart Analytics',
      description: 'Get instant insights with automated analysis, charts, and word frequency data'
    }
  ];

  return (
    <div className="max-w-6xl mx-auto">
      {/* Hero Section */}
      <div className="text-center py-16">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 rounded-full mb-6">
          <Zap className="h-8 w-8 text-blue-600" />
        </div>
        
        <h1 className="text-5xl font-bold text-gray-900 mb-6 leading-tight">
          AI-Driven Survey
          <span className="block text-blue-600">Generation Platform</span>
        </h1>
        
        <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto leading-relaxed">
          Create intelligent surveys in seconds with AI-powered question generation. 
          Collect responses, analyze data, and gain actionable insights automatically.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/create"
            className="group inline-flex items-center space-x-2 bg-blue-600 text-white px-8 py-4 rounded-xl font-semibold text-lg hover:bg-blue-700 transform hover:scale-105 transition-all duration-200 shadow-lg hover:shadow-xl"
          >
            <PlusCircle className="h-5 w-5 group-hover:rotate-90 transition-transform duration-200" />
            <span>Create Your First Survey</span>
          </Link>
          
          <div className="text-sm text-gray-500">
            No setup required • Instant deployment
          </div>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 py-16">
        {features.map((feature, index) => {
          const Icon = feature.icon;
          return (
            <div
              key={index}
              className="group p-6 bg-white rounded-2xl shadow-md hover:shadow-xl transition-all duration-300 border border-gray-100 hover:border-blue-200"
            >
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 rounded-lg mb-4 group-hover:bg-blue-200 transition-colors">
                <Icon className="h-6 w-6 text-blue-600" />
              </div>
              
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {feature.title}
              </h3>
              
              <p className="text-gray-600 leading-relaxed">
                {feature.description}
              </p>
            </div>
          );
        })}
      </div>

      {/* How It Works */}
      <div className="py-16 text-center">
        <h2 className="text-3xl font-bold text-gray-900 mb-12">How It Works</h2>
        
        <div className="grid md:grid-cols-3 gap-8">
          {[
            {
              step: '1',
              title: 'Define Your Survey',
              description: 'Enter your topic, target audience, and preferred number of questions'
            },
            {
              step: '2',
              title: 'AI Generates Questions',
              description: 'Our AI creates contextual multiple choice and open-ended questions'
            },
            {
              step: '3',
              title: 'Analyze Results',
              description: 'Get instant analytics with charts, insights, and data visualizations'
            }
          ].map((item, index) => (
            <div key={index} className="relative">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-600 text-white rounded-full font-bold text-lg mb-4">
                {item.step}
              </div>
              
              <h3 className="text-xl font-semibold text-gray-900 mb-2">
                {item.title}
              </h3>
              
              <p className="text-gray-600">
                {item.description}
              </p>

              {index < 2 && (
                <div className="hidden md:block absolute top-6 left-full w-full">
                  <div className="w-8 h-0.5 bg-blue-300 mx-auto"></div>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-2xl p-12 text-center text-white">
        <h2 className="text-3xl font-bold mb-4">Ready to Get Started?</h2>
        <p className="text-xl text-blue-100 mb-8">
          Create your first AI-powered survey and start collecting valuable insights today.
        </p>
        
        <Link
          to="/create"
          className="inline-flex items-center space-x-2 bg-white text-blue-600 px-8 py-4 rounded-xl font-semibold text-lg hover:bg-gray-50 transform hover:scale-105 transition-all duration-200 shadow-lg"
        >
          <PlusCircle className="h-5 w-5" />
          <span>Create Survey Now</span>
        </Link>
      </div>
    </div>
  );
}
