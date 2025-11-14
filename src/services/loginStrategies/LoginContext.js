// services/loginStrategies/LoginContext.js
class LoginContext {
  constructor(strategy) {
    if (!strategy || typeof strategy.login !== 'function') {
      throw new Error('A valid login strategy must be provided');
    }
    this.strategy = strategy;
  }

  async login(req) {
    return await this.strategy.login(req);
  }
}

module.exports = LoginContext;
