'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/lib/auth-context';
import { UserType } from '@/lib/types';
import { USER_TYPE_DISPLAY_NAMES } from '@/lib/constants';
import { 
  GraduationCap, 
  Zap, 
  Building2, 
  Users,
  CheckCircle,
  ArrowRight
} from 'lucide-react';

interface UserTypeOption {
  type: UserType;
  title: string;
  description: string;
  icon: React.ReactNode;
  features: string[];
  badge?: string;
}

const userTypeOptions: UserTypeOption[] = [
  {
    type: 'student',
    title: 'Student',
    description: 'Perfect for college assignments and personal projects',
    icon: <GraduationCap className="h-8 w-8" />,
    features: [
      'Private project management',
      'Basic Kanban boards',
      'Small team collaboration (up to 3)',
      'Portfolio project tracking'
    ],
    badge: 'Most Popular'
  },
  {
    type: 'hackathon_team',
    title: 'Hackathon Team',
    description: 'Built for fast-paced hackathon environments',
    icon: <Zap className="h-8 w-8" />,
    features: [
      'Time-bound project execution',
      'AI-powered idea analysis',
      'Real-time team collaboration',
      'Demo and pitch tools'
    ],
    badge: 'AI Powered'
  },
  {
    type: 'organizer',
    title: 'Event Organizer',
    description: 'Manage hackathons and track multiple teams',
    icon: <Users className="h-8 w-8" />,
    features: [
      'Create and manage hackathons',
      'Team progress monitoring',
      'Judge access management',
      'Event analytics and reports'
    ]
  },
  {
    type: 'corporate_manager',
    title: 'Corporate Manager',
    description: 'Internal innovation and hackathon management',
    icon: <Building2 className="h-8 w-8" />,
    features: [
      'Internal hackathon hosting',
      'Employee innovation tracking',
      'Advanced analytics',
      'Custom branding options'
    ]
  }
];

interface UserTypeSelectionProps {
  onComplete?: () => void;
}

export function UserTypeSelection({ onComplete }: UserTypeSelectionProps) {
  const { setUserType, user } = useAuth();
  const [selectedType, setSelectedType] = useState<UserType | null>(null);
  const [loading, setLoading] = useState(false);

  const handleSelectType = async (userType: UserType) => {
    if (!user) return;
    
    setLoading(true);
    try {
      await setUserType(userType);
      onComplete?.();
    } catch (error) {
      console.error('Failed to set user type:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto p-6">
      <div className="text-center mb-8">
        <h1 className="text-3xl font-bold mb-2">Welcome to HackMate AI</h1>
        <p className="text-muted-foreground text-lg">
          Choose your role to get started with the right tools for your needs
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {userTypeOptions.map((option) => (
          <Card 
            key={option.type}
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedType === option.type 
                ? 'ring-2 ring-primary border-primary' 
                : 'hover:border-primary/50'
            }`}
            onClick={() => setSelectedType(option.type)}
          >
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="text-primary">
                    {option.icon}
                  </div>
                  <div>
                    <CardTitle className="text-xl">{option.title}</CardTitle>
                    {option.badge && (
                      <Badge variant="secondary" className="mt-1">
                        {option.badge}
                      </Badge>
                    )}
                  </div>
                </div>
                {selectedType === option.type && (
                  <CheckCircle className="h-6 w-6 text-primary" />
                )}
              </div>
              <CardDescription className="text-base">
                {option.description}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="space-y-2">
                {option.features.map((feature, index) => (
                  <li key={index} className="flex items-center gap-2 text-sm">
                    <CheckCircle className="h-4 w-4 text-green-500 flex-shrink-0" />
                    {feature}
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {selectedType && (
        <div className="mt-8 text-center">
          <Button 
            size="lg" 
            onClick={() => handleSelectType(selectedType)}
            disabled={loading}
            className="min-w-[200px]"
          >
            {loading ? (
              'Setting up...'
            ) : (
              <>
                Continue as {USER_TYPE_DISPLAY_NAMES[selectedType]}
                <ArrowRight className="ml-2 h-4 w-4" />
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}