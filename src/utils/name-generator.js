export default class NameGenerator {
  static generateName( prototype, type ) {
    const normalizedType = typeof type === 'string' && type.trim()
      ? type.trim()
      : typeof prototype === 'string' && prototype.trim()
        ? prototype.trim()
        : 'element';

    return normalizedType.substr(0, 1).toUpperCase() + normalizedType.substr(1);
  }
}
