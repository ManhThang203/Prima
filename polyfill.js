// Fix BigInt serialization globally
BigInt.prototype.toJSON = function () {
  return this.toString();
};
