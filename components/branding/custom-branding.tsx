'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/lib/auth-context';
import { SubscriptionService } from '@/lib/subscription-service';
import { UpgradeDialog } from '@/components/subscription/upgrade-dialog';
import { 
  Palette, 
  Upload, 
  Eye, 
  Save,
  Crown,
  Image,
  Type,
  Layout,
  Loader2,
  Check,
  AlertCircle
} from 'lucide-react';

interface BrandingSettings {
  primaryColor: string;
  secondaryColor: string;
  logoUrl: string;
  organizationName: string;
  tagline: string;
  customCss: string;
  footerText: string;
  contactEmail: string;
  websiteUrl: string;
}

const DEFAULT_BRANDING: BrandingSettings = {
  primaryColor: '#3b82f6',
  secondaryColor: '#64748b',
  logoUrl: '',
  organizationName: '',
  tagline: '',
  customCss: '',
  footerText: '',
  contactEmail: '',
  websiteUrl: '',
};

export function CustomBranding() {
  const { user } = useAuth();
  const [branding, setBranding] = useState<BrandingSettings>(DEFAULT_BRANDING);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState('');
  const [previewMode, setPreviewMode] = useState(false);

  const hasCustomBranding = user ? SubscriptionService.getLimits(user.subscriptionTier)?.customBranding ?? false : false;

  useEffect(() => {
    if (hasCustomBranding) {
      loadBrandingSettings();
    }
  }, [hasCustomBranding]);

  const loadBrandingSettings = () => {
    // Load from localStorage for demo purposes
    // In production, this would load from the backend
    try {
      const saved = localStorage.getItem(`branding_${user?.uid}`);
      if (saved) {
        setBranding(JSON.parse(saved));
      }
    } catch (error) {
      console.error('Failed to load branding settings:', error);
    }
  };

  const saveBrandingSettings = async () => {
    if (!user) return;

    setSaving(true);
    setError('');

    try {
      // Save to localStorage for demo purposes
      // In production, this would save to the backend
      localStorage.setItem(`branding_${user.uid}`, JSON.stringify(branding));
      
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err: any) {
      setError(err.message || 'Failed to save branding settings');
    } finally {
      setSaving(false);
    }
  };

  const handleColorChange = (field: 'primaryColor' | 'secondaryColor', value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleInputChange = (field: keyof BrandingSettings, value: string) => {
    setBranding(prev => ({ ...prev, [field]: value }));
  };

  const handleLogoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (limit to 2MB)
      if (file.size > 2 * 1024 * 1024) {
        setError('Logo file size must be less than 2MB');
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/')) {
        setError('Please select a valid image file');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setBranding(prev => ({ ...prev, logoUrl: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  const resetToDefaults = () => {
    setBranding(DEFAULT_BRANDING);
  };

  if (!hasCustomBranding) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Palette className="h-5 w-5" />
            Custom Branding
            <Badge variant="secondary">Pro Feature</Badge>
          </CardTitle>
          <CardDescription>
            Customize the appearance of your hackathon events with your organization's branding
          </CardDescription>
        </CardHeader>
        <CardContent className="text-center py-12">
          <Crown className="h-12 w-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-medium mb-2">Unlock Custom Branding</h3>
          <p className="text-muted-foreground mb-4">
            Add your logo, colors, and custom styling to create a branded experience for your events
          </p>
          <UpgradeDialog 
            reason="Access custom branding features"
            requiredFeature="Custom Branding"
          >
            <Button>
              <Crown className="mr-2 h-4 w-4" />
              Upgrade to Organizer
            </Button>
          </UpgradeDialog>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Custom Branding</h2>
          <p className="text-muted-foreground">Customize your organization's brand appearance</p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => setPreviewMode(!previewMode)}
          >
            <Eye className="mr-2 h-4 w-4" />
            {previewMode ? 'Edit Mode' : 'Preview'}
          </Button>
          <Button
            onClick={saveBrandingSettings}
            disabled={saving}
          >
            {saving ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : saved ? (
              <Check className="mr-2 h-4 w-4" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}

      {saved && (
        <Alert>
          <Check className="h-4 w-4" />
          <AlertDescription>Branding settings saved successfully!</AlertDescription>
        </Alert>
      )}

      {previewMode ? (
        /* Preview Mode */
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Brand Preview
            </CardTitle>
            <CardDescription>
              Preview how your branding will appear to participants
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div 
              className="p-6 border rounded-lg"
              style={{ 
                backgroundColor: branding.secondaryColor + '10',
                borderColor: branding.primaryColor + '30'
              }}
            >
              {/* Header Preview */}
              <div className="flex items-center justify-between mb-6 pb-4 border-b">
                <div className="flex items-center gap-4">
                  {branding.logoUrl && (
                    <img 
                      src={branding.logoUrl} 
                      alt="Organization Logo" 
                      className="h-12 w-auto"
                    />
                  )}
                  <div>
                    <h1 
                      className="text-xl font-bold"
                      style={{ color: branding.primaryColor }}
                    >
                      {branding.organizationName || 'Your Organization'}
                    </h1>
                    {branding.tagline && (
                      <p className="text-sm text-muted-foreground">{branding.tagline}</p>
                    )}
                  </div>
                </div>
                <Button 
                  style={{ 
                    backgroundColor: branding.primaryColor,
                    borderColor: branding.primaryColor
                  }}
                >
                  Join Event
                </Button>
              </div>

              {/* Content Preview */}
              <div className="space-y-4">
                <div className="grid gap-4 md:grid-cols-3">
                  {[1, 2, 3].map(i => (
                    <div key={i} className="p-4 bg-background border rounded-lg">
                      <div 
                        className="h-2 w-16 rounded mb-2"
                        style={{ backgroundColor: branding.primaryColor }}
                      />
                      <div className="h-4 bg-muted rounded mb-2" />
                      <div className="h-3 bg-muted rounded w-3/4" />
                    </div>
                  ))}
                </div>
              </div>

              {/* Footer Preview */}
              {(branding.footerText || branding.contactEmail || branding.websiteUrl) && (
                <div className="mt-6 pt-4 border-t text-center">
                  {branding.footerText && (
                    <p className="text-sm text-muted-foreground mb-2">{branding.footerText}</p>
                  )}
                  <div className="flex items-center justify-center gap-4 text-sm">
                    {branding.contactEmail && (
                      <a 
                        href={`mailto:${branding.contactEmail}`}
                        className="hover:underline"
                        style={{ color: branding.primaryColor }}
                      >
                        {branding.contactEmail}
                      </a>
                    )}
                    {branding.websiteUrl && (
                      <a 
                        href={branding.websiteUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:underline"
                        style={{ color: branding.primaryColor }}
                      >
                        Visit Website
                      </a>
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      ) : (
        /* Edit Mode */
        <Tabs defaultValue="colors" className="space-y-6">
          <TabsList>
            <TabsTrigger value="colors">Colors</TabsTrigger>
            <TabsTrigger value="logo">Logo & Identity</TabsTrigger>
            <TabsTrigger value="content">Content</TabsTrigger>
            <TabsTrigger value="advanced">Advanced</TabsTrigger>
          </TabsList>

          {/* Colors Tab */}
          <TabsContent value="colors" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Palette className="h-5 w-5" />
                  Color Scheme
                </CardTitle>
                <CardDescription>
                  Define your organization's primary and secondary colors
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="primaryColor">Primary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="primaryColor"
                        type="color"
                        value={branding.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={branding.primaryColor}
                        onChange={(e) => handleColorChange('primaryColor', e.target.value)}
                        placeholder="#3b82f6"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used for buttons, links, and primary elements
                    </p>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="secondaryColor">Secondary Color</Label>
                    <div className="flex gap-2">
                      <Input
                        id="secondaryColor"
                        type="color"
                        value={branding.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        className="w-16 h-10 p-1 border rounded"
                      />
                      <Input
                        value={branding.secondaryColor}
                        onChange={(e) => handleColorChange('secondaryColor', e.target.value)}
                        placeholder="#64748b"
                        className="flex-1"
                      />
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Used for secondary elements and accents
                    </p>
                  </div>
                </div>

                {/* Color Preview */}
                <div className="p-4 border rounded-lg">
                  <h4 className="font-medium mb-3">Color Preview</h4>
                  <div className="flex gap-4">
                    <div className="flex-1">
                      <div 
                        className="h-12 rounded mb-2"
                        style={{ backgroundColor: branding.primaryColor }}
                      />
                      <p className="text-xs text-center">Primary</p>
                    </div>
                    <div className="flex-1">
                      <div 
                        className="h-12 rounded mb-2"
                        style={{ backgroundColor: branding.secondaryColor }}
                      />
                      <p className="text-xs text-center">Secondary</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Logo & Identity Tab */}
          <TabsContent value="logo" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Image className="h-5 w-5" />
                  Logo & Organization Identity
                </CardTitle>
                <CardDescription>
                  Upload your logo and set organization details
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="logo">Organization Logo</Label>
                  <div className="flex items-center gap-4">
                    {branding.logoUrl ? (
                      <div className="flex items-center gap-4">
                        <img 
                          src={branding.logoUrl} 
                          alt="Logo preview" 
                          className="h-16 w-auto border rounded"
                        />
                        <Button
                          variant="outline"
                          onClick={() => setBranding(prev => ({ ...prev, logoUrl: '' }))}
                        >
                          Remove
                        </Button>
                      </div>
                    ) : (
                      <div className="flex items-center gap-4">
                        <div className="h-16 w-16 border-2 border-dashed border-muted-foreground/25 rounded flex items-center justify-center">
                          <Image className="h-6 w-6 text-muted-foreground" />
                        </div>
                        <div>
                          <Button
                            variant="outline"
                            onClick={() => document.getElementById('logo-upload')?.click()}
                          >
                            <Upload className="mr-2 h-4 w-4" />
                            Upload Logo
                          </Button>
                          <p className="text-xs text-muted-foreground mt-1">
                            PNG, JPG up to 2MB
                          </p>
                        </div>
                      </div>
                    )}
                    <input
                      id="logo-upload"
                      type="file"
                      accept="image/*"
                      onChange={handleLogoUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="orgName">Organization Name</Label>
                    <Input
                      id="orgName"
                      value={branding.organizationName}
                      onChange={(e) => handleInputChange('organizationName', e.target.value)}
                      placeholder="Your Organization Name"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="tagline">Tagline (Optional)</Label>
                    <Input
                      id="tagline"
                      value={branding.tagline}
                      onChange={(e) => handleInputChange('tagline', e.target.value)}
                      placeholder="Your organization's tagline"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Content Tab */}
          <TabsContent value="content" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Type className="h-5 w-5" />
                  Content & Contact Information
                </CardTitle>
                <CardDescription>
                  Set footer text and contact information
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="footerText">Footer Text</Label>
                  <Textarea
                    id="footerText"
                    value={branding.footerText}
                    onChange={(e) => handleInputChange('footerText', e.target.value)}
                    placeholder="© 2024 Your Organization. All rights reserved."
                    rows={2}
                  />
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email</Label>
                    <Input
                      id="contactEmail"
                      type="email"
                      value={branding.contactEmail}
                      onChange={(e) => handleInputChange('contactEmail', e.target.value)}
                      placeholder="contact@yourorg.com"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      value={branding.websiteUrl}
                      onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                      placeholder="https://yourorganization.com"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Advanced Tab */}
          <TabsContent value="advanced" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layout className="h-5 w-5" />
                  Advanced Customization
                </CardTitle>
                <CardDescription>
                  Add custom CSS for advanced styling (use with caution)
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="customCss">Custom CSS</Label>
                  <Textarea
                    id="customCss"
                    value={branding.customCss}
                    onChange={(e) => handleInputChange('customCss', e.target.value)}
                    placeholder="/* Add your custom CSS here */
.custom-header {
  background: linear-gradient(45deg, #your-color1, #your-color2);
}"
                    rows={8}
                    className="font-mono text-sm"
                  />
                  <p className="text-xs text-muted-foreground">
                    Custom CSS will be applied to your branded pages. Use standard CSS syntax.
                  </p>
                </div>

                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>
                    Custom CSS can affect the layout and functionality of your pages. 
                    Test thoroughly before applying to live events.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      )}

      {/* Reset Button */}
      <div className="flex justify-between items-center pt-6 border-t">
        <Button
          variant="outline"
          onClick={resetToDefaults}
          className="text-destructive hover:text-destructive"
        >
          Reset to Defaults
        </Button>
        <p className="text-sm text-muted-foreground">
          Changes are saved automatically and will apply to all your events
        </p>
      </div>
    </div>
  );
}