import { IdeaAnalysis } from './types';

export interface ProjectTemplate {
  id: string;
  name: string;
  description: string;
  category: string;
  difficulty: 'Beginner' | 'Intermediate' | 'Advanced';
  duration: '24h' | '48h';
  tags: string[];
  idea: IdeaAnalysis;
  estimatedTeamSize: number;
  popularityScore: number;
  createdAt: Date;
  updatedAt: Date;
}

export const PROJECT_TEMPLATES: ProjectTemplate[] = [
  {
    id: 'web-app-social',
    name: 'Social Media Dashboard',
    description: 'A comprehensive social media management platform with analytics and scheduling',
    category: 'Web Application',
    difficulty: 'Intermediate',
    duration: '48h',
    tags: ['React', 'Node.js', 'MongoDB', 'Social Media', 'Analytics'],
    estimatedTeamSize: 4,
    popularityScore: 95,
    createdAt: new Date('2024-01-01'),
    updatedAt: new Date('2024-01-01'),
    idea: {
      problem_statement: 'Small businesses and content creators struggle to manage multiple social media accounts efficiently, leading to inconsistent posting and missed engagement opportunities.',
      target_users: ['Small business owners', 'Content creators', 'Social media managers', 'Marketing agencies'],
      features: [
        'Multi-platform social media account integration',
        'Content scheduling and auto-posting',
        'Analytics dashboard with engagement metrics',
        'Content calendar with drag-and-drop interface',
        'Team collaboration tools',
        'Hashtag suggestion engine',
        'Performance reporting and insights'
      ],
      tech_stack_suggestions: ['React', 'Node.js', 'Express', 'MongoDB', 'Redis', 'Social Media APIs', 'Chart.js'],
      risks: [
        'API rate limiting from social platforms',
        'Complex authentication with multiple platforms',
        'Real-time data synchronization challenges',
        'Scalability issues with large datasets'
      ]
    }
  },
  {
    id: 'mobile-health-tracker',
    name: 'Personal Health Tracker',
    description: 'A mobile app for tracking health metrics with AI-powered insights',
    category: 'Mobile App',
    difficulty: 'Advanced',
    duration: '48h',
    tags: ['React Native', 'AI/ML', 'Health', 'Mobile', 'Data Visualization'],
    estimatedTeamSize: 5,
    popularityScore: 88,
    createdAt: new Date('2024-01-02'),
    updatedAt: new Date('2024-01-02'),
    idea: {
      problem_statement: 'People struggle to maintain consistent health tracking and lack personalized insights to improve their wellness journey.',
      target_users: ['Health-conscious individuals', 'Fitness enthusiasts', 'Patients with chronic conditions', 'Healthcare providers'],
      features: [
        'Daily health metric logging (weight, sleep, mood, etc.)',
        'AI-powered health insights and recommendations',
        'Goal setting and progress tracking',
        'Integration with wearable devices',
        'Medication reminders',
        'Health report generation',
        'Emergency contact alerts'
      ],
      tech_stack_suggestions: ['React Native', 'Python', 'TensorFlow', 'Firebase', 'HealthKit', 'Google Fit API'],
      risks: [
        'Health data privacy and compliance (HIPAA)',
        'Accuracy of AI health recommendations',
        'Device integration complexity',
        'User adoption and engagement'
      ]
    }
  },
  {
    id: 'ai-study-assistant',
    name: 'AI Study Assistant',
    description: 'An intelligent study companion that helps students learn more effectively',
    category: 'AI/Education',
    difficulty: 'Advanced',
    duration: '48h',
    tags: ['AI/ML', 'Education', 'NLP', 'Python', 'Web App'],
    estimatedTeamSize: 4,
    popularityScore: 92,
    createdAt: new Date('2024-01-03'),
    updatedAt: new Date('2024-01-03'),
    idea: {
      problem_statement: 'Students struggle with information overload and lack personalized study strategies that adapt to their learning style and pace.',
      target_users: ['High school students', 'College students', 'Online learners', 'Professional certification candidates'],
      features: [
        'Document summarization and key point extraction',
        'Personalized quiz generation from study materials',
        'Learning style assessment and adaptation',
        'Study schedule optimization',
        'Progress tracking and analytics',
        'Collaborative study groups',
        'Integration with popular note-taking apps'
      ],
      tech_stack_suggestions: ['Python', 'OpenAI API', 'React', 'FastAPI', 'PostgreSQL', 'Redis', 'Docker'],
      risks: [
        'AI accuracy in content understanding',
        'High computational costs for AI processing',
        'Copyright issues with educational content',
        'Scalability with large user base'
      ]
    }
  },
  {
    id: 'eco-tracker',
    name: 'Carbon Footprint Tracker',
    description: 'Track and reduce your environmental impact with gamified challenges',
    category: 'Sustainability',
    difficulty: 'Beginner',
    duration: '24h',
    tags: ['Sustainability', 'Gamification', 'Mobile', 'Data Visualization'],
    estimatedTeamSize: 3,
    popularityScore: 78,
    createdAt: new Date('2024-01-04'),
    updatedAt: new Date('2024-01-04'),
    idea: {
      problem_statement: 'People want to reduce their environmental impact but lack awareness of their carbon footprint and actionable steps to improve it.',
      target_users: ['Environmentally conscious individuals', 'Families', 'Students', 'Corporate employees'],
      features: [
        'Daily activity logging (transport, energy, food)',
        'Carbon footprint calculation and visualization',
        'Personalized eco-friendly challenges',
        'Achievement badges and leaderboards',
        'Community sharing and competitions',
        'Local eco-friendly business recommendations',
        'Impact tracking over time'
      ],
      tech_stack_suggestions: ['React Native', 'Node.js', 'MongoDB', 'Chart.js', 'Google Maps API'],
      risks: [
        'Accuracy of carbon footprint calculations',
        'User engagement and retention',
        'Data collection complexity',
        'Limited local business data'
      ]
    }
  },
  {
    id: 'blockchain-voting',
    name: 'Secure Voting Platform',
    description: 'A blockchain-based voting system ensuring transparency and security',
    category: 'Blockchain',
    difficulty: 'Advanced',
    duration: '48h',
    tags: ['Blockchain', 'Security', 'Voting', 'Web3', 'Smart Contracts'],
    estimatedTeamSize: 5,
    popularityScore: 85,
    createdAt: new Date('2024-01-05'),
    updatedAt: new Date('2024-01-05'),
    idea: {
      problem_statement: 'Traditional voting systems lack transparency and are vulnerable to fraud, leading to decreased trust in democratic processes.',
      target_users: ['Government organizations', 'Educational institutions', 'Corporate boards', 'Community organizations'],
      features: [
        'Blockchain-based vote recording',
        'Voter identity verification',
        'Real-time vote counting and results',
        'Audit trail and transparency dashboard',
        'Multi-device voting support',
        'Anonymous voting with verifiable results',
        'Election management interface'
      ],
      tech_stack_suggestions: ['Solidity', 'Ethereum', 'React', 'Web3.js', 'IPFS', 'Node.js'],
      risks: [
        'Blockchain scalability limitations',
        'Complex voter authentication',
        'Regulatory compliance challenges',
        'Technical barriers for users'
      ]
    }
  },
  {
    id: 'iot-smart-home',
    name: 'Smart Home Automation',
    description: 'IoT-based home automation system with energy optimization',
    category: 'IoT',
    difficulty: 'Advanced',
    duration: '48h',
    tags: ['IoT', 'Hardware', 'Energy', 'Automation', 'Mobile App'],
    estimatedTeamSize: 6,
    popularityScore: 82,
    createdAt: new Date('2024-01-06'),
    updatedAt: new Date('2024-01-06'),
    idea: {
      problem_statement: 'Homeowners want to reduce energy costs and improve convenience but lack an integrated system to automate and optimize their home devices.',
      target_users: ['Homeowners', 'Renters', 'Property managers', 'Energy-conscious families'],
      features: [
        'Smart device integration and control',
        'Energy usage monitoring and optimization',
        'Automated scheduling based on occupancy',
        'Mobile app for remote control',
        'Voice command integration',
        'Security monitoring and alerts',
        'Energy cost tracking and reporting'
      ],
      tech_stack_suggestions: ['Arduino/Raspberry Pi', 'MQTT', 'React Native', 'Node.js', 'InfluxDB', 'Grafana'],
      risks: [
        'Hardware compatibility issues',
        'Network connectivity reliability',
        'Security vulnerabilities in IoT devices',
        'Complex setup and configuration'
      ]
    }
  },
  {
    id: 'ar-learning-game',
    name: 'AR Educational Game',
    description: 'Augmented reality game for interactive learning experiences',
    category: 'AR/VR',
    difficulty: 'Advanced',
    duration: '48h',
    tags: ['AR', 'Education', 'Gaming', 'Mobile', '3D'],
    estimatedTeamSize: 5,
    popularityScore: 90,
    createdAt: new Date('2024-01-07'),
    updatedAt: new Date('2024-01-07'),
    idea: {
      problem_statement: 'Traditional learning methods fail to engage students effectively, especially in complex subjects like science and mathematics.',
      target_users: ['Elementary students', 'Middle school students', 'Teachers', 'Parents'],
      features: [
        '3D AR models for interactive learning',
        'Gamified lesson progression',
        'Real-world object recognition and overlay',
        'Collaborative multiplayer learning',
        'Progress tracking for teachers and parents',
        'Curriculum-aligned content',
        'Accessibility features for different learning needs'
      ],
      tech_stack_suggestions: ['Unity', 'ARCore/ARKit', 'C#', 'Blender', 'Firebase', 'Photon'],
      risks: [
        'Device compatibility limitations',
        'Complex 3D content creation',
        'AR tracking accuracy issues',
        'High development complexity'
      ]
    }
  },
  {
    id: 'fintech-budget-app',
    name: 'Personal Finance Manager',
    description: 'AI-powered personal finance app with smart budgeting and investment advice',
    category: 'FinTech',
    difficulty: 'Intermediate',
    duration: '48h',
    tags: ['FinTech', 'AI', 'Mobile', 'Banking', 'Investment'],
    estimatedTeamSize: 4,
    popularityScore: 87,
    createdAt: new Date('2024-01-08'),
    updatedAt: new Date('2024-01-08'),
    idea: {
      problem_statement: 'People struggle to manage their finances effectively due to lack of insights into spending patterns and personalized financial advice.',
      target_users: ['Young professionals', 'Students', 'Families', 'Small business owners'],
      features: [
        'Automatic expense categorization',
        'AI-powered budget recommendations',
        'Investment portfolio tracking',
        'Bill reminder and payment scheduling',
        'Financial goal setting and tracking',
        'Spending pattern analysis',
        'Integration with bank accounts and credit cards'
      ],
      tech_stack_suggestions: ['React Native', 'Python', 'Plaid API', 'TensorFlow', 'PostgreSQL', 'Redis'],
      risks: [
        'Financial data security and compliance',
        'Bank API integration complexity',
        'Regulatory requirements (PCI DSS)',
        'User trust and adoption'
      ]
    }
  }
];

