export type CurrentUser = {
  id: string;
  email: string;
  name: string;
};

// ponytail: mock only — wire to Clerk/Auth.js when auth is a confirmed requirement
export async function getCurrentUser(): Promise<CurrentUser> {
  return {
    id: "clu00000000000000000001",
    email: "alex@lodestar.ai",
    name: "Alex Tan",
  };
}
