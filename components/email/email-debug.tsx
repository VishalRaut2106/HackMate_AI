'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { CheckCircle, AlertCircle, Loader2, Mail, Settings } from 'lucide-react';

export function EmailDebug() {
  const [testing, setTesting] = useState(false);
  const [configStatus, setConfigStatus] = useState<any>(null);
  const [connectionStatus, setConnectionStatus] = useState<any>(null);
  const { toast } = useToast();

  const testEmailConfig = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/test-email-config');
      const data = await response.json();
      setConfigStatus(data);
      
      if (data.success) {
        toast({
          title: "Configuration valid",
          description: "Email credentials are properly configured",
        });
      } else {
        toast({
          title: "Configuration error",
          description: data.error,
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Config test failed:', error);
      toast({
        title: "Test failed",
        description: "Unable to test email configuration",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  const testEmailConnection = async () => {
    setTesting(true);
    try {
      const response = await fetch('/api/send-email');
      const data = await response.json();
      setConnectionStatus(data);
      
      if (data.connected) {
        toast({
          title: "Connection successful",
          description: `Connected to ${data.service} as ${data.user}`,
        });
      } else {
        toast({
          title: "Connection failed",
          description: "Unable to connect to email service",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      toast({
        title: "Connection test failed",
        description: "Unable to test email connection",
        variant: "destructive",
      });
    } finally {
      setTesting(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Mail className="h-5 w-5" />
            Email Service Debug
          </CardTitle>
          <CardDescription>
            Debug email configuration and connection issues
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <Button
              onClick={testEmailConfig}
              disabled={testing}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              {testing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Settings className="h-6 w-6" />
              )}
              <span>Test Configuration</span>
            </Button>

            <Button
              onClick={testEmailConnection}
              disabled={testing}
              variant="outline"
              className="h-20 flex-col gap-2"
            >
              {testing ? (
                <Loader2 className="h-6 w-6 animate-spin" />
              ) : (
                <Mail className="h-6 w-6" />
              )}
              <span>Test Connection</span>
            </Button>
          </div>

          {/* Configuration Status */}
          {configStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {configStatus.success ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  Configuration Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Status:</span>
                    <Badge variant={configStatus.success ? "default" : "destructive"}>
                      {configStatus.success ? "Valid" : "Invalid"}
                    </Badge>
                  </div>
                  {configStatus.error && (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {configStatus.error}
                    </div>
                  )}
                  {configStatus.details && (
                    <div className="text-xs text-muted-foreground">
                      <pre>{JSON.stringify(configStatus.details, null, 2)}</pre>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Connection Status */}
          {connectionStatus && (
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  {connectionStatus.connected ? (
                    <CheckCircle className="h-4 w-4 text-green-500" />
                  ) : (
                    <AlertCircle className="h-4 w-4 text-red-500" />
                  )}
                  Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Connected:</span>
                    <Badge variant={connectionStatus.connected ? "default" : "destructive"}>
                      {connectionStatus.connected ? "Yes" : "No"}
                    </Badge>
                  </div>
                  {connectionStatus.service && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">Service:</span>
                      <span className="text-sm">{connectionStatus.service}</span>
                    </div>
                  )}
                  {connectionStatus.user && (
                    <div className="flex items-center justify-between">
                      <span className="text-sm">User:</span>
                      <span className="text-sm">{connectionStatus.user}</span>
                    </div>
                  )}
                  {connectionStatus.error && (
                    <div className="text-sm text-red-600">
                      <strong>Error:</strong> {connectionStatus.error}
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Troubleshooting Tips */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Troubleshooting Tips</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-2 text-sm">
                <div>
                  <strong>1. Check Environment Variables:</strong>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground">
                    <li>EMAIL_USER should be your Gmail address</li>
                    <li>EMAIL_PASS should be a 16-character Gmail App Password</li>
                    <li>Make sure .env file is in the project root</li>
                  </ul>
                </div>
                <div>
                  <strong>2. Gmail App Password:</strong>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground">
                    <li>Enable 2-factor authentication on your Gmail account</li>
                    <li>Generate an App Password in Google Account settings</li>
                    <li>Use the App Password, not your regular Gmail password</li>
                  </ul>
                </div>
                <div>
                  <strong>3. Development Server:</strong>
                  <ul className="list-disc list-inside ml-4 text-muted-foreground">
                    <li>Restart your development server after changing .env</li>
                    <li>Check the server console for detailed error messages</li>
                  </ul>
                </div>
              </div>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}