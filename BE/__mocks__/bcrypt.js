export const hash = async (password) => {
  return "hashedpassword"; // always return this
};

export const compare = async (password, hashed) => {
  return password === "123456"; // succeed only for test password
};
