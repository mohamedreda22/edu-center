import React from 'react';
import { Button } from '@/shared/components/ui/button';
import { AlertTriangle, RefreshCcw } from 'lucide-react';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error('Frontend Error Boundary caught an error:', error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex flex-col items-center justify-center min-h-[400px] p-8 text-center space-y-6 bg-white rounded-3xl shadow-sm border border-red-50">
          <div className="p-4 bg-red-50 rounded-2xl">
            <AlertTriangle className="h-12 w-12 text-red-500" />
          </div>
          <div className="space-y-2">
            <h2 className="text-2xl font-black text-primary">عذراً، حدث خطأ ما</h2>
            <p className="text-muted-foreground max-w-md mx-auto font-medium">
              نواجه مشكلة تقنية في عرض هذه الصفحة. يرجى محاولة إعادة تحميل الصفحة أو العودة لاحقاً.
            </p>
          </div>
          <Button
            onClick={() => window.location.reload()}
            className="gap-2"
          >
            <RefreshCcw className="h-4 w-4" />
            إعادة تحميل الصفحة
          </Button>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