export class TemplateService {
  static getAllTemplates(): ProjectTemplate[] {
    return PROJECT_TEMPLATES.sort((a, b) => b.popularityScore - a.popularityScore);
  }

  static getTemplatesByCategory(category: string): ProjectTemplate[] {
    return PROJECT_TEMPLATES.filter(template => 
      template.category.toLowerCase().includes(category.toLowerCase())
    ).sort((a, b) => b.popularityScore - a.popularityScore);
  }

  static getTemplatesByDifficulty(difficulty: ProjectTemplate['difficulty']): ProjectTemplate[] {
    return PROJECT_TEMPLATES.filter(template => template.difficulty === difficulty)
      .sort((a, b) => b.popularityScore - a.popularityScore);
  }

  static getTemplatesByDuration(duration: ProjectTemplate['duration']): ProjectTemplate[] {
    return PROJECT_TEMPLATES.filter(template => template.duration === duration)
      .sort((a, b) => b.popularityScore - a.popularityScore);
  }

  static getTemplatesByTags(tags: string[]): ProjectTemplate[] {
    return PROJECT_TEMPLATES.filter(template =>
      tags.some(tag => 
        template.tags.some(templateTag => 
          templateTag.toLowerCase().includes(tag.toLowerCase())
        )
      )
    ).sort((a, b) => b.popularityScore - a.popularityScore);
  }

