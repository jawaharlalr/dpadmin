import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Toaster } from 'react-hot-toast';
import Layout from './components/Layout';
import Dashboard from './pages/Dashboard';
import Menu from './pages/Menu';
import Orders from './pages/Orders';
import Delivery from './pages/Delivery';
import Category from './pages/Category';
import Login from './pages/Login';
import HomeEditor from './pages/HomeEditor';
import Customers from './pages/Customers';
import MinOrderSettings from './pages/MinOrderSettings'; // Import the new settings page

const PrivateRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? <Layout>{children}</Layout> : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Toaster 
          position="top-right" 
          toastOptions={{ 
            style: { 
              background: '#333', 
              color: '#fff',
              borderRadius: '12px',
              fontSize: '14px',
              fontWeight: 'bold'
            } 
          }}
        />
        <Routes>
          <Route path="/login" element={<Login />} />
          
          {/* Main Dashboard Routes */}
          <Route path="/" element={<PrivateRoute><Dashboard /></PrivateRoute>} />
          <Route path="/editor" element={<PrivateRoute><HomeEditor /></PrivateRoute>} />
          <Route path="/categories" element={<PrivateRoute><Category /></PrivateRoute>} />
          <Route path="/menu" element={<PrivateRoute><Menu /></PrivateRoute>} />
          <Route path="/orders" element={<PrivateRoute><Orders /></PrivateRoute>} />
          <Route path="/customers" element={<PrivateRoute><Customers /></PrivateRoute>} />
          
          {/* New Min Order Settings Route */}
          <Route path="/settings/min-order" element={<PrivateRoute><MinOrderSettings /></PrivateRoute>} />
          
          <Route path="/delivery" element={<PrivateRoute><Delivery /></PrivateRoute>} />

          {/* Catch-all Redirect */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;