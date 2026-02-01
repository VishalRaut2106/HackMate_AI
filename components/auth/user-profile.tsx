'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { USER_TYPE_DISPLAY_NAMES, TIER_DISPLAY_NAMES } from '@/lib/constants';
import { UserType, SubscriptionTier } from '@/lib/types';
import { UsageDashboard } from '@/components/subscription/usage-dashboard';
import { 
  User, 
  Mail, 
  Calendar, 
  Building2, 
  GraduationCap,
  Save,
  X,
  Plus,
  BarChart3
} from 'lucide-react';

interface UserProfileProps {
  onClose?: () => void;
}

export function UserProfile({ onClose }: UserProfileProps) {
  const { user, updateProfile, setUserType, upgradeSubscription } = useAuth();
  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(false);
  const [newSkill, setNewSkill] = useState('');
  
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    bio: user?.profile?.bio || '',
    skills: user?.profile?.skills || [],
    university: user?.profile?.university || '',
    graduationYear: user?.profile?.graduationYear || new Date().getFullYear(),
    major: user?.profile?.major || '',
    organization: user?.profile?.organization || '',
    contactInfo: user?.profile?.contactInfo || '',
    department: user?.profile?.department || '',
    role: user?.profile?.role || '',
  });

  if (!user) return null;

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateProfile({
        displayName: formData.displayName,
        profile: {
          ...user.profile,
          bio: formData.bio,
          skills: formData.skills,
          university: formData.university,
          graduationYear: formData.graduationYear,
          major: formData.major,
          organization: formData.organization,
          contactInfo: formData.contactInfo,
          department: formData.department,
          role: formData.role,
        }
      });
      setEditing(false);
    } catch (error) {
      console.error('Failed to update profile:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSkill = () => {
    if (newSkill.trim() && !formData.skills.includes(newSkill.trim())) {
      setFormData(prev => ({
        ...prev,
        skills: [...prev.skills, newSkill.trim()]
      }));
      setNewSkill('');
    }
  };

  const handleRemoveSkill = (skillToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      skills: prev.skills.filter(skill => skill !== skillToRemove)
    }));
  };

  const handleUserTypeChange = async (newUserType: UserType) => {
    setLoading(true);
    try {
      await setUserType(newUserType);
    } catch (error) {
      console.error('Failed to update user type:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubscriptionUpgrade = async (tier: SubscriptionTier) => {
    setLoading(true);
    try {
      await upgradeSubscription(tier);
    } catch (error) {
      console.error('Failed to upgrade subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Profile Settings</h1>
        {onClose && (
          <Button variant="ghost" size="sm" onClick={onClose}>
            <X className="h-4 w-4" />
          </Button>
        )}
      </div>

      <Tabs defaultValue="profile" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="profile">Profile</TabsTrigger>
          <TabsTrigger value="usage">Usage & Billing</TabsTrigger>
        </TabsList>

        <TabsContent value="profile" className="space-y-6">

      {/* Basic Profile */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>Basic Information</CardTitle>
            <Button
              variant={editing ? "outline" : "default"}
              size="sm"
              onClick={() => editing ? setEditing(false) : setEditing(true)}
            >
              {editing ? 'Cancel' : 'Edit'}
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Avatar className="h-16 w-16">
              <AvatarImage src={user.photoURL} />
              <AvatarFallback>
                <User className="h-8 w-8" />
              </AvatarFallback>
            </Avatar>
            <div>
              <h3 className="font-semibold">{user.displayName}</h3>
              <p className="text-sm text-muted-foreground flex items-center gap-1">
                <Mail className="h-3 w-3" />
                {user.email}
              </p>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                />
              </div>
              
              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell us about yourself..."
                  value={formData.bio}
                  onChange={(e) => setFormData(prev => ({ ...prev, bio: e.target.value }))}
                />
              </div>

              <div>
                <Label>Skills</Label>
                <div className="flex gap-2 mb-2">
                  <Input
                    placeholder="Add a skill..."
                    value={newSkill}
                    onChange={(e) => setNewSkill(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleAddSkill()}
                  />
                  <Button type="button" onClick={handleAddSkill}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex flex-wrap gap-2">
                  {formData.skills.map((skill) => (
                    <Badge key={skill} variant="secondary" className="cursor-pointer">
                      {skill}
                      <X 
                        className="h-3 w-3 ml-1" 
                        onClick={() => handleRemoveSkill(skill)}
                      />
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="space-y-4">
              {user.profile?.bio && (
                <div>
                  <Label>Bio</Label>
                  <p className="text-sm text-muted-foreground mt-1">{user.profile.bio}</p>
                </div>
              )}
              
              <div>
                <Label>Skills</Label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {user.profile?.skills?.map((skill) => (
                    <Badge key={skill} variant="secondary">{skill}</Badge>
                  ))}
                  {(!user.profile?.skills || user.profile.skills.length === 0) && (
                    <p className="text-sm text-muted-foreground">No skills added yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {editing && (
            <Button onClick={handleSave} disabled={loading}>
              <Save className="h-4 w-4 mr-2" />
              {loading ? 'Saving...' : 'Save Changes'}
            </Button>
          )}
        </CardContent>
      </Card>

      {/* User Type & Subscription */}
      <Card>
        <CardHeader>
          <CardTitle>Account Type</CardTitle>
          <CardDescription>
            Your current user type and subscription tier
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <Label>User Type</Label>
              <p className="text-sm font-medium">{USER_TYPE_DISPLAY_NAMES[user.userType]}</p>
            </div>
            <Select value={user.userType} onValueChange={handleUserTypeChange}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="student">Student</SelectItem>
                <SelectItem value="hackathon_team">Hackathon Team</SelectItem>
                <SelectItem value="organizer">Event Organizer</SelectItem>
                <SelectItem value="corporate_manager">Corporate Manager</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <Label>Subscription</Label>
              <p className="text-sm font-medium">{TIER_DISPLAY_NAMES[user.subscriptionTier]}</p>
            </div>
            <Badge variant={user.subscriptionTier === 'free' ? 'secondary' : 'default'}>
              {user.subscriptionTier === 'free' ? 'Free' : 'Pro'}
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* User Type Specific Fields */}
      {user.userType === 'student' && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Student Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <Label htmlFor="university">University</Label>
                  <Input
                    id="university"
                    value={formData.university}
                    onChange={(e) => setFormData(prev => ({ ...prev, university: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="major">Major</Label>
                  <Input
                    id="major"
                    value={formData.major}
                    onChange={(e) => setFormData(prev => ({ ...prev, major: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="graduationYear">Graduation Year</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    value={formData.graduationYear}
                    onChange={(e) => setFormData(prev => ({ ...prev, graduationYear: parseInt(e.target.value) }))}
                  />
                </div>
              </>
            ) : (
              <>
                {user.profile?.university && (
                  <div>
                    <Label>University</Label>
                    <p className="text-sm text-muted-foreground">{user.profile.university}</p>
                  </div>
                )}
                {user.profile?.major && (
                  <div>
                    <Label>Major</Label>
                    <p className="text-sm text-muted-foreground">{user.profile.major}</p>
                  </div>
                )}
                {user.profile?.graduationYear && (
                  <div>
                    <Label>Graduation Year</Label>
                    <p className="text-sm text-muted-foreground">{user.profile.graduationYear}</p>
                  </div>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}

      {(user.userType === 'organizer' || user.userType === 'corporate_manager') && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              Organization Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {editing ? (
              <>
                <div>
                  <Label htmlFor="organization">Organization</Label>
                  <Input
                    id="organization"
                    value={formData.organization}
                    onChange={(e) => setFormData(prev => ({ ...prev, organization: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="contactInfo">Contact Information</Label>
                  <Input
                    id="contactInfo"
                    value={formData.contactInfo}
                    onChange={(e) => setFormData(prev => ({ ...prev, contactInfo: e.target.value }))}
                  />
                </div>
                {user.userType === 'corporate_manager' && (
                  <>
                    <div>
                      <Label htmlFor="department">Department</Label>
                      <Input
                        id="department"
                        value={formData.department}
                        onChange={(e) => setFormData(prev => ({ ...prev, department: e.target.value }))}
                      />
                    </div>
                    <div>
                      <Label htmlFor="role">Role</Label>
                      <Input
                        id="role"
                        value={formData.role}
                        onChange={(e) => setFormData(prev => ({ ...prev, role: e.target.value }))}
                      />
                    </div>
                  </>
                )}
              </>
            ) : (
              <>
                {user.profile?.organization && (
                  <div>
                    <Label>Organization</Label>
                    <p className="text-sm text-muted-foreground">{user.profile.organization}</p>
                  </div>
                )}
                {user.profile?.contactInfo && (
                  <div>
                    <Label>Contact Information</Label>
                    <p className="text-sm text-muted-foreground">{user.profile.contactInfo}</p>
                  </div>
                )}
                {user.userType === 'corporate_manager' && (
                  <>
                    {user.profile?.department && (
                      <div>
                        <Label>Department</Label>
                        <p className="text-sm text-muted-foreground">{user.profile.department}</p>
                      </div>
                    )}
                    {user.profile?.role && (
                      <div>
                        <Label>Role</Label>
                        <p className="text-sm text-muted-foreground">{user.profile.role}</p>
                      </div>
                    )}
                  </>
                )}
              </>
            )}
          </CardContent>
        </Card>
      )}
        </TabsContent>

        <TabsContent value="usage" className="space-y-6">
          <UsageDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}