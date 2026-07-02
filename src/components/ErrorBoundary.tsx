import { Component, type ReactNode, type ErrorInfo } from 'react';

interface Props {
  children: ReactNode;
  lang?: 'ar' | 'en';
}

interface State {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ErrorBoundary]', error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-[300px] flex items-center justify-center p-8">
          <div className="max-w-md text-center space-y-6">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-red-500/10">
              <span className="text-red-400 text-2xl">!</span>
            </div>
            <div>
              <h3 className="text-lg font-bold text-white mb-2">
                {this.props.lang === 'ar' ? 'حدث خطأ غير متوقع' : 'Unexpected Error'}
              </h3>
              <p className="text-sm text-slate-400 font-mono break-all">
                {this.state.error?.message || (this.props.lang === 'ar' ? 'خطأ غير معروف' : 'Unknown error')}
              </p>
            </div>
            <button
              onClick={this.handleReset}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-sm font-bold rounded-xl transition cursor-pointer"
            >
              {this.props.lang === 'ar' ? 'إعادة المحاولة' : 'Try Again'}
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}

export default ErrorBoundary;
