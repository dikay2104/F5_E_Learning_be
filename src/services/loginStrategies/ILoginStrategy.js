// services/loginStrategies/ILoginStrategy.js

class ILoginStrategy {
  async login(req) {
    throw new Error('Method "login" must be implemented');
  }
}

module.exports = ILoginStrategy;
