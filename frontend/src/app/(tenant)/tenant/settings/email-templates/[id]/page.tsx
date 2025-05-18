import { DashboardLayout } from '@/components/layouts/dashboard-layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Metadata } from 'next';
import Link from 'next/link';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export const metadata: Metadata = {
  title: 'Email Template Editor | Tenant Admin',
  description: 'Edit email templates for your tenant',
};

// Define navigation items for tenant admin
const navItems = [
  { title: 'Dashboard', href: '/tenant/dashboard' },
  { title: 'Users', href: '/tenant/users' },
  { title: 'Teams', href: '/tenant/teams' },
  { title: 'Modules', href: '/tenant/modules' },
  { title: 'Settings', href: '/tenant/settings' },
  { title: 'Billing', href: '/tenant/billing' },
];

// Available placeholders for templates
const placeholders = [
  { name: "{{user.firstName}}", description: "User's first name" },
  { name: "{{user.lastName}}", description: "User's last name" },
  { name: "{{user.email}}", description: "User's email address" },
  { name: "{{tenant.name}}", description: "Organization name" },
  { name: "{{tenant.domain}}", description: "Organization domain" },
  { name: "{{invite.link}}", description: "Invitation link (for invitations)" },
  { name: "{{reset.link}}", description: "Password reset link (for resets)" },
  { name: "{{login.link}}", description: "Login link" },
  { name: "{{current_date}}", description: "Current date" },
];

// Mock email templates
const mockTemplates = {
  invitation: {
    id: 'invitation',
    name: 'User Invitation',
    description: 'Email sent when inviting a new user',
    subject: 'Invitation to join {{tenant.name}} on Multi-Tenant Platform',
    previewText: 'You have been invited to join {{tenant.name}}',
    bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>You've been invited to {{tenant.name}}</h2>
    </div>
    <p>Hello {{user.firstName}},</p>
    <p>You have been invited to join {{tenant.name}} on the Multi-Tenant Platform. Please click the button below to accept the invitation and create your account.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{invite.link}}" class="button">Accept Invitation</a>
    </p>
    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all;">{{invite.link}}</p>
    <p>This invitation will expire in 7 days.</p>
    <p>Best regards,<br>The {{tenant.name}} Team</p>
    <div class="footer">
      <p>This is an automated message from Multi-Tenant Platform. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
    bodyText: `Hello {{user.firstName}},

You have been invited to join {{tenant.name}} on the Multi-Tenant Platform. Please visit the following link to accept the invitation and create your account:

{{invite.link}}

This invitation will expire in 7 days.

Best regards,
The {{tenant.name}} Team

This is an automated message from Multi-Tenant Platform. Please do not reply to this email.`,
  },
  
  welcome: {
    id: 'welcome',
    name: 'Welcome Email',
    description: 'Email sent when a user activates their account',
    subject: 'Welcome to {{tenant.name}}!',
    previewText: 'Your account has been created successfully',
    bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Welcome to {{tenant.name}}!</h2>
    </div>
    <p>Hello {{user.firstName}},</p>
    <p>Welcome to {{tenant.name}} on the Multi-Tenant Platform! Your account has been successfully created.</p>
    <p>You can now log in to access your account and all of the available features.</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{login.link}}" class="button">Login to Your Account</a>
    </p>
    <p>If you have any questions or need assistance, please contact your administrator.</p>
    <p>Best regards,<br>The {{tenant.name}} Team</p>
    <div class="footer">
      <p>This is an automated message from Multi-Tenant Platform. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
    bodyText: `Hello {{user.firstName}},

Welcome to {{tenant.name}} on the Multi-Tenant Platform! Your account has been successfully created.

You can now log in to access your account and all of the available features:
{{login.link}}

If you have any questions or need assistance, please contact your administrator.

Best regards,
The {{tenant.name}} Team

This is an automated message from Multi-Tenant Platform. Please do not reply to this email.`,
  },
  
  passwordReset: {
    id: 'passwordReset',
    name: 'Password Reset',
    description: 'Email sent for password reset requests',
    subject: 'Password Reset Request for {{tenant.name}}',
    previewText: 'Your password reset link',
    bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Password Reset Request</h2>
    </div>
    <p>Hello {{user.firstName}},</p>
    <p>We received a request to reset your password for your {{tenant.name}} account. Please click the button below to reset your password:</p>
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{reset.link}}" class="button">Reset Your Password</a>
    </p>
    <p>If the button doesn't work, you can copy and paste the following link into your browser:</p>
    <p style="word-break: break-all;">{{reset.link}}</p>
    <p>This link will expire in 24 hours. If you didn't request this password reset, please ignore this email or contact your administrator if you have concerns.</p>
    <p>Best regards,<br>The {{tenant.name}} Team</p>
    <div class="footer">
      <p>This is an automated message from Multi-Tenant Platform. Please do not reply to this email.</p>
    </div>
  </div>
