import bcrypt from "bcrypt";

const password = "saulnownowindie";

const hash = await bcrypt.hash(password, 10);

console.log(hash);