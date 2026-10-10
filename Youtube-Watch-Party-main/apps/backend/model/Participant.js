export class Participant {
  constructor(id, username, role) {
    this.id = id;
    this.username = username;
    this.role = role;
    this.joinedAt = new Date().toISOString();
  }
}