</body>
</html>`,
    bodyText: `Hello {{user.firstName}},

We received a request to reset your password for your {{tenant.name}} account. Please visit the following link to reset your password:

{{reset.link}}

This link will expire in 24 hours. If you didn't request this password reset, please ignore this email or contact your administrator if you have concerns.

Best regards,
The {{tenant.name}} Team

This is an automated message from Multi-Tenant Platform. Please do not reply to this email.`,
  },
  
  notificationDigest: {
    id: 'notificationDigest',
    name: 'Notification Digest',
    description: 'Daily/weekly summary of important events',
    subject: 'Your {{tenant.name}} Digest for {{current_date}}',
    previewText: 'Your daily activity summary',
    bodyHtml: `<!DOCTYPE html>
<html>
<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px; }
    .header { text-align: center; margin-bottom: 30px; }
    .button { display: inline-block; padding: 12px 24px; background-color: #1976d2; color: white; text-decoration: none; border-radius: 4px; font-weight: bold; }
    .footer { margin-top: 30px; font-size: 12px; color: #666; text-align: center; }
    .event { padding: 10px; border-bottom: 1px solid #eee; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h2>Your Daily Digest</h2>
    </div>
    <p>Hello {{user.firstName}},</p>
    <p>Here's your daily summary of activity at {{tenant.name}}:</p>
    
    <h3>Recent Activities</h3>
    <div class="event">
      <p><strong>New Users:</strong> 3 new team members joined</p>
    </div>
    <div class="event">
      <p><strong>Projects:</strong> 2 projects were updated</p>
    </div>
    <div class="event">
      <p><strong>Tasks:</strong> 5 tasks were completed, 8 new tasks were created</p>
    </div>
    
    <p style="text-align: center; margin: 30px 0;">
      <a href="{{login.link}}" class="button">View Full Details</a>
    </p>
    
    <p>Best regards,<br>The {{tenant.name}} Team</p>
    <div class="footer">
      <p>This is an automated message from Multi-Tenant Platform. Please do not reply to this email.</p>
      <p>You can manage your notification preferences in your account settings.</p>
    </div>
  </div>
</body>
</html>`,
    bodyText: `Hello {{user.firstName}},

Here's your daily summary of activity at {{tenant.name}}:

RECENT ACTIVITIES
----------------
New Users: 3 new team members joined
Projects: 2 projects were updated
Tasks: 5 tasks were completed, 8 new tasks were created

View full details: {{login.link}}

Best regards,
The {{tenant.name}} Team

This is an automated message from Multi-Tenant Platform. Please do not reply to this email.
You can manage your notification preferences in your account settings.`,
  },
};

export default function EmailTemplateEditorPage({ params }: { params: { id: string } }) {
  // In a real app, this would be fetched from the API using params.id
  const tenantName = "Example Company";
  const template = mockTemplates[params.id as keyof typeof mockTemplates];
  
  if (!template) {
    return (
      <DashboardLayout navItems={navItems} tenantName={tenantName}>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Template Not Found</h1>
          <Link href="/tenant/settings">
            <Button variant="outline">Back to Settings</Button>
          </Link>
        </div>
        <Card>
          <CardContent className="py-10">
            <div className="text-center">
              <h2 className="text-xl font-semibold mb-2">Template Not Found</h2>
              <p className="text-gray-500 dark:text-gray-400 mb-6">
                The email template you're looking for doesn't exist.
              </p>
              <Link href="/tenant/settings">
                <Button>Back to Settings</Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      </DashboardLayout>
    );
  }
  
  return (
    <DashboardLayout navItems={navItems} tenantName={tenantName}>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">Edit Email Template: {template.name}</h1>
        <Link href="/tenant/settings">
          <Button variant="outline">Back to Settings</Button>
        </Link>
      </div>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Template Details</CardTitle>
          <CardDescription>{template.description}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-6">
            <div className="space-y-2">
              <label htmlFor="template-name" className="text-sm font-medium">
                Template Name
              </label>
              <Input
                id="template-name"
                defaultValue={template.name}
              />
            </div>
            
            <div className="space-y-2">
              <label htmlFor="template-subject" className="text-sm font-medium">
                Email Subject
              </label>
              <Input
                id="template-subject"
                defaultValue={template.subject}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Subject line that recipients will see in their inbox
              </p>
            </div>
            
            <div className="space-y-2">
              <label htmlFor="template-preview" className="text-sm font-medium">
                Preview Text
              </label>
              <Input
                id="template-preview"
                defaultValue={template.previewText}
              />
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Short text shown in email clients before opening the email
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
        <div className="md:col-span-3">
          <Card>
            <CardHeader>
              <CardTitle>Template Content</CardTitle>
              <CardDescription>Edit the email content in HTML or plain text format</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="html">
                <TabsList className="mb-4">
                  <TabsTrigger value="html">HTML Content</TabsTrigger>
                  <TabsTrigger value="text">Plain Text</TabsTrigger>
                  <TabsTrigger value="preview">Preview</TabsTrigger>
                </TabsList>
                
                <TabsContent value="html">
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <textarea
                        className="w-full min-h-[400px] p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue={template.bodyHtml}
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <Button>Save HTML</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="text">
                  <div className="space-y-4">
                    <div className="border rounded-md">
                      <textarea
                        className="w-full min-h-[400px] p-4 font-mono text-sm focus:outline-none focus:ring-1 focus:ring-blue-500"
                        defaultValue={template.bodyText}
                      ></textarea>
                    </div>
                    <div className="flex justify-end">
                      <Button>Save Plain Text</Button>
                    </div>
                  </div>
                </TabsContent>
                
                <TabsContent value="preview">
                  <div className="border rounded-md bg-white p-6">
                    <div className="mb-4 border-b pb-4">
                      <div className="text-sm text-gray-500">From: <span className="font-medium">Example Company &lt;notifications@example-company.com&gt;</span></div>
                      <div className="text-sm text-gray-500">To: <span className="font-medium">{{user.firstName}} {{user.lastName}} &lt;{{user.email}}&gt;</span></div>
                      <div className="text-sm text-gray-500">Subject: <span className="font-medium">{template.subject}</span></div>
                    </div>
                    
                    <div className="border-l-4 border-gray-200 pl-4 text-gray-600 italic mb-4">
                      {template.previewText}
                    </div>
                    
                    <div 
                      className="prose max-w-none" 
                      dangerouslySetInnerHTML={{ __html: template.bodyHtml }}
                    />
                  </div>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Available Placeholders</CardTitle>
              <CardDescription>Variables you can use in the template</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {placeholders.map((placeholder) => (
                  <div key={placeholder.name} className="text-sm">
                    <div className="font-mono font-medium">{placeholder.name}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400">{placeholder.description}</div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
          
          <Card className="mt-6">
            <CardHeader>
              <CardTitle>Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <Button className="w-full">Save Template</Button>
                <Button variant="outline" className="w-full">Send Test Email</Button>
                <Button variant="outline" className="w-full">Reset to Default</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
