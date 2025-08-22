let users = [];
let nextId = 1;

export const storage = {
  getUserByEmail: async (email) => {
    return users.find((u) => u.email === email) || null;
  },
  createUser: async (user) => {
    const newUser = {
      id: nextId++,
      role: user.role || "buyer",   // default role
      ...user,
      password: "hashedpassword"    // simulate hashing
    };
    users.push(newUser);
    return newUser;
  },
  verifyPassword: async (email, password) => {
    const user = users.find((u) => u.email === email);
    if (!user) return null;
    return password === "123456" ? user : null;
  },
  getUsersByRoles: async (roles) => {
    return users.filter((u) => roles.includes(u.role));
  },
  reset: () => { users = []; nextId = 1; }
};