  static searchTemplates(query: string): ProjectTemplate[] {
    const lowerQuery = query.toLowerCase();
    return PROJECT_TEMPLATES.filter(template =>
      template.name.toLowerCase().includes(lowerQuery) ||
      template.description.toLowerCase().includes(lowerQuery) ||
      template.category.toLowerCase().includes(lowerQuery) ||
      template.tags.some(tag => tag.toLowerCase().includes(lowerQuery)) ||
      template.idea.problem_statement.toLowerCase().includes(lowerQuery)
    ).sort((a, b) => b.popularityScore - a.popularityScore);
  }

  static getTemplateById(id: string): ProjectTemplate | null {
    return PROJECT_TEMPLATES.find(template => template.id === id) || null;
  }

  static getPopularTemplates(limit: number = 6): ProjectTemplate[] {
    return PROJECT_TEMPLATES
      .sort((a, b) => b.popularityScore - a.popularityScore)
      .slice(0, limit);
  }

  static getRecommendedTemplates(userPreferences: {
    difficulty?: ProjectTemplate['difficulty'];
    duration?: ProjectTemplate['duration'];
    interests?: string[];
  }): ProjectTemplate[] {
    let templates = PROJECT_TEMPLATES;

    // Filter by difficulty if specified
    if (userPreferences.difficulty) {
      templates = templates.filter(t => t.difficulty === userPreferences.difficulty);
    }

    // Filter by duration if specified
    if (userPreferences.duration) {
      templates = templates.filter(t => t.duration === userPreferences.duration);
    }

    // Score by interests if specified
    if (userPreferences.interests && userPreferences.interests.length > 0) {
      templates = templates.map(template => ({
        ...template,
        relevanceScore: userPreferences.interests!.reduce((score, interest) => {
          const interestLower = interest.toLowerCase();
          let matchScore = 0;
          
          // Check category match
          if (template.category.toLowerCase().includes(interestLower)) matchScore += 3;
          
          // Check tags match
          template.tags.forEach(tag => {
            if (tag.toLowerCase().includes(interestLower)) matchScore += 2;
          });
          
          // Check description match
          if (template.description.toLowerCase().includes(interestLower)) matchScore += 1;
          
          return score + matchScore;
        }, 0)
      })).sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0));
    }

    return templates.slice(0, 8);
  }

  static getCategories(): string[] {
    const categories = new Set(PROJECT_TEMPLATES.map(t => t.category));
    return Array.from(categories).sort();
  }

  static getAllTags(): string[] {
    const tags = new Set(PROJECT_TEMPLATES.flatMap(t => t.tags));
    return Array.from(tags).sort();
  }

  static getDifficultyLevels(): ProjectTemplate['difficulty'][] {
    return ['Beginner', 'Intermediate', 'Advanced'];
  }

  static getDurations(): ProjectTemplate['duration'][] {
    return ['24h', '48h'];
  }
}