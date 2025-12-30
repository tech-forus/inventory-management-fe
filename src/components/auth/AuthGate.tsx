import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';

type Action = 'view' | 'create' | 'update' | 'delete' | string;

interface User {
  role?: string;
  permissions?: string[];
}

export interface AuthGateProps {
  children: React.ReactNode;
  moduleKey?: string;
  action?: Action;
}

function readAuthFromStorage(): { token: string | null; user: User | null } {
  const token = localStorage.getItem('token') || sessionStorage.getItem('token');
  const rawUser = localStorage.getItem('user') || sessionStorage.getItem('user');

  let user: User | null = null;
  if (rawUser) {
    try {
      user = JSON.parse(rawUser) as User;
    } catch {
      user = null;
    }
  }

  return { token, user };
}

function hasPermission(user: User | null, permission?: string): boolean {
  if (!user) return false;
  // Admin + super_admin have full access in the existing UI model
  if (user.role === 'super_admin' || user.role === 'admin') return true;
  if (!permission) return true;
  return user.permissions?.includes(permission) || false;
}

export default function AuthGate({ children, moduleKey, action = 'view' }: AuthGateProps) {
  const location = useLocation();
  const { token, user } = readAuthFromStorage();

  if (!token) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  const requiredPermission = moduleKey ? `${moduleKey}.${action}` : undefined;
  if (!hasPermission(user, requiredPermission)) {
    return <Navigate to="/not-authorized" replace />;
  }

  return <>{children}</>;
}



