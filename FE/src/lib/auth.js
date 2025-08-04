import { authAPI ,api} from './api.js';

export class AuthManager {
  constructor() {
    this.token = sessionStorage.getItem('authToken');
    this.user = JSON.parse(sessionStorage.getItem('user') || 'null');
  if (this.token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${this.token}`;
    // console.log("🔐 Token restored from sessionStorage:", this.token);
  } else {
    console.warn("🔐 No token found in sessionStorage.");
  }
}

static restore() {
  const token = sessionStorage.getItem('authToken');
  if (token) {
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    // console.log("🔁 Token restored:", token);
  }
}

  async login(email, password) {
    try {
      const response = await authAPI.login({ email, password });
       const { token, user } = response.data;
        this.setAuth(token, user);
     api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      console.log("🟢 Login response:", response.data);
    if (!token || !user) throw new Error("Invalid response structure");
      // this.setAuth(response.data.token, response.data.user);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Login failed');
    }
  }

  async register(userData) {
    try {
      const response = await authAPI.register(userData);
      this.setAuth(response.data.token, response.data.user);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Registration failed');
    }
  }

  async googleLogin(googleToken, role) {
    try {
      const response = await authAPI.googleAuth(googleToken, role);
      this.setAuth(response.data.token, response.data.user);
      return response.data;
    } catch (error) {
      throw new Error(error.response?.data?.message || 'Google login failed');
    }
  }

  async getCurrentUser() {
    if (!this.token) return null;
    
    try {
      const response = await authAPI.getMe();
      this.user = response.data.user;
      sessionStorage.setItem('user', JSON.stringify(this.user));
      return this.user;
    } catch (error) {
      this.logout();
      return null;
    }
  }

  setAuth(token, user) {
    this.token = token;
    this.user = user;
    sessionStorage.setItem('authToken', token);
   sessionStorage.setItem('user', JSON.stringify(user));
      // api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
  }

  logout() {
    this.token = null;
    this.user = null;
    sessionStorage.removeItem('authToken');
    sessionStorage.removeItem('user');
  }

  isAuthenticated() {
    return !!this.token;
  }

  hasRole(role) {
    return this.user?.role === role;
  }

  getUser() {
    return this.user;
  }
}

export const authManager = new AuthManager();
