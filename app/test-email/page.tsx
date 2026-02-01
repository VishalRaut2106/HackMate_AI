'use client';

import { EmailTest } from '@/components/email/email-test';
import { EmailDebug } from '@/components/email/email-debug';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function TestEmailPage() {
  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-3xl font-bold">Email Service Test & Debug</h1>
          <p className="text-muted-foreground mt-2">
            Test your Nodemailer configuration and debug email issues
          </p>
        </div>
        
        <Tabs defaultValue="debug" className="space-y-6">
          <TabsList>
            <TabsTrigger value="debug">Debug</TabsTrigger>
            <TabsTrigger value="test">Send Test</TabsTrigger>
          </TabsList>
          
          <TabsContent value="debug">
            <EmailDebug />
          </TabsContent>
          
          <TabsContent value="test">
            <EmailTest />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}