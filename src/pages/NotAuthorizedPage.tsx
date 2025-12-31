// src/pages/NotAuthorizedPage.tsx
const NotAuthorizedPage = () => {
  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">403</h1>
        <p className="text-xl text-gray-600 mb-4">Not Authorized</p>
        <p className="text-gray-500">You don't have permission to access this page.</p>
      </div>
    </div>
  );
};

export default NotAuthorizedPage;
