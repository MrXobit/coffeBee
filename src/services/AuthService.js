import axios from 'axios';

export default class AuthService {
  static async login(email, password) {
    try {
      const response = await axios.post('https://us-central1-coffee-bee.cloudfunctions.net/handleRegistrationRequest', {
        email,
        password
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async checkAuth(token) {
    try {
      const response = await axios.post(
        'https://us-central1-coffee-bee.cloudfunctions.net/checkAuth', 
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`, 
          }
        }
      );
      return response.data;
    } catch (error) {
      throw error; 
    }
  }
}
