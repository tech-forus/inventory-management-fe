import { Link } from 'react-router-dom'
import { ShieldAlert, ArrowLeft } from 'lucide-react'

const NotAuthorizedPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8 text-center">
          {/* Icon */}
          <div className="flex justify-center mb-6">
            <div className="w-20 h-20 bg-red-100 rounded-full flex items-center justify-center">
              <ShieldAlert className="w-10 h-10 text-red-600" />
            </div>
          </div>

          {/* Error Message */}
          <h1 className="text-3xl font-bold text-gray-900 mb-3">
            Access Denied
          </h1>
          <p className="text-gray-600 mb-8">
            You don't have permission to access this page. Please contact your administrator if you believe this is an error.
          </p>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Link
              to="/app/dashboard"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-primary-main text-white rounded-lg hover:bg-primary-dark transition-colors duration-200"
            >
              <ArrowLeft className="w-4 h-4" />
              Return to Dashboard
            </Link>
            
            <Link
              to="/login"
              className="w-full inline-flex items-center justify-center gap-2 px-6 py-3 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors duration-200"
            >
              Go to Login
            </Link>
          </div>

          {/* Additional Info */}
          <div className="mt-8 pt-6 border-t border-gray-200">
            <p className="text-sm text-gray-500">
              Need help? Contact support at{' '}
              <a href="mailto:support@example.com" className="text-primary-main hover:underline">
                support@example.com
              </a>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default NotAuthorizedPage
