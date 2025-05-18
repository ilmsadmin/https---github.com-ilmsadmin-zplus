import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { defaultLocale } from '@/lib/i18n/config';

export default function Home() {
  // Check for token to determine where to redirect
  const token = cookies().get('token')?.value;
  const userRole = cookies().get('userRole')?.value;
  
  // First redirect to the default locale
  const basePath = `/${defaultLocale}`;
  
  // Then redirect to the appropriate dashboard if logged in
  if (token) {
    if (userRole === 'SYSTEM_ADMIN') {
      redirect(`${basePath}/system/dashboard`);
    } else {
      redirect(`${basePath}/tenant/dashboard`);
    }
  }
  
  // If not logged in, redirect to the home page with locale
  redirect(basePath);
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <header className="bg-white shadow-sm dark:bg-gray-900 dark:border-b dark:border-gray-800">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 items-center justify-between">
            <div className="flex-shrink-0">
              <span className="text-xl font-bold text-gray-900 dark:text-white">Multi-Tenant Platform</span>
            </div>
            <div className="flex space-x-4">
              <Link href="/login">
                <Button variant="ghost">Sign in</Button>
              </Link>
              <Link href="/register">
                <Button>Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>
      
      {/* Hero Section */}
      <main>
        <div className="relative isolate overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 pt-10 pb-24 sm:pb-32 lg:flex lg:px-8 lg:py-40">
            <div className="mx-auto max-w-2xl lg:mx-0 lg:max-w-xl lg:flex-shrink-0">
              <h1 className="mt-10 text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl dark:text-white">
                The Ultimate Multi-Tenant Platform
              </h1>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Build, deploy, and scale your SaaS applications with our comprehensive multi-tenant platform. 
                Secure, performant, and highly customizable.
              </p>
              <div className="mt-10 flex items-center gap-x-6">
                <Link href="/register">
                  <Button size="lg">Get Started</Button>
                </Link>
                <Link href="#features">
                  <Button variant="ghost" size="lg">Learn more →</Button>
                </Link>
              </div>
            </div>
          </div>
        </div>
        
        {/* Features Section */}
        <div id="features" className="py-24 sm:py-32">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <div className="mx-auto max-w-2xl text-center">
              <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl dark:text-white">
                Powerful Features
              </h2>
              <p className="mt-6 text-lg leading-8 text-gray-600 dark:text-gray-300">
                Everything you need to build and manage your SaaS applications
              </p>
            </div>
            
            <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
              <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
                {/* Feature 1 */}
                <Card>
                  <CardHeader>
                    <CardTitle>Multi-Tenant Architecture</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Separate data with schema-per-tenant, ensuring complete isolation and security.
                    </CardDescription>
                  </CardContent>
                </Card>
                
                {/* Feature 2 */}
                <Card>
                  <CardHeader>
                    <CardTitle>Microservices Backend</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Scalable microservices with event-driven communication for high reliability.
                    </CardDescription>
                  </CardContent>
                </Card>
                
                {/* Feature 3 */}
                <Card>
                  <CardHeader>
                    <CardTitle>White Labeling</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Customize branding, themes, and domains for each tenant.
                    </CardDescription>
                  </CardContent>
                </Card>
                
                {/* Feature 4 */}
                <Card>
                  <CardHeader>
                    <CardTitle>Advanced Billing</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Flexible pricing plans with subscription management and usage-based billing.
                    </CardDescription>
                  </CardContent>
                </Card>
                
                {/* Feature 5 */}
                <Card>
                  <CardHeader>
                    <CardTitle>Module Marketplace</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Extend functionality with installable modules and plugins.
                    </CardDescription>
                  </CardContent>
                </Card>
                
                {/* Feature 6 */}
                <Card>
                  <CardHeader>
                    <CardTitle>Enterprise Security</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>
                      Advanced security with MFA, role-based access control, and audit logs.
                    </CardDescription>
                  </CardContent>
                </Card>
              </div>
            </div>
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-white dark:bg-gray-900">
        <div className="mx-auto max-w-7xl px-6 py-12 md:flex md:items-center md:justify-between lg:px-8">
          <div className="mt-8 md:mt-0">
            <p className="text-center text-xs leading-5 text-gray-500 dark:text-gray-400">
              &copy; 2025 Multi-Tenant Platform. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
