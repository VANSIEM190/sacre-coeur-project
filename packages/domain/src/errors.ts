/** Une erreur métier dont le message peut être affiché à l'utilisateur. */
export class DomainError extends Error {
  constructor(message: string, options?: ErrorOptions) {
    super(message, options);
    this.name = "DomainError";
  }
}
