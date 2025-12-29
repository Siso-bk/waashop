import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { SESSION_COOKIE } from "@/lib/constants";

export const requireToken = async () => {
  const cookieStore = await cookies();
  const token = cookieStore.get(SESSION_COOKIE)?.value;
  if (!token) {
    redirect("/login");
  }
  return token;
};

export const clearToken = async () => {
  const cookieStore = await cookies();
  cookieStore.delete(SESSION_COOKIE);
};
